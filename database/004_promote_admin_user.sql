-- Script to promote a user to admin role
-- Replace 'your-email@example.com' with the actual email
-- Run this after the teams schema is created

-- Promote specific user to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'garg.arya@gmail.com'; -- Replace with your admin email

-- Verify the update
SELECT user_id, email, full_name, role, created_at 
FROM public.profiles 
WHERE email = 'garg.arya@gmail.com';

-- Optional: Create a function to promote users to admin (for future use)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'User with email % not found', user_email;
  ELSE
    RAISE NOTICE 'User % promoted to admin', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage: SELECT public.promote_user_to_admin('user@example.com');