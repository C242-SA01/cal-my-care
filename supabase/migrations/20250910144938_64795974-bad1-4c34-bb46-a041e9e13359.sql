-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('patient', 'midwife', 'admin');

-- Create enum for screening status
CREATE TYPE public.screening_status AS ENUM ('in_progress', 'completed', 'reviewed');

-- Create enum for anxiety levels
CREATE TYPE public.anxiety_level AS ENUM ('minimal', 'mild', 'moderate', 'severe');

-- Update profiles table for CalMyCare
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'patient';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gestational_age integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_primigravida boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_given boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_date timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create GAD-7 questions table
CREATE TABLE public.gad7_questions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text text NOT NULL,
    question_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Insert GAD-7 questions
INSERT INTO public.gad7_questions (question_text, question_order) VALUES
('Merasa gugup, cemas, atau tegang', 1),
('Tidak dapat menghentikan atau mengendalikan rasa khawatir', 2),
('Khawatir berlebihan tentang hal-hal yang berbeda', 3),
('Kesulitan untuk rileks', 4),
('Gelisah sehingga sulit untuk duduk diam', 5),
('Mudah terganggu atau mudah tersinggung', 6),
('Merasa takut seolah-olah sesuatu yang mengerikan akan terjadi', 7);

-- Create screenings table
CREATE TABLE public.screenings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status screening_status DEFAULT 'in_progress' NOT NULL,
    total_score integer,
    anxiety_level anxiety_level,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create screening answers table
CREATE TABLE public.screening_answers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    screening_id uuid REFERENCES public.screenings(id) ON DELETE CASCADE NOT NULL,
    question_id uuid REFERENCES public.gad7_questions(id) NOT NULL,
    score integer NOT NULL CHECK (score >= 0 AND score <= 3),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(screening_id, question_id)
);

-- Create educational materials table
CREATE TABLE public.educational_materials (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    material_type text DEFAULT 'article', -- article, video, infographic
    anxiety_level anxiety_level,
    image_url text,
    video_url text,
    is_published boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id uuid REFERENCES public.educational_materials(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    is_published boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text text NOT NULL,
    question_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create quiz options table
CREATE TABLE public.quiz_options (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false,
    option_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create user quiz attempts table
CREATE TABLE public.user_quiz_attempts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    score integer NOT NULL DEFAULT 0,
    total_questions integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gad7_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for screenings
CREATE POLICY "Users can view their own screenings" 
ON public.screenings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screenings" 
ON public.screenings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screenings" 
ON public.screenings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Midwives can view all screenings" 
ON public.screenings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('midwife', 'admin')
  )
);

-- Create RLS policies for screening answers
CREATE POLICY "Users can manage their screening answers" 
ON public.screening_answers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.screenings 
    WHERE id = screening_id AND user_id = auth.uid()
  )
);

-- Create RLS policies for educational materials
CREATE POLICY "Everyone can view published materials" 
ON public.educational_materials 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Midwives can manage materials" 
ON public.educational_materials 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('midwife', 'admin')
  )
);

-- Create RLS policies for GAD-7 questions
CREATE POLICY "Everyone can view GAD-7 questions" 
ON public.gad7_questions 
FOR SELECT 
USING (true);

-- Create RLS policies for quizzes
CREATE POLICY "Everyone can view published quizzes" 
ON public.quizzes 
FOR SELECT 
USING (is_published = true);

-- Create RLS policies for quiz questions and options
CREATE POLICY "Everyone can view quiz questions" 
ON public.quiz_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = quiz_id AND is_published = true
  )
);

CREATE POLICY "Everyone can view quiz options" 
ON public.quiz_options 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_questions q
    JOIN public.quizzes qz ON q.quiz_id = qz.id
    WHERE q.id = question_id AND qz.is_published = true
  )
);

-- Create RLS policies for user quiz attempts
CREATE POLICY "Users can view their own quiz attempts" 
ON public.user_quiz_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts" 
ON public.user_quiz_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_materials_updated_at
  BEFORE UPDATE ON public.educational_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample educational materials
INSERT INTO public.educational_materials (title, content, material_type, anxiety_level) VALUES
(
  'Mengelola Kecemasan Ringan Selama Kehamilan',
  'Kecemasan ringan selama kehamilan adalah hal yang normal. Berikut beberapa tips untuk mengelolanya: 1. Praktikkan teknik pernapasan dalam, 2. Lakukan olahraga ringan seperti jalan santai, 3. Bicarakan perasaan Anda dengan pasangan atau keluarga, 4. Cukupi waktu istirahat dan tidur.',
  'article',
  'mild'
),
(
  'Kapan Harus Mencari Bantuan Profesional',
  'Segera konsultasikan dengan tenaga kesehatan jika Anda mengalami: kecemasan yang mengganggu aktivitas sehari-hari, kesulitan tidur yang berkelanjutan, kehilangan nafsu makan, atau pikiran yang mengganggu tentang kehamilan.',
  'article',
  'moderate'
),
(
  'Teknik Relaksasi untuk Ibu Hamil',
  'Relaksasi dapat membantu mengurangi kecemasan. Cobalah: meditasi mindfulness 10 menit setiap hari, yoga prenatal, mendengarkan musik yang menenangkan, atau mandi air hangat.',
  'article',
  'minimal'
);