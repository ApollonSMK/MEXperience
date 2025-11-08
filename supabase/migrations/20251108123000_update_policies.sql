-- Remove as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read plans" ON public.plans;

-- Ativa a Row Level Security para as tabelas críticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter a claim de admin de forma segura
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) RETURNS JSONB
    LANGUAGE sql STABLE
    AS $$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb -> claim,
    'null'::jsonb
  )
$$;

-- Permite que administradores tenham acesso total à tabela de perfis
-- Esta política usa a função auxiliar para evitar recursão infinita
CREATE POLICY "Allow admin full access"
    ON public.profiles FOR ALL
    TO authenticated
    USING ( (get_my_claim('is_admin'::text)) = 'true'::jsonb )
    WITH CHECK ( (get_my_claim('is_admin'::text)) = 'true'::jsonb );

-- Permite que os utilizadores acedam e modifiquem o seu próprio perfil
CREATE POLICY "Allow individual access to own profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Permite que qualquer utilizador autenticado leia os planos (são dados públicos)
CREATE POLICY "Allow authenticated users to read plans"
    ON public.plans FOR SELECT
    TO authenticated
    USING (true);
