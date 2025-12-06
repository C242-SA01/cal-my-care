
ALTER TABLE public.profiles
ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE;
