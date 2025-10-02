
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';

const ADMIN_EMAIL = 'contact@me-experience.lu';

async function getAdminData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.email !== ADMIN_EMAIL) {
    redirect('/profile');
  }

  // A lista completa de perfis será carregada na página de utilizadores,
  // não no layout principal, para respeitar o RLS e melhorar a performance.
  return { user };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAdminData();

  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  );
}
