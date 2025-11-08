
'use client';

import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import React from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface EmbeddedCheckoutFormProps {
  clientSecret: string;
  appearance: StripeElementsOptions['appearance'];
}

export function EmbeddedCheckoutForm({ clientSecret, appearance }: EmbeddedCheckoutFormProps) {
  if (!clientSecret) {
    return null; // Don't render anything if the client secret isn't available yet
  }
  
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
