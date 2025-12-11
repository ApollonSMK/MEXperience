-- Adiciona a coluna de comissão (porcentagem) na tabela de perfis
-- Default é 10% se não for especificado
ALTER TABLE profiles 
ADD COLUMN reseller_commission numeric DEFAULT 10;

-- Comentário para documentação
COMMENT ON COLUMN profiles.reseller_commission IS 'Percentage of commission for reseller sales (e.g., 10 for 10%)';