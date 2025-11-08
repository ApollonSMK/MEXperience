
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

interface CheckoutFormProps {
    user: User;
    plan: Plan;
}

export function CheckoutForm({ user, plan }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
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
    
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: user.email,
        },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Ocorreu um erro inesperado.");
    } else {
        setMessage("Ocorreu um erro inesperado. Por favor, tente novamente.");
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
