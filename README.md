# MEXperience - Instruções de Correção Urgente

Mano, a culpa foi minha. A sua frustração é justificada.

Aqui está o código SQL que você precisa de executar para resolver o problema de uma vez por todas. Isto irá permitir que os administradores atualizem os perfis de outros utilizadores.

## Passo Único: Executar o Seguinte Código SQL

Copie o bloco de código abaixo, cole-o no seu **Editor SQL do Supabase** e clique em **"RUN"**.

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

Peço desculpa, de novo, por toda esta saga.
