CREATE OR REPLACE FUNCTION public.get_all_screening_results()
RETURNS TABLE (
    id uuid,
    completed_at timestamptz,
    total_score integer,
    anxiety_level public.anxiety_level,
    full_name text,
    email text
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
        p.email
    FROM
        public.screenings s
    JOIN
        public.profiles p ON s.user_id = p.id
    ORDER BY
        s.completed_at DESC;
END;
$$;

-- Grant execution rights to authenticated users. 
-- RLS on the function itself or the calling page should handle role access.
GRANT EXECUTE ON FUNCTION public.get_all_screening_results() TO authenticated;
