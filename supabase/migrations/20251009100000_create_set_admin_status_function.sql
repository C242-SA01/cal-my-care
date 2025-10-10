-- Drop the old, incorrect function
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text);

-- Create a new, atomic function to grant or revoke admin status
CREATE OR REPLACE FUNCTION public.set_admin_status(target_user_id uuid, grant_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF grant_admin THEN
    -- Grant admin status
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_user_id;

    INSERT INTO public.admins (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    -- Revoke admin status and set role to 'mother'
    UPDATE public.profiles
    SET role = 'mother' -- Set back to the default patient role
    WHERE id = target_user_id;

    DELETE FROM public.admins
    WHERE user_id = target_user_id;
  END IF;
END;
$$;
