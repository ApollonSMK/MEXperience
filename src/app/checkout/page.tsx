
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/checkout-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Plan } from '@/app/admin/plans/page';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get('price_id');
  const planId = searchParams.get('plan_id');

  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [elementsOptions, setElementsOptions] = useState<StripeElementsOptions | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigAndCreateSession = async () => {
      setIsLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Erro: Cliente Supabase não está disponível.");
        setIsLoading(false);
        return;
      }

      try {
        const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error("A chave pública do Stripe não está configurada. Contacte o suporte.");
        }
        setStripePromise(loadStripe(publicKey));

        if(planId) {
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();
            if(planError) throw new Error("Le plan sélectionné n'a pas pu être chargé.");
            setPlan(planData as Plan);
        } else {
            throw new Error("Informação do plano em falta.");
        }

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, planId }),
        });
        
        const responseBody = await response.json();
        if (!response.ok) {
          throw new Error(responseBody.error || 'Erreur lors de la création de la session de paiement.');
        }
        if (!responseBody.clientSecret) {
            throw new Error("Não foi possível obter o segredo do cliente para o pagamento.");
        }
        
        setElementsOptions({
            clientSecret: responseBody.clientSecret,
            appearance: { theme: 'stripe' }
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (priceId && planId) {
      fetchConfigAndCreateSession();
    } else {
        setError("Informação de preço ou plano em falta. Por favor, tente selecionar um plano novamente.");
        setIsLoading(false);
    }
  }, [priceId, planId]);

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Finaliser la souscription</h1>
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Détails du Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && !plan ? (
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

            <Card>
                <CardHeader>
                    <CardTitle>Informations de Paiement</CardTitle>
                    <CardDescription>Entrez vos informations de paiement sécurisées ci-dessous.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {isLoading && !error && (
                        <div className="space-y-4 text-center p-8">
                            <p className="text-sm text-muted-foreground">Préparation de votre session de paiement sécurisée...</p>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}

                    {stripePromise && elementsOptions && !error && (
                        <Elements stripe={stripePromise} options={elementsOptions}>
                            <CheckoutForm />
                        </Elements>
                    )}
                </CardContent>
            </Card>
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
