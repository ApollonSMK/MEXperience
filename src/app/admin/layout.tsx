
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// For now, we'll use a hardcoded admin email.
// In a real application, this should be based on roles or claims in Supabase.
const ADMIN_EMAIL = 'admin@mewellness.pt';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/login');
  }

  return <>{children}</>;
}
