
'use client';

import { useEffect, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { StripePaymentElementOptions } from '@stripe/stripe-js';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Pagamento bem-sucedido!');
          break;
        case 'processing':
          setMessage('Seu pagamento está sendo processado.');
          break;
        case 'requires_payment_method':
          setMessage('Seu pagamento não foi bem-sucedido, por favor, tente novamente.');
          break;
        default:
          setMessage('Algo deu errado.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'Ocorreu um erro inesperado.');
    } else {
      setMessage('Ocorreu um erro inesperado.');
    }

    setIsLoading(false);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Pagar agora'}
        </span>
      </Button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message" className="mt-4 text-center text-sm text-destructive">{message}</div>}
    </form>
  );
}
