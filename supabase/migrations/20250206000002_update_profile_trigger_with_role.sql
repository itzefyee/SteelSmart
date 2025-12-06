-- Update the handle_new_user function to set default Role as 'Customer'
-- This ensures all new signups automatically get the Customer role

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, "Role")
  VALUES (NEW.id, 'Customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger on_auth_user_created already exists and will use this updated function
-- No need to recreate the trigger

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile with Customer role when a new user signs up';
