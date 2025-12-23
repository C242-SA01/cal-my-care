-- Menambahkan kolom untuk status kelengkapan profil
ALTER TABLE public.profiles
ADD COLUMN is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Menambahkan kolom untuk status penyelesaian pre-test
ALTER TABLE public.profiles
ADD COLUMN is_pretest_pass_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Menambahkan kolom timestamp untuk kapan pre-test diselesaikan
ALTER TABLE public.profiles
ADD COLUMN pretest_pass_completed_at TIMESTAMPTZ;

-- Menambahkan RLS (Row Level Security) untuk memastikan hanya service_role (backend) yang bisa mengubah status ini
-- Ini mencegah pengguna mengubah status onboarding mereka sendiri dari sisi klien secara langsung.
CREATE POLICY "Allow server to update onboarding status"
ON public.profiles
FOR UPDATE USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Memastikan pengguna tetap bisa mengupdate profil mereka sendiri (selain kolom onboarding)
-- Asumsi: sudah ada policy untuk update profil, jika belum, ini bisa jadi dasar.
-- Pastikan untuk menyesuaikan `id = auth.uid()` jika nama kolomnya berbeda.
-- ALTER POLICY "Users can update their own profile." ON public.profiles
-- USING (id = auth.uid());

