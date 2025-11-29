-- 1. Permitir que ADMINS insiram faturas (INSERT)
CREATE POLICY "Admins can insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- 2. (Opcional) Se quiser permitir vendas sem selecionar cliente (Balcão/Anônimo)
-- Você precisa remover a restrição NOT NULL da coluna user_id
ALTER TABLE public.invoices ALTER COLUMN user_id DROP NOT NULL;

-- 3. Permitir atualizar faturas (caso precise mudar status depois)
CREATE POLICY "Admins can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);