-- Executar este comando no SQL Editor do Supabase
-- Isso adiciona o valor 'blocked' ao tipo enum existente 'payment_method'

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'blocked';