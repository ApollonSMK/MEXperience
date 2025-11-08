
'use client'

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [clientSecret, setClientSecret] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;

  useEffect(() => {
    if (!planId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum plano selecionado.' });
      router.push('/abonnements');
      return;
    }
    
    const fetchPlanDetails = async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os detalhes do plano.' });
            router.push('/abonnements');
        } else {
            const planData = data as Plan;
            setPlan(planData);
            // Now that we have plan details, create the checkout session
            createCheckoutSession(planData);
        }
    }

    const createCheckoutSession = async (currentPlan: Plan) => {
      try {
        if (!currentPlan.stripe_price_id) {
            throw new Error("Este plano não está configurado para pagamentos.");
        }

        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: currentPlan.id, priceId: currentPlan.stripe_price_id }),
        });

        if (res.status === 401) {
            toast({ variant: 'destructive', title: 'Autenticação necessária', description: 'Por favor, inicie sessão para continuar.' });
            router.push(`/login?redirect=/checkout/${planId}`);
            return;
        }

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Falha ao criar a sessão de checkout.');
        }
        
        const { clientSecret } = await res.json();
        if (!clientSecret) {
            throw new Error('Client secret não recebido da API.');
        }
        setClientSecret(clientSecret);

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro de Checkout', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetails();

  }, [planId, router, toast, supabase]);

  const appearance = { theme: 'stripe' as const };
  const options: StripeElementsOptions = { clientSecret, appearance };

  if (isLoading || !clientSecret || !plan) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">A preparar o seu checkout seguro...</p>
        </div>
    )
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center bg-background py-12 px-4">
        <div className="w-full max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle>Finalizar Compra</CardTitle>
                    <CardDescription>Está a subscrever o plano <span className="font-bold text-primary">{plan.title}</span> por {plan.price}{plan.period}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Elements options={options} stripe={stripePromise}>
                        <CheckoutForm />
                    </Elements>
                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}


export default function CheckoutIdPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
