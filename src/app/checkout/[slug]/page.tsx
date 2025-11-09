
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-gray-50 dark:bg-black py-12 px-4">
        {slug ? (
            <Elements stripe={stripePromise}>
                <CheckoutForm planId={slug} />
            </Elements>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutSlugPage() {
    return (
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="mt-4 text-muted-foreground">Chargement de la page de paiement...</p>
           </div>
          </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}
