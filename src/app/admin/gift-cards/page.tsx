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
import { processPOSSale } from '@/app/actions/pos';
import { createGiftCard } from '@/app/actions/gift-cards';
import { sendEmail as sendEmailService } from '@/lib/email-service'; // If available or remove if unused
import { Gift, Copy, Plus, Search, User as UserIcon, Trash2, RefreshCw, Layers, Printer, TrendingUp, Wallet, CheckCircle2, Send, Mail, CreditCard, Banknote, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminClientSelector } from '@/components/admin-client-selector';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  recipient_id?: string;
  type?: 'gift_card' | 'promo_code';
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
  
  // Novo estado para o tipo de visualização principal (Gift Card vs Promo Code)
  const [viewType, setViewType] = useState<'gift_card' | 'promo_code'>('gift_card');
  const [activeTab, setActiveTab] = useState('active'); // active, used, all
  
  // State pour création
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creationTab, setCreationTab] = useState('single');
  
  // Single Creation / POS
  const [amount, setAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('none'); // none (offert), cash, card, transfer
  const [sendEmail, setSendEmail] = useState(true);

  // Bulk Creation
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('5');
  const [bulkPrefix, setBulkPrefix] = useState('GIFT');
  
  // Influencer Creation (Promo Code)
  const [promoCodeName, setPromoCodeName] = useState('');
  const [promoType, setPromoType] = useState<'fixed' | 'percentage'>('fixed');
  const [maxUses, setMaxUses] = useState<string>(''); // NOVO ESTADO

  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

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
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
    // Quando abre o modal, reseta o tipo com base na aba que estava vendo
    if (isCreateOpen && viewType === 'promo_code') {
        setCreationTab('promo');
    }
  }, [isCreateOpen, creationTab, viewType]);

  const handleCreateGiftCard = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Montant invalide.' });
        return;
    }

    setIsCreating(true);
    
    // 1. Create Gift Card Record (Server Action)
    const result = await createGiftCard({
        amount: val,
        paymentMethod: paymentMethod as "cash" | "card" | "stripe_terminal",
        userId: selectedUser?.id,
        // If recipient email is different, you might want to pass it here or handle separately
    });

    if (!result.success) {
         toast({ variant: 'destructive', title: 'Erreur', description: result.error });
         setIsCreating(false);
         return;
    }

    // 2. Success Feedback
    if (result.giftCardId) {
         toast({ title: 'Succès', description: 'Chèque cadeau créé avec succès !' });
    }

    // 3. Send Email (Client side trigger is fine for now, or move to server)
    // Note: result from createGiftCard usually returns the created card object or ID in 'data' or similar field.
    // Let's assume result.data holds the card info based on typical patterns, or fetch it.
    // If the action returns { success: true, data: { id: ... } }, then result.data.id works.
    // If it returns invoiceId, we might need the card ID specifically for the email.
    
    if (sendEmail && selectedUser?.email && result.giftCardId) {
        await fetch('/api/emails/send-gift-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId: result.giftCardId })
        });
        toast({ title: 'Email envoyé', description: `Chèque cadeau envoyé à ${selectedUser.email}` });
    }

    setIsCreating(false);
    setIsCreateSheetOpen(false);
    setAmount('');
    setSelectedUser(null);
  };

  const handleCreateSingle = async (forceType?: 'gift_card' | 'promo_code') => {
    if (!amount || isNaN(parseFloat(amount))) {
        toast({ variant: 'destructive', title: 'Montant invalide' });
        return;
    }
    
    // Se for promo code, usamos o nome customizado
    const finalCode = forceType === 'promo_code' ? promoCodeName.toUpperCase() : generatedCode;
    
    if (forceType === 'promo_code') {
         if (!promoCodeName) {
            toast({ variant: 'destructive', title: 'Code requis', description: "Veuillez entrer un nom pour le code promo (ex: MARIE20)" });
            return;
         }
         // Validação de porcentagem
         if (promoType === 'percentage') {
             const val = parseFloat(amount);
             if (val <= 0 || val > 100) {
                 toast({ variant: 'destructive', title: 'Pourcentage invalide', description: "Le pourcentage doit être compris entre 1 et 100." });
                 return;
             }
         }
    }

    setIsProcessing(true);

    try {
        const val = parseFloat(amount);
        
        // USANDO createGiftCard (Action)
        const result = await createGiftCard({
            amount: val,
            paymentMethod: paymentMethod as 'cash' | 'card' | 'stripe_terminal' | 'none',
            userId: selectedUser?.id,
            code: finalCode,
            type: forceType || 'gift_card',
            metadata: { 
                discount_type: forceType === 'promo_code' ? promoType : 'fixed',
                max_uses: maxUses ? parseInt(maxUses) : null // Envia o limite
            }
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        toast({ title: 'Succès', description: 'Chèque cadeau créé.' });

        // 3. Send Email (Client side trigger is fine for now, or move to server)
        if (sendEmail && selectedUser?.email && result.giftCardId) {
            await fetch('/api/emails/send-gift-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: result.giftCardId })
            });
            toast({ title: 'Email envoyé', description: `Envoyé à ${selectedUser.email}` });
        }

        resetForm();

    } catch (error: any) {
        console.error(error);
        toast({ 
            variant: 'destructive', 
            title: 'Erreur', 
            description: error.message
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCreateBulk = async () => {
    const qty = parseInt(bulkQuantity);
    const val = parseFloat(bulkAmount);

    if (isNaN(qty) || qty < 1 || isNaN(val)) {
        toast({ variant: 'destructive', title: 'Données invalides' });
        return;
    }

    setIsProcessing(true);
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
    setIsProcessing(false);
  };

  const resetForm = () => {
    setIsCreateOpen(false);
    setAmount('');
    setBulkAmount('');
    setSelectedUser(null);
    setGeneratedCode('');
    setPromoCodeName('');
    setMaxUses(''); // Reset
    setPaymentMethod('none');
    setSendEmail(true);
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

  const handleSendEmail = async (card: GiftCard) => {
      if (!card.recipient?.email) {
          toast({ variant: 'destructive', title: 'Erreur', description: "Ce chèque n'est attribué à aucun utilisateur avec email." });
          return;
      }
      
      if(!confirm(`Envoyer le code ${card.code} par email à ${card.recipient.display_name} (${card.recipient.email}) ?`)) return;

      toast({ title: 'Envoi en cours...', description: 'Veuillez patienter.' });

      try {
          const response = await fetch('/api/emails/send-gift-card', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cardId: card.id })
          });

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || 'Erro desconhecido');
          }

          toast({ title: 'Envoyé !', description: 'L\'email a été envoyé avec succès.' });

      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Erreur d\'envoi', description: error.message });
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié', description: 'Code copié dans le presse-papier.' });
  };
  
  // Filtra primeiro pelo tipo principal (Gift Card ou Promo Code)
  // Assumimos que registros antigos sem 'type' são gift_cards
  const typeFilteredCards = giftCards.filter(card => {
      const cardType = card.type || 'gift_card';
      return cardType === viewType;
  });

  const filteredCards = typeFilteredCards.filter(card => {
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {viewType === 'gift_card' ? 'Cartes Cadeaux' : 'Codes Promo Influenceurs'}
            </h1>
            <p className="text-muted-foreground mt-1">Gérez vos codes et suivi des soldes.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all"><Plus className="mr-2 h-5 w-5" /> Créer Nouveau</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Création de Code</DialogTitle>
                    <DialogDescription>Générez un code cadeau ou promotionnel.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="single" value={creationTab} onValueChange={setCreationTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="single">Vente Unique</TabsTrigger>
                        <TabsTrigger value="promo">Influenceur</TabsTrigger>
                        <TabsTrigger value="bulk">Masse</TabsTrigger>
                    </TabsList>
                    
                    {/* TAB: INFLUENCER / PROMO */}
                    <TabsContent value="promo" className="space-y-5 animate-in fade-in zoom-in-95">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-semibold text-purple-600 uppercase mb-2">Code Personnalisé</span>
                            <Input 
                                className="text-center font-bold text-xl uppercase tracking-widest border-purple-200 focus-visible:ring-purple-500" 
                                placeholder="MARIE20" 
                                value={promoCodeName}
                                onChange={(e) => setPromoCodeName(e.target.value.toUpperCase().replace(/\s/g, ''))}
                            />
                            <p className="text-xs text-muted-foreground mt-2">Le code sera créé comme "Code Promo"</p>
                        </div>
                        
                        {/* SELETOR DE TIPO DE DESCONTO */}
                         <div className="grid gap-2">
                            <Label>Type de Réduction</Label>
                            <Tabs value={promoType} onValueChange={(v) => setPromoType(v as 'fixed' | 'percentage')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="fixed">Montant Fixe (€)</TabsTrigger>
                                    <TabsTrigger value="percentage">Pourcentage (%)</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="grid gap-2">
                            <Label>{promoType === 'fixed' ? 'Montant (€)' : 'Pourcentage (%)'}</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">
                                    {promoType === 'fixed' ? '€' : '%'}
                                </span>
                                <Input type="number" className="pl-8 text-lg font-semibold" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={promoType === 'fixed' ? "20.00" : "10"} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {promoType === 'fixed' ? "Montant total de réduction disponible." : "Pourcentage de réduction à appliquer sur le soin."}
                            </p>
                        </div>

                        {/* NOVO CAMPO: LIMITE DE USO */}
                        <div className="grid gap-2">
                            <Label>Limite d'utilisations (Optionnel)</Label>
                            <Input 
                                type="number" 
                                placeholder="Laisser vide pour illimité" 
                                value={maxUses} 
                                onChange={(e) => setMaxUses(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">Nombre maximum de fois que ce code peut être utilisé au total.</p>
                        </div>

                         <div className="grid gap-2">
                            <Label>Influenceur (Optionnel - Pour suivi)</Label>
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-accent/20">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-background">
                                            <AvatarImage src={selectedUser.photo_url} />
                                            <AvatarFallback><UserIcon className="h-4 w-4"/></AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-medium text-foreground">{selectedUser.display_name}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            ) : (
                                <Button variant="outline" className="justify-start text-muted-foreground w-full" onClick={() => setIsClientSelectorOpen(true)}>
                                    <UserIcon className="mr-2 h-4 w-4" /> Associer un compte client...
                                </Button>
                            )}
                        </div>

                        <Button 
                            className="w-full mt-4 h-12 text-lg bg-purple-600 hover:bg-purple-700 text-white" 
                            onClick={() => handleCreateSingle('promo_code')} 
                            disabled={isProcessing}
                        >
                            {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : (
                                `Créer Code Promo (${amount || '0'}${promoType === 'fixed' ? '€' : '%'})`
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="single" className="space-y-5 animate-in fade-in zoom-in-95">
                        
                        {/* 1. CONFIGURATION DU CODE */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-dashed flex flex-col items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground uppercase mb-1">Code du Chèque</span>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-mono font-bold tracking-wider text-primary">{generatedCode || '----'}</div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setGeneratedCode(generateRandomCode())}><RefreshCw className="h-3 w-3"/></Button>
                            </div>
                        </div>

                        {/* 2. MONTANT */}
                        <div className="grid gap-2">
                            <Label>Montant (€)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">€</span>
                                <Input type="number" className="pl-8 text-lg font-semibold" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" />
                            </div>
                        </div>

                        {/* 3. CLIENT */}
                        <div className="grid gap-2">
                            <Label>Destinataire (Optionnel)</Label>
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
                                <Button variant="outline" className="justify-start text-muted-foreground w-full" onClick={() => setIsClientSelectorOpen(true)}>
                                    <UserIcon className="mr-2 h-4 w-4" /> Rechercher un client...
                                </Button>
                            )}
                        </div>

                        {/* 4. PAIEMENT */}
                        <div className="grid gap-3 pt-2 border-t">
                            <Label>Mode de Paiement (Enregistrement Comptable)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div 
                                    className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted ${paymentMethod === 'card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Carte Bancaire</span>
                                </div>
                                <div 
                                    className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Espèces</span>
                                </div>
                                <div 
                                    className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                    onClick={() => setPaymentMethod('transfer')}
                                >
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Virement / Payconiq</span>
                                </div>
                                <div 
                                    className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-muted ${paymentMethod === 'none' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                    onClick={() => setPaymentMethod('none')}
                                >
                                    <Gift className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Offert / Gratuit</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. OPTIONS FINALES */}
                        {selectedUser?.email && (
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="email-notify" checked={sendEmail} onCheckedChange={(c) => setSendEmail(!!c)} />
                                <label htmlFor="email-notify" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Envoyer le code par email au client immédiatement
                                </label>
                            </div>
                        )}

                        <Button className="w-full mt-4 h-12 text-lg" onClick={() => handleCreateSingle('gift_card')} disabled={isProcessing}>
                            {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : (
                                paymentMethod === 'none' ? 'Créer (Gratuit)' : `Valider & Encaisser (${amount || '0'}€)`
                            )}
                        </Button>
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
                        <Button className="w-full mt-4" onClick={handleCreateBulk} disabled={isProcessing}>
                            {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : (
                                <><Layers className="mr-2 h-4 w-4" /> Générer {bulkQuantity} codes</>
                            )}
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
            <p className="text-xs text-muted-foreground mt-1">Montant disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Codes Actifs</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sur {stats.totalCards} codes totaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Utilisé</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.redeemedValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Revenu déjà généré</p>
          </CardContent>
        </Card>
      </div>

      {/* TABS PRINCIPAIS DE NAVEGAÇÃO */}
      <Tabs defaultValue="gift_card" value={viewType} onValueChange={(v: any) => setViewType(v)} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
            <TabsTrigger value="gift_card">Cartes Cadeaux</TabsTrigger>
            <TabsTrigger value="promo_code">Influenceurs / Promo</TabsTrigger>
          </TabsList>
      </Tabs>

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
                            <TableHead>{viewType === 'gift_card' ? 'Propriétaire' : 'Influenceur'}</TableHead>
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
                                        <p>Aucun code trouvé dans cette catégorie.</p>
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
                                            <div className={`font-mono font-bold px-2 py-1 rounded text-foreground tracking-wide text-xs border ${card.type === 'promo_code' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-muted'}`}>
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
                                        <div className="flex justify-end gap-1">
                                            {card.recipient && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-muted-foreground hover:text-primary transition-colors" 
                                                    onClick={() => handleSendEmail(card)}
                                                    title="Envoyer par email"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleDelete(card.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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