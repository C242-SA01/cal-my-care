-- Add trimester column to screenings table
ALTER TABLE public.screenings
ADD COLUMN trimester INT;

-- Add a check constraint to ensure trimester is 1, 2, or 3
ALTER TABLE public.screenings
ADD CONSTRAINT chk_trimester_value CHECK (trimester >= 1 AND trimester <= 3);

-- Catatan Penting untuk RLS (Row Level Security):
-- Jika RLS diaktifkan pada tabel 'screenings', pastikan kebijakan INSERT dan UPDATE
-- yang sudah ada (atau yang baru) mengizinkan penambahan dan pembaruan kolom 'trimester'.
-- Kebijakan yang sudah ada yang mengizinkan pengguna untuk INSERT/UPDATE skrining mereka
-- sendiri (misalnya berdasarkan 'user_id') kemungkinan sudah cukup.