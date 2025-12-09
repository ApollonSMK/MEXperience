-- Adiciona a coluna metadata do tipo JSONB à tabela gift_cards
ALTER TABLE public.gift_cards 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.gift_cards.metadata IS 'Armazena dados flexíveis como tipo de desconto (fixed/percentage), nome do influencer, etc.';