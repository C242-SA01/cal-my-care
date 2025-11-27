-- 1. Create the table for e-modules
-- CONFLICT WARNING: An 'e_modules' table already exists from a previous migration (20251123100000_create_emodul_table.sql).
-- This one has different columns (e.g., 'pdf_storage_path', 'flipbook_url', 'author_id').
-- The existing table has 'file_url', 'cover_image_url', 'tags', 'category'.
-- You must decide which schema to use. Running this as-is may fail or cause inconsistencies.
CREATE TABLE IF NOT EXISTS public.e_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    pdf_storage_path TEXT NOT NULL, -- Stores the path in Supabase Storage, e.g., 'public/modules/file.pdf'
    flipbook_url TEXT, -- Stores the Heyzine or other iframe embed URL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.e_modules IS 'Stores educational e-modules (materials).';
COMMENT ON COLUMN public.e_modules.pdf_storage_path IS 'Path to the PDF file in Supabase Storage.';
COMMENT ON COLUMN public.e_modules.flipbook_url IS 'URL for the embedded flipbook view (e.g., Heyzine).';


-- 2. Create the table for user bookmarks
-- CONFLICT WARNING: A similar table 'user_module_progress' was created in migration 20251127000000_create_user_module_progress_table.sql.
-- This creates 'user_bookmarked_modules'. You need to decide if you need both or just one.
CREATE TABLE IF NOT EXISTS public.user_bookmarked_modules (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.e_modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, module_id)
);

COMMENT ON TABLE public.user_bookmarked_modules IS 'Join table to track which users have bookmarked which e-modules.';


-- 3. Set up Row-Level Security (RLS) for e_modules table
ALTER TABLE public.e_modules ENABLE ROW LEVEL SECURITY;

-- CONFLICT WARNING: The admin check here is different from other migrations.
-- This uses: (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
-- Existing migrations use: public.is_admin()
-- It's best to be consistent.
DROP POLICY IF EXISTS "Allow all authenticated users to read e-modules" ON public.e_modules;
CREATE POLICY "Allow all authenticated users to read e-modules"
    ON public.e_modules FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admins to create e-modules" ON public.e_modules;
CREATE POLICY "Allow admins to create e-modules"
    ON public.e_modules FOR INSERT
    TO authenticated
    WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Allow admins to update e-modules" ON public.e_modules;
CREATE POLICY "Allow admins to update e-modules"
    ON public.e_modules FOR UPDATE
    TO authenticated
    USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Allow admins to delete e-modules" ON public.e_modules;
CREATE POLICY "Allow admins to delete e-modules"
    ON public.e_modules FOR DELETE
    TO authenticated
    USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );


-- 4. Set up Row-Level Security (RLS) for user_bookmarked_modules table
ALTER TABLE public.user_bookmarked_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to see their own bookmarks" ON public.user_bookmarked_modules;
CREATE POLICY "Allow users to see their own bookmarks"
    ON public.user_bookmarked_modules FOR SELECT
    TO authenticated
    USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Allow users to create their own bookmarks" ON public.user_bookmarked_modules;
CREATE POLICY "Allow users to create their own bookmarks"
    ON public.user_bookmarked_modules FOR INSERT
    TO authenticated
    WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Allow users to delete their own bookmarks" ON public.user_bookmarked_modules;
CREATE POLICY "Allow users to delete their own bookmarks"
    ON public.user_bookmarked_modules FOR DELETE
    TO authenticated
    USING ( auth.uid() = user_id );


-- 5. Create Supabase Storage Bucket and Policies for PDF files
-- CONFLICT WARNING: A bucket named 'e-modules' already exists. This tries to create 'e_module_pdfs'.
-- You should use one consistent bucket name for all e-module files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('e_module_pdfs', 'e_module_pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- FIXED: The 'COMMENT ON BUCKET' command below caused a syntax error and has been removed.
-- Bucket comments/descriptions must be added via the Supabase Dashboard, not SQL.
-- COMMENT ON BUCKET e_module_pdfs IS 'Stores PDF files for the e-modules.';

-- Storage RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view PDFs" ON storage.objects;
CREATE POLICY "Allow authenticated users to view PDFs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING ( bucket_id = 'e_module_pdfs' );

DROP POLICY IF EXISTS "Allow admins to upload PDFs" ON storage.objects;
CREATE POLICY "Allow admins to upload PDFs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK ( bucket_id = 'e_module_pdfs' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Allow admins to update PDFs" ON storage.objects;
CREATE POLICY "Allow admins to update PDFs"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING ( bucket_id = 'e_module_pdfs' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Allow admins to delete PDFs" ON storage.objects;
CREATE POLICY "Allow admins to delete PDFs"
    ON storage.objects FOR DELETE
    TO authenticated
    USING ( bucket_id = 'e_module_pdfs' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );