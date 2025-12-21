create or replace function check_if_email_exists(email_to_check text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from auth.users
    where email = email_to_check
  );
end;
$$;
