'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Skeleton } from '@/components/ui/skeleton';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const params = useParams();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;

  // Since all logic is now in CheckoutForm, this component is much simpler.
  // We just need to provide the planId.
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-gray-50 dark:bg-black py-12 px-4">
          <Elements stripe={stripePromise}>
            <CheckoutForm planId={planId} />
          </Elements>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutIdPage() {
    return (
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
               <Skeleton className="h-12 w-12" />
               <Skeleton className="h-4 w-48 mt-4" />
           </div>
          </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}
