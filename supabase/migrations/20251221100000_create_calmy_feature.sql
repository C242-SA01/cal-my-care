-- 1. Definisikan tipe enum untuk mood (opsional, namun direkomendasikan)
CREATE TYPE public.mood_enum AS ENUM ('senang', 'sedih', 'lelah', 'bersemangat', 'biasa');

-- 2. Buat tabel calmy_notes
CREATE TABLE public.calmy_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_date date NOT NULL,
    title text,
    content text NOT NULL,
    mood public.mood_enum, -- Menggunakan tipe enum yang sudah dibuat
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Beri komentar pada tabel dan kolom untuk dokumentasi
COMMENT ON TABLE public.calmy_notes IS 'Catatan harian pribadi untuk user (pasien).';
COMMENT ON COLUMN public.calmy_notes.mood IS 'Mood atau perasaan user saat membuat catatan.';

-- 4. Buat fungsi untuk auto-update kolom updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_calmy_notes_updated
BEFORE UPDATE ON public.calmy_notes
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Aktifkan Row Level Security (RLS)
ALTER TABLE public.calmy_notes ENABLE ROW LEVEL SECURITY;

-- 6. Buat index untuk optimasi query
CREATE INDEX idx_calmy_notes_user_date ON public.calmy_notes (user_id, note_date);

-- 7. RLS Policies

-- Policy 1: User bisa MELIHAT (SELECT) hanya catatan miliknya sendiri.
CREATE POLICY "Allow patient to read their own notes"
ON public.calmy_notes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: User bisa MENAMBAH (INSERT) catatan untuk dirinya sendiri.
CREATE POLICY "Allow patient to create their own notes"
ON public.calmy_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: User bisa MENGUBAH (UPDATE) hanya catatan miliknya sendiri.
CREATE POLICY "Allow patient to update their own notes"
ON public.calmy_notes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: User bisa MENGHAPUS (DELETE) hanya catatan miliknya sendiri.
CREATE POLICY "Allow patient to delete their own notes"
ON public.calmy_notes
FOR DELETE
USING (auth.uid() = user_id);
