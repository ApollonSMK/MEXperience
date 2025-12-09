-- ARQUIVO DE REFERÊNCIA DO BANCO DE DADOS (SUPABASE SELF-HOSTED)
-- Este arquivo serve para guiar a IA e o desenvolvedor sobre a estrutura atual.

-- ==========================================
-- 1. TABELAS (TABLES)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.appointments (
  user_id uuid,
  user_name text,
  user_email text,
  service_name text,
  date timestamp with time zone NOT NULL,
  duration numeric NOT NULL,
  status USER-DEFINED, -- Enum type assumed
  payment_method USER-DEFINED, -- Enum type assumed
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.debug_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  metadata jsonb,
  is_admin_result boolean,
  log_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT debug_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id text NOT NULL, -- 'confirmation', 'cancellation', 'reschedule', 'purchase'
  subject text NOT NULL,
  body_html text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_templates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.gateway_settings (
  public_key text,
  secret_key text,
  id text NOT NULL DEFAULT 'stripe'::text CHECK (id = 'stripe'::text),
  test_mode boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  webhook_secret text,
  CONSTRAINT gateway_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.plans (
  id text NOT NULL,
  title text NOT NULL,
  price text,
  period text,
  minutes numeric NOT NULL,
  price_per_minute numeric,
  sessions text,
  features jsonb,
  benefits jsonb,
  order integer,
  popular boolean DEFAULT false,
  stripe_price_id text,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  email text DEFAULT (jwt() ->> 'email'::text),
  display_name text,
  first_name text,
  last_name text,
  photo_url text,
  phone text,
  dob date,
  plan_id text,
  last_sign_in_time timestamp with time zone,
  is_admin boolean DEFAULT false,
  minutes_balance numeric DEFAULT 0,
  creation_time timestamp with time zone DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  stripe_cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_cancel_at bigint,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);

CREATE TABLE IF NOT EXISTS public.guest_passes (
  host_user_id uuid NOT NULL,
  guest_user_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  plan_id_at_time_of_use text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT guest_passes_pkey PRIMARY KEY (id),
  CONSTRAINT guest_passes_host_user_id_fkey FOREIGN KEY (host_user_id) REFERENCES public.profiles(id),
  CONSTRAINT guest_passes_guest_user_id_fkey FOREIGN KEY (guest_user_id) REFERENCES public.profiles(id),
  CONSTRAINT guest_passes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);

CREATE TABLE IF NOT EXISTS public.hero_images (
  alt_text text,
  image_url text NOT NULL,
  file_path text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  display_order integer NOT NULL DEFAULT nextval('hero_images_display_order_seq'::regclass),
  title text,
  subtitle text,
  button_text text,
  button_link text,
  CONSTRAINT hero_images_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.invoices (
  user_id uuid,
  plan_id text,
  plan_title text,
  amount numeric NOT NULL,
  status USER-DEFINED, -- Enum type assumed
  pdf_url text,
  id text NOT NULL, -- Alterado de uuid para text para aceitar Stripe IDs
  date timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id text NOT NULL,
  day_name text NOT NULL,
  time_slots jsonb,
  order integer,
  CONSTRAINT schedules_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.services (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  pricing_tiers jsonb,
  order integer,
  color text,
  is_under_maintenance boolean DEFAULT false,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.smtp_settings (
  host text NOT NULL,
  port integer NOT NULL,
  user text NOT NULL,
  password text NOT NULL,
  id smallint NOT NULL DEFAULT 1 CHECK (id = 1),
  encryption text DEFAULT 'ssl'::text,
  sender_name text DEFAULT 'M.E Experience', -- Added for custom sender name
  CONSTRAINT smtp_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.time_slot_locks (
  service_id text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  locked_by_user_id uuid,
  expires_at timestamp with time zone NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT time_slot_locks_pkey PRIMARY KEY (id),
  CONSTRAINT time_slot_locks_locked_by_user_id_fkey FOREIGN KEY (locked_by_user_id) REFERENCES auth.users(id)
);

-- ==========================================
-- 2. TRIGGERS & FUNCTIONS (NECESSÁRIO ADICIONAR MANUALMENTE)
-- ==========================================

-- Trigger para criar perfil automaticamente ao criar usuário no Auth (Google Login etc)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    first_name, 
    last_name, 
    photo_url
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    split_part(new.raw_user_meta_data->>'full_name', ' ', 1),
    substring(new.raw_user_meta_data->>'full_name' from position(' ' in new.raw_user_meta_data->>'full_name') + 1),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicação do Trigger
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 3. POLICIES (RLS) - RESUMO
-- ==========================================

-- Appointments:
-- Public: SELECT (verificação)
-- Authenticated: INSERT, UPDATE own, DELETE own
-- Admin: ALL

-- Profiles:
-- Public: SELECT own, UPDATE own
-- Trigger (System): INSERT (via handle_new_user)

-- Plans/Services/Schedules:
-- Public: SELECT
-- Admin: ALL

-- Invoices:
-- Authenticated: SELECT own
-- Admin: SELECT all