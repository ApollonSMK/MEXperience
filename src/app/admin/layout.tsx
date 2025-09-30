
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';

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
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
      } else {
        setUser(null);
        redirect('/login');
      }
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      if (event === 'SIGNED_OUT' || !currentUser || currentUser.email !== ADMIN_EMAIL) {
         setUser(null);
         redirect('/login');
      } else {
        setUser(currentUser);
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
    // This is a fallback, the effect should handle redirection.
    return (
       <div className="flex items-center justify-center min-h-screen bg-background">
        <p>A redirecionar para o login...</p>
      </div>
    );
  }

  return (
      <div className="min-h-screen flex flex-col bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-7xl items-center justify-between">
                <div className="flex items-center gap-4">
                    <Logo />
                    <h1 className="text-lg font-bold text-foreground">Painel de Administração</h1>
                </div>
                <form action={logout}>
                    <Button variant="outline">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
  );
}
