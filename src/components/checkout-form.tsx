
'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!planId || !supabase) return;

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Plan non trouvé."});
        } else {
            setPlan(data);
        }
    }
    fetchPlanDetails();
  }, [planId, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setErrorMessage(undefined);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error: elementsSubmitError } = await elements.submit();
    if (elementsSubmitError) {
      setErrorMessage(elementsSubmitError.message);
      setIsProcessing(false);
      return;
    }

    try {
        const response = await fetch('/api/stripe/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: planId }),
        });

        const subscriptionResult = await response.json();

        if (subscriptionResult.error) {
            throw new Error(subscriptionResult.error);
        }
        
        const { clientSecret } = subscriptionResult;
        
        // Use the universal confirmPayment method
        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/return`,
            },
        });

        if (confirmError) {
             // This point will only be reached if there is an immediate error when
            // confirming the payment. Otherwise, your customer will be redirected to
            // your `return_url`. For some payment methods like iDEAL, your customer will
            // be redirected to an intermediate site first to authorize the payment, then
            // redirected to the `return_url`.
            setErrorMessage(confirmError.message);
        }

    } catch (error: any) {
      setErrorMessage(error.message || 'Une erreur inattendue est survenue.');
    }

    // The processing state is managed by the redirection, so we might not need to set it to false here
    // unless an error occurs that doesn't cause a redirect.
    setIsProcessing(false);
  };
  
  if (!plan) {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-6xl">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="mt-4 text-muted-foreground">Chargement des détails du plan...</p>
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
          <PaymentElement id="payment-element" />
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
