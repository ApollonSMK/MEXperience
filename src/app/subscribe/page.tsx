'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionForm } from '@/components/subscription-form';
import type { Plan } from '@/app/admin/plans/page';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function SubscribePageContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan_id');
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!planId) {
            toast({ variant: 'destructive', title: 'Plan manquant', description: "Aucun plan n'a été sélectionné." });
            return;
        }

        const fetchPlanAndIntent = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // This case should be handled by redirects, but as a fallback
                toast({ variant: 'destructive', title: 'Utilisateur non connecté', description: 'Veuillez vous connecter pour vous abonner.' });
                setIsLoading(false);
                return;
            }

            // 1. Fetch Plan Details
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError || !planData) {
                toast({ variant: 'destructive', title: 'Plan non trouvé', description: "Le plan sélectionné n'existe pas." });
                setIsLoading(false);
                return;
            }
            setPlan(planData);

            // 2. Create Subscription Intent
            try {
                const response = await fetch('/api/stripe/create-subscription-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId: planData.id, stripePriceId: planData.stripe_price_id }),
                });

                const { clientSecret, error: intentError } = await response.json();

                if (intentError) {
                    throw new Error(intentError);
                }

                setClientSecret(clientSecret);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Erreur de paiement', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlanAndIntent();
    }, [planId, supabase, toast]);
    
    const appearance = {
      theme: 'stripe' as 'stripe',
    };
    const options = {
      clientSecret,
      appearance,
    };

    return (
        <>
            <Header />
            <main className="flex-grow bg-secondary/30">
                <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* Resumo do Plano */}
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold">Résumé de l'Abonnement</h1>
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
                                       <span>Total ({plan.period.includes('mois') ? 'Mensuel' : 'Annuel'})</span>
                                       <span>{plan.price}</span>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>

                        {/* Detalhes do Pagamento */}
                        <div className="space-y-6">
                             <h1 className="text-2xl font-bold">Détails de Paiement</h1>
                             {clientSecret && (
                                <Elements options={options} stripe={stripePromise}>
                                    <SubscriptionForm plan={plan} />
                                </Elements>
                             )}
                             {isLoading && !clientSecret && (
                                 <Card>
                                     <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-24 w-full" />
                                            <Skeleton className="h-10 w-full" />
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
        <Suspense fallback={<div>Chargement de la page d'abonnement...</div>}>
            <SubscribePageContent />
        </Suspense>
    )
}
