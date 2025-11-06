-- supabase/migrations/20241107000001_create_delete_user_function.sql

-- First, ensure the function is created in the public schema
-- but has the security definer context to access the auth schema.
create or replace function public.delete_user_by_id(user_id_to_delete uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the calling user is an admin.
  -- This is a crucial security check.
  -- It relies on the presence of a 'profiles' table with an 'is_admin' column.
  if not (
    select is_admin
    from public.profiles
    where id = auth.uid()
  ) then
    raise exception 'Permission denied: You must be an admin to delete users.';
  end if;

  -- Perform the deletion from the auth.users table.
  -- This is the core action that actually deletes the user account.
  delete from auth.users where id = user_id_to_delete;

  -- The deletion from public.profiles will happen automatically
  -- if you have a cascading delete trigger on the foreign key.
  -- If not, you should explicitly delete from profiles as well.
  -- The trigger is the recommended approach.
end;
$$;


-- Grant execution rights for the function to the 'service_role'
-- This is necessary because the function has `security definer` privileges.
grant execute on function public.delete_user_by_id(uuid) to service_role;

-- Also grant execute to authenticated users, as the function itself contains the admin check.
grant execute on function public.delete_user_by_id(uuid) to authenticated;
