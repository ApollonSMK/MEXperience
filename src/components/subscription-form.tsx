
'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Plan } from '@/app/admin/plans/page';
import type { User } from '@supabase/supabase-js';

interface SubscriptionFormProps {
    plan: Plan;
    user: User;
}

export function SubscriptionForm({ plan, user }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccessfulPayment = async (paymentIntentId: string) => {
    try {
        const response = await fetch('/api/stripe/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_intent_id: paymentIntentId }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao confirmar o pagamento no backend.');
        }

        toast({
            title: 'Pagamento Bem-sucedido!',
            description: "A sua subscrição está agora ativa. Será redirecionado.",
        });
        router.push('/profile/subscription');

    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Erro Pós-Pagamento',
            description: "O seu pagamento foi processado, mas ocorreu um erro ao atualizar a sua conta. " + e.message,
        });
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
        return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
        setErrorMessage(submitError.message || "Ocorreu um erro ao submeter o formulário.");
        setIsLoading(false);
        return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
        'payment_intent_client_secret'
    );
    
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile`, // Won't be used, but required
      },
      redirect: 'if_required', // Prevents redirection
    });

    if (result.error) {
      setErrorMessage(result.error.message || "Ocorreu um erro inesperado.");
      setIsLoading(false);
    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await handleSuccessfulPayment(result.paymentIntent.id);
    } else {
        setErrorMessage("O pagamento não foi bem-sucedido. Por favor, tente novamente.");
        setIsLoading(false);
    }
  };
  
  const priceNumber = parseFloat(plan.price.replace('€', ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
       {errorMessage && <div className="text-destructive text-sm font-medium">{errorMessage}</div>}
      <Button disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
        {isLoading ? <Loader2 className="animate-spin"/> : `Pagar €${priceNumber.toFixed(2)}`}
      </Button>
    </form>
  );
}
