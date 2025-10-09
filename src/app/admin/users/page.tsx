
import { UsersTable } from '@/components/admin/users/users-table';
import { columns } from './columns';
import type { Profile } from '@/types/profile';
import { createClient } from '@/lib/supabase/server';

async function getUsers(): Promise<Profile[]> {
    // Use o cliente admin para ignorar as RLS e obter todos os dados
    const supabaseAdmin = createClient({ admin: true });

    const { data: users, error } = await supabaseAdmin.rpc('get_all_users_with_profiles');

    if (error) {
        console.error('Error fetching users with profiles:', error);
        if (error.code === '42883') { // 'undefined_function'
             throw new Error(`A função RPC 'get_all_users_with_profiles' não foi encontrada na sua base de dados. Por favor, execute o SQL necessário no seu editor SQL do Supabase para criá-la.`);
        }
        if (error.message.includes('column "refunded_minutes" does not exist')) {
             throw new Error(`A sua tabela 'profiles' precisa da coluna 'refunded_minutes'. Execute o SQL abaixo para a adicionar.`);
        }
        throw error;
    }

    return (users as Profile[]).sort((a, b) => {
        const nameA = a.full_name || '';
        const nameB = b.full_name || '';
        return nameA.localeCompare(nameB);
    });
}

export default async function AdminUsersPage() {
    try {
        const users = await getUsers();

        return (
            <div className="container mx-auto py-10">
                 <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Utilizadores</h1>
                    <p className="text-muted-foreground">
                        Gira todos os utilizadores registados na plataforma.
                    </p>
                </div>
                <UsersTable columns={columns} data={users} />
            </div>
        );
    } catch (error: any) {
        return (
             <div className="container mx-auto py-10">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-destructive">Erro ao Carregar Utilizadores</h1>
                    <p className="text-muted-foreground mt-2 bg-destructive/10 p-4 rounded-md">
                        {error.message}
                    </p>
                    {(error.message.includes('A função RPC') || error.message.includes('precisa da coluna') || error.message.includes('permission denied')) && (
                         <div className="mt-4 p-4 border rounded-md bg-muted/50">
                            <h3 className="font-semibold text-lg">Ação Necessária: Atualizar Base de Dados e Permissões</h3>
                            <p className="mt-2 text-sm">Detectamos que a sua base de dados pode estar desatualizada ou com permissões incorretas. Copie e cole o seguinte código SQL no seu <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent">Editor SQL do Supabase</a> e clique em "RUN" para corrigir o erro de uma vez por todas:</p>
                            <pre className="mt-4 bg-black text-white p-4 rounded-md text-xs overflow-x-auto">
{`-- 1. Assegurar que a RLS (Row Level Security) está ativa na tabela de perfis.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar a coluna para os minutos de bónus, se ainda não existir.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS refunded_minutes integer NULL DEFAULT 0;

-- 3. Remover políticas antigas para evitar conflitos.
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;

-- 4. Criar as políticas de segurança corretas.

-- Política 1: Perfis públicos são visíveis para todos.
CREATE POLICY "Profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- Política 2: Utilizadores podem inserir o seu próprio perfil.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política 3: Utilizadores podem atualizar o seu próprio perfil.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 4 (CRUCIAL): Administradores podem atualizar qualquer perfil.
CREATE POLICY "Admins can update any profile."
ON public.profiles FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Recriar a função para buscar todos os utilizadores, garantindo que a nova coluna é incluída.
CREATE OR REPLACE FUNCTION get_all_users_with_profiles()
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    full_name text,
    avatar_url text,
    email text,
    phone text,
    subscription_plan text,
    role text,
    refunded_minutes integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- A função SECURITY DEFINER ignora a RLS para garantir que o admin possa ver todos os dados.
    SELECT
        u.id,
        u.created_at,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
        COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture') as avatar_url,
        u.email,
        p.phone,
        p.subscription_plan,
        p.role,
        p.refunded_minutes -- Adiciona a coluna aqui!
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id;
$$;
`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}
