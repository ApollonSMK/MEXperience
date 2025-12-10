'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AppointmentPaymentFormProps {
    onPaymentSuccess: (paymentIntentId: string) => void;
    price: number;
}

export function AppointmentPaymentForm({ onPaymentSuccess, price }: AppointmentPaymentFormProps) {
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
        return_url: `${window.location.origin}/agendar`, // Not really used, but required
      },
      redirect: 'if_required', // Prevents automatic redirection
    });

    if (error) {
      console.error("Stripe confirm error:", error);
      setErrorMessage(error.message || "Ocorreu um erro inesperado.");
      setIsLoading(false);
    } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        onPaymentSuccess(paymentIntent.id);
    } else {
        console.error("Unexpected PaymentIntent status:", paymentIntent?.status);
        setErrorMessage(`O pagamento não foi concluído imediatamente (Status: ${paymentIntent?.status}). Se foi cobrado, contacte o suporte.`);
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
       {errorMessage && <div className="text-destructive text-sm font-medium">{errorMessage}</div>}
      <Button disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
        {isLoading ? <Loader2 className="animate-spin"/> : `Payer €${price.toFixed(2)}`}
      </Button>
    </form>
  );
}