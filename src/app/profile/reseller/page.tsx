'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, Store, PlusCircle, DollarSign, CreditCard, Calendar as CalendarIcon, Copy, CheckCircle2,
    Users, TrendingUp, Calendar, Clock, Search, ArrowRight, Eye, EyeOff 
} from 'lucide-react';
import { createResellerGiftCard, getResellerStats } from '@/app/actions/reseller';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GiftCardData {
    id: string;
    code: string;
    initial_balance: number;
    current_balance: number;
    status: string;
    created_at: string;
}

export default function ResellerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<GiftCardData[]>([]);
    const [stats, setStats] = useState({ totalSold: 0, totalCards: 0, commissionRate: 10 });
    const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});
    
    // State para geração
    const [amount, setAmount] = useState<string>('50');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const loadData = async () => {
        try {
            const data = await getResellerStats();
            setCards(data.cards);
            setStats(data.stats);
        } catch (error: any) {
            console.error(error);
            // Se falhar autenticação, redirecionar para login
            if (error.message?.includes('Non autorisé')) {
                toast({ 
                    variant: "destructive", 
                    title: "Session expirée", 
                    description: "Veuillez vous reconnecter." 
                });
                router.push('/login');
                return;
            }
            toast({ 
                variant: "destructive", 
                title: "Erreur", 
                description: "Impossible de charger les données." 
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copié", description: "Code copié dans le presse-papier." });
    };

    const toggleCodeVisibility = (id: string) => {
        setVisibleCodes(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleGenerate = async () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) {
            toast({ variant: "destructive", title: "Erreur", description: "Montant invalide" });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await createResellerGiftCard(val);
            setGeneratedCode(result.code);
            toast({ title: "Succès", description: "Carte générée avec succès !" });
            loadData(); // Recarregar lista e stats
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de générer la carte." });
        } finally {
            setIsGenerating(false);
        }
    };

    const resetDialog = () => {
        setIsDialogOpen(false);
        setTimeout(() => {
            setGeneratedCode(null);
            setAmount('50');
        }, 300);
    };

    const copyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            toast({ title: "Copié !" });
        }
    };

    // Prepare chart data (Sales per day, last 7 entries for simplicity or aggregate)
    const chartData = cards.slice(0, 20).reverse().map(c => ({
        date: format(new Date(c.created_at), 'dd/MM'),
        amount: c.initial_balance
    }));

    if (loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-900/50 py-10">
                <div className="container mx-auto max-w-6xl px-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={() => router.push('/profile')} className="-ml-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au profil
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Store className="h-4 w-4" /> Console Revendeur
                        </div>
                    </div>

                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Ventes Directes</h1>
                            <p className="text-muted-foreground">Générez des codes cadeaux instantanés pour vos clients.</p>
                        </div>
                        
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Nouvelle Vente
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{generatedCode ? 'Carte Générée !' : 'Créer une Carte Cadeau'}</DialogTitle>
                                    <DialogDescription>
                                        {generatedCode 
                                            ? "Donnez ce code au client. Il est actif immédiatement." 
                                            : "Entrez le montant reçu du client. Aucun paiement en ligne ne sera requis."}
                                    </DialogDescription>
                                </DialogHeader>

                                {generatedCode ? (
                                    <div className="py-6 flex flex-col items-center space-y-4">
                                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-full text-center border-2 border-dashed border-emerald-500/50">
                                            <span className="text-sm text-muted-foreground uppercase tracking-wider mb-2 block">Code Carte Cadeau</span>
                                            <div className="text-3xl font-mono font-bold tracking-widest select-all text-emerald-600 dark:text-emerald-400">
                                                {generatedCode}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button onClick={copyCode} className="flex-1" variant="outline">
                                                <Copy className="mr-2 h-4 w-4" /> Copier
                                            </Button>
                                            <Button onClick={resetDialog} className="flex-1">
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Terminer
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Montant (€)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    value={amount} 
                                                    onChange={(e) => setAmount(e.target.value)} 
                                                    className="pl-10 text-lg" 
                                                    placeholder="50"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[20, 50, 100].map((v) => (
                                                <Button 
                                                    key={v} 
                                                    variant="outline" 
                                                    onClick={() => setAmount(v.toString())}
                                                    className={amount === v.toString() ? 'border-primary bg-primary/5' : ''}
                                                >
                                                    {v}€
                                                </Button>
                                            ))}
                                        </div>
                                        <DialogFooter className="mt-4">
                                            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                                {isGenerating ? 'Création...' : 'Confirmer la Vente'}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Ventes</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalSold}€</div>
                                <p className="text-xs text-muted-foreground">Volume total généré</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cartes Émises</CardTitle>
                                <CreditCard className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalCards}</div>
                                <p className="text-xs text-muted-foreground">Nombre de transactions</p>
                            </CardContent>
                        </Card>
                         <Card className="col-span-1 lg:col-span-1 border-dashed bg-slate-50 dark:bg-slate-900/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Commissions (Est.)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-muted-foreground">
                                    {((stats.totalSold * stats.commissionRate) / 100).toFixed(2)}€
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Basé sur {stats.commissionRate}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart & History */}
                    <div className="grid gap-6 md:grid-cols-7">
                        {/* Chart */}
                        <Card className="md:col-span-4">
                            <CardHeader>
                                <CardTitle>Aperçu des Ventes</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis 
                                                    dataKey="date" 
                                                    stroke="#888888" 
                                                    fontSize={12} 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                />
                                                <YAxis 
                                                    stroke="#888888" 
                                                    fontSize={12} 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    tickFormatter={(value) => `${value}€`} 
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                            Pas assez de données pour le graphique
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent List */}
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Historique Récent</CardTitle>
                                <CardDescription>Les 10 dernières cartes générées.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Montant</TableHead>
                                            <TableHead>Solde</TableHead>
                                            <TableHead>Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cards.slice(0, 10).map((card) => (
                                            <TableRow key={card.id}>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(card.created_at), 'dd MMM', { locale: fr })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                                                            {visibleCodes[card.id] ? card.code : '••••••••••••'}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => toggleCodeVisibility(card.id)}
                                                        >
                                                            {visibleCodes[card.id] ? (
                                                                <EyeOff className="h-3 w-3" />
                                                            ) : (
                                                                <Eye className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => copyToClipboard(card.code)}
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{card.initial_balance}€</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">{card.current_balance}€</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={card.status === 'active' ? 'success' : 'outline'}>
                                                        {card.status === 'active' ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {cards.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                    Aucune vente
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}