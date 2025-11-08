
'use client'

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';
import type { User } from '@supabase/supabase-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState('');

  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;

  useEffect(() => {
    if (!planId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum plano selecionado.' });
      router.push('/abonnements');
      return;
    }
    
    const fetchInitialData = async () => {
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
        setIsLoading(false);
    }

    fetchInitialData();

  }, [planId, router, toast, supabase]);

  const appearance = { theme: 'stripe' as const };
  const options: StripeElementsOptions = { clientSecret, appearance };

  if (isLoading || !plan || !user) {
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
                        <CheckoutForm user={user} plan={plan} />
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
