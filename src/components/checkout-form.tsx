'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Plan } from '@/app/admin/plans/page';

interface CheckoutFormProps {
  planId: string;
}

export const CheckoutForm = ({ planId }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const createSubscription = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();

    if (!planId || !supabase) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Données de configuration manquantes.' });
      router.push('/abonnements');
      return;
    }

    try {
      // 1. Fetch plan details
      const { data: planData, error: planError } = await supabase.from('plans').select('*').eq('id', planId).single();
      if (planError || !planData) throw new Error(planError?.message || "Plan non trouvé.");
      setPlan(planData);

      // 2. Create subscription on the backend
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });

      const sessionData = await response.json();
      if (!response.ok || sessionData.error) throw new Error(sessionData.error || 'Falha ao iniciar a sessão de checkout.');

      setClientSecret(sessionData.clientSecret);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur de préparation', description: error.message });
      router.push('/abonnements');
    } finally {
      setIsLoading(false);
    }
  }, [planId, router, toast]);

  useEffect(() => {
    createSubscription();
  }, [createSubscription]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements || !clientSecret) {
      setIsProcessing(false);
      return;
    }

    setErrorMessage(undefined);

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/checkout/return`,
        },
    });

    if (error) {
      setErrorMessage(error.message || "Une erreur inattendue est survenue.");
    }
    
    setIsProcessing(false);
  };
  
  if (isLoading || !clientSecret || !plan) {
    return (
       <div className="flex flex-col items-center justify-center w-full max-w-6xl">
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
