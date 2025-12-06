-- ATIVAR RLS É OBRIGATÓRIO PARA AS POLICIES FUNCIONAREM
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Garante que o Admin consegue ver tudo (caso ainda não tenhas esta policy)
CREATE POLICY "Admins can do everything on gift_cards"
ON gift_cards
TO public
USING (
  public.is_admin()
);