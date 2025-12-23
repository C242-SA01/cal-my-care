-- Add a 'screening_type' column to the screenings table to differentiate between
-- regular trimester screenings and the one-time pre-test.

ALTER TABLE public.screenings
ADD COLUMN screening_type TEXT;

-- Optional: Add a comment for clarity in the database schema
COMMENT ON COLUMN public.screenings.screening_type IS 'Tipe skrining, misalnya ''trimester'' atau ''pretest''.';
