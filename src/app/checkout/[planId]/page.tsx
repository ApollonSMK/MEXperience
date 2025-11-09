
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutForm } from '@/components/checkout-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

function CheckoutPageContent() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  // The CheckoutForm component now handles everything, including fetching the clientSecret and wrapping with Elements provider.
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center bg-gray-50 dark:bg-black py-12 px-4">
          <CheckoutForm planSlug={slug} />
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
