
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
  console.log(`[CheckoutPage] Página carregada com price_id: ${priceId} e plan_id: ${planId}`);

  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigAndCreateSession = async () => {
      console.log('[CheckoutPage] useEffect: A iniciar busca de configuração e criação de sessão.');
      setIsLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
          const errMsg = "Erro: Cliente Supabase não está disponível.";
          console.error(`[CheckoutPage] ${errMsg}`);
          setError(errMsg);
          setIsLoading(false);
          return;
      }
      
      try {
        // 1. Fetch Stripe public key
        console.log('[CheckoutPage] Passo 1: A obter a chave pública Stripe.');
        const { data: gatewaySettings, error: gatewayError } = await supabase
            .from('gateway_settings')
            .select('public_key')
            .eq('id', 'stripe')
            .single();

        if (gatewayError || !gatewaySettings?.public_key) {
            console.error('[CheckoutPage] Erro ao obter a chave pública Stripe:', gatewayError);
            throw new Error("A configuration du paiement n'est pas disponible. Veuillez contacter le support.");
        }
        console.log('[CheckoutPage] Chave pública Stripe obtida. A carregar Stripe.js.');
        setStripePromise(loadStripe(gatewaySettings.public_key));

        // 2. Fetch Plan details
        if(planId) {
            console.log(`[CheckoutPage] Passo 2: A obter detalhes do plano para plan_id: ${planId}`);
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();
            if(planError) {
                console.error('[CheckoutPage] Erro ao obter detalhes do plano:', planError);
                throw new Error("Le plan sélectionné n'a pas pu être chargé.");
            }
            console.log('[CheckoutPage] Detalhes do plano obtidos:', planData);
            setPlan(planData as Plan);
        } else {
            console.warn('[CheckoutPage] plan_id não encontrado nos parâmetros da URL.');
        }

        // 3. Create Checkout Session on the server
        console.log(`[CheckoutPage] Passo 3: A chamar a API /api/create-checkout-session com o priceId: ${priceId}`);
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });
        
        console.log(`[CheckoutPage] Resposta da API recebida com status: ${response.status}`);
        const responseBody = await response.json();

        if (!response.ok) {
          console.error('[CheckoutPage] Erro da API:', responseBody.error);
          throw new Error(responseBody.error || 'Erreur lors de la création de la session de paiement.');
        }

        console.log('[CheckoutPage] Client Secret obtido da API:', responseBody.clientSecret ? 'Sim' : 'Não');
        setClientSecret(responseBody.clientSecret);

      } catch (err: any) {
        console.error('[CheckoutPage] Erro geral no bloco catch:', err);
        setError(err.message);
      } finally {
        console.log('[CheckoutPage] useEffect finalizado.');
        setIsLoading(false);
      }
    };
    
    if (priceId) {
      fetchConfigAndCreateSession();
    } else {
        const errMsg = "Informação de preço em falta. Por favor, tente selecionar um plano novamente.";
        console.error(`[CheckoutPage] ${errMsg}`);
        setError(errMsg);
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
                        <p className="text-sm text-muted-foreground text-center">Chargement du formulaire de paiement...</p>
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
