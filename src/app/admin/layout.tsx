
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Logo } from '@/components/logo';
import {
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'contact@me-experience.lu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
          redirect('/login');
        }
        setUser(currentUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        redirect('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // This should not happen if the logic above is correct, but as a fallback
    return redirect('/login');
  }

  return (
      <div className="min-h-screen bg-muted/40">
        <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
               <Logo />
               <h1 className="text-xl font-bold font-headline">Painel de Administração</h1>
            </div>
          <div className="flex items-center gap-4">
             <Avatar className="h-9 w-9">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                {user.user_metadata?.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
            </Avatar>
             <form action={logout}>
                <Button variant="outline">
                    Logout
                </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
  );
}
