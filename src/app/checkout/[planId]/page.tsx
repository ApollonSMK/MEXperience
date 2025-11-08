'use client';

import { Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutProvider } from '@stripe/react-stripe-js/checkout';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import type { Plan } from '../../admin/plans/page';
import { Separator } from '@/components/ui/separator';
import { CheckoutForm } from '@/components/checkout-form';
import type { User } from '@supabase/supabase-js';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;

  // Use a memoized promise to fetch the client secret.
  // This prevents the fetch from re-running on every render.
  const clientSecretPromise = useMemo(() => {
    if (!planId) {
      return Promise.reject(new Error("Plan ID is missing"));
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
        return Promise.reject(new Error("Supabase client is not available."));
    }
    // Check for user session before creating checkout session
    return supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
            router.push(`/login?redirect=/checkout/${planId}`);
            return Promise.reject(new Error("User not authenticated"));
        }

        return fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan_id: planId, user_id: user.id, user_email: user.email }),
        })
        .then((res) => {
            if (!res.ok) {
                return res.json().then(errorData => Promise.reject(new Error(errorData.error || 'Failed to create checkout session.')));
            }
            return res.json();
        })
        .then((data) => {
            if (!data.clientSecret) {
                return Promise.reject(new Error("Client secret is missing from server response."));
            }
            return data.clientSecret;
        });
    });
  }, [planId, router]);

  const appearance = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  };
  
  const options = {
    clientSecret: clientSecretPromise,
    appearance: appearance,
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-background py-12 px-4">
          <CheckoutProvider
            stripe={stripePromise}
            options={options}
          >
            <CheckoutForm planId={planId} />
          </CheckoutProvider>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutIdPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
