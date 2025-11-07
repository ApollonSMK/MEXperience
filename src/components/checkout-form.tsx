'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: result.error.message,
      });
    } else {
        toast({
            title: 'Traitement...',
            description: 'Votre paiement est en cours de traitement.',
        });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button disabled={!stripe || isLoading} className="w-full mt-6">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <span>{isLoading ? 'Traitement...' : 'Payer et S\'abonner'}</span>
      </Button>
    </form>
  );
};

export default CheckoutForm;
