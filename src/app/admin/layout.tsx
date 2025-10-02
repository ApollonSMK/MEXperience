
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';
import type { Profile } from '@/types/profile';

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

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching profiles for admin:', error);
    // Continue with an empty array if profiles fail to load
    return { user, profiles: [] };
  }

  return { user, profiles: profiles as Profile[] };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profiles } = await getAdminData();

  return (
    <AdminLayoutClient user={user} profiles={profiles}>
      {children}
    </AdminLayoutClient>
  );
}
