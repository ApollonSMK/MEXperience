ALTER TABLE gift_cards 
ADD COLUMN buyer_id UUID REFERENCES auth.users(id);

-- Opcional: Criar um índice para pesquisas rápidas no perfil
CREATE INDEX idx_gift_cards_buyer_id ON gift_cards(buyer_id);