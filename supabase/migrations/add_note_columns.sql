-- Add note columns to product_specs table for enrichment explanations
-- These columns store explanations for calculated/estimated values

-- Add dimension_note column
ALTER TABLE product_specs 
ADD COLUMN IF NOT EXISTS dimension_note TEXT;

-- Add load_capacity_note column
ALTER TABLE product_specs 
ADD COLUMN IF NOT EXISTS load_capacity_note TEXT;

-- Add material_note column (for future use)
ALTER TABLE product_specs 
ADD COLUMN IF NOT EXISTS material_note TEXT;

-- Add comments for documentation
COMMENT ON COLUMN product_specs.dimension_note IS 'Explanation for dimension values (e.g., "Extracted from product name", "Typical dimensions - actual may vary")';
COMMENT ON COLUMN product_specs.load_capacity_note IS 'Explanation for load capacity calculation (e.g., "ISO 898-1 standard", "Calculated from cross-section")';
COMMENT ON COLUMN product_specs.material_note IS 'Additional material information or notes';
