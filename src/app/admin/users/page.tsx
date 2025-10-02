
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { UsersTable } from '@/components/admin/users/users-table';
import { columns } from '@/components/admin/users/columns';

async function getUsers() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return profiles;
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
