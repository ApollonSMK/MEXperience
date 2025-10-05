# MEXperience - Instruções de Correção Urgente

## Script 1: Corrigir Permissões de Edição de Perfil de Utilizador

Se os administradores não conseguem editar perfis de outros utilizadores, execute o seguinte código SQL.

```sql
-- HABILITA A ROW LEVEL SECURITY (SE AINDA NÃO ESTIVER ATIVA)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- REMOVE POLÍTICAS ANTIGAS PARA EVITAR CONFLITOS (OPCIONAL MAS RECOMENDADO)
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;

-- CRIA A POLÍTICA CORRETA PARA PERMITIR QUE ADMINS ATUALIZEM QUALQUER PERFIL
CREATE POLICY "Admins can update any profile."
ON public.profiles FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- GARANTE QUE A POLÍTICA PARA UTILIZADORES NORMAIS (EDITAR O PRÓPRIO PERFIL) TAMBÉM EXISTE
-- Se esta política já existir com o mesmo nome, o comando vai dar um erro, que pode ser ignorado.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

```

---

## Script 2: Corrigir Permissões de Gestão de Horários

Para garantir que apenas administradores podem criar, editar ou apagar os horários de funcionamento, execute o seguinte código SQL.

```sql
-- 1. Habilita a Row Level Security para a tabela de horários
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas para evitar conflitos (opcional mas recomendado)
DROP POLICY IF EXISTS "Admins can manage operating hours" ON public.operating_hours;
DROP POLICY IF EXISTS "Public can read operating hours" ON public.operating_hours;

-- 3. Cria uma política para permitir que todos leiam os horários (necessário para os formulários de agendamento)
CREATE POLICY "Public can read operating hours"
ON public.operating_hours FOR SELECT
USING (true);

-- 4. Cria a política principal que permite a administradores gerir (inserir, atualizar, apagar) os horários
CREATE POLICY "Admins can manage operating hours"
ON public.operating_hours FOR ALL -- 'ALL' cobre INSERT, UPDATE, DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

```

Peço desculpa, de novo, por toda esta saga.
