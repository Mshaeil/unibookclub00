-- Promote a user to admin by email
-- Run in Supabase SQL Editor. Replace 'admin@example.com' with the actual email.

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1
);
