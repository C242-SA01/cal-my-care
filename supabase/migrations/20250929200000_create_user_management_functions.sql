-- Functions for Admin User Management

-- 1. Function to get all users with their admin status.
--    Only admins can call this.
CREATE OR REPLACE FUNCTION public.get_users_with_admin_status()
RETURNS TABLE (
    user_id uuid,
    full_name text,
    email text,
    is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- First, ensure the caller is an admin.
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can access this function.';
    END IF;

    -- Return the list of users and their admin status.
    RETURN QUERY
    SELECT
        p.id as user_id,
        p.full_name,
        p.email,
        EXISTS(SELECT 1 FROM public.admins a WHERE a.user_id = p.id) as is_admin
    FROM
        public.profiles p
    ORDER BY
        p.full_name;
END;
$$;

-- 2. Function to grant admin role to a user.
--    Only admins can call this.
CREATE OR REPLACE FUNCTION public.grant_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- First, ensure the caller is an admin.
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can perform this action.';
    END IF;

    -- Insert the user into the admins table.
    -- ON CONFLICT DO NOTHING prevents errors if the user is already an admin.
    INSERT INTO public.admins (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 3. Function to revoke admin role from a user.
--    Only admins can call this.
CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- First, ensure the caller is an admin.
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can perform this action.';
    END IF;

    -- Prevent an admin from revoking their own role.
    IF auth.uid() = target_user_id THEN
        RAISE EXCEPTION 'Admins cannot revoke their own admin status.';
    END IF;

    -- Delete the user from the admins table.
    DELETE FROM public.admins
    WHERE user_id = target_user_id;
END;
$$;
