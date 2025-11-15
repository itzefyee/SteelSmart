-- Initial Schema Migration for StealSmart
-- This migration creates all necessary tables, indexes, RLS policies, and functions
-- Run this in your Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (migrated from products.json)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('robotic', 'structural', 'fasteners', 'custom')),
  material VARCHAR(255),
  specifications JSONB NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  technical_details TEXT,
  compatible_with TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  lead_time VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAD Generation History (replaces in-memory storage)
CREATE TABLE IF NOT EXISTS cad_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  category VARCHAR(100),
  format VARCHAR(20) NOT NULL,
  units VARCHAR(20) DEFAULT 'mm',
  model_data_url TEXT, -- URL to file in Supabase Storage
  file_path TEXT, -- Storage bucket path
  file_size BIGINT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'processing')),
  error TEXT,
  zoo_operation_id VARCHAR(255), -- Zoo Dev API operation/generation ID
  metadata JSONB DEFAULT '{}'
);

-- Drawing Analysis History
CREATE TABLE IF NOT EXISTS drawing_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Storage bucket path
  file_type VARCHAR(50),
  file_size BIGINT,
  extracted_specs JSONB,
  recommended_products JSONB,
  confidence DECIMAL(3, 2),
  reasoning TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gemini_response JSONB
);

-- RFQ (Request for Quote) submissions
CREATE TABLE IF NOT EXISTS rfq_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_company VARCHAR(255),
  contact_phone VARCHAR(50),
  project_description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  material VARCHAR(255),
  specifications TEXT NOT NULL,
  deadline DATE,
  budget VARCHAR(100),
  attached_files TEXT[], -- Array of storage paths
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'quoted', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Converted Files tracking
CREATE TABLE IF NOT EXISTS file_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_file_path TEXT NOT NULL,
  original_format VARCHAR(20) NOT NULL,
  converted_file_path TEXT NOT NULL,
  converted_format VARCHAR(20) NOT NULL,
  file_size BIGINT,
  conversion_status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Favorites/Bookmarks
CREATE TABLE IF NOT EXISTS product_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_cad_history_user_id ON cad_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cad_history_generated_at ON cad_history(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cad_history_zoo_operation ON cad_history(zoo_operation_id);
CREATE INDEX IF NOT EXISTS idx_drawing_analyses_user_id ON drawing_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_drawing_analyses_analyzed_at ON drawing_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_submissions_user_id ON rfq_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_rfq_submissions_status ON rfq_submissions(status);
CREATE INDEX IF NOT EXISTS idx_rfq_submissions_created_at ON rfq_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_file_conversions_user_id ON file_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_user_product ON product_favorites(user_id, product_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CAD History Policies
CREATE POLICY "Users can view own CAD history" ON cad_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CAD history" ON cad_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CAD history" ON cad_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CAD history" ON cad_history
  FOR DELETE USING (auth.uid() = user_id);

-- Drawing Analyses Policies
CREATE POLICY "Users can view own analyses" ON drawing_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON drawing_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON drawing_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- RFQ Submissions Policies
CREATE POLICY "Users can view own RFQs" ON rfq_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own RFQs" ON rfq_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RFQs" ON rfq_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- File Conversions Policies
CREATE POLICY "Users can view own conversions" ON file_conversions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions" ON file_conversions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversions" ON file_conversions
  FOR DELETE USING (auth.uid() = user_id);

-- Product Favorites Policies
CREATE POLICY "Users can view own favorites" ON product_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON product_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON product_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Products Policies (public read for authenticated users)
CREATE POLICY "Products are viewable by authenticated users" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow public read if you want unauthenticated access
-- CREATE POLICY "Products are viewable by everyone" ON products
--   FOR SELECT USING (true);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfq_updated_at
  BEFORE UPDATE ON rfq_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE products IS 'Product catalog (migrated from products.json)';
COMMENT ON TABLE cad_history IS 'CAD generation history with file references';
COMMENT ON TABLE drawing_analyses IS 'Technical drawing analysis results';
COMMENT ON TABLE rfq_submissions IS 'Request for Quote submissions from users';
COMMENT ON TABLE file_conversions IS 'CAD file conversion tracking';
COMMENT ON TABLE product_favorites IS 'User product bookmarks';

COMMENT ON COLUMN cad_history.zoo_operation_id IS 'Zoo Dev API operation/generation ID for tracking and re-fetching';
COMMENT ON COLUMN cad_history.model_data_url IS 'Public URL to CAD file in Supabase Storage';
COMMENT ON COLUMN cad_history.file_path IS 'Internal storage bucket path (e.g., user-id/file.step)';
