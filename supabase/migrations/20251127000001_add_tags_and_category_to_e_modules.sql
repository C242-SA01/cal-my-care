-- Add tags and category columns to e_modules table
ALTER TABLE public.e_modules
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS category TEXT;
