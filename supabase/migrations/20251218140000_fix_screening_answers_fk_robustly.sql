-- =================================================================
-- Fix Foreign Key Constraint on screening_answers (Robustly)
-- =================================================================
--
-- Problem:
-- An error "violates foreign key constraint" is occurring. This indicates
-- that the `screening_answers.question_id` is not correctly referencing
-- the `pass_questions.id`. This can happen if the previous migration
-- to update the foreign key failed, leaving the database in an
-- inconsistent state.
--
-- Solution:
-- This script is designed to be idempotent and robustly fix the schema.
-- 1. Drop dependent functions first.
-- 2. Drop the old foreign key constraint if it exists.
-- 3. Add the correct foreign key constraint with a new, explicit name.
-- 4. Re-create any dependent functions.

-- 1. Drop dependent functions that might block the constraint change.
DROP FUNCTION IF EXISTS public.get_screening_details(uuid) CASCADE;

-- 2. Drop the old foreign key constraint if it exists.
-- We use a DO block to handle the case where the constraint might not exist
-- or might have a different name, preventing the script from failing.
DO $$
BEGIN
   IF EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'screening_answers_question_id_fkey' AND
             conrelid = 'public.screening_answers'::regclass
   ) THEN
       ALTER TABLE public.screening_answers DROP CONSTRAINT screening_answers_question_id_fkey;
   END IF;
END;
$$;

-- 3. Add the new, correct foreign key constraint with an explicit name.
ALTER TABLE public.screening_answers
ADD CONSTRAINT screening_answers_question_id_pass_fkey
  FOREIGN KEY (question_id)
  REFERENCES public.pass_questions(id)
  ON DELETE CASCADE;

-- 4. Re-create the get_screening_details function to use the pass_questions table.
CREATE FUNCTION public.get_screening_details(p_screening_id uuid)
RETURNS TABLE (
    screening_id uuid,
    completed_at timestamptz,
    total_score integer,
    anxiety_level public.anxiety_level,
    status public.screening_status,
    notes text,
    full_name text,
    email text,
    question_text text,
    answer_score integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as screening_id,
        s.completed_at,
        s.total_score,
        s.anxiety_level,
        s.status,
        s.notes,
        p.full_name,
        p.email,
        pq.question_text,
        sa.score as answer_score
    FROM
        public.screenings s
    JOIN
        public.profiles p ON s.user_id = p.id
    JOIN
        public.screening_answers sa ON sa.screening_id = s.id
    LEFT JOIN
        public.pass_questions pq ON sa.question_id = pq.id
    WHERE
        s.id = p_screening_id
    ORDER BY
        pq.question_order ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_screening_details(uuid) TO authenticated;
