
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';
import type { User } from '@supabase/supabase-js';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

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

  const fetchClientSecret = useMemo(() => {
    return async () => {
        if (!planId) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum plano selecionado.' });
            router.push('/abonnements');
            return '';
        }

        const supabaseClient = getSupabaseBrowserClient();
        if (!supabaseClient) return '';

        const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Autenticação necessária', description: 'Por favor, inicie sessão para continuar.' });
            router.push(`/login?redirect=/checkout/${planId}`);
            return '';
        }
        setUser(currentUser);

        const { data: planData, error: planError } = await supabaseClient.from('plans').select('*').eq('id', planId).single();
        if (planError || !planData) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os detalhes do plano.' });
            router.push('/abonnements');
            return '';
        }
        
        const typedPlan = planData as Plan;
        if (!typedPlan.stripe_price_id) {
            toast({ variant: 'destructive', title: 'Erro de Configuração', description: "Este plano não está configurado para pagamentos." });
            router.push('/abonnements');
            return '';
        }
        setPlan(typedPlan);
        
        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
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
            
            return sessionData.clientSecret;

        } catch (error: any) {
            console.error("Error creating subscription:", error);
            toast({ variant: 'destructive', title: 'Erro ao Iniciar Checkout', description: error.message });
            return '';
        }
    }
  }, [planId, router, toast]);

  useEffect(() => {
    fetchClientSecret().then(secret => {
        setClientSecret(secret);
        setIsLoading(false);
    });
  }, [fetchClientSecret])
  
  if (isLoading || !plan) {
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
                        {plan ? (
                            <>
                                <CardTitle>{plan.title}</CardTitle>
                                {plan.popular && <CardDescription>Está a subscrever o nosso plano mais popular.</CardDescription>}
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-64 mt-2" />
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Separator />
                        {plan ? (
                        <>
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
                        </>
                        ) : (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Coluna Direita: Formulário de Pagamento */}
            <div id="checkout">
                 <h1 className="text-2xl font-bold mb-4">Detalhes do Pagamento</h1>
                 <Card>
                    <CardContent className="pt-6">
                        {clientSecret ? (
                            <EmbeddedCheckoutProvider stripe={stripePromise} options={{clientSecret}}>
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-muted-foreground text-sm">A carregar o formulário de pagamento...</p>
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
