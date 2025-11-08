
-- Enable Row Level Security on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on profiles to avoid conflicts
DROP POLICY IF EXISTS "Allow individual access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;

-- Create a new policy that allows users to SELECT their own profile
CREATE POLICY "Allow individual read access to own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Create a new policy that allows users to UPDATE their own profile
CREATE POLICY "Allow individual update access to own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Optionally, create a policy for admins to be able to see all profiles
-- This depends on having a way to identify admins, e.g., a custom claim or another table.
-- For now, we will focus on user-specific access.
