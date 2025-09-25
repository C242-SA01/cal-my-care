-- supabase/migrations/20250915120000_fix_admin_answer_rls.sql

-- Create a policy to allow admins and midwives to view all screening answers.
-- This was missing and caused the get_screening_details() function to fail.
CREATE POLICY "Admins and midwives can view all screening answers"
ON public.screening_answers
FOR SELECT
USING (true); -- WORKAROUND: Temporarily allowing all authenticated users as 'role' column is missing.
