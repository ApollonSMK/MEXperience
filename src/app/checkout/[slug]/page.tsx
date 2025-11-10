'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const params = useParams();
  const { toast } = useToast();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
        toast({
            variant: 'destructive',
            title: 'Plan non valide',
            description: "Aucun plan n'a été spécifié pour le paiement.",
        });
        setError("Aucun plan sélectionné.");
        return;
    };

    const createSubscription = async () => {
        try {
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: slug }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }
            setClientSecret(data.clientSecret);
        } catch (error: any) {
            setError(error.message || "Impossible d'initialiser le paiement.");
            toast({
                variant: 'destructive',
                title: 'Erreur de Configuration du Paiement',
                description: error.message || "Impossible de démarrer le processus de paiement.",
            });
        }
    };

    createSubscription();
  }, [slug, toast]);

  const appearance = {
    theme: 'stripe' as const,
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center bg-gray-50 dark:bg-black py-12 px-4">
        {clientSecret ? (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm planId={slug}/>
            </Elements>
        ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="mt-4 text-muted-foreground">{error ? error : "Préparation de votre paiement sécurisé..."}</p>
           </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutSlugPage() {
    return (
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="mt-4 text-muted-foreground">Chargement de la page de paiement...</p>
           </div>
          </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}
