'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'complete' | 'open' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
        setStatus('error');
        setMessage("L'ID de session est introuvable. Redirection...");
        setTimeout(() => router.replace('/'), 3000);
        return;
    }
    
    const fetchSessionStatus = async () => {
        try {
            const response = await fetch(`/api/stripe/checkout-status?session_id=${sessionId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch session status');
            }
            const session = await response.json();

            setStatus(session.status);

            switch (session.status) {
                case 'complete':
                    setMessage('Paiement réussi ! Votre abonnement est actif.');
                    setTimeout(() => router.push('/profile/subscription'), 3000);
                    break;
                case 'open':
                     setMessage('Le paiement a été annulé ou a échoué. Veuillez réessayer.');
                    break;
                default:
                    setStatus('error');
                    setMessage('Quelque chose s\'est mal passé.');
                    break;
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Erreur lors de la vérification du paiement.');
        }
    };

    fetchSessionStatus();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-bold">Vérification de votre paiement...</h1>
        <p className="text-muted-foreground">Veuillez patienter un instant.</p>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
        <p className="text-muted-foreground max-w-md mb-8">
            {message} Vous serez redirigé(e) sous peu.
        </p>
        <Button onClick={() => router.push('/profile/subscription')}>
          Voir mon abonnement
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <AlertCircle className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold mb-2">Paiement Incomplet</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {message || "Une erreur inattendue s'est produite."}
      </p>
       <div className="flex gap-4">
        <Button onClick={() => router.push('/abonnements')}>
            Réessayer
        </Button>
        <Button variant="outline" asChild>
            <Link href="/">
                Page d'accueil
            </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ReturnPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
            <ReturnContent />
        </Suspense>
    )
}
