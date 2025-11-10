
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { Plan } from '@/app/admin/plans/page';
import type { User } from '@supabase/supabase-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function PaymentForm({ plan, clientSecret, user }: { plan: Plan; clientSecret: string; user: User }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccessfulPayment = async () => {
      if (!plan || !user) return;

      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('minutes_balance')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
          throw new Error("Erreur lors de la récupération du profil utilisateur.");
      }

      const newBalance = (currentProfile?.minutes_balance || 0) + plan.minutes;
      
      // Update user profile with plan and minutes
      const { error: profileError } = await supabase
          .from('profiles')
          .update({
              plan_id: plan.id,
              minutes_balance: newBalance,
              // The webhook will set the subscription status to 'active'
          })
          .eq('id', user.id);

      if (profileError) {
          throw new Error("Erreur lors de la mise à jour de l'abonnement du profil.");
      }

      // Invoice creation is now handled by the webhook to comply with RLS.
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
        setErrorMessage(submitError.message || "Une erreur est survenue.");
        setIsLoading(false);
        return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/profile`, // We won't use this, but it's required
      },
      redirect: 'if_required', // This is key! It prevents redirection.
    });

    if (confirmError) {
      setErrorMessage(confirmError.message || "Une erreur inattendue est survenue.");
      setIsLoading(false);
    } else {
        try {
            await handleSuccessfulPayment();
            toast({
                title: 'Paiement Réussi !',
                description: "Votre abonnement est maintenant actif. Vous allez être redirigé.",
            });
            router.push('/profile/subscription');
        } catch (e: any) {
             toast({
                variant: 'destructive',
                title: 'Erreur post-paiement',
                description: "Votre paiement a été traité, mais une erreur est survenue lors de la mise à jour de votre compte. " + e.message,
            });
            setIsLoading(false);
        }
    }
  };

  const priceNumber = parseFloat(plan.price.replace('€', ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
       {errorMessage && <div className="text-destructive text-sm font-medium">{errorMessage}</div>}
      <Button disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
        {isLoading ? <Loader2 className="animate-spin"/> : `Payer €${priceNumber.toFixed(2)}`}
      </Button>
    </form>
  );
}


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
            toast({ variant: 'destructive', title: 'Plan manquant', description: "Aucun plan n'a été sélectionné." });
            router.push('/abonnements');
            return;
        }

        const fetchPlanAndIntent = async () => {
            setIsLoading(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                toast({ variant: 'destructive', title: 'Utilisateur non connecté', description: 'Veuillez vous connecter pour vous abonner.' });
                router.push(`/login?redirect=/subscribe?plan_id=${planId}`);
                return;
            }
            setUser(currentUser);

            // 1. Fetch Plan Details
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError || !planData?.stripe_price_id) {
                toast({ variant: 'destructive', title: 'Plan non trouvé', description: "Le plan sélectionné n'existe pas ou est mal configuré." });
                router.push('/abonnements');
                return;
            }
            setPlan(planData);

            // 2. Create subscription Intent
            try {
                const response = await fetch('/api/stripe/create-subscription-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId: planData.id, stripePriceId: planData.stripe_price_id }),
                });

                const { clientSecret: newClientSecret, error: intentError } = await response.json();

                if (intentError) {
                    throw new Error(intentError);
                }

                setClientSecret(newClientSecret);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Erreur de paiement', description: error.message });
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
                             {clientSecret && plan && user ? (
                                <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
                                    <PaymentForm plan={plan} clientSecret={clientSecret} user={user}/>
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
        <Suspense fallback={<div>Chargement de la page d'abonnement...</div>}>
            <SubscribePageContent />
        </Suspense>
    )
}
