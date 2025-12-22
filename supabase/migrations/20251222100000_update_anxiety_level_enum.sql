-- Step 1: Temporarily remove the dependency on the ENUM type
ALTER TABLE public.screenings ALTER COLUMN anxiety_level TYPE TEXT;
ALTER TABLE public.educational_materials ALTER COLUMN anxiety_level TYPE TEXT;

-- Step 2: Drop the old ENUM type
DROP TYPE public.anxiety_level;

-- Step 3: Create the new ENUM type with the desired values
CREATE TYPE public.anxiety_level AS ENUM (
  'normal',
  'ringan',
  'sedang',
  'berat'
);

-- Step 4: Convert old data to new values. 
-- This is a safe-guard and mapping step. If there's old data, it needs to be mapped.
-- minimal -> normal
-- mild -> ringan
-- moderate -> sedang
-- severe -> berat
UPDATE public.screenings SET anxiety_level = 
  CASE
    WHEN anxiety_level = 'minimal' THEN 'normal'
    WHEN anxiety_level = 'mild' THEN 'ringan'
    WHEN anxiety_level = 'moderate' THEN 'sedang'
    WHEN anxiety_level = 'severe' THEN 'berat'
    ELSE anxiety_level -- Keep it if it's already in the new format for some reason
  END;

UPDATE public.educational_materials SET anxiety_level = 
  CASE
    WHEN anxiety_level = 'minimal' THEN 'normal'
    WHEN anxiety_level = 'mild' THEN 'ringan'
    WHEN anxiety_level = 'moderate' THEN 'sedang'
    WHEN anxiety_level = 'severe' THEN 'berat'
    ELSE anxiety_level
  END;

-- Step 5: Re-apply the ENUM type to the columns
ALTER TABLE public.screenings ALTER COLUMN anxiety_level TYPE public.anxiety_level USING (anxiety_level::public.anxiety_level);
ALTER TABLE public.educational_materials ALTER COLUMN anxiety_level TYPE public.anxiety_level USING (anxiety_level::public.anxiety_level);
