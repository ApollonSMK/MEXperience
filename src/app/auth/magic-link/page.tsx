'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const MAGIC_LINK_ERROR_MESSAGE = 'Lien magique invalide ou expiré.';

export default function MagicLinkPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    const finalizeSession = async () => {
      const currentUrl = new URL(window.location.href);
      const searchParams = currentUrl.searchParams;
      const hash = window.location.hash;
      const redirectError = searchParams.get('error_description');

      if (redirectError) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(redirectError);
        return;
      }

      const { data: existingSessionData } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (existingSessionData.session) {
        window.history.replaceState(null, '', currentUrl.pathname);
        setStatus('success');
        toast({
          title: 'Connexion confirmée',
          description: 'Bienvenue, vous allez être redirigé(e) automatiquement.',
        });
        redirectTimeout = setTimeout(() => {
          router.replace('/profile');
        }, 1500);
        return;
      }

      const hasAuthParams = searchParams.toString().length > 0 || hash.length > 1;

      if (!hasAuthParams) {
        setStatus('error');
        setErrorMessage(MAGIC_LINK_ERROR_MESSAGE);
        return;
      }

      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

      if (!isMounted) return;

      if (error || !data.session) {
        setStatus('error');
        setErrorMessage(error?.message ?? MAGIC_LINK_ERROR_MESSAGE);
        return;
      }

      window.history.replaceState(null, '', currentUrl.pathname);

      setStatus('success');
      toast({
        title: 'Connexion confirmée',
        description: 'Bienvenue, vous allez être redirigé(e) automatiquement.',
      });

      redirectTimeout = setTimeout(() => {
        router.replace('/profile');
      }, 1500);
    };

    void finalizeSession();

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