'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { AuthError, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function MagicLinkPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .then(
        ({
          data,
          error,
        }: {
          data: { session: Session | null } | null;
          error: AuthError | null;
        }) => {
          if (!isMounted) return;

          if (error || !data?.session) {
            const message =
              error?.message === 'invalid request: both auth code and code verifier should be non-empty'
                ? 'Ce lien a été ouvert dans un autre navigateur ou a expiré. Demandez un nouveau lien magique et ouvrez-le depuis le même navigateur.'
                : error?.message ?? 'Lien magique invalide ou expiré.';
            setStatus('error');
            setErrorMessage(message);
            return;
          }

          setStatus('success');
          toast({
            title: 'Connexion confirmée',
            description: 'Bienvenue, vous allez être redirigé(e) automatiquement.',
          });

          redirectTimeout = setTimeout(() => {
            router.replace('/profile');
          }, 1500);
        }
      );

    return () => {
      isMounted = false;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [router, supabase, toast]);

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          {status === 'verifying' ? (
            <CardHeader className="items-center justify-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <CardTitle>Connexion en cours…</CardTitle>
              <CardDescription>Nous confirmons votre lien magique.</CardDescription>
            </CardHeader>
          ) : null}

          {status === 'success' ? (
            <>
              <CardHeader className="space-y-2">
                <CardTitle>Lien validé</CardTitle>
                <CardDescription>Redirection en cours vers votre profil.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.replace('/profile')}>
                  Accéder au tableau de bord
                </Button>
              </CardContent>
            </>
          ) : null}

          {status === 'error' ? (
            <>
              <CardHeader className="space-y-2">
                <CardTitle>Impossible de finaliser la connexion</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Button onClick={() => router.replace('/login')}>Retour à la connexion</Button>
              </CardContent>
            </>
          ) : null}
        </Card>
      </main>
      <Footer />
    </>
  );
}