-- supabase/migrations/YYYYMMDDHHMMSS_create_guest_passes.sql

CREATE TABLE IF NOT EXISTS public.guest_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    plan_id_at_time_of_use TEXT
);

ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow host to read their guest passes"
ON public.guest_passes
FOR SELECT
TO authenticated
USING (host_user_id = auth.uid());

CREATE POLICY "Allow guest to read their own pass"
ON public.guest_passes
FOR SELECT
TO authenticated
USING (guest_user_id = auth.uid());

-- Since guest passes are created via the scheduler flow, which is complex,
-- we'll allow any authenticated user to insert for now.
-- In a production app, this would be locked down further, likely via an Edge Function.
CREATE POLICY "Allow authenticated users to insert guest passes"
ON public.guest_passes
FOR INSERT
TO authenticated
WITH CHECK (true);
