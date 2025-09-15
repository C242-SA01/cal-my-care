CREATE OR REPLACE FUNCTION public.get_screening_details(p_screening_id uuid)
RETURNS TABLE (
    -- Screening Info
    screening_id uuid,
    completed_at timestamptz,
    total_score integer,
    anxiety_level public.anxiety_level,
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
    -- Check if the caller is an admin or midwife
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'midwife')
    ) THEN
        RAISE EXCEPTION 'Permission denied. Only admins and midwives can access screening details.';
    END IF;

    RETURN QUERY
    SELECT
        s.id as screening_id,
        s.completed_at,
        s.total_score,
        s.anxiety_level,
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

GRANT EXECUTE ON FUNCTION public.get_screening_details(uuid) TO authenticated;
