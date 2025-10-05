
import { UsersTable } from '@/components/admin/users/users-table';
import { columns } from './columns';
import type { Profile } from '@/types/profile';
import { createClient } from '@/lib/supabase/server';

async function getUsers(): Promise<Profile[]> {
    const supabaseAdmin = createClient({ auth: { persistSession: false } });

    const { data: users, error } = await supabaseAdmin.rpc('get_all_users_with_profiles');

    if (error) {
        console.error('Error fetching users with profiles:', error);
        if (error.code === '42883') { // 'undefined_function'
             throw new Error(`A função RPC 'get_all_users_with_profiles' não foi encontrada na sua base de dados. Por favor, execute o SQL necessário no seu editor SQL do Supabase para criá-la.`);
        }
        throw new Error('Não foi possível carregar os dados dos utilizadores. Verifique a consola do servidor para mais detalhes.');
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
                    {error.message.includes('A função RPC') && (
                         <div className="mt-4 p-4 border rounded-md bg-muted/50">
                            <h3 className="font-semibold text-lg">Ação Necessária: Criar Função SQL</h3>
                            <p className="mt-2 text-sm">Copie e cole o seguinte código SQL no seu <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent">Editor SQL do Supabase</a> e clique em "RUN" para corrigir o erro:</p>
                            <pre className="mt-4 bg-black text-white p-4 rounded-md text-xs overflow-x-auto">
{`-- Adiciona a coluna para os minutos reembolsados, se ainda não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS refunded_minutes integer;

create or replace function get_all_users_with_profiles()
returns table (
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
language sql
security definer
as $$
    select
        u.id,
        u.created_at,
        coalesce(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
        coalesce(p.avatar_url, u.raw_user_meta_data->>'picture') as avatar_url,
        u.email,
        p.phone,
        p.subscription_plan,
        p.role,
        p.refunded_minutes
    from auth.users u
    left join public.profiles p on u.id = p.id;
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
