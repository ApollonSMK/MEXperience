'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SubscriptionForm } from '@/components/subscription-form';
import type { Plan } from '@/app/admin/plans/page';
import type { User } from '@supabase/supabase-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function SubscribePageContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan_id');
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!planId) {
            toast({ variant: 'destructive', title: 'Plano em falta', description: "Nenhum plano foi selecionado." });
            router.push('/abonnements');
            return;
        }

        const fetchPlanAndIntent = async () => {
            setIsLoading(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                toast({ variant: 'destructive', title: 'Utilizador não autenticado', description: 'Por favor, inicie sessão para subscrever.' });
                router.push(`/login?redirect=/subscribe?plan_id=${planId}`);
                return;
            }
            setUser(currentUser);

            // 1. Ir buscar os detalhes do plano à BD
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError || !planData?.stripe_price_id) {
                toast({ variant: 'destructive', title: 'Plano não encontrado', description: "O plano selecionado não existe ou está mal configurado." });
                router.push('/abonnements');
                return;
            }
            setPlan(planData);

            // 2. Chamar a nossa API para criar a intenção de subscrição e obter o clientSecret
            try {
                const response = await fetch('/api/stripe/create-subscription-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId: planData.id, stripePriceId: planData.stripe_price_id }),
                });

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }

                // Se o backend retornar que o upgrade já está completo (sem necessidade de pagamento extra)
                if (data.upgradeComplete) {
                     toast({ title: 'Abonnement mis à jour !', description: "Votre changement de plan a été effectué avec succès." });
                     router.push('/profile/subscription');
                     return;
                }

                if (!data.clientSecret) {
                    throw new Error("Erreur: Impossible d'initialiser le paiement.");
                }

                setClientSecret(data.clientSecret);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Erro de pagamento', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlanAndIntent();
    }, [planId, supabase, toast, router]);
    
    const appearance = {
      theme: 'stripe' as 'stripe',
    };

    return (
        <>
            <Header />
            <main className="flex-grow bg-secondary/30">
                <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* Resumo do Plano */}
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold">Resumo da Subscrição</h1>
                            {isLoading || !plan ? (
                                <Card>
                                    <CardHeader>
                                        <Skeleton className="h-8 w-3/4" />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-6 w-4/5" />
                                    </CardContent>
                                    <CardFooter>
                                        <Skeleton className="h-8 w-1/2" />
                                    </CardFooter>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{plan.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {plan.features.map((feature: string) => (
                                                <li key={feature} className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    <span className="text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <Separator className="my-4"/>
                                    <CardFooter className="flex justify-between items-center font-bold">
                                       <span>Total ({plan.period.includes('mois') ? 'Mensal' : 'Anual'})</span>
                                       <span>{plan.price}</span>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>

                        {/* Detalhes do Pagamento */}
                        <div className="space-y-6">
                             <h1 className="text-2xl font-bold">Detalhes do Pagamento</h1>
                             {clientSecret && plan && user ? (
                                <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
                                    <SubscriptionForm plan={plan} user={user} />
                                </Elements>
                             ) : (
                                 <Card>
                                     <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center p-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                                            </div>
                                        </div>
                                     </CardContent>
                                 </Card>
                             )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}


export default function SubscribePage() {
    return (
        <Suspense fallback={<div>A carregar a página de subscrição...</div>}>
            <SubscribePageContent />
        </Suspense>
    )
}