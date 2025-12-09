'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Check, CreditCard, Sparkles, Loader2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const PRESET_AMOUNTS = [50, 100, 150, 200];

function PaymentForm({ amount, metadata, onSuccess }: { amount: number, metadata: any, onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error: submitError } = await elements.submit();
        if (submitError) {
             toast({
                title: "Erreur",
                description: submitError.message,
                variant: "destructive"
            });
            setIsLoading(false);
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/return`,
            },
        });

        if (error) {
            toast({
                title: "Erreur de paiement",
                description: error.message,
                variant: "destructive"
            });
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            <Button type="submit" disabled={!stripe || isLoading} className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Payer {amount}€
            </Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Paiement sécurisé par SSL
            </p>
        </form>
    );
}

export default function GiftCardPurchaseView() {
    const [amount, setAmount] = useState<number>(100);
    const [customAmount, setCustomAmount] = useState<string>('');
    
    // User State
    const [userId, setUserId] = useState<string | null>(null);
    
    // Form State
    const [fromName, setFromName] = useState('');
    const [toName, setToName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [message, setMessage] = useState('');

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoadingSecret, setIsLoadingSecret] = useState(false);
    
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();

    // Check for user on mount
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Optional: Pre-fill email if empty
                if (!recipientEmail) {
                    // We don't overwrite user input, but could be useful logic later
                }
            }
        };
        checkUser();
    }, []);

    const handleAmountSelect = (val: number) => {
        setAmount(val);
        setCustomAmount('');
        setClientSecret(null); 
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomAmount(val);
        if (val && !isNaN(Number(val))) {
            setAmount(Number(val));
            setClientSecret(null);
        }
    };

    const handlePreparePayment = async () => {
        if (!fromName || !toName || !recipientEmail) {
            toast({
                title: "Information manquante",
                description: "Veuillez remplir tous les champs obligatoires (*).",
                variant: "destructive"
            });
            return;
        }

        setIsLoadingSecret(true);

        try {
            // We pass the detected userId explicitly in metadata as a backup
            // although the server should detect it from cookies too.
            const res = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    type: 'gift_card',
                    metadata: {
                        from_name: fromName,
                        to_name: toName,
                        recipient_email: recipientEmail,
                        message: message,
                        type: 'gift_card',
                        buyer_id: userId || '' // Explicitly send it if we have it
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to init payment');
            
            const data = await res.json();
            setClientSecret(data.clientSecret);

        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible d'initialiser le paiement.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingSecret(false);
        }
    };

    const handleBack = () => {
        setClientSecret(null);
    };

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                
                {/* Left Side: The "Card" Preview */}
                <div className="space-y-8 lg:sticky lg:top-24">
                    <div className="text-center lg:text-left space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Offrez du Bien-être
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Le cadeau parfait pour ceux que vous aimez. Valable sur tous nos services.
                        </p>
                    </div>

                    <div className="relative aspect-[1.586/1] w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.01] max-w-md mx-auto lg:mx-0">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-purple-600/90 p-8 flex flex-col justify-between text-white border border-white/10">
                            <div className="flex justify-between items-start">
                                <Gift className="h-10 w-10 opacity-90 drop-shadow-md" />
                                <span className="text-lg font-medium tracking-wider opacity-90 font-mono">GIFT CARD</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest opacity-75">Montant</p>
                                    <p className="text-5xl font-bold tracking-tight">€{amount}</p>
                                </div>
                                
                                {(toName || fromName) && (
                                    <div className="space-y-1 pt-2 animate-in fade-in slide-in-from-left-2 duration-500">
                                        {toName && (
                                            <p className="text-lg font-medium leading-none drop-shadow-sm">
                                                <span className="opacity-70 text-sm font-normal mr-2">Pour:</span>
                                                {toName}
                                            </p>
                                        )}
                                        {fromName && (
                                            <p className="text-base leading-none drop-shadow-sm">
                                                <span className="opacity-70 text-xs font-normal mr-2">De:</span>
                                                {fromName}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <div className="h-2 w-32 bg-white/30 rounded-full"></div>
                                    <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                                </div>
                                <Sparkles className="h-12 w-12 text-yellow-300 opacity-90 animate-pulse" />
                            </div>
                        </div>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground max-w-md mx-auto lg:mx-0">
                        {/* Features list ... */}
                         <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-1.5 rounded-full">
                                <Check className="h-4 w-4 text-primary" />
                            </div>
                             Valable 12 mois
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="bg-primary/10 p-1.5 rounded-full">
                                <Check className="h-4 w-4 text-primary" />
                            </div>
                            Utilisable en plusieurs fois
                        </div>
                    </div>
                </div>

                {/* Right Side: The Form */}
                <Card className="shadow-xl border-muted/60 overflow-hidden relative transition-all duration-300">
                    <CardHeader className="bg-muted/10 pb-8">
                         <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl">
                                {clientSecret ? 'Paiement sécurisé' : 'Personnaliser votre cadeau'}
                            </CardTitle>
                            {clientSecret && (
                                <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                </Button>
                            )}
                        </div>
                        <CardDescription>
                            {clientSecret 
                                ? 'Finalisez votre commande pour recevoir le code cadeau.' 
                                : 'Choisissez le montant et ajoutez un message personnel.'
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-6">
                        
                        {/* STEP 1: Details Form */}
                        {!clientSecret && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                {/* Amount Selection */}
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Montant du cadeau</Label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {PRESET_AMOUNTS.map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => handleAmountSelect(val)}
                                                className={cn(
                                                    "flex items-center justify-center py-3 px-2 rounded-lg border font-medium transition-all text-sm sm:text-base",
                                                    amount === val && !customAmount
                                                        ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                                                        : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                {val}€
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative mt-2">
                                        <span className="absolute left-3 top-3 text-muted-foreground">€</span>
                                        <Input 
                                            type="number" 
                                            placeholder="Autre montant..." 
                                            className="pl-8 h-11" 
                                            value={customAmount}
                                            onChange={handleCustomAmountChange}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Recipient Details */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="from">De la part de <span className="text-red-500">*</span></Label>
                                            <Input 
                                                id="from" 
                                                placeholder="Votre nom" 
                                                value={fromName}
                                                onChange={(e) => setFromName(e.target.value)}
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="to">Pour <span className="text-red-500">*</span></Label>
                                            <Input 
                                                id="to" 
                                                placeholder="Nom du destinataire" 
                                                value={toName}
                                                onChange={(e) => setToName(e.target.value)}
                                                className="h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email du destinataire <span className="text-red-500">*</span></Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            placeholder="pierre@example.com" 
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            className="h-10"
                                        />
                                        <p className="text-xs text-muted-foreground">Nous enverrons le code cadeau à cette adresse après le paiement.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message personnel (Optionnel)</Label>
                                        <Textarea 
                                            id="message" 
                                            placeholder="Joyeux anniversaire ! Profite bien de ce moment..." 
                                            rows={3} 
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Payment Area */}
                        {clientSecret && stripePromise && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="bg-primary/5 p-4 rounded-lg mb-6 border border-primary/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Montant à payer</p>
                                        <p className="text-2xl font-bold text-primary">{amount}€</p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-medium">{toName}</p>
                                        <p className="text-muted-foreground">{recipientEmail}</p>
                                    </div>
                                </div>
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <PaymentForm amount={amount} metadata={{}} onSuccess={() => {}} />
                                </Elements>
                            </div>
                        )}

                    </CardContent>
                    
                    {!clientSecret && (
                        <CardFooter className="flex flex-col gap-4 bg-muted/20 p-8 border-t">
                            <div className="flex items-center justify-between w-full text-xl font-bold">
                                <span>Total à payer</span>
                                <span>{amount}€</span>
                            </div>
                            <Button 
                                className="w-full h-12 text-lg gap-2 shadow-lg hover:shadow-xl transition-all" 
                                size="lg"
                                onClick={handlePreparePayment}
                                disabled={isLoadingSecret}
                            >
                                {isLoadingSecret ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <CreditCard className="h-5 w-5" /> 
                                )}
                                Procéder au paiement
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}