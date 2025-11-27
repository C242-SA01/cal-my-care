-- Create the e_modules table
CREATE TABLE IF NOT EXISTS public.e_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    cover_image_url TEXT
);

-- Enable Row Level Security
ALTER TABLE public.e_modules ENABLE ROW LEVEL SECURITY;

-- Grant all permissions to service_role
GRANT ALL ON TABLE public.e_modules TO service_role;

-- RLS Policies for e_modules
CREATE POLICY "Admins can manage e_modules"
ON public.e_modules
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view e_modules"
ON public.e_modules
FOR SELECT
TO authenticated
USING (is_published = true);

-- Create a public bucket for e-modules
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('e-modules', 'e-modules', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS Policies for e-modules storage
-- Allow public read access
CREATE POLICY "Public can view e_module files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'e-modules');

-- Restrict mutations to admins
CREATE POLICY "Admins can manage e_module files"
ON storage.objects
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (bucket_id = 'e-modules' AND public.is_admin())
WITH CHECK (bucket_id = 'e-modules' AND public.is_admin());
