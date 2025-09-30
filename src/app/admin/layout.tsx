
'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Header from '@/components/header';

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
        <Header user={user} />
        <main className="flex-1">
          {children}
        </main>
      </div>
  );
}
