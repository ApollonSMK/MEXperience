
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { toast } = useToast();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const createSubscription = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/stripe/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug: slug }),
        });

        const sessionData = await response.json();
        if (!response.ok || sessionData.error) {
          throw new Error(sessionData.error || 'Falha ao iniciar a sessão de checkout.');
        }
        setClientSecret(sessionData.clientSecret);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur de préparation', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    createSubscription();
  }, [slug, toast]);
  
  const appearance = { theme: 'stripe' as const };
  const options = clientSecret ? { clientSecret, appearance } : undefined;

  if (isLoading || !options) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Préparation de votre paiement sécurisé...</p>
      </div>
    );
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm planSlug={slug} />
    </Elements>
  );
}

export default function CheckoutSlugPage() {
    return (
        <>
            <Header />
            <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center bg-gray-50 dark:bg-black py-12 px-4">
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
            </main>
            <Footer />
        </>
    )
}
