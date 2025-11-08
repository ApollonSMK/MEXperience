
'use client';

import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface EmbeddedCheckoutFormProps {
  clientSecret: string;
}

export function EmbeddedCheckoutForm({ clientSecret }: EmbeddedCheckoutFormProps) {
  if (!clientSecret) {
    return null; // Don't render anything if the client secret isn't available yet
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
