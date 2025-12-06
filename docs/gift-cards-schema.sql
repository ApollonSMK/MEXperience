-- Table pour stocker les chèques cadeaux
create table public.gift_cards (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  initial_balance numeric not null, -- Montant original (ex: 50.00)
  current_balance numeric not null, -- Montant restant (ex: 25.50)
  recipient_id uuid references public.profiles(id), -- Optionnel : lié à un utilisateur
  created_at timestamptz default now(),
  expires_at timestamptz, -- Optionnel : date d'expiration
  status text default 'active' check (status in ('active', 'used', 'expired', 'cancelled')),
  created_by uuid references auth.users(id) -- Qui a créé la carte (admin)
);

-- Index pour recherche rapide par code
create index gift_cards_code_idx on public.gift_cards (code);
create index gift_cards_recipient_idx on public.gift_cards (recipient_id);

-- RLS Policies (Sécurité)
alter table public.gift_cards enable row level security;

-- Les admins ont tous les droits
create policy "Admins can do everything on gift_cards"
  on public.gift_cards
  for all
  using ( (select is_admin from public.profiles where id = auth.uid()) = true );

-- Les utilisateurs peuvent voir leurs propres cartes (si assignées)
create policy "Users can view their own gift_cards"
  on public.gift_cards
  for select
  using ( recipient_id = auth.uid() );

-- Trigger pour mettre à jour le statut automatiquement si le solde tombe à 0
create or replace function update_gift_card_status()
returns trigger as $$
begin
  if new.current_balance <= 0 and new.status = 'active' then
    new.status := 'used';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_gift_card_balance_change
  before update on public.gift_cards
  for each row
  execute function update_gift_card_status();