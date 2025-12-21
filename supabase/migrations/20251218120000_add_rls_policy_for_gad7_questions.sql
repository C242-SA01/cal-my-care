-- =================================================================
-- RLS Policy for gad7_questions
-- =================================================================
--
-- Problem:
-- The `gad7_questions` table had Row Level Security (RLS) enabled, but
-- there was no policy in place to allow users to read the questions.
-- This caused a query in the `Screening.tsx` page to fail for any
-- logged-in user, preventing the quiz from loading.
--
-- Solution:
-- Add a simple policy that allows any authenticated user to read
-- (SELECT) all rows from the `gad7_questions` table. The questions
-- are considered public, non-sensitive data.

CREATE POLICY "Allow authenticated users to read gad7_questions"
ON public.gad7_questions
FOR SELECT
TO authenticated
USING (true);
