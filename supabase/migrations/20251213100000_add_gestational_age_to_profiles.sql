-- Add gestational_age_weeks to profiles table
ALTER TABLE public.profiles
ADD COLUMN gestational_age_weeks INT;

-- Optional: Add a check constraint to ensure weeks are within a reasonable range for pregnancy
ALTER TABLE public.profiles
ADD CONSTRAINT chk_gestational_age_weeks CHECK (gestational_age_weeks >= 1 AND gestational_age_weeks <= 42);

-- Catatan Penting untuk RLS (Row Level Security):
-- Jika RLS diaktifkan pada tabel 'profiles', pastikan ada kebijakan yang mengizinkan
-- pengguna untuk memperbarui kolom 'gestational_age_weeks' mereka sendiri.
-- Contoh kebijakan (jika belum ada atau perlu dimodifikasi):
-- CREATE POLICY "Users can update their own gestational_age_weeks"
--   ON public.profiles
--   FOR UPDATE USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);