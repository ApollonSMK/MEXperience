
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Logo } from '@/components/logo';
import {
  Loader2,
  LogOut,
} from 'lucide-react';
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
        } else {
          setUser(currentUser);
        }
      } else if (event === 'SIGNED_OUT') {
        redirect('/login');
      }
      setLoading(false);
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
    // This will be caught by the onAuthStateChange listener which will redirect
    return null;
  }

  return (
      <div className="min-h-screen flex flex-col bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-7xl items-center justify-between">
                <div className="flex items-center gap-6">
                    <Logo />
                    <h1 className="text-xl font-bold font-headline hidden md:block">Painel de Administração</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <form action={logout}>
                        <Button variant="outline">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </form>
                </div>
            </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
  );
}
