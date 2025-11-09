'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  planId: string;
}

export const CheckoutForm = ({ planId }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }
  }, [stripe]);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      setIsLoading(false);
      return;
    }
    
    setErrorMessage(undefined);
    
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/checkout/return`,
        },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment (e.g., network issue, invalid card details).
    // Otherwise, the user is redirected to the `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <Button 
        className="w-full mt-6" 
        size="lg" 
        type="submit" 
        disabled={isLoading || !stripe || !elements}
        id="submit"
      >
        <span id="button-text">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Payer Maintenant'}
        </span>
      </Button>
      {errorMessage && (
        <div id="payment-message" className="p-4 mt-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {errorMessage}
        </div>
      )}
    </form>
  );
};
