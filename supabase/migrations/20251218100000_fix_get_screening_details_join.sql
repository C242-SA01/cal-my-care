-- Purpose: Modify the get_screening_details function to robustly handle cases
-- where screening questions may have been deleted after a screening was completed.
--
-- Problem: The function used an INNER JOIN between screening_answers and gad7_questions.
-- If a question was deleted, the JOIN would fail for that record, causing the entire
-- function to return zero rows for that screening_id. The previous migration also
-- failed because of an issue with changing function signatures.
--
-- Solution: Explicitly DROP the function first, then CREATE it again with a LEFT JOIN.
-- This ensures that all answers for a screening are returned, even if the
-- corresponding question has been deleted. The question_text for a deleted question
-- will appear as NULL.

DROP FUNCTION IF EXISTS public.get_screening_details(uuid) CASCADE;

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
AS $$
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
        gq.question_text,
        sa.score as answer_score
    FROM
        public.screenings s
    JOIN
        public.profiles p ON s.user_id = p.id
    JOIN
        public.screening_answers sa ON sa.screening_id = s.id
    LEFT JOIN  -- Changed from INNER JOIN
        public.gad7_questions gq ON sa.question_id = gq.id
    WHERE
        s.id = p_screening_id
    ORDER BY
        gq.question_order ASC NULLS LAST; -- Show deleted questions at the end
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_screening_details(uuid) TO authenticated;
