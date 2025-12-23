-- Membuat fungsi RPC untuk mengambil seluruh riwayat skrining yang telah selesai
-- untuk pengguna yang sedang login. Data ini akan digunakan untuk me-render
-- kedua grafik di halaman "Care".

CREATE OR REPLACE FUNCTION get_screening_history()
RETURNS TABLE (
  screening_type text,
  total_score integer,
  anxiety_level text,
  completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.screening_type,
    s.total_score,
    s.anxiety_level,
    s.completed_at
  FROM
    public.screenings s
  WHERE
    s.user_id = auth.uid() AND s.status = 'completed'
  ORDER BY
    s.completed_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_screening_history() TO authenticated;
