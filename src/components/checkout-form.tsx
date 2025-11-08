
'use client';

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import type { Plan } from '@/app/admin/plans/page';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';

interface CheckoutFormProps {
    user: User;
    plan: Plan;
    stripePromise: Promise<Stripe | null>;
}

function EmbeddedForm({ clientSecret, user, plan }: { clientSecret: string, user: User, plan: Plan }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/profile/subscription`,
            payment_method_data: {
                billing_details: {
                    name: user.user_metadata?.display_name || user.email,
                    email: user.email
                }
            }
        },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "An unexpected error occurred.");
    } else {
      setMessage("An unexpected error occurred.");
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

export function CheckoutForm({ user, plan, stripePromise }: CheckoutFormProps) {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createSubscription = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/stripe/create-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_price_id: plan.stripe_price_id,
                    plan_id: plan.id,
                }),
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create subscription.');
            }
            
            const data = await res.json();
            
            const subscriptionClientSecret = data.latest_invoice?.payment_intent?.client_secret;

            if (!subscriptionClientSecret) {
                throw new Error('Client secret not found in subscription response.');
            }
            
            setClientSecret(subscriptionClientSecret);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao preparar pagamento',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    createSubscription();
  }, [plan, toast]);
  
  if (isLoading || !clientSecret) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground text-sm">A carregar o formulário de pagamento...</p>
        </div>
    )
  }
  
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: 'stripe' }
  };

  return (
    <Elements options={options} stripe={stripePromise}>
        <EmbeddedForm clientSecret={clientSecret} user={user} plan={plan} />
    </Elements>
  )
}
