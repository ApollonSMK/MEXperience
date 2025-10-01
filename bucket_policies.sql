-- 1. Política para permitir que os utilizadores vejam (SELECT) qualquer avatar.
-- Esta política torna as imagens publicamente visíveis, o que é necessário para exibi-las na aplicação.
CREATE POLICY "Avatar images are publicly viewable"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Política para permitir que um utilizador insira (INSERT) o seu próprio avatar.
-- A verificação (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]) garante que
-- um utilizador só pode fazer upload para uma pasta com o seu próprio ID de utilizador.
-- Ex: /avatars/USER_ID/avatar.png
CREATE POLICY "A user can insert their own avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );


-- 3. Política para permitir que um utilizador atualize (UPDATE) o seu próprio avatar.
CREATE POLICY "A user can update their own avatar"
ON storage.objects FOR UPDATE
USING ( auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( bucket_id = 'avatars' );


-- 4. Política para permitir que um utilizador apague (DELETE) o seu próprio avatar.
CREATE POLICY "A user can delete their own avatar"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );
