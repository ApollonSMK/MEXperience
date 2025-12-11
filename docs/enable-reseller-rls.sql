-- Policy to allow resellers to create (insert) gift cards
-- They can only insert if their profile has is_reseller = true
-- And they must set themselves as the buyer_id to ensure accountability

CREATE POLICY "Resellers can create gift cards"
ON public.gift_cards
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT is_reseller FROM public.profiles WHERE id = auth.uid()) = true
  AND
  buyer_id = auth.uid()
);

-- Policy to allow resellers to view their own created gift cards
CREATE POLICY "Resellers can view their own gift cards"
ON public.gift_cards
FOR SELECT
TO authenticated
USING (
  buyer_id = auth.uid()
);