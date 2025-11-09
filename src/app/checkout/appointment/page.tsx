'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppointmentCheckoutForm } from '@/components/appointment-checkout-form';
import { Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

function CheckoutPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detailsString = sessionStorage.getItem('appointmentDetails');
    if (!detailsString) {
      toast({
        variant: 'destructive',
        title: 'Détails de réservation manquants',
        description: "Aucun détail de rendez-vous trouvé. Redirection...",
      });
      router.push('/agendar');
      return;
    }

    const details = JSON.parse(detailsString);
    setAppointmentDetails(details);

    const createPaymentIntent = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(details),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }
            
            setClientSecret(data.clientSecret);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur de Configuration du Paiement',
                description: error.message || "Impossible de démarrer le processus de paiement. Veuillez réessayer.",
            });
            router.push('/agendar');
        } finally {
            setIsLoading(false);
        }
    };

    createPaymentIntent();
  }, [router, toast]);


  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center bg-gray-50 dark:bg-black py-12 px-4">
        {(isLoading || !clientSecret || !appointmentDetails) && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] w-full max-w-6xl mx-auto">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="mt-4 text-muted-foreground">Préparation de votre paiement sécurisé...</p>
           </div>
        )}
        
        {!isLoading && clientSecret && appointmentDetails && (
            <Elements options={options} stripe={stripePromise}>
                <AppointmentCheckoutForm appointmentDetails={appointmentDetails} />
            </Elements>
        )}

      </main>
      <Footer />
    </>
  );
}

export default function AppointmentCheckoutPage() {
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
