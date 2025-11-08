
'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import type { Plan } from '@/app/admin/plans/page';

interface CheckoutFormProps {
    user: User;
    plan: Plan;
}

export function CheckoutForm({ user, plan }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
        setMessage(submitError.message || "Ocorreu um erro ao submeter o formulário.");
        setIsLoading(false);
        return;
    }
    
    // Create the PaymentMethod using the details from the card element
    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      elements,
    });

    if (pmError) {
        setMessage(pmError.message || "Ocorreu um erro ao criar o método de pagamento.");
        setIsLoading(false);
        return;
    }
    
    // Call the backend to create the subscription
    const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          payment_method: paymentMethod.id,
          plan_price_id: plan.stripe_price_id,
          plan_id: plan.id,
          user_id: user.id,
        }),
    });
      
    const subscription = await res.json();

    if (subscription.error) {
        setMessage(subscription.error);
        setIsLoading(false);
        return;
    }

    // @ts-ignore
    const { latest_invoice } = subscription;
    const { payment_intent } = latest_invoice;

    if (payment_intent.status === 'succeeded') {
        toast({ title: "Sucesso!", description: "A sua subscrição foi ativada." });
        window.location.href = '/profile/subscription';
        return;
    }

    // Use the client secret from the payment intent to confirm the payment
    const { error: confirmError } = await stripe.confirmCardPayment(payment_intent.client_secret);

    if (confirmError) {
      setMessage(confirmError.message || "Ocorreu um erro inesperado ao confirmar o pagamento.");
    } else {
       toast({ title: "Sucesso!", description: "A sua subscrição está a ser ativada." });
       window.location.href = '/profile/subscription';
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isLoading ? <Loader2 className="animate-spin" /> : "Pagar e Subscrever"}
        </span>
      </Button>
      {message && <div id="payment-message" className="text-destructive text-sm mt-2">{message}</div>}
    </form>
  );
}
