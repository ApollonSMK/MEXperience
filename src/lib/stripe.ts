import Stripe from 'stripe';

let stripe: Stripe;

export const getStripe = (secretKey: string): Stripe => {
  if (!stripe) {
    stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return stripe;
};
