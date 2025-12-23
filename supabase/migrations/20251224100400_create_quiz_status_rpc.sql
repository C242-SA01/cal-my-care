-- Membuat fungsi RPC untuk mendapatkan status semua kuis (Trimester 1-3 dan Post Test) untuk pengguna yang sedang login.
-- Status bisa berupa: 'active', 'locked', 'completed'.
CREATE OR REPLACE FUNCTION get_user_quiz_status()
RETURNS TABLE (
  trimester_1 text,
  trimester_2 text,
  trimester_3 text,
  post_test text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_current_trimester text;
  completed_quiz_types text[];
BEGIN
  -- 1. Dapatkan data user
  current_user_id := auth.uid();
  SELECT trimester INTO user_current_trimester FROM public.profiles WHERE id = current_user_id;

  -- 2. Dapatkan semua tipe kuis yang sudah selesai oleh user
  SELECT array_agg(screening_type) INTO completed_quiz_types
  FROM public.screenings
  WHERE user_id = current_user_id AND status = 'completed';

  -- Jika tidak ada kuis yang selesai, inisialisasi array kosong untuk menghindari null
  IF completed_quiz_types IS NULL THEN
    completed_quiz_types := ARRAY[]::text[];
  END IF;

  -- 3. Inisialisasi status default. Post test selalu aktif jika belum selesai.
  trimester_1 := 'locked';
  trimester_2 := 'locked';
  trimester_3 := 'locked';
  post_test := 'active';

  -- 4. Tentukan status 'active' berdasarkan trimester user saat ini
  IF user_current_trimester = 'I' THEN
    trimester_1 := 'active';
  ELSIF user_current_trimester = 'II' THEN
    trimester_1 := 'locked'; -- Asumsi tidak bisa mengerjakan kuis trimester sebelumnya
    trimester_2 := 'active';
  ELSIF user_current_trimester = 'III' THEN
    trimester_1 := 'locked';
    trimester_2 := 'locked';
    trimester_3 := 'active';
  END IF;

  -- 5. Timpa status menjadi 'completed' untuk semua kuis yang sudah ada di riwayat
  IF 'trimester_1' = ANY(completed_quiz_types) THEN
    trimester_1 := 'completed';
  END IF;
  IF 'trimester_2' = ANY(completed_quiz_types) THEN
    trimester_2 := 'completed';
  END IF;
  IF 'trimester_3' = ANY(completed_quiz_types) THEN
    trimester_3 := 'completed';
  END IF;
  IF 'post_test' = ANY(completed_quiz_types) THEN
    post_test := 'completed';
  END IF;

  -- 6. Kembalikan hasil
  RETURN QUERY SELECT trimester_1, trimester_2, trimester_3, post_test;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_quiz_status() TO authenticated;
