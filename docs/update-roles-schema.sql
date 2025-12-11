-- Rode este SQL no Editor SQL do Supabase

-- 1. Adicionar flag de Influenciador
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_influencer BOOLEAN DEFAULT false;

-- 2. Adicionar flag de Revendedor (para vender Gift Cards)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_reseller BOOLEAN DEFAULT false;

-- 3. Adicionar código de referência (para links de convite)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 4. Adicionar quem convidou este usuário (rastreamento)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);