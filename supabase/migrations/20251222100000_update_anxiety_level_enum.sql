-- Migration to safely update the anxiety_level ENUM type
-- This script handles dependencies from functions before altering the type.

-- Step 1: Drop dependent functions
-- These functions use the anxiety_level type and must be removed before the type can be changed.
-- They will be recreated at the end of the script.
DROP FUNCTION IF EXISTS public.get_all_screening_results();
DROP FUNCTION IF EXISTS public.get_screening_details(uuid);

-- Step 2: Temporarily change the column type to TEXT to remove dependency
ALTER TABLE public.screenings ALTER COLUMN anxiety_level TYPE TEXT;
ALTER TABLE public.educational_materials ALTER COLUMN anxiety_level TYPE TEXT;

-- Step 3: Drop the old ENUM type
DROP TYPE IF EXISTS public.anxiety_level;

-- Step 4: Create the new ENUM type with the correct values
CREATE TYPE public.anxiety_level AS ENUM (
  'normal',
  'ringan',
  'sedang',
  'berat'
);

-- Step 5: Update existing data to conform to the new ENUM values
-- This ensures that old data like 'mild' is migrated to 'ringan', etc.
UPDATE public.screenings SET anxiety_level = 
  CASE
    WHEN anxiety_level = 'minimal' THEN 'normal'
    WHEN anxiety_level = 'mild' THEN 'ringan'
    WHEN anxiety_level = 'moderate' THEN 'sedang'
    WHEN anxiety_level = 'severe' THEN 'berat'
    ELSE anxiety_level
  END;

UPDATE public.educational_materials SET anxiety_level = 
  CASE
    WHEN anxiety_level = 'minimal' THEN 'normal'
    WHEN anxiety_level = 'mild' THEN 'ringan'
    WHEN anxiety_level = 'moderate' THEN 'sedang'
    WHEN anxiety_level = 'severe' THEN 'berat'
    ELSE anxiety_level
  END;

-- Step 6: Alter the columns back to the new ENUM type
-- The USING clause casts the TEXT data back to the new ENUM type.
ALTER TABLE public.screenings ALTER COLUMN anxiety_level TYPE public.anxiety_level USING (anxiety_level::public.anxiety_level);
ALTER TABLE public.educational_materials ALTER COLUMN anxiety_level TYPE public.anxiety_level USING (anxiety_level::public.anxiety_level);


-- Step 7: Recreate the functions that were dropped in Step 1

-- Recreate get_all_screening_results
CREATE FUNCTION public.get_all_screening_results()
RETURNS TABLE (
    id uuid,
    completed_at timestamptz,
    total_score integer,
    anxiety_level public.anxiety_level,
    full_name text,
    email text,
    status public.screening_status,
    notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.completed_at,
        s.total_score,
        s.anxiety_level,
        p.full_name,
        p.email,
        s.status,
        s.notes
    FROM
        public.screenings s
    JOIN
        public.profiles p ON s.user_id = p.id
    ORDER BY
        s.completed_at DESC;
END;
$$;

-- Recreate get_screening_details
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

-- Step 8: Grant permissions to the recreated functions
GRANT EXECUTE ON FUNCTION public.get_all_screening_results() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_screening_details(uuid) TO authenticated;