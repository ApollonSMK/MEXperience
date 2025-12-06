-- 1. Adiciona colunas para controle de uso
ALTER TABLE public.gift_cards 
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL, -- NULL significa ilimitado
ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0;

-- 2. Função segura para incrementar uso (evita condições de corrida)
CREATE OR REPLACE FUNCTION increment_gift_card_usage(card_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gift_cards
  SET uses_count = uses_count + 1
  WHERE id = card_id;
END;
$$;