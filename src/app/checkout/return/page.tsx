'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'processing' | 'requires_payment_method' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    if (!clientSecret) {
        setStatus('error');
        setMessage("Les détails de paiement sont introuvables. Redirection...");
        setTimeout(() => router.replace('/'), 3000);
        return;
    }
    
    const fetchPaymentStatus = async () => {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
        if (!stripe) {
            setStatus('error');
            setMessage("Erreur de chargement de Stripe.");
            return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        switch (paymentIntent?.status) {
            case 'succeeded':
                setStatus('succeeded');
                setMessage('Paiement réussi ! Votre abonnement est actif.');
                setTimeout(() => router.push('/profile/subscription'), 3000);
                break;
            case 'processing':
                setStatus('processing');
                setMessage('Votre paiement est en cours de traitement. Nous vous informerons de la suite.');
                break;
            case 'requires_payment_method':
                setStatus('requires_payment_method');
                setMessage('Le paiement a échoué. Veuillez essayer une autre méthode de paiement.');
                break;
            default:
                setStatus('error');
                setMessage('Quelque chose s\'est mal passé.');
                break;
        }
    };

    fetchPaymentStatus();
  }, [searchParams, router]);

  if (status === 'loading' || status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-bold">
            {status === 'loading' ? 'Vérification de votre paiement...' : 'Traitement du paiement...'}
        </h1>
        <p className="text-muted-foreground">Veuillez patienter un instant.</p>
      </div>
    );
  }

  if (status === 'succeeded') {
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
