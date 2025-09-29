-- This migration fixes the RLS policy that prevents users from completing their own screenings.
-- The previous policy checked that the updated row still had the status 'in_progress', which is incorrect.

-- Drop the old, faulty policy
DROP POLICY IF EXISTS "Users can update their own in-progress screenings" ON public.screenings;

-- Create the new, corrected policy
-- USING: The user can only target rows that are their own and are currently in progress.
-- WITH CHECK: The user can change the status, but the row must remain theirs.
CREATE POLICY "Users can update their own screenings"
ON public.screenings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'in_progress')
WITH CHECK (auth.uid() = user_id);
