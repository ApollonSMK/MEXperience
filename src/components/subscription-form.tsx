'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Plan } from '@/app/admin/plans/page';
import type { User } from '@supabase/supabase-js';

interface SubscriptionFormProps {
    plan: Plan;
    user: User;
    onPaymentSuccess: (paymentIntentId: string) => void;
}

export function SubscriptionForm({ plan, user, onPaymentSuccess }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile/subscription`, // Not used, but required
      },
      redirect: 'if_required', // Prevents automatic redirection
    });

    if (error) {
      setErrorMessage(error.message || "Ocorreu um erro inesperado.");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Ação pós-pagamento agora é gerida pela página pai
        onPaymentSuccess(paymentIntent.id);
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
        {isLoading ? <Loader2 className="animate-spin"/> : `Payer €${priceNumber.toFixed(2)}`}
      </Button>
    </form>
  );
}
