-- Add Categories Table Migration
-- This migration creates the categories table with initial data
-- Categories are used to organize products in the catalog

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read policy - everyone can view categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert initial 4 categories
INSERT INTO categories (id, name, description, icon) VALUES
  ('robotic', 'Robotic Components', 'Motors, actuators, sensors, and control systems for robotics applications', 'robot'),
  ('structural', 'Structural Steel', 'Beams, plates, angles, and custom structural components', 'building'),
  ('fasteners', 'Fasteners', 'Bolts, screws, nuts, washers, and specialty fastening hardware', 'wrench'),
  ('custom', 'Custom Parts', 'Made-to-order fabricated components and custom machining services', 'cog')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE categories IS 'Product categories for organizing the catalog';
COMMENT ON COLUMN categories.icon IS 'Icon identifier for UI display (e.g., robot, building, wrench, cog)';
