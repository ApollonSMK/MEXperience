
'use client';

import { useState } from 'react';
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
    setMessage(null);

    try {
        // 1. Create a PaymentMethod
        const { error: elementsSubmitError } = await elements.submit();
        if (elementsSubmitError) {
          throw elementsSubmitError;
        }

        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
            elements,
        });

        if (paymentMethodError) {
            throw paymentMethodError;
        }

        // 2. Call backend to create subscription
        const response = await fetch('/api/stripe/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                plan_id: plan.id,
                plan_price_id: plan.stripe_price_id,
                payment_method: paymentMethod.id,
            }),
        });

        const subscription = await response.json();

        if (subscription.error) {
            throw new Error(subscription.error);
        }

        const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

        if (!clientSecret) {
            throw new Error("Ocorreu um erro ao processar a sua subscrição. Por favor, tente novamente.");
        }

        // 3. Confirm the payment on the client
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

        if (confirmError) {
            throw confirmError;
        }

        toast({
            title: "Pagamento bem-sucedido!",
            description: "A sua subscrição está a ser ativada. A redirecionar...",
        });
        
        // Redirect on success
        router.push('/profile/subscription');


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
