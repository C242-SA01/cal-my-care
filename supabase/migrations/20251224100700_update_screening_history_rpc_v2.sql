-- Versi 2 dari get_screening_history
-- Perubahan: Menambahkan kolom 'id' ke dalam output tabel.
-- Kolom 'id' ini dibutuhkan oleh frontend untuk membuat link ke halaman detail hasil skrining.

DROP FUNCTION IF EXISTS get_screening_history();

CREATE OR REPLACE FUNCTION get_screening_history()
RETURNS TABLE (
  id uuid, -- DITAMBAHKAN
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
    s.id, -- DITAMBAHKAN
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
