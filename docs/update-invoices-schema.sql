-- Adicionar coluna de método de pagamento na tabela de faturas
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';

-- Comentário: Valores comuns serão 'stripe', 'cash', 'card', 'transfer', 'gift_card'