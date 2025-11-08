'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getSupabaseBrowserClient();
    const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');

    useEffect(() => {
        const clientSecret = searchParams.get('payment_intent_client_secret');
        const redirectStatus = searchParams.get('redirect_status');

        if (!clientSecret || !redirectStatus || !supabase) {
            setStatus('error');
            return;
        }

        const fetchPaymentStatus = async () => {
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
            if (!stripe) {
                setStatus('error');
                return;
            }

            const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

            switch (paymentIntent?.status) {
                case 'succeeded':
                    setStatus('success');
                    setTimeout(() => router.push('/profile/subscription'), 3000);
                    break;
                case 'processing':
                    setStatus('loading');
                    // You might want to show a "processing" message and poll for status
                    break;
                default:
                    setStatus('error');
                    break;
            }
        };

        fetchPaymentStatus();
    }, [searchParams, router, supabase]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <h1 className="text-2xl font-bold">Vérification de votre paiement...</h1>
                <p className="text-muted-foreground">Veuillez ne pas rafraîchir cette page.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
                    <CardTitle className="text-2xl">Paiement Échoué</CardTitle>
                    <CardDescription>
                        Il y a eu un problème avec votre paiement. Aucune charge n'a été effectuée.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <p className="text-sm text-center text-muted-foreground">Veuillez essayer à nouveau ou contacter le support si le problème persiste.</p>
                    <Button asChild className="mt-6">
                        <Link href="/abonnements">Retour aux abonnements</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-2xl">Paiement Réussi !</CardTitle>
                <CardDescription>
                    Merci pour votre abonnement ! Vous serez redirigé(e) sous peu.
                </CardDescription>
            </CardHeader>
             <CardContent className="flex flex-col items-center">
                 <p className="text-sm text-center text-muted-foreground">Votre compte a été mis à jour avec votre nouveau plan.</p>
                <Button asChild className="mt-6" variant="outline">
                    <Link href="/profile">Aller au Profil</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function ReturnPage() {
    return (
        <>
            <Header />
            <main className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center bg-gray-50 dark:bg-black p-4">
                <Suspense fallback={<div>Chargement...</div>}>
                    <ReturnContent />
                </Suspense>
            </main>
            <Footer />
        </>
    );
}
