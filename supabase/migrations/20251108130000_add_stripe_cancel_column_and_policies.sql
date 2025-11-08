
-- Adicionar a coluna em falta na tabela de perfis
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end boolean DEFAULT false;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_cancel_at bigint;


-- Limpar políticas antigas e problemáticas para um recomeço limpo
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ler os logs de depuração" ON public.debug_logs;
DROP POLICY IF EXISTS "Utilizadores autenticados podem escrever logs" ON public.debug_logs;
DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos para verificação de" ON public.appointments;
DROP POLICY IF EXISTS "Utilizadores podem criar os seus próprios agendamentos." ON public.appointments;


-- Ativar RLS nas tabelas críticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;


-- Políticas para a tabela PROFILES
CREATE POLICY "Utilizadores podem ler e atualizar o seu próprio perfil."
ON public.profiles
FOR ALL
USING (auth.uid() = id);

-- Políticas para a tabela PLANS
CREATE POLICY "Planos são visíveis publicamente."
ON public.plans
FOR SELECT
USING (true);

-- Políticas para a tabela SERVICES
CREATE POLICY "Serviços são visíveis publicamente."
ON public.services
FOR SELECT
USING (true);

-- Políticas para a tabela SCHEDULES
CREATE POLICY "Horários são visíveis publicamente."
ON public.schedules
FOR SELECT
USING (true);

-- Políticas para a tabela APPOINTMENTS
CREATE POLICY "Utilizadores podem gerir os seus próprios agendamentos."
ON public.appointments
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Agendamentos são visíveis publicamente para verificação de horários."
ON public.appointments
FOR SELECT
USING (true);

-- Políticas para a tabela INVOICES
CREATE POLICY "Utilizadores podem ver as suas próprias faturas."
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Políticas para a tabela HERO_IMAGES
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Imagens do Hero são visíveis publicamente."
ON public.hero_images
FOR SELECT
USING (true);

-- As políticas de escrita para tabelas de configuração (plans, services, etc.)
-- devem ser geridas através de permissões de API a nível de administrador
-- ou funções de base de dados, em vez de políticas RLS complexas baseadas em roles,
-- para evitar problemas de recursão. A lógica de admin já está no código da aplicação.

    