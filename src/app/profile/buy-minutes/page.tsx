'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ResponsiveDialog } from '@/components/responsive-dialog';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface MinutePack {
    id: string;
    name: string;
    minutes: number;
    price: number;
    popular?: boolean;
    display_order?: number;
}

function MinutePackPaymentForm({ 
    clientSecret, 
    pack, 
    onSuccess 
}: { 
    clientSecret: string, 
    pack: MinutePack, 
    onSuccess: () => void 
}) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);
        setErrorMessage(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message || "Erreur de soumission.");
            setIsLoading(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/profile/buy-minutes`, 
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message || "Erreur de paiement.");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            try {
                // Confirm server-side logic
                const response = await fetch('/api/stripe/confirm-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payment_intent_id: paymentIntent.id }),
                });

                if (!response.ok) throw new Error('Erreur de confirmation serveur.');

                onSuccess();
            } catch (err) {
                console.error(err);
                setErrorMessage("Paiement réussi mais erreur de mise à jour du solde. Contactez le support.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <PaymentElement />
            {errorMessage && <div className="text-destructive text-sm font-medium">{errorMessage}</div>}
            <Button disabled={isLoading || !stripe || !elements} className="w-full" size="lg">
                {isLoading ? <Loader2 className="animate-spin" /> : `Payer €${pack.price}`}
            </Button>
        </form>
    );
}

export default function BuyMinutesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    
    const [packs, setPacks] = useState<MinutePack[]>([]);
    const [loadingPacks, setLoadingPacks] = useState(true);

    const [selectedPack, setSelectedPack] = useState<MinutePack | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login?redirect=/profile/buy-minutes');
                return;
            }
            setUser(user);
            setLoadingUser(false);
        };

        const fetchPacks = async () => {
            const { data, error } = await supabase
                .from('minute_packs')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (!error && data) {
                setPacks(data);
            }
            setLoadingPacks(false);
        };

        checkUser();
        fetchPacks();
    }, [supabase, router]);

    const handleSelectPack = async (pack: MinutePack) => {
        if (!user) return;
        setIsProcessing(true);
        setSelectedPack(pack);

        try {
            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'minute_pack',
                    price: pack.price,
                    packName: pack.name,
                    minutesAmount: pack.minutes,
                    userId: user.id,
                    userEmail: user.email
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setClientSecret(data.clientSecret);
            setIsPaymentModalOpen(true);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSuccess = () => {
        setIsPaymentModalOpen(false);
        toast({
            title: "Félicitations !",
            description: `Vous avez acheté ${selectedPack?.minutes} minutes avec succès.`,
        });
        setTimeout(() => {
            router.push('/profile'); // Redirect back to profile to see new balance
        }, 1500);
    };

    if (loadingUser) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;
    }

    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col bg-background py-8">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex items-center mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                             <h1 className="text-3xl font-bold tracking-tight">Recharger mes minutes</h1>
                             <p className="text-muted-foreground">Achetez des packs de minutes supplémentaires sans abonnement.</p>
                        </div>
                    </div>

                    {loadingPacks ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                        </div>
                    ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {packs.map(pack => (
                            <Card key={pack.id} className={`flex flex-col relative transition-all hover:shadow-lg ${pack.popular ? 'border-primary shadow-md scale-105' : ''}`}>
                                {pack.popular && (
                                    <div className="absolute top-0 right-0 -mt-3 -mr-3">
                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                            <Zap className="h-3 w-3" /> Populaire
                                        </span>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-xl">{pack.name}</CardTitle>
                                    <CardDescription>Valable sur tous les services</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 text-center space-y-4">
                                    <div className="text-4xl font-extrabold text-primary">
                                        {pack.minutes} <span className="text-xl font-normal text-muted-foreground">min</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        €{pack.price}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Soit {(pack.price / pack.minutes).toFixed(2)}€ / minute
                                    </div>
                                    <ul className="text-sm space-y-2 text-left mt-4 pl-4">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500"/> Validité illimitée</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500"/> Utilisable immédiatement</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        className="w-full" 
                                        onClick={() => handleSelectPack(pack)}
                                        variant={pack.popular ? 'default' : 'outline'}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing && selectedPack?.id === pack.id ? (
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        ) : (
                                            "Acheter"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    )}
                </div>
            </main>
            <Footer />

            <ResponsiveDialog
                isOpen={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                title={`Payer ${selectedPack?.name}`}
                description="Entrez vos coordonnées bancaires pour valider l'achat."
            >
                {clientSecret && selectedPack && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <MinutePackPaymentForm 
                            clientSecret={clientSecret} 
                            pack={selectedPack} 
                            onSuccess={handleSuccess} 
                        />
                    </Elements>
                )}
            </ResponsiveDialog>
        </>
    );
}