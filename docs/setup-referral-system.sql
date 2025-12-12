-- 1. Adicionar a coluna que falta para saber quem convidou quem
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by text;

-- Criar um índice para tornar as pesquisas de parceiros rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 2. Criar uma tabela para histórico de recompensas (Log Financeiro)
-- Isto serve para saber exatamente quando e quanto cada parceiro ganhou.
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid REFERENCES public.profiles(id) NOT NULL, -- Quem recebe
    referred_user_id uuid REFERENCES public.profiles(id), -- Quem se inscreveu (fonte)
    event_type text NOT NULL, -- 'signup', 'subscription_renew', 'purchase'
    minutes_amount integer NOT NULL, -- Quantos minutos ganhou
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Segurança (RLS) para a tabela de recompensas
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Parceiros podem ver os seus próprios ganhos
CREATE POLICY "Users can view their own rewards" 
ON public.referral_rewards FOR SELECT 
TO authenticated 
USING (auth.uid() = referrer_id);

-- Apenas admins ou sistema (via service role) podem inserir recompensas
-- (Não criamos policy de INSERT para authenticated para evitar fraudes)

-- 3. Atualizar o schema cache (opcional, mas boa prática)
NOTIFY pgrst, 'reload schema';