  -- Step 1: Create the 'admins' table to store admin user IDs.
  CREATE TABLE IF NOT EXISTS public.admins (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
  );

  -- Informational comment for the developer
  -- After running this migration, you need to manually insert the user_id of your admin users into the 'admins' table.
  -- Example: INSERT INTO public.admins (user_id) VALUES ('your-admin-user-id');

  -- Step 2: Create or replace the function to check for admin privileges.
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM public.admins
      WHERE user_id = auth.uid()
    );
  END;
  $$;

  -- Step 3: Clean up and fix RLS policies for 'screenings' table.

  -- Drop the old insecure "view all" policy.
  DROP POLICY IF EXISTS "Midwives can view all screenings" ON public.screenings;
  -- Drop the old broken update policy from the previous migration attempt.
  DROP POLICY IF EXISTS "Admins can update screenings" ON public.screenings;
  -- Drop the user-specific update policy which we will replace with a more specific one.
  DROP POLICY IF EXISTS "Users can update their own screenings" ON public.screenings;


  -- Create a new policy for admins to view all screenings.
  CREATE POLICY "Admins can view all screenings"
  ON public.screenings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

  -- Create a new policy for admins to update screenings (for reviews).
  CREATE POLICY "Admins can update screenings for review"
  ON public.screenings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

  -- Re-create the policy for users to update their own screenings, but only if they are in progress.
  CREATE POLICY "Users can update their own in-progress screenings"
  ON public.screenings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'in_progress');


  -- Step 4: Clean up and fix RLS policies for 'educational_materials' table.

  -- Drop the old insecure policy.
  DROP POLICY IF EXISTS "Midwives can manage materials" ON public.educational_materials;

  -- Create a new policy for admins to manage all educational materials.
  CREATE POLICY "Admins can manage educational materials"
  ON public.educational_materials
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


  -- Step 5: Clean up and fix RLS policies for 'screening_answers' table.

  -- Drop the old insecure policy.
  DROP POLICY IF EXISTS "Admins and midwives can view all screening answers" ON public.screening_answers;

  -- Create a new policy for admins to view all screening answers.
  CREATE POLICY "Admins can view all screening answers"
  ON public.screening_answers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
