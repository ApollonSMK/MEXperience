
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

    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      elements,
    });

    if (paymentMethodError) {
      setErrorMessage(paymentMethodError.message);
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          payment_method: paymentMethod.id,
        }),
      });

      const subscriptionResult = await response.json();

      if (subscriptionResult.error) {
        throw new Error(subscriptionResult.error);
      }

      if (subscriptionResult.requires_action && subscriptionResult.client_secret) {
        // 3D Secure is required
        const { error: confirmError } = await stripe.confirmCardPayment(subscriptionResult.client_secret);
        if (confirmError) {
          throw new Error(confirmError.message);
        }
        // The payment is confirmed, redirect to return page
        router.push('/checkout/return?redirect_status=succeeded');
      } else if (subscriptionResult.success) {
        // Payment succeeded immediately
        router.push('/checkout/return?redirect_status=succeeded');
      }

    } catch (error: any) {
      setErrorMessage(error.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsProcessing(false);
    }
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
