
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';
import { getServices } from '@/lib/services-db';
import type { Service } from '@/lib/services';

async function getAdminData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // A verificação de 'admin' foi removida para permitir o acesso a todos os utilizadores autenticados
  
  const services = await getServices();

  // A lista completa de perfis será carregada na página de utilizadores,
  // não no layout principal, para respeitar o RLS e melhorar a performance.
  return { user, services };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, services } = await getAdminData();

  return (
    <AdminLayoutClient user={user} services={services}>
      {children}
    </AdminLayoutClient>
  );
}
