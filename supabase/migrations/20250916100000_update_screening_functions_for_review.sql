-- First, drop the old functions because their return signatures are changing.
DROP FUNCTION IF EXISTS public.get_all_screening_results();
DROP FUNCTION IF EXISTS public.get_screening_details(uuid);

-- Create the get_all_screening_results function with the new signature
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

-- Create the get_screening_details function with the new signature
CREATE FUNCTION public.get_screening_details(p_screening_id uuid)
RETURNS TABLE (
    -- Screening Info
    screening_id uuid,
    completed_at timestamptz,
    total_score integer,
    anxiety_level public.anxiety_level,
    status public.screening_status,
    notes text,
    -- Profile Info
    full_name text,
    email text,
    -- Question and Answer Info
    question_text text,
    answer_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
    -- WORKAROUND: Role check disabled as 'role' column is missing from profiles table.
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
        gq.question_text,
        sa.score as answer_score
    FROM
        public.screenings s
    JOIN
        public.profiles p ON s.user_id = p.id
    JOIN
        public.screening_answers sa ON sa.screening_id = s.id
    JOIN
        public.gad7_questions gq ON sa.question_id = gq.id
    WHERE
        s.id = p_screening_id
    ORDER BY
        gq.question_order ASC;
END;
$$;
