-- 1. Create the 'profiles' table
-- This table stores public profile data for each user.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments to the table and columns for clarity.
COMMENT ON TABLE public.profiles IS 'Public profile information for each user, linked to the auth.users table.';
COMMENT ON COLUMN public.profiles.id IS 'User ID from auth.users. This is the primary key.';
COMMENT ON COLUMN public.profiles.full_name IS 'The user''s full name.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL for the user''s avatar image.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of the last profile update.';

-- 2. Enable Row Level Security (RLS) for the 'profiles' table.
-- This ensures that the policies defined below are enforced.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for the 'profiles' table.

-- POLICY: Allow public read access to all profiles.
-- This policy allows any user (authenticated or not) to view profiles.
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- POLICY: Allow users to insert their own profile.
-- This policy allows an authenticated user to create their own profile entry.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- POLICY: Allow users to update their own profile.
-- This policy allows an authenticated user to update only their own profile data.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Create a trigger function to automatically create a profile on new user signup.
-- This function will be called whenever a new user is created in auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

-- Create the trigger that executes the handle_new_user function after a new user is inserted.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add comments to the function and trigger for clarity.
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to automatically create a user profile upon new user registration in auth.users.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Executes the handle_new_user function after a new user is created.';
