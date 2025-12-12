-- 1. Tabela para rastrear cliques nos links
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_code text NOT NULL,
  ip_hash text, -- Para tentar contar cliques únicos se quisermos
  user_agent text,
  country text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para Clicks (Segurança)
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to clicks" 
ON public.referral_clicks FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Admins read clicks" 
ON public.referral_clicks FOR SELECT 
TO public 
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- 2. Função Recursiva para obter a Árvore de Afiliados (Multi-level)
-- Esta função retorna toda a descendência de um utilizador
CREATE OR REPLACE FUNCTION get_referral_tree(root_user_id uuid)
RETURNS TABLE (
    id uuid,
    display_name text,
    email text,
    photo_url text,
    referred_by uuid,
    level integer,
    total_spent numeric,
    plan_status text,
    joined_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE tree AS (
        -- Base case: Direct children (Level 1)
        SELECT 
            p.id, 
            p.display_name, 
            p.email, 
            p.photo_url, 
            p.referred_by, 
            1 as level,
            0::numeric as total_spent, -- Placeholder, could calculate real spent
            p.stripe_subscription_status as plan_status,
            p.creation_time as joined_at
        FROM public.profiles p
        WHERE p.referred_by = root_user_id
        
        UNION ALL
        
        -- Recursive step: Children of children
        SELECT 
            p.id, 
            p.display_name, 
            p.email, 
            p.photo_url, 
            p.referred_by, 
            t.level + 1,
            0::numeric,
            p.stripe_subscription_status,
            p.creation_time
        FROM public.profiles p
        INNER JOIN tree t ON p.referred_by = t.id
    )
    SELECT * FROM tree;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;