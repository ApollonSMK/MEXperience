
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

        // We are using the Payment Element, so we don't need to create the payment method manually.
        // We call our backend to create the subscription, which will create the initial PaymentIntent.
        
        const response = await fetch('/api/stripe/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                plan_id: plan.id,
            }),
        });

        const subscription = await response.json();
        if(subscription.error) {
            throw new Error(subscription.error);
        }

        const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

        if (!clientSecret) {
            throw new Error("Ocorreu um erro ao processar a sua subscrição. Por favor, tente novamente.");
        }

        // Use the clientSecret to confirm the payment on the client side
        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          clientSecret,
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
