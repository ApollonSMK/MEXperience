-- Adiciona a coluna em falta para gerir o estado de cancelamento da subscrição do Stripe
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end BOOLEAN DEFAULT false;
