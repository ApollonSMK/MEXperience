
-- Enable Row Level Security for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to avoid conflicts
DROP POLICY IF EXISTS "Allow individual access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read plans" ON public.plans;

-- Create a policy that allows users to read, insert, update, and delete their own profile.
CREATE POLICY "Allow individual access to own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy that allows admin users to read all profiles (for the admin dashboard).
CREATE POLICY "Allow admin read access to all profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Enable RLS for plans table (best practice)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows any authenticated user to read all plans.
CREATE POLICY "Allow authenticated users to read plans"
ON public.plans
FOR SELECT
USING (auth.role() = 'authenticated');
