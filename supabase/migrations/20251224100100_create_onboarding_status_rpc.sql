CREATE OR REPLACE FUNCTION get_user_onboarding_status()
RETURNS TABLE (
  is_profile_complete BOOLEAN,
  is_pretest_pass_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.is_profile_complete,
    p.is_pretest_pass_completed
  FROM
    profiles AS p
  WHERE
    p.id = auth.uid()
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_onboarding_status() TO authenticated;
