'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Plus, Search, User as UserIcon, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminClientSelector } from '@/components/admin-client-selector';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  
  // State pour création
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  // Users cache pour le sélecteur
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

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

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CADEAU-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(result);
  };

  useEffect(() => {
    if (isCreateOpen && !generatedCode) {
        generateRandomCode();
    }
  }, [isCreateOpen]);

  const handleCreate = async () => {
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
        toast({ variant: 'destructive', title: 'Erreur création', description: error.message });
    } else {
        toast({ title: 'Succès', description: 'Chèque cadeau créé avec succès.' });
        setIsCreateOpen(false);
        setAmount('');
        setSelectedUser(null);
        setGeneratedCode('');
        fetchGiftCards();
    }
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

  const filteredCards = giftCards.filter(card => 
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.recipient?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.recipient?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Chèques Cadeaux</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Créer un Chèque</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nouveau Chèque Cadeau</DialogTitle>
                    <DialogDescription>Créez un code pour un client ou pour imprimer.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Code</Label>
                        <div className="flex gap-2">
                            <Input value={generatedCode} onChange={(e) => setGeneratedCode(e.target.value.toUpperCase())} />
                            <Button variant="outline" size="icon" onClick={generateRandomCode}><RefreshCw className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Montant (€)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Destinataire (Optionnel)</Label>
                        {selectedUser ? (
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={selectedUser.photo_url} />
                                        <AvatarFallback><UserIcon className="h-4 w-4"/></AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm">
                                        <p className="font-medium">{selectedUser.display_name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ) : (
                            <Button variant="outline" className="justify-start" onClick={() => setIsClientSelectorOpen(true)}>
                                <UserIcon className="mr-2 h-4 w-4" /> Sélectionner un client
                            </Button>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate}>Créer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher par code ou client..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Montant Initial</TableHead>
                        <TableHead>Solde Actuel</TableHead>
                        <TableHead>Destinataire</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredCards.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Aucun chèque cadeau trouvé.</TableCell>
                        </TableRow>
                    ) : (
                        filteredCards.map((card) => (
                            <TableRow key={card.id}>
                                <TableCell className="font-mono font-medium flex items-center gap-2">
                                    {card.code}
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(card.code)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                                <TableCell>€{card.initial_balance}</TableCell>
                                <TableCell>
                                    <span className={card.current_balance === 0 ? "text-muted-foreground" : "font-bold text-green-600"}>
                                        €{card.current_balance}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {card.recipient ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{card.recipient.display_name}</span>
                                            <span className="text-xs text-muted-foreground">{card.recipient.email}</span>
                                        </div>
                                    ) : (
                                        <Badge variant="outline">Non assigné</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                        {card.status === 'active' ? 'Actif' : card.status === 'used' ? 'Utilisé' : 'Annulé'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(card.created_at), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(card.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
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