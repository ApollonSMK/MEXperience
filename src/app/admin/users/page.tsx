
import { UsersTable } from '@/components/admin/users/users-table';
import { columns } from './columns';
import type { Profile } from '@/types/profile';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getUsers(): Promise<Profile[]> {
    const cookieStore = cookies();

    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                async get(name: string) {
                    return (await cookieStore.get(name))?.value
                },
            },
        }
    );

    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching auth users:', authError);
        throw new Error(`AuthApiError: ${authError.message}. Verifique se a sua SUPABASE_SERVICE_ROLE_KEY está corretamente configurada no ficheiro .env.local.`);
    }

    const userIds = authUsers.map(user => user.id);

    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
    }

    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    const usersData = authUsers.map(authUser => {
        const profile = profilesMap.get(authUser.id);
        return {
            id: authUser.id,
            created_at: authUser.created_at,
            full_name: authUser.user_metadata?.full_name || profile?.full_name || 'Nome Desconhecido',
            avatar_url: authUser.user_metadata?.picture || profile?.avatar_url,
            email: authUser.email || profile?.email || 'Email Desconhecido',
            phone: profile?.phone || null,
            subscription_plan: profile?.subscription_plan || null,
            role: profile?.role || 'user',
        };
    });

    return usersData.sort((a, b) => {
        const nameA = a.full_name || '';
        const nameB = b.full_name || '';
        return nameA.localeCompare(nameB);
    }) as Profile[];
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
                    <p className="mt-4">
                        Por favor, certifique-se de que o ficheiro `.env.local` foi criado na raiz do projeto e que a variável `SUPABASE_SERVICE_ROLE_KEY` contém a sua chave "service_role" correta do Supabase.
                    </p>
                </div>
            </div>
        )
    }
}
