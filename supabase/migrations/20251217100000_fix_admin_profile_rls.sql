-- This migration adds a Row Level Security (RLS) policy to allow users with the
-- 'admin' role to view all user profiles. Previously, admins could not see the
-- profiles of other users, which caused functions like 'get_screening_details'
-- to fail because they couldn't join the 'profiles' table for non-admin users.

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());
