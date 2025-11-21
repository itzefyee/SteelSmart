-- Create a storage bucket for 3D model frames
-- Run this in your Supabase SQL editor

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-frames', 'model-frames', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'model-frames');

-- Policy for authenticated uploads (optional, if you want to upload via admin panel)
CREATE POLICY "Authenticated users can upload model frames"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'model-frames' 
  AND auth.role() = 'authenticated'
);

-- Policy for authenticated updates (optional)
CREATE POLICY "Authenticated users can update model frames"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'model-frames' 
  AND auth.role() = 'authenticated'
);

-- Policy for authenticated deletes (optional)
CREATE POLICY "Authenticated users can delete model frames"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'model-frames' 
  AND auth.role() = 'authenticated'
);

-- Note: After creating the bucket, you can upload the model frames through:
-- 1. Supabase Dashboard > Storage > model-frames bucket
-- 2. Or use the Supabase client in a script










