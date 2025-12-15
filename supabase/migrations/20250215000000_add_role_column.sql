-- Add Role column to profiles table
-- This migration adds the missing Role column that is referenced in the middleware

-- Add Role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "Role" VARCHAR(50) DEFAULT 'Customer';

-- Add check constraint for valid roles
ALTER TABLE profiles ADD CONSTRAINT check_valid_role 
  CHECK ("Role" IN ('Customer', 'Admin', 'admin', 'customer'));

-- Update existing profiles to have Customer role if null
UPDATE profiles SET "Role" = 'Customer' WHERE "Role" IS NULL;

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles("Role");

COMMENT ON COLUMN profiles."Role" IS 'User role: Customer, Admin';