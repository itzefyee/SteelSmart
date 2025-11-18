-- Add Conversation Support to CAD Generation
-- This migration adds support for iterative CAD generation with conversation tracking

-- Add conversation-related columns to cad_history
ALTER TABLE cad_history
ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_model_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_iteration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS iteration_number INTEGER DEFAULT 0;

-- Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_cad_history_conversation_id ON cad_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cad_history_user_conversation ON cad_history(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_cad_history_previous_model ON cad_history(previous_model_id);

-- Create a view for conversation chains
CREATE OR REPLACE VIEW cad_conversations AS
SELECT 
  conversation_id,
  user_id,
  MIN(generated_at) as started_at,
  MAX(generated_at) as last_updated,
  COUNT(*) as iteration_count,
  -- Get the first (original) prompt
  (SELECT prompt FROM cad_history ch2 
   WHERE ch2.conversation_id = ch.conversation_id 
   ORDER BY generated_at ASC 
   LIMIT 1) as original_prompt,
  -- Get the latest prompt
  (SELECT prompt FROM cad_history ch2 
   WHERE ch2.conversation_id = ch.conversation_id 
   ORDER BY generated_at DESC 
   LIMIT 1) as latest_prompt,
  -- Get all model IDs in order
  ARRAY_AGG(zoo_operation_id ORDER BY generated_at ASC) as model_ids,
  -- Get all prompts in order
  ARRAY_AGG(prompt ORDER BY generated_at ASC) as all_prompts,
  -- Latest status
  (SELECT status FROM cad_history ch2 
   WHERE ch2.conversation_id = ch.conversation_id 
   ORDER BY generated_at DESC 
   LIMIT 1) as latest_status
FROM cad_history ch
WHERE conversation_id IS NOT NULL
GROUP BY conversation_id, user_id;

-- Comment on the view
COMMENT ON VIEW cad_conversations IS 'Aggregated view of CAD generation conversations with iteration tracking';

-- Update existing records to have conversation_id (use zoo_operation_id as conversation for existing)
UPDATE cad_history 
SET conversation_id = zoo_operation_id,
    is_iteration = false,
    iteration_number = 0
WHERE conversation_id IS NULL AND zoo_operation_id IS NOT NULL;

-- Add RLS policies for the conversation view
CREATE POLICY "Users can view their own conversations"
  ON cad_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get conversation history with iterations
CREATE OR REPLACE FUNCTION get_conversation_iterations(conv_id VARCHAR)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  model_id VARCHAR,
  generated_at TIMESTAMP WITH TIME ZONE,
  is_iteration BOOLEAN,
  iteration_number INTEGER,
  status VARCHAR,
  file_path TEXT,
  model_data_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.prompt,
    ch.zoo_operation_id as model_id,
    ch.generated_at,
    ch.is_iteration,
    ch.iteration_number,
    ch.status,
    ch.file_path,
    ch.model_data_url
  FROM cad_history ch
  WHERE ch.conversation_id = conv_id
  ORDER BY ch.generated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_conversation_iterations(VARCHAR) TO authenticated;

-- Function to auto-increment iteration number
CREATE OR REPLACE FUNCTION set_iteration_number()
RETURNS TRIGGER AS $$
DECLARE
  max_iteration INTEGER;
BEGIN
  IF NEW.conversation_id IS NOT NULL AND NEW.is_iteration = true THEN
    -- Get the max iteration number for this conversation
    SELECT COALESCE(MAX(iteration_number), 0)
    INTO max_iteration
    FROM cad_history
    WHERE conversation_id = NEW.conversation_id;
    
    -- Set the new iteration number
    NEW.iteration_number := max_iteration + 1;
  ELSE
    -- Not an iteration, set to 0
    NEW.iteration_number := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set iteration number
DROP TRIGGER IF EXISTS trigger_set_iteration_number ON cad_history;
CREATE TRIGGER trigger_set_iteration_number
  BEFORE INSERT ON cad_history
  FOR EACH ROW
  EXECUTE FUNCTION set_iteration_number();

-- Add comments for documentation
COMMENT ON COLUMN cad_history.conversation_id IS 'Links related CAD generations together in a conversation';
COMMENT ON COLUMN cad_history.previous_model_id IS 'References the zoo_operation_id of the model this iteration is based on';
COMMENT ON COLUMN cad_history.is_iteration IS 'True if this is an iteration of a previous model, false if its an original generation';
COMMENT ON COLUMN cad_history.iteration_number IS 'Sequential number of this iteration within the conversation (0 for original)';


