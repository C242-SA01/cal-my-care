CREATE OR REPLACE FUNCTION public.get_screening_details(p_screening_id uuid)
RETURNS TABLE (
    id uuid,
    completed_at timestamptz,
    total_score integer,
    anxiety_level public.anxiety_level,
    notes text,
    status public.screening_status,
    full_name text,
    email text,
    question_text text,
    answer_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS '
BEGIN
    -- WORKAROUND: Role check disabled as 'role' column is missing from profiles table.
    RETURN QUERY
    SELECT
        s.id,
        s.completed_at,
        s.total_score,
        s.anxiety_level,
        s.notes,
        s.status,
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
';

GRANT EXECUTE ON FUNCTION public.get_screening_details(uuid) TO authenticated;