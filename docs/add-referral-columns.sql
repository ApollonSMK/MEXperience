-- Add referral columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_influencer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Create an index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Create an index on referred_by for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);