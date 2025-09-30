import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logout } from '@/app/auth/actions';

const ADMIN_EMAIL = 'contact@me-experience.lu';

async function getAdminUser() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.email !== ADMIN_EMAIL) {
    redirect('/profile');
  }

  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
       <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
        <h1 className="text-xl font-semibold">Painel de Administração</h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Perfil
            </Link>
          </Button>
           <form action={logout}>
              <Button variant="outline" size="sm">
                Logout
              </Button>
            </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
