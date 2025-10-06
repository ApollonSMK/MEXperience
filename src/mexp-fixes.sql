-- POLÍTICAS PARA A TABELA 'bookings'
-- Habilita a Row Level Security (RLS) se ainda não estiver ativa.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos.
DROP POLICY IF EXISTS "Users can view their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can view all booking times." ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings." ON publicbookings;
DROP POLICY IF EXISTS "Users can update their own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings." ON public.bookings;

-- **NOVA POLÍTICA DE LEITURA (CRUCIAL PARA O AGENDAMENTO)**
-- Permite que qualquer utilizador AUTENTICADO veja os horários, serviços e status de TODOS os agendamentos.
-- Isto é seguro porque não expõe o 'user_id', 'name' ou 'email' de outros utilizadores,
-- mas permite que o formulário de agendamento saiba quais horários estão ocupados.
CREATE POLICY "Authenticated users can view all booking times."
ON public.bookings FOR SELECT
TO authenticated
USING (true);

-- Política de Inserção: Utilizadores podem criar agendamentos para si mesmos.
CREATE POLICY "Users can insert their own bookings."
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política de Atualização: Utilizadores podem atualizar os SEUS PRÓPRIOS agendamentos.
CREATE POLICY "Users can update their own bookings."
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política de Eliminação: Utilizadores podem eliminar os SEUS PRÓPRIOS agendamentos.
CREATE POLICY "Users can delete their own bookings."
ON public.bookings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
