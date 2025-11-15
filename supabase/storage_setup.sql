-- Supabase Storage Buckets Configuration
-- Run this in Supabase SQL Editor OR create buckets via Dashboard
-- Dashboard: Storage > Create a new bucket

-- Note: Buckets must be created via Dashboard or Storage API
-- This file documents the required configuration

-- =============================================================================
-- REQUIRED STORAGE BUCKETS
-- =============================================================================

-- Bucket 1: cad-models
-- Purpose: Store generated CAD files (STEP, STL, OBJ, GLTF)
-- Public: false (private, user-specific access)
-- File size limit: 50MB
-- Allowed MIME types: model/step, model/stl, model/obj, model/gltf+json, model/gltf-binary

-- Bucket 2: technical-drawings
-- Purpose: Store uploaded technical drawings for analysis
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/png, image/jpeg, image/dxf

-- Bucket 3: rfq-attachments
-- Purpose: Store RFQ submission attachments
-- Public: false (private)
-- File size limit: 20MB
-- Allowed MIME types: application/pdf, image/*, model/*

-- Bucket 4: product-images
-- Purpose: Store product catalog images
-- Public: true (publicly accessible)
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/webp

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

-- CAD Models Bucket Policies
-- Users can only access their own files (organized by user_id folders)

CREATE POLICY "Users can upload own CAD models"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cad-models'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own CAD models"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cad-models'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own CAD models"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cad-models'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own CAD models"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cad-models'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Technical Drawings Bucket Policies

CREATE POLICY "Users can upload own technical drawings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'technical-drawings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own technical drawings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'technical-drawings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own technical drawings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'technical-drawings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RFQ Attachments Bucket Policies

CREATE POLICY "Users can upload own RFQ attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rfq-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own RFQ attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rfq-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own RFQ attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rfq-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Product Images Bucket Policies (public read)

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Only admins/service role can delete product images
CREATE POLICY "Service role can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'service_role'
);

-- =============================================================================
-- SETUP INSTRUCTIONS
-- =============================================================================

-- 1. Create buckets via Supabase Dashboard:
--    - Go to Storage section
--    - Click "Create a new bucket"
--    - Create each bucket with settings above
--
-- 2. Or use JavaScript/API to create buckets:
--
--    const { data, error } = await supabase
--      .storage
--      .createBucket('cad-models', {
--        public: false,
--        fileSizeLimit: 52428800, // 50MB in bytes
--        allowedMimeTypes: ['model/step', 'model/stl', 'model/obj', 'model/gltf+json']
--      });
--
-- 3. Apply RLS policies by running this SQL file in Supabase SQL Editor
--
-- 4. Test access by uploading files with proper folder structure:
--    - Path format: {user_id}/{filename}
--    - Example: "a1b2c3-uuid/bracket.step"

-- =============================================================================
-- FILE PATH CONVENTIONS
-- =============================================================================

-- All private buckets use this structure:
-- {bucket-name}/{user_id}/{timestamp}_{original_filename}
--
-- Examples:
-- cad-models/a1b2c3-uuid/1699876543_mounting-bracket.step
-- technical-drawings/a1b2c3-uuid/1699876543_drawing.pdf
-- rfq-attachments/a1b2c3-uuid/1699876543_requirements.pdf
--
-- Public bucket (product-images):
-- product-images/products/{product_id}_{image_name}.png
