'use client';

import React, { useState, useEffect } from 'react';
import { useCheckout } from '@stripe/react-stripe-js/checkout';
import { PaymentElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Separator } from './ui/separator';
import { Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Plan } from '@/app/admin/plans/page';

interface CheckoutFormProps {
    planId: string;
}

export const CheckoutForm = ({ planId }: CheckoutFormProps) => {
  const checkout = useCheckout();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { data, error } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (error) {
            console.error('Error fetching plan details:', error);
        } else {
            setPlan(data);
        }
    }
    fetchPlanDetails();
  }, [planId]);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!checkout) {
      return;
    }

    setLoading(true);
    setErrorMessage(undefined);

    const { error } = await checkout.confirm();

    if (error) {
      setErrorMessage(error.message);
    }
    
    // Note: `confirm` will redirect the user to the `return_url`
    // so we don't need to handle the success case here.
    // The loading state will be reset when the user comes back to this page.
    setLoading(false);
  };
  
  if (!checkout || !plan) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">A preparar o seu checkout seguro...</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
        <div>
            <h1 className="text-2xl font-bold mb-4">Resumo da Subscrição</h1>
            <Card>
                <CardHeader>
                    <CardTitle>{plan.title}</CardTitle>
                    {plan.popular && <CardDescription>Está a subscrever o nosso plano mais popular.</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />
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
                </CardContent>
            </Card>
        </div>

        <div id="checkout">
            <h1 className="text-2xl font-bold mb-4">Detalhes do Pagamento</h1>
             <form onSubmit={handleSubmit}>
                <PaymentElement />
                <Button className="w-full mt-6" size="lg" type="submit" disabled={loading || !checkout}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pagar Agora
                </Button>
                {errorMessage && <div className="p-4 mt-4 text-sm text-destructive bg-destructive/10 rounded-md">{errorMessage}</div>}
             </form>
        </div>
    </div>
  );
};
