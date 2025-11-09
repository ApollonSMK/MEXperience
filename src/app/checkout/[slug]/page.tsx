'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const params = useParams();
  const { toast } = useToast();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
        setIsLoading(false);
        return;
    };

    const createSubscription = async () => {
        setIsLoading(true);
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
            toast({
                variant: 'destructive',
                title: 'Erreur de Configuration du Paiement',
                description: error.message || "Impossible de démarrer le processus de paiement. Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    createSubscription();
  }, [slug, toast]);


  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-gray-50 dark:bg-black py-12 px-4">
        {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="mt-4 text-muted-foreground">Préparation de votre paiement sécurisé...</p>
           </div>
        )}
        
        {!isLoading && clientSecret && (
            <Elements options={options} stripe={stripePromise}>
                <CheckoutForm planId={slug} />
            </Elements>
        )}

        {!isLoading && !clientSecret && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto text-center">
                <p className="text-destructive font-semibold">Erreur de chargement du paiement.</p>
                <p className="mt-2 text-muted-foreground">Impossible d'initialiser la session de paiement. Veuillez retourner et réessayer.</p>
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
