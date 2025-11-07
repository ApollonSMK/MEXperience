'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/checkout-form';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { Plan } from '@/app/admin/plans/page';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get('price_id');
  const planId = searchParams.get('plan_id');

  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigAndCreateSession = async () => {
      setIsLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
          setError("Erreur de connexion à la base de données.");
          setIsLoading(false);
          return;
      }
      
      try {
        // 1. Fetch Stripe public key
        const { data: gatewaySettings, error: gatewayError } = await supabase
            .from('gateway_settings')
            .select('public_key')
            .eq('id', 'stripe')
            .single();

        if (gatewayError || !gatewaySettings?.public_key) {
            throw new Error("La configuration du paiement n'est pas disponible. Veuillez contacter le support.");
        }
        setStripePromise(loadStripe(gatewaySettings.public_key));

        // 2. Fetch Plan details
        if(planId) {
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();
            if(planError) throw new Error("Le plan sélectionné n'a pas pu être chargé.");
            setPlan(planData as Plan);
        }

        // 3. Create Checkout Session on the server
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Erreur lors de la création de la session de paiement.');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (priceId) {
      fetchConfigAndCreateSession();
    } else {
        setError("Information de prix manquante. Veuillez réessayer de sélectionner un plan.");
        setIsLoading(false);
    }
  }, [priceId, planId]);

  const options: StripeElementsOptions | undefined = clientSecret ? { clientSecret } : undefined;

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Finaliser la souscription</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Détails du Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-1/2" />
                           <Skeleton className="h-4 w-1/4" />
                        </div>
                    ): plan ? (
                        <div>
                            <p className="text-xl font-bold">{plan.title}</p>
                            <p className="text-muted-foreground">{plan.price}{plan.period}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Impossible de charger les détails du plan.</p>
                    )}
                </CardContent>
            </Card>

            <div className="mt-8">
                {error && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {clientSecret && stripePromise && !error ? (
                    <Elements stripe={stripePromise} options={options}>
                        <CheckoutForm />
                    </Elements>
                ) : !error && (
                     <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                )}
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <p>Chargement du checkout...</p>
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}
