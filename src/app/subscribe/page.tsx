'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/payment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { User } from '@supabase/supabase-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface Plan {
    id: string;
    title: string;
    price: string;
    minutes: number;
    features: string[];
}

function SubscribePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getSupabaseBrowserClient();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const planId = searchParams.get('plan');
    const planPrice = useMemo(() => {
        if (!plan?.price) return 0;
        return parseFloat(plan.price.replace('€', ''));
    }, [plan]);


    useEffect(() => {
        const initialize = async () => {
            if (!planId) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Aucun plan sélectionné.' });
                router.push('/abonnements');
                return;
            }

            setIsLoading(true);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push(`/login?redirect=/subscribe?plan=${planId}`);
                return;
            }
            setUser(session.user);

            const { data: planData, error: planError } = await supabase.from('plans').select('*').eq('id', planId).single();

            if (planError || !planData) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de trouver le plan sélectionné.' });
                router.push('/abonnements');
                return;
            }
            setPlan(planData as Plan);

            try {
                const response = await fetch('/api/stripe/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan_id: planId, amount: parseFloat(planData.price.replace('€', '')) }),
                });

                const { clientSecret: secret, error } = await response.json();

                if (error) throw new Error(error);
                if (!secret) throw new Error("Le clientSecret n'a pas été reçu.");
                
                setClientSecret(secret);
            } catch (e: any) {
                toast({ variant: 'destructive', title: 'Erreur de Paiement', description: e.message });
            } finally {
                setIsLoading(false);
            }
        };

        initialize();

    }, [planId, router, supabase, toast]);
    
    const handleSuccessfulPayment = async () => {
        if (!user || !plan) return;
    
        try {
            // Primeiro, cria a nova subscrição no Stripe
            const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, minutes_balance').eq('id', user.id).single();
            const { data: planData } = await supabase.from('plans').select('stripe_price_id, minutes').eq('id', plan.id).single();
            
            if (!profile || !planData) throw new Error('Profil ou données du plan introuvables.');

            const stripe = await stripePromise;
            if (!stripe) throw new Error('Stripe.js not loaded');

            // Criar a subscrição no Stripe associada ao cliente
            const subResponse = await fetch('/api/stripe/create-subscription', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ 
                     plan_id: plan.id, 
                     customer_id: profile.stripe_customer_id 
                }),
            });

            const { subscriptionId, error: subError } = await subResponse.json();
            if(subError) throw new Error(subError);

            // Em seguida, atualiza o perfil do usuário no Supabase
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                    plan_id: plan.id,
                    minutes_balance: (profile.minutes_balance || 0) + planData.minutes,
                    stripe_subscription_id: subscriptionId,
                    stripe_subscription_status: 'active',
                })
                .eq('id', user.id);
            
            if (profileUpdateError) throw profileUpdateError;

            // Finalmente, cria a fatura no Supabase
            const { error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    user_id: user.id,
                    plan_id: plan.id,
                    plan_title: plan.title,
                    amount: planPrice,
                    status: 'paid', // O pagamento acabou de ser feito
                    date: new Date().toISOString(),
                });

            if (invoiceError) throw invoiceError;

            toast({
                title: 'Abonnement Réussi!',
                description: 'Bienvenue! Votre abonnement est maintenant actif.',
            });
            router.push('/profile/subscription');

        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur post-paiement',
                description: "Votre paiement a été traité, mais une erreur est survenue lors de la mise à jour de votre compte. " + e.message,
            });
        }
    };


    const options: StripeElementsOptions = {
        clientSecret,
        appearance: {
            theme: 'stripe',
        },
    };
    
    const renderLoading = () => (
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                </CardContent>
                <CardContent>
                     <Skeleton className="h-8 w-1/3" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )

    return (
        <>
            <Header />
            <main className="flex-grow bg-gray-50/50 dark:bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                    
                    {isLoading ? renderLoading() : (
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {plan && (
                                <div className="space-y-6">
                                     <h1 className="text-2xl font-bold tracking-tight">Résumé de l'Abonnement</h1>
                                     <Card className="bg-background">
                                        <CardHeader>
                                            <CardTitle>{plan.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardContent className="border-t pt-4">
                                            <div className="flex justify-between font-semibold">
                                                <span>Total (Mensuel)</span>
                                                <span>€{planPrice.toFixed(2)}</span>
                                            </div>
                                        </CardContent>
                                     </Card>
                                </div>
                            )}

                            <div>
                                 <h1 className="text-2xl font-bold tracking-tight mb-6">Détails de Paiement</h1>
                                 {clientSecret ? (
                                    <Elements options={options} stripe={stripePromise}>
                                        <PaymentForm 
                                            userEmail={user?.email || ''} 
                                            amount={planPrice} 
                                            onSuccessfulPayment={handleSuccessfulPayment}
                                        />
                                    </Elements>
                                ) : (
                                    <div className="flex items-center justify-center p-8 border rounded-lg">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

export default function SubscribePage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Chargement...</div>}>
            <SubscribePageContent />
        </Suspense>
    );
}
