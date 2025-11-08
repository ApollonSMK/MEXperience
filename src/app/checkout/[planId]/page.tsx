'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';
import type { User } from '@supabase/supabase-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/checkout-form';
import { Separator } from '@/components/ui/separator';

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
    
    const fetchInitialDataAndCreateSubscription = async () => {
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
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
            console.error("Error creating subscription:", error);
            toast({ variant: 'destructive', title: 'Erro ao Iniciar Checkout', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }

    fetchInitialDataAndCreateSubscription();

  }, [planId, router, toast, supabase]);

  const appearance = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
    rules: {
        '.Input:focus': {
            boxShadow: '0 0 0 2px var(--colorPrimary)',
            borderColor: 'var(--colorPrimary)',
        }
    }
  };
  const options: StripeElementsOptions = { clientSecret, appearance };
  
  if (isLoading || !plan || !user) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
            
            {/* Coluna Esquerda: Resumo do Pedido */}
            <div>
                <h1 className="text-2xl font-bold mb-4">Resumo da Subscrição</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription>
                            Está a subscrever o nosso plano mais popular.
                        </CardDescription>
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
                            <span>Total (Mensal)</span>
                            <span>{plan.price}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Coluna Direita: Formulário de Pagamento */}
            <div>
                 <h1 className="text-2xl font-bold mb-4">Detalhes do Pagamento</h1>
                 <Card>
                    <CardContent className="pt-6">
                        {clientSecret ? (
                            <Elements stripe={stripePromise} options={options}>
                                <CheckoutForm />
                            </Elements>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground text-sm">A carregar o formulário de pagamento...</p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
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
