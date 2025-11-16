-- Make products table publicly readable
-- This allows unauthenticated users to browse the product catalog

-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON products;

-- Create new policy that allows public read access
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Note: Write operations (INSERT, UPDATE, DELETE) are still restricted
-- Only admins with service role key can modify products
