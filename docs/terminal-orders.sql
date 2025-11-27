-- 1. Tabela para comunicação entre Next.js e Flutter
CREATE TABLE public.terminal_orders (
    id TEXT PRIMARY KEY, -- Usaremos o ID da PaymentIntent do Stripe (pi_...)
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Valor em cêntimos
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed, canceled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Segurança)
ALTER TABLE public.terminal_orders ENABLE ROW LEVEL SECURITY;

-- Permissões: O Admin (Next.js) e o App Flutter (logado como admin/service) podem ler e escrever
CREATE POLICY "Enable all access for authenticated users" ON public.terminal_orders
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. HABILITAR REALTIME (CRUCIAL)
-- Isso diz ao Supabase para enviar eventos desta tabela para os clientes conectados
ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_orders;