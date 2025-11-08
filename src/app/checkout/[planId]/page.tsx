'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';
import { Separator } from '@/components/ui/separator';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientSecret = async () => {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();

      if (!planId) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Aucun plan sélectionné.' });
        router.push('/abonnements');
        return;
      }
       if (!supabase) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de se connecter à la base de données.' });
        router.push('/');
        return;
      }

      try {
        const { data: planData, error: planError } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (planError || !planData) {
          throw new Error(planError?.message || "Plan non trouvé.");
        }
        setPlan(planData);
        
        const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: planId }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Falha ao iniciar a sessão de checkout.');
        }
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur lors de la préparation du paiement',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientSecret();
  }, [planId, router, toast]);


  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-background py-12 px-4">
        {isLoading || !plan ? (
           <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="mt-4 text-muted-foreground">Préparation de votre paiement sécurisé...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold mb-4">Résumé de l'Abonnement</h1>
              <Card>
                  <CardHeader>
                      <CardTitle>{plan.title}</CardTitle>
                      {plan.popular && <CardDescription>Vous souscrivez à notre plan le plus populaire.</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Separator />
                      <ul className="space-y-2 text-sm">
                          {plan.features?.map((feature: string) => (
                          <li key={feature} className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                          </li>
                          ))}
                      </ul>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>Total (Mensuel)</span>
                          <span>{plan.price}</span>
                      </div>
                  </CardContent>
              </Card>
            </div>

            <div id="checkout">
              <h1 className="text-2xl font-bold mb-4">Détails de Paiement</h1>
               {clientSecret ? (
                <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{clientSecret}}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
               ) : (
                 <div className="flex items-center justify-center p-8 border rounded-md">
                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
               )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutIdPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
