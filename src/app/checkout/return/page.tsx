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
    const MAX_RETRIES = 10; // Poll for 20 seconds (10 retries * 2s interval)

    useEffect(() => {
        const paymentIntentId = searchParams.get('payment_intent');
        const redirectStatus = searchParams.get('redirect_status');

        if (!paymentIntentId) {
            console.error("Missing payment_intent from URL");
            toast({ variant: 'destructive', title: 'Erreur', description: 'URL de retour invalide.' });
            setStatus('error');
            return;
        }

        if (redirectStatus === 'failed') {
            toast({ variant: 'destructive', title: 'Paiement Échoué', description: 'La transaction n\'a pas pu être complétée.' });
            setStatus('error');
            return;
        }
    }, [searchParams, toast]);

    useEffect(() => {
        const paymentIntentId = searchParams.get('payment_intent');
        if (status !== 'processing' || retries >= MAX_RETRIES || !paymentIntentId) {
            if (retries >= MAX_RETRIES) {
                setStatus('error');
                toast({ 
                    variant: 'destructive', 
                    title: 'Timeout de Vérification', 
                    description: 'La vérification de votre paiement a pris trop de temps. Veuillez vérifier votre profil ou contacter le support.' 
                });
            }
            return;
        }

        const pollSubscriptionStatus = async () => {
            try {
                const response = await fetch(`/api/subscription-status?payment_intent=${paymentIntentId}`);
                if (!response.ok) {
                    // Don't stop polling on server error, just retry
                    throw new Error(`Server responded with ${response.status}`);
                }
                
                const data = await response.json();

                if (data.status === 'complete') {
                    setStatus('success');
                    toast({
                        title: "Paiement réussi!",
                        description: "Votre abonnement est actif. Vous serez redirigé.",
                        variant: "default"
                    });
                    setTimeout(() => router.push('/profile/subscription'), 3000);
                } else {
                    // If not complete, schedule the next poll
                    setRetries(prev => prev + 1);
                }
            } catch (error: any) {
                console.error("Polling error:", error.message);
                // Let it retry, but don't stop the polling on a network error
                 setRetries(prev => prev + 1);
            }
        };
        
        const timer = setTimeout(pollSubscriptionStatus, 2000);
        return () => clearTimeout(timer);

    }, [status, retries, searchParams, router, toast]);

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
