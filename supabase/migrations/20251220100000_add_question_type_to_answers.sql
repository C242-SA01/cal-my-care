-- Migration to fix polymorphic references in screening_answers
-- Date: 2025-12-20

BEGIN;

-- Step 1: Drop the incorrect foreign key constraint that only points to pass_questions.
-- The DO block handles cases where the constraint might not exist, preventing errors.
DO $$
BEGIN
   IF EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'screening_answers_question_id_pass_fkey' AND
             conrelid = 'public.screening_answers'::regclass
   ) THEN
       ALTER TABLE public.screening_answers DROP CONSTRAINT screening_answers_question_id_pass_fkey;
   END IF;
END;
$$;

-- Also drop the original constraint name just in case it's still present from an older migration.
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


-- Step 2: Add the 'question_type' column if it doesn't already exist.
-- This makes the script runnable even if it has partially succeeded before.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'screening_answers'
        AND column_name = 'question_type'
    ) THEN
        ALTER TABLE public.screening_answers ADD COLUMN question_type VARCHAR(10);
    END IF;
END;
$$;

-- Step 3: Add a CHECK constraint to ensure data integrity for the new column, if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_question_type' AND
              conrelid = 'public.screening_answers'::regclass
    ) THEN
        ALTER TABLE public.screening_answers ADD CONSTRAINT chk_question_type CHECK (question_type IN ('gad7', 'pass'));
    END IF;
END;
$$;

-- Note: We are intentionally NOT adding a new foreign key on `question_id`.
-- A single column cannot have a foreign key to two different tables (polymorphic association).
-- The integrity is now maintained by the combination of `question_id`, `question_type`,
-- and the application logic, which is the standard pattern for this situation.

COMMIT;
