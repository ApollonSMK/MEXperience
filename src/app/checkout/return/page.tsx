'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

function ReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');
    const [retries, setRetries] = useState(0);

    useEffect(() => {
        const clientSecret = searchParams.get('payment_intent_client_secret');
        const redirectStatus = searchParams.get('redirect_status');

        if (!clientSecret || !redirectStatus) {
            console.error("Missing payment_intent_client_secret or redirect_status from URL");
            toast({ variant: 'destructive', title: 'Erreur', description: 'URL de retour invalide.' });
            setStatus('error');
            return;
        }

        if (redirectStatus === 'failed') {
            setStatus('error');
            return;
        }

        const pollSubscriptionStatus = async () => {
            try {
                const response = await fetch(`/api/subscription-status?payment_intent_secret=${clientSecret}`);
                const data = await response.json();

                if (response.ok) {
                    if (data.status === 'complete') {
                        setStatus('success');
                        setTimeout(() => router.push('/profile/subscription'), 3000);
                        return; // Stop polling
                    }
                } else {
                    // If the API returns an error, something went wrong
                    throw new Error(data.error || "Erreur de serveur");
                }

            } catch (error: any) {
                console.error("Polling error:", error);
            }

            // If not complete, schedule the next poll
            setRetries(prev => prev + 1);
        };

        const intervalId = setInterval(pollSubscriptionStatus, 2000);

        // Stop polling after 10 attempts (20 seconds) to avoid infinite loops
        if (retries > 10) {
            clearInterval(intervalId);
            setStatus('error');
            toast({ variant: 'destructive', title: 'Timeout', description: 'La vérification de votre paiement a pris trop de temps. Veuillez contacter le support.' });
        }
        
        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);

    }, [searchParams, router, retries, toast]);

    if (status === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <h1 className="text-2xl font-bold">Vérification de votre paiement...</h1>
                <p className="text-muted-foreground">Veuillez ne pas rafraîchir cette page. Cela peut prendre un moment.</p>
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
                        Il y a eu un problème avec votre paiement ou sa vérification. Aucune charge n'a été effectuée.
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

    // status === 'success'
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
