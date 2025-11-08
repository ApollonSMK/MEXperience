-- 1. Ativar RLS na tabela de perfis, se ainda não estiver ativo.
alter table public.profiles enable row level security;

-- 2. Remover políticas antigas para evitar conflitos.
drop policy if exists "Allow individual access to own profile" on public.profiles;
drop policy if exists "Allow admin full access" on public.profiles;
drop policy if exists "Allow authenticated users to read plans" on public.plans;

-- 3. Política para utilizadores: um utilizador pode ler e atualizar o seu próprio perfil.
-- A verificação `auth.uid() = id` é a forma segura e padrão de fazer isto.
create policy "Allow individual access to own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- 4. Política para administradores: um utilizador com `is_admin = true` pode aceder a todos os perfis.
-- A função `is_claims_admin()` é uma forma segura de verificar o status de admin sem recursão.
create policy "Allow admin full access"
on public.profiles for all
using ( public.is_claims_admin() );

-- 5. Política para planos: qualquer utilizador autenticado pode ler os planos disponíveis.
alter table public.plans enable row level security;
create policy "Allow authenticated users to read plans"
on public.plans for select
using ( auth.role() = 'authenticated' );

-- 6. Função auxiliar segura para verificar o status de admin.
-- Esta função lê diretamente dos dados do utilizador logado (JWT claims), evitando a recursão.
CREATE OR REPLACE FUNCTION public.is_claims_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt()->>'user_role')::jsonb ? 'admin'
$$;
