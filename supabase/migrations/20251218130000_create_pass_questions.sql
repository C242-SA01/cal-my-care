-- =================================================================
-- Create and Populate PASS Questions Table
-- =================================================================
--
-- This migration creates a new table `pass_questions` for the 31-question
-- "Perinatal Anxiety Screening Scale (PASS)" quiz, replacing the
-- previously used `gad7_questions` which was incorrect for this context.

-- 1. Create the new table for PASS questions
CREATE TABLE public.pass_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    question_text text NOT NULL,
    question_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Add comments for clarity
COMMENT ON TABLE public.pass_questions IS 'Stores the questions for the Perinatal Anxiety Screening Scale (PASS) quiz.';
COMMENT ON COLUMN public.pass_questions.question_order IS 'The order in which the question appears in the quiz.';

-- 3. Populate the table with the 31 PASS questions
INSERT INTO public.pass_questions (question_text, question_order) VALUES
('Khawatir terhadap janin atau kehamilan', 1),
('Takut jika bahaya akan datang pada janin', 2),
('Merasa takut akan hal-hal buruk yang akan terjadi', 3),
('Khawatir tentang banyak hal', 4),
('Khawatir tentang masa depan', 5),
('Merasa kelelahan', 6),
('Merasa takut terhadap jarum, darah, kelahiran, nyeri, dan sakit', 7),
('Mendadak merasa takut atau tidak nyaman berlebihan', 8),
('Memikirkan suatu hal berulang-ulang dan sulit dihentikan atau dikontrol', 9),
('Sulit tidur walau ada kesempatan tidur sempurna', 10),
('Merasa harus melakukan hal-hal sesuai aturan', 11),
('Menginginkan segala sesuatu sempurna', 12),
('Merasa perlu mengendalikan segala hal', 13),
('Sulit berhenti memeriksa atau melakukan sesuatu secara berlebihan', 14),
('Merasa gelisah atau mudah terkejut', 15),
('Merasa khawatir atas pikiran berulang', 16),
('Merasa perlu selalu mengawasi sesuatu', 17),
('Terganggu kenangan berulang atau mimpi buruk', 18),
('Khawatir mempermalukan diri di depan orang lain', 19),
('Khawatir orang lain menilai negatif', 20),
('Tidak nyaman di keramaian', 21),
('Menghindari kegiatan sosial', 22),
('Menghindari hal yang membuat risau', 23),
('Merasa terpisah dari diri sendiri', 24),
('Lupa waktu dan apa yang telah terjadi', 25),
('Sulit menyesuaikan diri dengan perubahan', 26),
('Khawatir tidak mampu melakukan sesuatu', 27),
('Pikiran tidak berhenti dan sulit berkonsentrasi', 28),
('Takut kehilangan kendali', 29),
('Merasa panik', 30),
('Merasa gelisah', 31);

-- 4. Enable Row Level Security (RLS) and add a policy
-- This ensures that the questions can be read by any logged-in user.
ALTER TABLE public.pass_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read pass_questions"
ON public.pass_questions
FOR SELECT
TO authenticated
USING (true);
