'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

function ReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentType = searchParams.get('type');
    const redirectStatus = searchParams.get('redirect_status');

    useEffect(() => {
        let redirectUrl = '/profile';
        if (paymentType === 'appointment') {
            redirectUrl = '/profile/appointments';
        } else if (paymentType === 'subscription') {
            redirectUrl = '/profile/subscription';
        }

        const timer = setTimeout(() => {
            router.push(redirectUrl);
        }, 3000); // Redireciona após 3 segundos

        return () => clearTimeout(timer);
    }, [paymentType, router]);

    return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center bg-background p-4">
            <Card className="mx-auto w-full max-w-lg text-center">
                <CardHeader>
                     {redirectStatus === 'succeeded' ? (
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    ) : (
                        <Loader2 className="mx-auto h-16 w-16 text-muted-foreground animate-spin mb-4" />
                    )}
                    <CardTitle className="text-2xl">Paiement Réussi !</CardTitle>
                    <CardDescription>
                        Votre transaction a été traitée avec succès.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Vous allez être redirigé(e) dans quelques instants.
                    </p>
                    <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}


export default function CheckoutReturnPage() {
    return (
        <>
            <Header />
            <Suspense fallback={
                 <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            }>
                <ReturnContent />
            </Suspense>
            <Footer />
        </>
    );
}
