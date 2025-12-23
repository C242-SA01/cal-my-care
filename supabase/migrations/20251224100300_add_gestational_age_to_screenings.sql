-- Menambahkan kolom untuk mencatat usia kehamilan (dalam minggu) pada saat kuis diselesaikan.
-- Ini penting untuk plotting data yang akurat pada grafik perkembangan di fitur Care.

ALTER TABLE public.screenings
ADD COLUMN gestational_age_at_completion INTEGER;

COMMENT ON COLUMN public.screenings.gestational_age_at_completion IS 'Usia kehamilan dalam minggu saat skrining diselesaikan.';
