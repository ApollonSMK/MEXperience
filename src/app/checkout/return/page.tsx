
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

function ReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');
    const [message, setMessage] = useState('Vérification de votre paiement...');

    useEffect(() => {
        const sessionId = searchParams.get('session_id');

        // Handle new one-time payment flow
        if (sessionId) {
            // We don't need to check the session status on the client.
            // The webhook will handle creating the appointment.
            // We just assume success and redirect.
            setStatus('success');
            setMessage('Votre paiement a été reçu. Nous créons votre rendez-vous...');
            toast({
                title: "Paiement reçu!",
                description: "Votre rendez-vous est en cours de confirmation. Vous serez redirigé(e) dans quelques instants.",
                duration: 5000,
            });

            setTimeout(() => {
                router.push('/profile/appointments');
            }, 5000);
            return;
        }
        
        // Handle subscription redirect flow
        const redirectStatus = searchParams.get('redirect_status');
        if (redirectStatus) {
             if (redirectStatus === 'succeeded') {
                setStatus('success');
                setMessage('Votre paiement a été reçu. Nous activons votre abonnement...');
                toast({
                    title: "Paiement reçu!",
                    description: "Votre abonnement est en cours de traitement. Vous serez redirigé(e) dans quelques instants.",
                    duration: 5000,
                });

                setTimeout(() => {
                    router.push('/profile/subscription');
                }, 5000);

            } else {
                 setStatus('error');
                 setMessage('La transaction n\'a pas pu être complétée ou a été annulée.');
                 toast({ variant: 'destructive', title: 'Paiement Échoué', description: 'La transaction n\'a pas pu être complétée.' });
            }
            return;
        }

        // If neither parameter is present
        setStatus('error');
        setMessage('Paramètres de redirection invalides.');

    }, [searchParams, router, toast]);

    if (status === 'error') {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
                    <CardTitle className="text-2xl">Paiement Échoué</CardTitle>
                    <CardDescription>
                        {message}
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

    // status === 'success' or 'processing'
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
                <CardTitle className="text-2xl">Traitement en cours...</CardTitle>
                <CardDescription>
                    {message}
                </CardDescription>
            </CardHeader>
             <CardContent className="flex flex-col items-center">
                 <p className="text-sm text-center text-muted-foreground">Vous serez redirigé(e) vers votre profil sous peu.</p>
                <Button asChild className="mt-6" variant="outline">
                    <Link href="/profile">Aller au Profil Maintenant</Link>
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
