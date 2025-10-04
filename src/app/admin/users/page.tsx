
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { UsersTable } from '@/components/admin/users/users-table';
import { columns } from '@/components/admin/users/columns';
import type { Profile } from '@/types/profile';

async function getUsers(): Promise<Profile[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Corrigido: Selecionar colunas de 'profiles' e 'created_at' da tabela 'auth.users' relacionada
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            *,
            user:auth_users (
                created_at
            )
        `)
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    // Mapear os dados para um formato plano que a tabela espera
    const users = profiles.map(p => {
        // O Supabase retorna a junção como um objeto ou array, precisamos de achatar.
        // E garantir que a propriedade user existe e não é nula
        const auth_user = p.user && (Array.isArray(p.user) ? p.user[0] : p.user);
        return {
            ...p,
            created_at: auth_user?.created_at,
        }
    }) as Profile[];

    return users;
}

export default async function AdminUsersPage() {
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
}
