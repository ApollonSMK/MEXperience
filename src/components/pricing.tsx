'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface Plan {
    id: string; // This is the slug
    title: string;
    price: string;
    period: string;
    minutes: number;
    sessions: string;
    features: string[];
    popular: boolean;
    order: number;
    price_per_minute?: number;
    stripe_price_id?: string;
}

export function Pricing() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchPlansAndUser = async () => {
        setIsLoading(true);
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        const { data: plansData, error: plansError } = await supabase.from('plans').select('*').order('order');
        if (plansError) {
            console.error("Error fetching plans:", plansError);
            setPlans([]);
        } else {
            setPlans(plansData as Plan[] || []);
        }

        setIsLoading(false);
    };

    fetchPlansAndUser();
  }, [supabase]);

  const handleSubscription = async (planId: string) => {
    if (!user) {
        toast({
            title: "Connexion requise",
            description: "Vous devez vous connecter pour souscrire à un abonnement.",
            action: <Button onClick={() => router.push('/login?redirect=/abonnements')}>Se connecter</Button>
        });
        return;
    }
    
    setIsSubscribing(planId);
    try {
        const response = await fetch('/api/stripe/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: planId }),
        });

        const { sessionId, error } = await response.json();

        if (error) {
            throw new Error(error);
        }
        if (!sessionId) {
            throw new Error('Impossible de récupérer l\'ID de session.');
        }

        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error('Stripe.js n\'a pas pu être chargé.');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        
        if (stripeError) {
            throw stripeError;
        }

    } catch (error: any) {
        console.error("Subscription Error:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de Souscription',
            description: error.message || 'Une erreur inattendue est survenue.',
        });
    } finally {
        setIsSubscribing(null);
    }
  };


  return (
    <section id="pricing" className="w-full py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nos Plans d'Abonnement</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choisissez le plan qui correspond le mieux à vos besoins et profitez d'avantages exclusifs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 md:grid-cols-3 md:gap-12">
          {isLoading && (
            <>
              <Skeleton className="h-[450px] rounded-lg" />
              <Skeleton className="h-[450px] rounded-lg" />
              <Skeleton className="h-[450px] rounded-lg" />
            </>
          )}
          {!isLoading && plans.length > 0 && plans.map((plan) => (
            <Card key={plan.id} className={`flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${plan.popular ? 'border-primary shadow-2xl' : ''}`}>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1 rounded-t-lg">
                  Le plus populaire
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xl font-medium text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="text-center bg-secondary/50 p-3 rounded-lg">
                    <p className="font-bold text-2xl">{plan.minutes}</p>
                    <p className="text-sm text-muted-foreground">minutes/mois (€{plan.price_per_minute?.toFixed(2)}/min)</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{plan.sessions} séances/mois</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {Array.isArray(plan.features) && plan.features.map((feature: string) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscription(plan.id)}
                  disabled={isSubscribing === plan.id}
                >
                  {isSubscribing === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  S'abonner
                </Button>
              </CardFooter>
            </Card>
          ))}
           {!isLoading && plans.length === 0 && (
             <div className="md:col-span-3 text-center text-muted-foreground">
                Aucun plan d'abonnement n'est actuellement disponible.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
