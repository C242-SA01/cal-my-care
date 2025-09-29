-- This migration ensures the handle_new_user function exists and then creates the trigger for it.
-- This is a self-contained fix for the new user profile creation issue.

-- Step 1: Ensure the function exists using CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
    );
  return new;
end;
$function$;

-- Step 2: Create the trigger that calls the function
-- Drop trigger first to make this script re-runnable
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();