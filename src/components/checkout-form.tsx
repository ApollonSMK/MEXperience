
'use client';

import { useEffect, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import type { Plan } from '@/app/admin/plans/page';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
    user: User;
    plan: Plan;
}

export function CheckoutForm({ user, plan }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }
    
    setIsProcessing(true);

    try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw submitError;
        }

        // The payment intent is already created and the client secret is passed to the Elements provider.
        // We just need to confirm the payment.
        
        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/profile/subscription`,
          },
        });

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`.
        if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
            setMessage(confirmError.message || "An unexpected error occurred.");
        } else {
            setMessage("An unexpected error occurred.");
        }

    } catch (error: any) {
        setMessage(error.message || "An unexpected error occurred.");
    }

    setIsProcessing(false);
  };
  
   return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <Button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isProcessing ? <Loader2 className="animate-spin" /> : `Pagar ${plan.price} e Subscrever`}
        </span>
      </Button>
      {message && <div id="payment-message" className="text-destructive text-sm mt-2">{message}</div>}
    </form>
  );
}
