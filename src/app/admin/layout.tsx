
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';
import { getServices } from '@/lib/services-db';
import type { Profile } from '@/types/profile';

async function getAdminData() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile to check for admin role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'role'> | null, error: any };

  // If there's an error fetching the profile or the user is not an admin, redirect
  if (error || !profile || profile.role !== 'admin') {
      console.warn("Acesso negado ao painel de administração:", {userId: user.id, role: profile?.role});
      redirect('/profile'); // Redirect non-admins to their profile page
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
