-- Create user_product_interactions table for collaborative filtering
-- This tracks user behavior to improve recommendations

-- First, verify products table structure (for debugging)
-- Run this to check: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'id';

-- Drop table if exists (to ensure clean migration)
DROP TABLE IF EXISTS user_product_interactions CASCADE;

CREATE TABLE user_product_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'click', 'search', 'rfq', 'purchase', 'add_to_cart')),
  search_context JSONB DEFAULT '{}'::jsonb,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint separately (more explicit)
ALTER TABLE user_product_interactions 
  ADD CONSTRAINT user_product_interactions_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product ON user_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON user_product_interactions(action);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON user_product_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON user_product_interactions(session_id);

-- Add GIN index for JSONB search_context
CREATE INDEX IF NOT EXISTS idx_interactions_search_context ON user_product_interactions USING GIN (search_context);

-- Add comments
COMMENT ON TABLE user_product_interactions IS 'Tracks user interactions with products for collaborative filtering and analytics';
COMMENT ON COLUMN user_product_interactions.action IS 'Type of interaction: view, click, search, rfq, purchase, add_to_cart';
COMMENT ON COLUMN user_product_interactions.search_context IS 'JSON object containing search parameters when interaction occurred';
COMMENT ON COLUMN user_product_interactions.session_id IS 'Session identifier for anonymous user tracking';

-- Create function to get frequently bought/viewed together
CREATE OR REPLACE FUNCTION get_frequently_bought_together(
  p_product_id VARCHAR(255),
  p_limit INT DEFAULT 4
)
RETURNS TABLE (
  product_id VARCHAR(255),
  co_occurrence_count BIGINT,
  interaction_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i2.product_id,
    COUNT(*) as co_occurrence_count,
    ARRAY_AGG(DISTINCT i2.action) as interaction_types
  FROM user_product_interactions i1
  JOIN user_product_interactions i2 
    ON (i1.user_id = i2.user_id OR i1.session_id = i2.session_id)
    AND i2.product_id != p_product_id
    AND i2.created_at >= i1.created_at - INTERVAL '30 days'
  WHERE i1.product_id = p_product_id
    AND i1.action IN ('view', 'click', 'rfq', 'purchase')
    AND i2.action IN ('view', 'click', 'rfq', 'purchase')
  GROUP BY i2.product_id
  ORDER BY co_occurrence_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get similar search recommendations
CREATE OR REPLACE FUNCTION get_similar_search_recommendations(
  p_material TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  product_id VARCHAR(255),
  interaction_count BIGINT,
  avg_confidence FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.product_id,
    COUNT(*) as interaction_count,
    AVG(CASE 
      WHEN i.action = 'purchase' THEN 1.0
      WHEN i.action = 'rfq' THEN 0.8
      WHEN i.action = 'click' THEN 0.6
      ELSE 0.4
    END) as avg_confidence
  FROM user_product_interactions i
  WHERE 
    (p_material IS NULL OR i.search_context->>'material' ILIKE '%' || p_material || '%')
    AND (p_category IS NULL OR i.search_context->>'category' = p_category)
    AND i.action IN ('click', 'rfq', 'purchase')
    AND i.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY i.product_id
  ORDER BY interaction_count DESC, avg_confidence DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_product_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own interactions
CREATE POLICY "Users can view own interactions"
  ON user_product_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own interactions
CREATE POLICY "Users can insert own interactions"
  ON user_product_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can do anything (for analytics)
CREATE POLICY "Service role has full access"
  ON user_product_interactions
  FOR ALL
  USING (auth.role() = 'service_role');
