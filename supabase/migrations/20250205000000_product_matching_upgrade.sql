-- Product matching data layer upgrade
-- Adds taxonomy, structured specs, embeddings, and normalized drawing tables

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Component taxonomy for canonical component types and aliases
CREATE TABLE IF NOT EXISTS component_taxonomy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_name TEXT NOT NULL,
  category VARCHAR(50),
  description TEXT,
  keywords TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material synonym groups (maps freeform text to normalized families)
CREATE TABLE IF NOT EXISTS material_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family TEXT NOT NULL UNIQUE,
  synonyms TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_synonyms_family ON material_synonyms(family);

-- Structured specifications per product
CREATE TABLE IF NOT EXISTS product_specs (
  product_id VARCHAR(50) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  width_mm NUMERIC,
  height_mm NUMERIC,
  depth_mm NUMERIC,
  diameter_mm NUMERIC,
  thickness_mm NUMERIC,
  length_mm NUMERIC,
  load_min_kn NUMERIC,
  load_max_kn NUMERIC,
  weight_kg NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_specs_dimensions
  ON product_specs(width_mm, height_mm, depth_mm, diameter_mm);

CREATE INDEX IF NOT EXISTS idx_product_specs_load
  ON product_specs(load_min_kn, load_max_kn);

-- Vector embeddings for similarity search (optional but prepared)
CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id VARCHAR(50) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  embedding vector(768),
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_source ON product_embeddings(source);

-- Normalized specs captured from drawing analysis to enable caching
CREATE TABLE IF NOT EXISTS drawing_specs_normalized (
  analysis_id UUID PRIMARY KEY REFERENCES drawing_analyses(id) ON DELETE CASCADE,
  component_type_id UUID REFERENCES component_taxonomy(id),
  material_family TEXT,
  width_range numrange,
  height_range numrange,
  depth_range numrange,
  diameter_range numrange,
  load_range numrange,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_specs_component ON drawing_specs_normalized(component_type_id);

-- Extend products table with taxonomy + material metadata
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS component_type_id UUID REFERENCES component_taxonomy(id),
  ADD COLUMN IF NOT EXISTS material_family TEXT,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_products_component_type ON products(component_type_id);
CREATE INDEX IF NOT EXISTS idx_products_material_family ON products(material_family);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

-- Trigger to maintain search vector based on name/description/material
CREATE OR REPLACE FUNCTION update_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.material, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE update_products_search_vector();

-- ============================================================================
-- Row Level Security policies for new tables
-- ============================================================================

ALTER TABLE component_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_specs_normalized ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Component taxonomy viewable by authenticated users" ON component_taxonomy
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Material synonyms viewable by authenticated users" ON material_synonyms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Product specs viewable by authenticated users" ON product_specs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Product embeddings viewable by authenticated users" ON product_embeddings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can select own normalized specs" ON drawing_specs_normalized
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM drawing_analyses da
      WHERE da.id = drawing_specs_normalized.analysis_id
        AND da.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own normalized specs" ON drawing_specs_normalized
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM drawing_analyses da
      WHERE da.id = drawing_specs_normalized.analysis_id
        AND da.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own normalized specs" ON drawing_specs_normalized
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM drawing_analyses da
      WHERE da.id = drawing_specs_normalized.analysis_id
        AND da.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own normalized specs" ON drawing_specs_normalized
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM drawing_analyses da
      WHERE da.id = drawing_specs_normalized.analysis_id
        AND da.user_id = auth.uid()
    )
  );

