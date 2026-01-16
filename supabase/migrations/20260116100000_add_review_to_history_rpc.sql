-- Versi 3 dari get_screening_history
-- Perubahan:
-- 1. Menambahkan kolom 'status', 'notes', dan 'reviewed_at' untuk menampilkan tinjauan admin.
-- 2. Mengubah filter status untuk menyertakan skrining yang sudah 'completed' dan 'reviewed'.

-- It's safer to drop and recreate if the return table signature changes.
DROP FUNCTION IF EXISTS get_screening_history();

CREATE OR REPLACE FUNCTION get_screening_history()
RETURNS TABLE (
  id uuid,
  screening_type text,
  total_score integer,
  anxiety_level text, -- Kept as text for consistency with v2
  completed_at timestamptz,
  status text, -- DITAMBAHKAN
  notes text, -- DITAMBAHKAN
  reviewed_at timestamptz -- DITAMBAHKAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.screening_type,
    s.total_score,
    s.anxiety_level::text, -- Cast to text for safety
    s.completed_at,
    s.status::text, -- Cast to text for safety
    s.notes,
    s.reviewed_at
  FROM
    public.screenings s
  WHERE
    s.user_id = auth.uid() AND s.status IN ('completed', 'reviewed') -- DIPERBARUI
  ORDER BY
    s.completed_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_screening_history() TO authenticated;
