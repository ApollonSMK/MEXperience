'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getUserById, updateUser } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Loader2, 
    ArrowLeft, 
    Save, 
    Mail, 
    Phone, 
    Calendar, 
    Clock, 
    CreditCard, 
    Gift, 
    History, 
    Wallet,
    ShieldAlert,
    Ban,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserPageProps {
    params: Promise<{ userId: string }>;
}

export default function AdminUserPage({ params }: UserPageProps) {
    const resolvedParams = use(params);
    const userId = resolvedParams.userId;
    const router = useRouter();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Data
    const [user, setUser] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    
    // Form State (Editable fields)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        minutes_balance: 0,
        is_admin: false,
        plan_id: ''
    });

    useEffect(() => {
        const loadData = async () => {
            const result = await getUserById(userId);
            if (result.error) {
                toast({ variant: "destructive", title: "Erreur", description: result.error });
                router.push('/admin/users');
                return;
            }
            
            setUser(result.user);
            setAppointments(result.appointments);
            setGiftCards(result.giftCards);
            setInvoices(result.invoices);
            setPlans(result.plans);
            setStats(result.stats);
            
            setFormData({
                first_name: result.user.first_name || '',
                last_name: result.user.last_name || '',
                phone: result.user.phone || '',
                minutes_balance: result.user.minutes_balance || 0,
                is_admin: result.user.is_admin || false,
                plan_id: result.user.plan_id || ''
            });
            
            setIsLoading(false);
        };
        
        loadData();
    }, [userId, router, toast]);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateUser(userId, formData);
        
        if (result.error) {
            toast({ variant: "destructive", title: "Erreur", description: result.error });
        } else {
            toast({ title: "Succès", description: "Profil mis à jour avec succès." });
            // Update local user state specifically for display name refresh if needed
            setUser({ ...user, ...formData });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const getInitials = (first?: string, last?: string) => {
        return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                
                <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-20 w-20 border-2 border-primary/10">
                        <AvatarImage src={user.photo_url} />
                        <AvatarFallback className="text-xl">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {user.display_name || 'Sans Nom'}
                            {user.is_admin && <Badge variant="default" className="text-xs">Admin</Badge>}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                            {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="font-mono text-xs text-muted-foreground">ID: {user.id}</Badge>
                            <Badge variant="secondary" className="text-xs">Membre depuis {format(new Date(user.creation_time || user.created_at || new Date()), 'MM/yyyy')}</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dépenses Totales (LTV)</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Historique complet</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solde Minutes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{user.minutes_balance || 0} min</div>
                        <p className="text-xs text-muted-foreground">Disponibles</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="text-green-600 font-medium">{stats?.completedAppointments || 0} complétés</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Annulations</CardTitle>
                        <Ban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats?.cancelledAppointments || 0}</div>
                        <p className="text-xs text-muted-foreground">Rendez-vous annulés</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="appointments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                        Agendamentos
                    </TabsTrigger>
                    <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                        Informations
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                        Historique Financier
                    </TabsTrigger>
                    <TabsTrigger value="gifts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                        Chèques Cadeaux
                    </TabsTrigger>
                </TabsList>

                {/* TAB: APPOINTMENTS */}
                <TabsContent value="appointments" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Historique des Rendez-vous</CardTitle>
                            <CardDescription>Tous les rendez-vous passés et futurs de ce client.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Durée</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Paiement</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Aucun rendez-vous enregistré.</TableCell>
                                        </TableRow>
                                    ) : (
                                        appointments.map((app) => {
                                            // Normalização de dados (snake_case do DB vs camelCase)
                                            const serviceName = app.service_name || app.serviceName || 'Service inconnu';
                                            const paymentMethod = app.payment_method || app.paymentMethod;
                                            const updatedAt = app.updated_at ? new Date(app.updated_at) : new Date(app.created_at);
                                            
                                            // Lógica para calcular penalidade visualmente
                                            let penaltyInfo = null;
                                            
                                            const isMinutesPayment = paymentMethod === 'minutes';
                                            
                                            if (app.status === 'Cancelado' && isMinutesPayment) {
                                                const appDate = new Date(app.date);
                                                // Usamos updatedAt como data de cancelamento
                                                const cancelDate = updatedAt; 
                                                
                                                // Diferença em minutos entre o agendamento e o momento do cancelamento
                                                const minutesUntil = differenceInMinutes(appDate, cancelDate);
                                                const hoursUntil = minutesUntil / 60;

                                                // Regra: Se cancelou com menos de 24h de antecedência (e não depois do evento)
                                                if (hoursUntil < 24 && hoursUntil > -24) { 
                                                    const refundRatio = Math.max(0, hoursUntil / 24);
                                                    const refundAmount = Math.floor(app.duration * refundRatio);
                                                    const penalty = app.duration - refundAmount;
                                                    
                                                    // Mesmo que a penalidade seja 0, se foi cancelado < 24h, mostramos o aviso
                                                    // Mas focamos onde houve perda de minutos
                                                    if (penalty > 0) {
                                                        penaltyInfo = {
                                                            penalty,
                                                            hoursBefore: Math.floor(hoursUntil),
                                                            refundAmount
                                                        };
                                                    }
                                                }
                                            }

                                            return (
                                            <TableRow key={app.id}>
                                                <TableCell className="font-medium">
                                                    {format(new Date(app.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                                </TableCell>
                                                <TableCell>{serviceName}</TableCell>
                                                <TableCell>{app.duration} min</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <Badge variant={
                                                            app.status === 'Confirmado' ? 'secondary' :
                                                            app.status === 'Concluído' ? 'default' :
                                                            app.status === 'Cancelado' ? 'destructive' : 'outline'
                                                        }>
                                                            {app.status}
                                                        </Badge>
                                                        
                                                        {penaltyInfo && (
                                                            <div className="flex flex-col gap-0.5 mt-1 animate-in fade-in zoom-in duration-300">
                                                                <div className="flex items-center text-xs text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded-sm border border-amber-200" title={`Annulé ${penaltyInfo.hoursBefore}h avant le rendez-vous`}>
                                                                    <AlertTriangle className="h-3 w-3 mr-1.5" />
                                                                    Pénalité: -{penaltyInfo.penalty} min
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground ml-1">
                                                                    (Remboursé: {penaltyInfo.refundAmount} min)
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize text-muted-foreground text-sm">
                                                    {isMinutesPayment ? 'Pack Minutes' : paymentMethod || '-'}
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: INFO (EDIT PROFILE) */}
                <TabsContent value="info" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prénom</Label>
                                        <Input 
                                            value={formData.first_name} 
                                            onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nom</Label>
                                        <Input 
                                            value={formData.last_name} 
                                            onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={user.email} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input 
                                        value={formData.phone} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Paramètres du Compte</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Plan d'abonnement</Label>
                                    <Select 
                                        value={formData.plan_id || "none"} 
                                        onValueChange={(val) => setFormData({...formData, plan_id: val === "none" ? "" : val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun plan</SelectItem>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.title} ({plan.minutes} min/mês)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        L'attribution manuelle ne déclenche pas de facturation Stripe.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Solde de Minutes (Manuel)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="number" 
                                            value={formData.minutes_balance} 
                                            onChange={(e) => setFormData({...formData, minutes_balance: Number(e.target.value)})} 
                                        />
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Attention : Modifier ceci affecte directement le solde du client.
                                    </p>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Accès Administrateur</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Donner accès complet au backoffice.
                                        </p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4"
                                        checked={formData.is_admin}
                                        onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: FINANCIAL */}
                <TabsContent value="financial" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Historique des Transactions</CardTitle>
                            <CardDescription>Achats, Abonnements et Paiements enregistrés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Aucune transaction trouvée.</TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell>
                                                    {format(new Date(inv.date || inv.created_at), 'dd MMM yyyy', { locale: fr })}
                                                </TableCell>
                                                <TableCell>{inv.plan_title || 'Achat'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={inv.status === 'Pago' || inv.status === 'paid' ? 'default' : 'secondary'}>
                                                        {inv.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    €{(inv.amount || 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: GIFT CARDS */}
                <TabsContent value="gifts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Chèques Cadeaux</CardTitle>
                            <CardDescription>Codes promo et cartes cadeaux assignés à ce compte.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Initial</TableHead>
                                        <TableHead>Restant</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {giftCards.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Aucun chèque cadeau associé.</TableCell>
                                        </TableRow>
                                    ) : (
                                        giftCards.map((card) => (
                                            <TableRow key={card.id}>
                                                <TableCell className="font-mono font-medium">{card.code}</TableCell>
                                                <TableCell>€{card.initial_balance}</TableCell>
                                                <TableCell className="font-bold text-green-600">€{card.current_balance}</TableCell>
                                                <TableCell>
                                                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                                        {card.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(card.created_at), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}