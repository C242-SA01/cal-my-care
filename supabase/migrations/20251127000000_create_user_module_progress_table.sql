-- Create the user_module_progress table
CREATE TABLE IF NOT EXISTS public.user_module_progress (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.e_modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, module_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_module_progress_updated_at ON public.user_module_progress;
CREATE TRIGGER set_user_module_progress_updated_at
BEFORE UPDATE ON public.user_module_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies for user_module_progress
-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
ON public.user_module_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
ON public.user_module_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
ON public.user_module_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all progress records
CREATE POLICY "Admins can manage all progress"
ON public.user_module_progress
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
