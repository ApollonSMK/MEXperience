'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Plan } from '@/app/admin/plans/page';

interface SubscriptionFormProps {
    plan: Plan | null;
}

export function SubscriptionForm({ plan }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirect to a specific page after payment is completed
        return_url: `${window.location.origin}/profile/subscription`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setErrorMessage(error.message || "Une erreur inattendue est survenue.");
    } else {
      setErrorMessage("Une erreur inattendue est survenue.");
    }

    setIsLoading(false);
  };
  
  const priceNumber = plan?.price ? parseFloat(plan.price.replace('€', '')) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
       {errorMessage && <div className="text-destructive text-sm font-medium">{errorMessage}</div>}
      <Button disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
        {isLoading ? <Loader2 className="animate-spin"/> : `Payer €${priceNumber}`}
      </Button>
    </form>
  );
}
