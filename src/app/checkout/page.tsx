
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Plan } from '@/app/admin/plans/page';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const priceId = searchParams.get('price_id');
  const planId = searchParams.get('plan_id');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSessionAndRedirect = async () => {
      setIsLoading(true);
      setError(null);
      
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !planId || !priceId) {
        setError("Informations sur le plan ou le prix manquantes. Veuillez essayer de sélectionner à nouveau un plan.");
        setIsLoading(false);
        return;
      }
      
      try {
        const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();
        if (planError || !planData) throw new Error("Le plan sélectionné n'a pas pu être chargé.");
        setPlan(planData as Plan);

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, planId }),
        });
        
        const session = await response.json();
        if (!response.ok) {
          throw new Error(session.error || 'Erreur lors de la création de la session de paiement.');
        }

        if (session.redirectUrl) {
            router.push(session.redirectUrl);
        } else {
            throw new Error("URL de paiement non reçue du serveur.");
        }

      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    createSessionAndRedirect();
  }, [priceId, planId, router]);

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="container mx-auto max-w-lg px-4 py-8 text-center">
            
            <Card>
                <CardHeader>
                    <CardTitle>Redirection vers le paiement...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error ? (
                         <Alert variant="destructive">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                            {plan ? (
                                <div>
                                    <p className="font-semibold">Vous avez choisi le plan :</p>
                                    <p className="text-xl font-bold">{plan.title} ({plan.price}{plan.period})</p>
                                </div>
                            ) : (
                               <Skeleton className="h-8 w-3/4 mx-auto" />
                            )}
                            <p className="text-sm text-muted-foreground">Veuillez patienter pendant que nous vous redirigeons vers notre portail de paiement sécurisé.</p>
                        </>
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
                <p>Chargement du paiement...</p>
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    )
}
