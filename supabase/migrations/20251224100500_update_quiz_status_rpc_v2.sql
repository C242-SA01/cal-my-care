-- Versi 2 dari get_user_quiz_status
-- Perubahan: Fungsi ini sekarang mengembalikan satu objek JSONB.
-- Setiap key dalam objek adalah tipe kuis, dan value-nya adalah JSON lain
-- yang berisi 'status' dan 'screening_id' (jika sudah selesai).
-- Ini lebih fleksibel dan efisien daripada me-return banyak kolom.

DROP FUNCTION IF EXISTS get_user_quiz_status();

CREATE OR REPLACE FUNCTION get_user_quiz_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_current_trimester text;
  completed_quizzes record;
  result_jsonb jsonb;
  
  -- Inisialisasi status default
  status_trimester_1 jsonb := '{"status": "locked", "screening_id": null}';
  status_trimester_2 jsonb := '{"status": "locked", "screening_id": null}';
  status_trimester_3 jsonb := '{"status": "locked", "screening_id": null}';
  status_post_test jsonb   := '{"status": "active", "screening_id": null}';

BEGIN
  -- 1. Dapatkan data user
  current_user_id := auth.uid();
  SELECT trimester INTO user_current_trimester FROM public.profiles WHERE id = current_user_id;

  -- 2. Tentukan status 'active' berdasarkan trimester user saat ini
  IF user_current_trimester = 'I' THEN
    status_trimester_1 := '{"status": "active", "screening_id": null}';
  ELSIF user_current_trimester = 'II' THEN
    status_trimester_2 := '{"status": "active", "screening_id": null}';
  ELSIF user_current_trimester = 'III' THEN
    status_trimester_3 := '{"status": "active", "screening_id": null}';
  END IF;

  -- 3. Loop melalui kuis yang sudah selesai dan timpa statusnya
  FOR completed_quizzes IN
    SELECT id, screening_type FROM public.screenings
    WHERE user_id = current_user_id AND status = 'completed'
      AND screening_type IN ('trimester_1', 'trimester_2', 'trimester_3', 'post_test')
  LOOP
    IF completed_quizzes.screening_type = 'trimester_1' THEN
      status_trimester_1 := jsonb_build_object('status', 'completed', 'screening_id', completed_quizzes.id);
    ELSIF completed_quizzes.screening_type = 'trimester_2' THEN
      status_trimester_2 := jsonb_build_object('status', 'completed', 'screening_id', completed_quizzes.id);
    ELSIF completed_quizzes.screening_type = 'trimester_3' THEN
      status_trimester_3 := jsonb_build_object('status', 'completed', 'screening_id', completed_quizzes.id);
    ELSIF completed_quizzes.screening_type = 'post_test' THEN
      status_post_test := jsonb_build_object('status', 'completed', 'screening_id', completed_quizzes.id);
    END IF;
  END LOOP;

  -- 4. Gabungkan semua menjadi satu objek JSONB hasil
  result_jsonb := jsonb_build_object(
    'trimester_1', status_trimester_1,
    'trimester_2', status_trimester_2,
    'trimester_3', status_trimester_3,
    'post_test', status_post_test
  );

  -- 5. Kembalikan hasil
  RETURN result_jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_quiz_status() TO authenticated;
