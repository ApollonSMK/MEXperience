'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Plus, Search, User as UserIcon, Trash2, RefreshCw, Layers, Printer, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminClientSelector } from '@/components/admin-client-selector';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  recipient_id?: string;
  created_at: string;
  recipient?: {
    display_name: string;
    email: string;
  };
}

export default function GiftCardsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  // State pour création
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creationTab, setCreationTab] = useState('single');
  
  // Single Creation
  const [amount, setAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Bulk Creation
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('5');
  const [bulkPrefix, setBulkPrefix] = useState('GIFT');

  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // Stats
  const stats = {
    totalActiveValue: giftCards.filter(c => c.status === 'active').reduce((acc, curr) => acc + curr.current_balance, 0),
    totalCards: giftCards.length,
    activeCount: giftCards.filter(c => c.status === 'active').length,
    redeemedValue: giftCards.reduce((acc, curr) => acc + (curr.initial_balance - curr.current_balance), 0)
  };

  const fetchGiftCards = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*, recipient:profiles(display_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      setGiftCards(data as any[]);
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*');
    const { data: plansData } = await supabase.from('plans').select('*');
    setUsers(usersData || []);
    setPlans(plansData || []);
  };

  useEffect(() => {
    fetchGiftCards();
    fetchUsers();
  }, []);

  const generateRandomCode = (prefix = '') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix ? `${prefix}-${result}` : result;
  };

  useEffect(() => {
    if (isCreateOpen && !generatedCode && creationTab === 'single') {
        setGeneratedCode(generateRandomCode());
    }
  }, [isCreateOpen, creationTab]);

  const handleCreateSingle = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
        toast({ variant: 'destructive', title: 'Montant invalide' });
        return;
    }

    const newCard = {
        code: generatedCode,
        initial_balance: parseFloat(amount),
        current_balance: parseFloat(amount),
        recipient_id: selectedUser?.id || null,
        status: 'active'
    };

    const { error } = await supabase.from('gift_cards').insert(newCard);

    if (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
        toast({ title: 'Succès', description: 'Chèque cadeau créé avec succès.' });
        resetForm();
    }
  };

  const handleCreateBulk = async () => {
    const qty = parseInt(bulkQuantity);
    const val = parseFloat(bulkAmount);

    if (isNaN(qty) || qty < 1 || isNaN(val)) {
        toast({ variant: 'destructive', title: 'Données invalides' });
        return;
    }

    const cards = [];
    for(let i = 0; i < qty; i++) {
        cards.push({
            code: generateRandomCode(bulkPrefix),
            initial_balance: val,
            current_balance: val,
            status: 'active'
        });
    }

    const { error } = await supabase.from('gift_cards').insert(cards);
    
    if (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
        toast({ title: 'Succès', description: `${qty} chèques cadeaux générés.` });
        resetForm();
    }
  };

  const resetForm = () => {
    setIsCreateOpen(false);
    setAmount('');
    setBulkAmount('');
    setSelectedUser(null);
    setGeneratedCode('');
    fetchGiftCards();
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Êtes-vous sûr de vouloir supprimer ce chèque cadeau ?")) return;
      const { error } = await supabase.from('gift_cards').delete().eq('id', id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      } else {
        setGiftCards(prev => prev.filter(c => c.id !== id));
        toast({ title: 'Supprimé', description: 'Le chèque cadeau a été supprimé.' });
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié', description: 'Code copié dans le presse-papier.' });
  };

  const filteredCards = giftCards.filter(card => {
    const matchesSearch = 
        card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.recipient?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.recipient?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && card.status === 'active' && card.current_balance > 0;
    if (activeTab === 'used') return matchesSearch && (card.status === 'used' || card.current_balance === 0);
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8 p-1">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestion Cartes Cadeaux</h1>
            <p className="text-muted-foreground mt-1">Gérez les codes promotionnels et les chèques cadeaux de vos clients.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all"><Plus className="mr-2 h-5 w-5" /> Nouveau Chèque</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Générer des Chèques Cadeaux</DialogTitle>
                    <DialogDescription>Choisissez le mode de génération ci-dessous.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="single" value={creationTab} onValueChange={setCreationTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="single">Unititaire</TabsTrigger>
                        <TabsTrigger value="bulk">En Masse</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="single" className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed flex flex-col items-center justify-center mb-4">
                            <span className="text-xs font-semibold text-muted-foreground uppercase mb-1">Aperçu du Code</span>
                            <div className="text-2xl font-mono font-bold tracking-wider text-primary">{generatedCode || '----'}</div>
                        </div>

                        <div className="grid gap-3">
                            <Label>Code Personnalisé (Optionnel)</Label>
                            <div className="flex gap-2">
                                <Input value={generatedCode} onChange={(e) => setGeneratedCode(e.target.value.toUpperCase())} />
                                <Button variant="outline" size="icon" onClick={() => setGeneratedCode(generateRandomCode())}><RefreshCw className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label>Montant (€)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                                <Input type="number" className="pl-8" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label>Attribuer à un client (Optionnel)</Label>
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-accent/20">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-background">
                                            <AvatarImage src={selectedUser.photo_url} />
                                            <AvatarFallback><UserIcon className="h-4 w-4"/></AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-medium text-foreground">{selectedUser.display_name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            ) : (
                                <Button variant="outline" className="justify-start text-muted-foreground" onClick={() => setIsClientSelectorOpen(true)}>
                                    <UserIcon className="mr-2 h-4 w-4" /> Rechercher un client...
                                </Button>
                            )}
                        </div>
                        <Button className="w-full mt-4" onClick={handleCreateSingle}>Créer le chèque</Button>
                    </TabsContent>

                    <TabsContent value="bulk" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Quantité</Label>
                                <Input type="number" value={bulkQuantity} onChange={(e) => setBulkQuantity(e.target.value)} min="1" max="100" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Montant par carte (€)</Label>
                                <Input type="number" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} placeholder="50" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Préfixe du Code</Label>
                            <Input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())} placeholder="EX: NOEL24" />
                            <p className="text-xs text-muted-foreground">Exemple généré: {bulkPrefix}-X7Z9A2</p>
                        </div>
                        <Button className="w-full mt-4" onClick={handleCreateBulk}>
                            <Layers className="mr-2 h-4 w-4" /> Générer {bulkQuantity} codes
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Active Totale</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalActiveValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Montant disponible pour les clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartes Actives</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sur {stats.totalCards} cartes générées au total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Utilisé</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.redeemedValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Revenu déjà généré par les cartes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b">
                <TabsList>
                    <TabsTrigger value="active" className="gap-2"><CheckCircle2 className="h-3.5 w-3.5"/> Actifs</TabsTrigger>
                    <TabsTrigger value="used" className="gap-2"><Layers className="h-3.5 w-3.5"/> Historique</TabsTrigger>
                    <TabsTrigger value="all">Tout</TabsTrigger>
                </TabsList>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full sm:w-[250px]"
                    />
                </div>
            </div>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px]">Code</TableHead>
                            <TableHead className="w-[180px]">Solde / Initial</TableHead>
                            <TableHead>Utilisation</TableHead>
                            <TableHead>Propriétaire</TableHead>
                            <TableHead>Date Création</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Gift className="h-8 w-8 text-muted-foreground/30" />
                                        <p>Aucun chèque cadeau trouvé.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCards.map((card) => {
                                const percentUsed = ((card.initial_balance - card.current_balance) / card.initial_balance) * 100;
                                
                                return (
                                <TableRow key={card.id} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="font-mono font-bold bg-muted px-2 py-1 rounded text-foreground tracking-wide text-xs border">
                                                {card.code}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(card.code)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base">€{card.current_balance}</span>
                                            <span className="text-xs text-muted-foreground">sur €{card.initial_balance}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{percentUsed.toFixed(0)}% utilisé</span>
                                            </div>
                                            <Progress value={percentUsed} className="h-2" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {card.recipient ? (
                                            <div className="flex items-center gap-2">
                                                 <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                        {card.recipient.display_name.substring(0,2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium leading-none">{card.recipient.display_name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{card.recipient.email}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">Non assigné</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(card.created_at), 'dd MMM yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleDelete(card.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Tabs>
      </Card>

      <Sheet open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
        <SheetContent className="w-full sm:max-w-[600px] p-0" side="right">
            <SheetHeader className="sr-only">
                <SheetTitle>Sélectionner un client</SheetTitle>
            </SheetHeader>
             <AdminClientSelector 
                users={users} 
                plans={plans} 
                onSelect={(u) => { setSelectedUser(u); setIsClientSelectorOpen(false); }} 
                onClose={() => setIsClientSelectorOpen(false)}
             />
        </SheetContent>
      </Sheet>
    </div>
  );
}