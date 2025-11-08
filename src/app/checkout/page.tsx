
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/checkout-form';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan_id');

  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!planId) {
        setError("ID do plano não encontrado. Por favor, selecione um plano novamente.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao criar a intenção de pagamento.');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [planId]);

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento Seguro</CardTitle>
              <CardDescription>Complete os seus dados de pagamento abaixo.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                 <div className="flex flex-col items-center justify-center space-y-4 p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">A carregar o formulário de pagamento...</p>
                 </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {clientSecret && !error && (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <p>A carregar checkout...</p>
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}
