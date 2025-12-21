-- Add confidence_score and last_verified_at columns to product_specs table
-- These columns are used by the AI enrichment script to track data quality

-- Add confidence_score column (0.0 to 1.0)
ALTER TABLE product_specs 
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1);

-- Add last_verified_at column to track when data was last enriched
ALTER TABLE product_specs 
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the columns
COMMENT ON COLUMN product_specs.confidence_score IS 'AI confidence score for extracted data (0.0 to 1.0)';
COMMENT ON COLUMN product_specs.last_verified_at IS 'Timestamp when data was last verified/enriched by AI';

-- Create index for querying by confidence score
CREATE INDEX IF NOT EXISTS idx_product_specs_confidence ON product_specs(confidence_score);
