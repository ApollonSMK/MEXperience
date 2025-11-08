
'use client';

import { useEffect, useState } from 'react';
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Pagamento bem-sucedido!");
          break;
        case "processing":
          setMessage("O seu pagamento está a ser processado.");
          break;
        case "requires_payment_method":
          setMessage("O seu pagamento não foi bem-sucedido, por favor, tente novamente.");
          break;
        default:
          setMessage("Algo correu mal.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile/subscription`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "Ocorreu um erro inesperado.");
    } else {
      setMessage("Ocorreu um erro inesperado.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <LinkAuthenticationElement
        id="link-authentication-element"
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isLoading ? <Loader2 className="animate-spin" /> : "Pagar agora"}
        </span>
      </Button>
      {message && <div id="payment-message" className="text-destructive text-sm mt-2">{message}</div>}
    </form>
  );
}
