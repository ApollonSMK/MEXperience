'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  clientSecret: string;
}

export const CheckoutForm = ({ clientSecret }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }
    
    setErrorMessage(undefined);

    // The key change is here. We are confirming the payment for the Payment Intent
    // that is associated with the Subscription's first invoice.
    // This is the correct flow for subscriptions created via API.
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
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
