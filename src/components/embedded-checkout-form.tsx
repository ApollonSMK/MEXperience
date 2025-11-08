'use client';

import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useStripe } from '@stripe/react-stripe-js';
import React, { useCallback } from 'react';

export function EmbeddedCheckoutForm() {
  const stripe = useStripe();

  const fetchClientSecret = useCallback(async () => {
    // A lógica para buscar o client secret já está na página principal.
    // Este componente agora assume que o client secret é fornecido
    // ao <EmbeddedCheckoutProvider> que o envolve.
    // Retornamos uma string vazia como um placeholder, pois a lógica real
    // está no nível da página.
    return '';
  }, []);

  const options = {fetchClientSecret};

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripe}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
