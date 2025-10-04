
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';
import { getServices } from '@/lib/services-db';

async function getAdminData() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  
  const services = await getServices();

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
