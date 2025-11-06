-- Drop the existing function if it exists, to avoid signature conflicts.
DROP FUNCTION IF EXISTS public.delete_user_by_id(user_id_to_delete uuid);

-- Create the new function to delete a user from auth and cascade to profiles.
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will delete the user from the Supabase authentication system.
  -- A trigger on auth.users should then handle deleting the corresponding public.profiles record.
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;
