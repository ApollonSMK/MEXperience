-- Ativa a Row-Level Security para a tabela de perfis.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Apaga as políticas antigas para evitar conflitos.
DROP POLICY IF EXISTS "Allow individual access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin read access to all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;


-- Cria uma política que permite a um utilizador ler o seu próprio perfil.
CREATE POLICY "Allow individual access to own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Cria uma política que permite a um utilizador criar o seu próprio perfil.
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Cria uma política que permite a um utilizador atualizar o seu próprio perfil.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
