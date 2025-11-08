
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';
import type { User } from '@supabase/supabase-js';
import { EmbeddedCheckoutForm } from '@/components/embedded-checkout-form';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;

  useEffect(() => {
    if (!planId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum plano selecionado.' });
      router.push('/abonnements');
      return;
    }
    
    const fetchInitialDataAndCreateSession = async () => {
        setIsLoading(true);
        if (!supabase) return;

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Autenticação necessária', description: 'Por favor, inicie sessão para continuar.' });
            router.push(`/login?redirect=/checkout/${planId}`);
            return;
        }
        setUser(currentUser);

        const { data: planData, error: planError } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (planError || !planData) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os detalhes do plano.' });
            router.push('/abonnements');
            return;
        }
        
        const typedPlan = planData as Plan;
        if (!typedPlan.stripe_price_id) {
            toast({ variant: 'destructive', title: 'Erro de Configuração', description: "Este plano não está configurado para pagamentos." });
            router.push('/abonnements');
            return;
        }
        setPlan(typedPlan);

        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    plan_id: typedPlan.id,
                    plan_price_id: typedPlan.stripe_price_id,
                }),
            });

            const sessionData = await response.json();

            if (!response.ok || sessionData.error) {
                throw new Error(sessionData.error || 'Falha ao iniciar a sessão de checkout.');
            }
            
            setClientSecret(sessionData.clientSecret);

        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            toast({ variant: 'destructive', title: 'Erro ao Iniciar Checkout', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }

    fetchInitialDataAndCreateSession();

  }, [planId, router, toast, supabase]);
  
  if (isLoading || !plan || !user || !clientSecret) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">A preparar o seu checkout seguro...</p>
        </div>
    )
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-background py-12 px-4">
        <div className="w-full max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle>Finalizar Compra</CardTitle>
                    <CardDescription>Está a subscrever o plano <span className="font-bold text-primary">{plan.title}</span> por {plan.price}{plan.period}.</CardDescription>
                </CardHeader>
                <CardContent>
                     <EmbeddedCheckoutForm clientSecret={clientSecret} />
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
