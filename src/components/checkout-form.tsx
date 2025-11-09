
'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Plan {
    id: string;
    title: string;
    slug: string;
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

interface CheckoutFormProps {
  planId: string;
}

export const CheckoutForm = ({ planId }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlanAndCreateSubscription = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!planId || !supabase) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Fetch Plan Details
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError || !planData) {
                throw new Error("Plan non trouvé.");
            }
            setPlan(planData);

            // 2. Create Subscription on the backend to get a clientSecret
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId }),
            });

            const subscriptionResult = await response.json();

            if (subscriptionResult.error) {
                throw new Error(subscriptionResult.error);
            }
            
            setClientSecret(subscriptionResult.clientSecret);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur de Configuration', description: error.message });
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }
    fetchPlanAndCreateSubscription();
  }, [planId, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/return`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setErrorMessage(error.message);
    } else {
      setErrorMessage("Une erreur inattendue est survenue.");
    }

    setIsProcessing(false);
  };
  
  if (isLoading || !plan) {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-6xl py-12">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="mt-4 text-muted-foreground">Préparation de votre paiement sécurisé...</p>
       </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-4">Résumé de l'Abonnement</h1>
        <Card>
          <CardHeader>
            <CardTitle>{plan.title}</CardTitle>
            {plan.popular && <CardDescription>Vous souscrivez à notre plan le plus populaire.</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <ul className="space-y-2 text-sm">
              {(plan.features as string[])?.map((feature: string) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total (Mensuel)</span>
              <span>{plan.price}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="checkout">
        <h1 className="text-2xl font-bold mb-4">Détails de Paiement</h1>
        <form onSubmit={handleSubmit}>
          {clientSecret && elements && (
            <>
              <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
              <Button 
                className="w-full mt-6" 
                size="lg" 
                type="submit" 
                disabled={isProcessing || !stripe || !elements}
                id="submit"
              >
                <span id="button-text">
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Payer Maintenant'}
                </span>
              </Button>
            </>
          )}

          {!clientSecret && !isLoading && (
             <div className="p-4 mt-4 text-sm text-destructive bg-destructive/10 rounded-md">
                Erreur de configuration du paiement. Impossible de charger le formulaire.
            </div>
          )}

          {isLoading && (
              <div className="flex flex-col items-center justify-center w-full py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground text-sm">Chargement du formulaire de paiement...</p>
            </div>
          )}

          {errorMessage && (
            <div id="payment-message" className="p-4 mt-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
