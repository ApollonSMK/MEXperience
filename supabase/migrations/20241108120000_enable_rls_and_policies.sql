-- 1. Enable RLS for the profiles table
alter table public.profiles enable row level security;

-- 2. Drop existing policies on profiles if they exist, to prevent conflicts
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;
drop policy if exists "Users can read their own profile." on public.profiles;
drop policy if exists "Profiles are public." on public.profiles;

-- 3. Create new, correct policies for the profiles table
create policy "Profiles are public."
on public.profiles for select
using ( true );

create policy "Users can insert their own profile."
on public.profiles for insert
with check ( auth.uid() = id );

create policy "Users can update their own profile."
on public.profiles for update
using ( auth.uid() = id );

-- 4. Enable RLS for the plans table
alter table public.plans enable row level security;

-- 5. Drop existing policies on plans if they exist
drop policy if exists "Plans are publicly viewable." on public.plans;

-- 6. Create a policy to allow any authenticated user to read plans
create policy "Plans are publicly viewable."
on public.plans for select
using ( auth.role() = 'authenticated' );
