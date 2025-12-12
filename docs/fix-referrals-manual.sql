-- 1. Verifica se existem usuários com referred_by preenchido
SELECT id, email, referred_by FROM public.profiles WHERE referred_by IS NOT NULL;

-- 2. Se a lista acima estiver vazia, significa que o código de signup não salvou.
-- Vamos forçar a atualização dos últimos 3 usuários criados para terem o referido.
-- (Substitua 'PabW1SPHZ' pelo código real se for diferente)

UPDATE public.profiles
SET referred_by = 'PabW1SPHZ'
WHERE id IN (
    SELECT id FROM public.profiles 
    ORDER BY creation_time DESC 
    LIMIT 3
);

-- 3. Verifica se o contador vai funcionar agora
-- O resultado deste select deve ser 3.
SELECT count(*) FROM public.profiles WHERE referred_by = 'PabW1SPHZ';