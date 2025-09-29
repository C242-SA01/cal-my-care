CREATE OR REPLACE FUNCTION update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET role = new_role::public.user_role
  WHERE id = target_user_id;
END;
$$;