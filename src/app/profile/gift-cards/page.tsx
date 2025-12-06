'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Calendar, User, RefreshCw, ArrowLeft, Send, Sparkles, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftCard {
    id: string;
    code: string;
    current_balance: number;
    initial_balance: number;
    status: string;
    created_at: string;
    buyer_id: string;
    metadata: {
        to_name: string;
        from_name: string;
        recipient_email: string;
        message?: string;
    };
}

export default function MyGiftCardsPage() {
    const router = useRouter();
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = getSupabaseBrowserClient();
    const { toast } = useToast();

    const fetchCards = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setCurrentUserId(user.id);

        const { data, error } = await supabase
            .from('gift_cards')
            .select('*')
            .or(`buyer_id.eq.${user.id},metadata->>recipient_email.eq.${user.email}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cards:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger vos cartes cadeaux.",
                variant: "destructive"
            });
        } else {
            setCards(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCards();
    }, [supabase]);

    const { receivedCards, purchasedCards } = useMemo(() => {
        if (!currentUserId) return { receivedCards: [], purchasedCards: [] };
        
        // A card is "received" if the current user is NOT the buyer (meaning they are the recipient by email)
        // OR if they bought it for themselves (buyer_id == user_id AND recipient email matches user email)
        // BUT logic simplifies: 
        // Purchased = I bought it (buyer_id == me)
        // Received = I am the recipient (email == me) AND I didn't buy it necessarily (or I did).
        // Let's split by intent:
        // 'Achats' (Sent) -> Buyer ID is me.
        // 'Reçus' (Received) -> Recipient Email is me.
        
        // Note: A card can be in both if I bought it for myself.
        const purchased = cards.filter(c => c.buyer_id === currentUserId);
        
        // We need the user email to filter received properly, but we don't have it in state easily besides auth check.
        // For now, let's assume if it's not purchased by me, it's received.
        // If purchased by me, it goes to purchased.
        
        // Better logic based on typical user mental model:
        // "My Wallet" -> Cards I can SPEND. (Email matches mine OR I bought for myself? Usually email matches).
        // "Sent History" -> Cards I bought for OTHERS.
        
        // Since we can't easily check email without another call, let's stick to simple:
        // Purchased = All cards I bought.
        // Received = All cards where I'm not the buyer (gifted to me).
        
        const purchasedList = cards.filter(c => c.buyer_id === currentUserId);
        const receivedList = cards.filter(c => c.buyer_id !== currentUserId);

        return { receivedCards: receivedList, purchasedCards: purchasedList };
    }, [cards, currentUserId]);


    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({
            title: "Code copié !",
            description: "Le code a été copié dans le presse-papier.",
        });
    };

    const GiftCardItem = ({ card, type }: { card: GiftCard, type: 'received' | 'purchased' }) => {
        const isFullyUsed = card.current_balance === 0;
        
        return (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className={`relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${isFullyUsed ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                    {/* Visual Header */}
                    <div className={`h-24 relative p-6 flex justify-between items-start ${type === 'received' ? 'bg-gradient-to-br from-primary/80 to-primary text-primary-foreground' : 'bg-slate-100 dark:bg-slate-800'}`}>
                         <div className="z-10">
                            <span className="font-bold text-2xl tracking-tight block">
                                {card.current_balance}€
                            </span>
                             {card.current_balance !== card.initial_balance && (
                                <span className="text-xs opacity-80 line-through">
                                    Initial: {card.initial_balance}€
                                </span>
                            )}
                         </div>
                         <Gift className={`h-8 w-8 z-10 ${type === 'received' ? 'text-white/80' : 'text-slate-400'}`} />
                         
                         {/* Decorative Circles */}
                         <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                         <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-black/5 blur-xl pointer-events-none" />
                    </div>

                    <div className="p-5 pt-4">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Code</span>
                                <div className="font-mono text-lg font-bold tracking-wider flex items-center gap-2">
                                    {card.code}
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(card.code)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                             </div>
                             <Badge variant={card.status === 'active' && card.current_balance > 0 ? 'outline' : 'secondary'} className={card.status === 'active' && card.current_balance > 0 ? 'border-green-200 text-green-700 bg-green-50' : ''}>
                                {card.current_balance === 0 ? 'Épuisée' : (card.status === 'active' ? 'Active' : 'Inacive')}
                             </Badge>
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">De:</span>
                                <span className="font-medium">{card.metadata.from_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pour:</span>
                                <span className="font-medium">{card.metadata.to_name}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span>{format(new Date(card.created_at), 'd MMM yyyy', { locale: fr })}</span>
                            </div>
                        </div>

                         {type === 'purchased' && card.metadata.recipient_email && (
                            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Send className="h-3 w-3" /> Envoyé à {card.metadata.recipient_email}
                            </div>
                        )}
                        
                        {type === 'received' && !isFullyUsed && (
                             <Button className="w-full mt-4" onClick={() => router.push('/reserver')}>
                                Utiliser maintenant
                             </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const EmptyState = ({ type }: { type: 'received' | 'purchased' }) => (
         <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4">
                <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
                {type === 'received' ? 'Aucune carte reçue' : 'Aucun achat effectué'}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                {type === 'received' 
                    ? "Vous n'avez pas encore reçu de cartes cadeaux. Partagez votre souhait !" 
                    : "Vous n'avez pas encore offert de cartes cadeaux."}
            </p>
            {type === 'purchased' && (
                <Button onClick={() => router.push('/cadeaux')} size="lg" className="shadow-lg shadow-primary/20">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Offrir une carte
                </Button>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">Chargement...</p>
                 </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col bg-background pb-12">
                 <div className="w-full bg-slate-50 dark:bg-slate-900/50 border-b py-8 mb-8">
                    <div className="container mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                             <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 bg-background hover:bg-background/80">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Mes Cartes Cadeaux</h1>
                                <p className="text-sm text-muted-foreground">Gérez vos codes et offrez du bien-être.</p>
                            </div>
                        </div>
                         <Button onClick={() => router.push('/cadeaux')} size="lg" className="w-full sm:w-auto shadow-md">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Acheter une carte
                         </Button>
                    </div>
                </div>

                <div className="container mx-auto max-w-5xl px-4">
                     <Tabs defaultValue="purchased" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 h-12 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <TabsTrigger value="purchased" className="rounded-full data-[state=active]:shadow-sm">Mes Achats (Offerts)</TabsTrigger>
                            <TabsTrigger value="received" className="rounded-full data-[state=active]:shadow-sm">Reçues</TabsTrigger>
                        </TabsList>

                        <TabsContent value="purchased" className="mt-0 focus-visible:ring-0">
                             {purchasedCards.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {purchasedCards.map(card => (
                                        <GiftCardItem key={card.id} card={card} type="purchased" />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState type="purchased" />
                            )}
                        </TabsContent>

                        <TabsContent value="received" className="mt-0 focus-visible:ring-0">
                             {receivedCards.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {receivedCards.map(card => (
                                        <GiftCardItem key={card.id} card={card} type="received" />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState type="received" />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <Footer />
        </>
    );
}