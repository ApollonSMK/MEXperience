import Stripe from 'stripe';

// This approach avoids having a global Stripe instance that could cause issues.
// The getStripe function will now manage its instance privately.
let stripeInstance: Stripe | undefined;

export const getStripe = (secretKey: string): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return stripeInstance;
};
