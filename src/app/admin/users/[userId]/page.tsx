'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getUserById, updateUser } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Loader2, ArrowLeft, Save, Mail, Phone, Calendar, Clock, CreditCard, 
    Gift, Ban, Trash2, UserCog, CheckCircle2, XCircle, FileText, Send
} from 'lucide-react';
import { format, differenceInMinutes, formatDistanceToNow } from 'date-fns';
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    // Data
    const [user, setUser] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    
    // Form State (Editable fields)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        minutes_balance: 0,
        is_admin: false,
        is_influencer: false,
        is_reseller: false,
        reseller_commission: 10,
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
            
            // --- BUILD UNIFIED TIMELINE ---
            // Helper to check for valid date
            const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

            const emailEvents = (result.emailLogs || [])
                .filter((log: any) => log.created_at)
                .map((log: any) => ({
                    id: `email-${log.id}`,
                    type: 'email',
                    date: new Date(log.created_at),
                    title: 'Email Envoyé',
                    description: log.subject,
                    details: log.status === 'sent' ? 'Envoyé avec succès' : 'Échec de l\'envoi',
                    icon: Mail,
                    color: 'text-blue-500 bg-blue-50'
                }))
                .filter((e: any) => isValidDate(e.date));

            const auditEvents = (result.auditLogs || [])
                .filter((log: any) => log.created_at)
                .map((log: any) => ({
                    id: `audit-${log.id}`,
                    type: 'system',
                    date: new Date(log.created_at),
                    title: 'Système',
                    description: log.action_type,
                    details: log.details,
                    icon: FileText,
                    color: 'text-gray-500 bg-gray-50'
                }))
                .filter((e: any) => isValidDate(e.date));

            // Optional: Add recent appointments to timeline too for context
            const recentAppEvents = (result.appointments || [])
                .slice(0, 10)
                .map((app: any) => {
                    const dateStr = app.created_at || app.date;
                    if (!dateStr) return null;
                    return {
                        id: `app-${app.id}`,
                        type: 'appointment',
                        date: new Date(dateStr), // Using creation date for timeline
                        title: 'Nouveau Rendez-vous',
                        description: app.service_name,
                        details: format(new Date(app.date), 'dd MMMM à HH:mm', { locale: fr }),
                        icon: Calendar,
                        color: 'text-purple-500 bg-purple-50'
                    };
                })
                .filter((e: any) => e !== null && isValidDate(e.date));

            const mergedTimeline = [...emailEvents, ...auditEvents, ...recentAppEvents]
                .filter((e: any) => e !== null)
                .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

            setTimeline(mergedTimeline);
            
            setFormData({
                first_name: result.user.first_name || '',
                last_name: result.user.last_name || '',
                phone: result.user.phone || '',
                minutes_balance: result.user.minutes_balance || 0,
                is_admin: result.user.is_admin || false,
                is_influencer: result.user.is_influencer || false,
                is_reseller: result.user.is_reseller || false,
                reseller_commission: result.user.reseller_commission || 10,
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
            setUser({ ...user, ...formData });
        }
        setIsSaving(false);
    };

    const handleDeleteUser = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch('/api/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erro ao apagar utilizador');

            toast({ title: "Utilisateur supprimé", description: "Le compte a été supprimé définitivement." });
            router.push('/admin/users');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const getInitials = (first?: string, last?: string) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';

    const formatDateSafe = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return format(d, 'dd/MM/yyyy');
    };

    return (
        <div className="container mx-auto max-w-7xl py-6 px-4 md:px-6 space-y-6 pb-20">
            {/* Top Navigation */}
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN - USER PROFILE CARD (Sticky on Desktop) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-t-4 border-t-primary overflow-hidden shadow-md">
                        <CardHeader className="text-center pb-2 bg-gradient-to-b from-muted/30 to-transparent pt-8">
                            <div className="mx-auto w-24 h-24 mb-4 relative">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                    <AvatarImage src={user.photo_url} />
                                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                        {getInitials(user.first_name, user.last_name)}
                                    </AvatarFallback>
                                </Avatar>
                                {user.is_admin && (
                                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 shadow-sm border-2 border-background">Admin</Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl font-bold">{user.display_name || 'Sans Nom'}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-1.5 mt-1">
                                <Mail className="h-3.5 w-3.5" /> {user.email}
                            </CardDescription>
                            {user.phone && (
                                <CardDescription className="flex items-center justify-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5" /> {user.phone}
                                </CardDescription>
                            )}
                        </CardHeader>
                        
                        <Separator />

                        <CardContent className="pt-6 grid grid-cols-2 gap-4 text-center">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Solde</p>
                                <p className="text-2xl font-bold text-primary">{user.minutes_balance || 0}</p>
                                <p className="text-xs text-muted-foreground">minutes</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Dépensé</p>
                                <p className="text-2xl font-bold text-emerald-600">€{stats?.totalSpent?.toFixed(0) || '0'}</p>
                                <p className="text-xs text-muted-foreground">total (LTV)</p>
                            </div>
                        </CardContent>

                        <Separator />

                        <CardFooter className="flex flex-col gap-3 pt-6 bg-muted/20">
                            <Button className="w-full gap-2" variant="outline" onClick={() => window.location.href=`mailto:${user.email}`}>
                                <Mail className="h-4 w-4" /> Envoyer Email
                            </Button>
                            
                            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                     <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
                                        <Trash2 className="h-4 w-4" /> Supprimer Compte
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Supprimer ce client ?</DialogTitle>
                                        <DialogDescription>
                                            Cette action supprimera définitivement les données, l'historique et les accès.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                                        <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
                                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmer'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>

                    {/* Quick Stats Summary */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Statistiques</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Rendez-vous</span>
                                <span className="font-medium">{stats?.totalAppointments || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Complétés</span>
                                <span className="font-medium">{stats?.completedAppointments || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Annulés</span>
                                <span className="font-medium">{stats?.cancelledAppointments || 0}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Inscrit le</span>
                                <span>{formatDateSafe(user.creation_time || user.created_at)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN - TABS & CONTENT */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 overflow-x-auto gap-2">
                            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-3 px-4 text-sm font-medium">
                                Vue d'ensemble
                            </TabsTrigger>
                            <TabsTrigger value="appointments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-3 px-4 text-sm font-medium">
                                Rendez-vous
                            </TabsTrigger>
                            <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-3 px-4 text-sm font-medium">
                                Finance & Cadeaux
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-3 px-4 text-sm font-medium ml-auto flex items-center gap-2">
                                <UserCog className="h-4 w-4" /> Paramètres
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB: OVERVIEW (Timeline + Highlights) */}
                        <TabsContent value="overview" className="space-y-6">
                            {/* Next Appointment Card (if any future app exists) */}
                            {appointments.find(a => new Date(a.date) > new Date() && a.status === 'Confirmado') && (
                                <Card className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-l-primary">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-primary mb-1">Prochain Rendez-vous</p>
                                            <h3 className="text-lg font-bold">
                                                {format(new Date(appointments.find(a => new Date(a.date) > new Date() && a.status === 'Confirmado').date), 'EEEE d MMMM à HH:mm', { locale: fr })}
                                            </h3>
                                            <p className="text-muted-foreground mt-1">
                                                {appointments.find(a => new Date(a.date) > new Date() && a.status === 'Confirmado').service_name}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => router.push('/admin/appointments')}>Voir l'agenda</Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Unified Activity Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ActivityIcon className="h-5 w-5 text-muted-foreground" />
                                        Activité Récente
                                    </CardTitle>
                                    <CardDescription>Historique combiné des actions, emails et événements.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[500px] pr-4">
                                        {timeline.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <p>Aucune activité enregistrée récemment.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 pl-2">
                                                {timeline.map((event, i) => (
                                                    <div key={event.id} className="relative pl-8 pb-1 last:pb-0">
                                                        {/* Connector Line */}
                                                        {i !== timeline.length - 1 && (
                                                            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
                                                        )}
                                                        
                                                        {/* Icon Bubble */}
                                                        <div className={`absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center border ${event.color}`}>
                                                            <event.icon className="h-3 w-3" />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-semibold">{event.title}</p>
                                                                <time className="text-xs text-muted-foreground">
                                                                    {formatDistanceToNow(event.date, { addSuffix: true, locale: fr })}
                                                                </time>
                                                            </div>
                                                            <p className="text-sm text-foreground/90">{event.description}</p>
                                                            {event.details && (
                                                                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-1 border border-border/50">
                                                                    {event.details}
                                                                </p>
                                                            )}
                                                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                                                {format(event.date, 'dd MMM yyyy HH:mm')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: APPOINTMENTS */}
                        <TabsContent value="appointments">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Historique des Rendez-vous</CardTitle>
                                        <CardDescription>Liste complète des visites.</CardDescription>
                                    </div>
                                    <Button size="sm" onClick={() => router.push('/admin/appointments')}>
                                        <Calendar className="mr-2 h-4 w-4" /> Nouvel Agenda
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Service</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead>Paiement</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appointments.length === 0 ? (
                                                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Aucun rendez-vous.</TableCell></TableRow>
                                            ) : (
                                                appointments.map((app) => (
                                                    <TableRow key={app.id}>
                                                        <TableCell className="font-medium whitespace-nowrap">
                                                            {format(new Date(app.date), 'dd MMM yy HH:mm', { locale: fr })}
                                                        </TableCell>
                                                        <TableCell>{app.service_name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                app.status === 'Concluído' ? 'default' :
                                                                app.status === 'Cancelado' ? 'destructive' : 'secondary'
                                                            }>
                                                                {app.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground capitalize">
                                                            {app.payment_method === 'minutes' ? 'Pack Minutes' : app.payment_method || '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: FINANCIAL */}
                        <TabsContent value="financial" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historique des Paiements</CardTitle>
                                    <CardDescription>Transactions et abonnements.</CardDescription>
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
                                                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Aucune facture.</TableCell></TableRow>
                                            ) : (
                                                invoices.map((inv) => (
                                                    <TableRow key={inv.id}>
                                                        <TableCell>{format(new Date(inv.date || inv.created_at), 'dd MMM yyyy', { locale: fr })}</TableCell>
                                                        <TableCell>{inv.plan_title || 'Achat'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={inv.status === 'paid' || inv.status === 'Pago' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                                                                {inv.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">€{(inv.amount || 0).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Chèques Cadeaux</CardTitle>
                                    <CardDescription>Actifs et utilisés.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Solde</TableHead>
                                                <TableHead>Statut</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {giftCards.length === 0 ? (
                                                <TableRow><TableCell colSpan={3} className="text-center h-16 text-muted-foreground">Aucun chèque cadeau.</TableCell></TableRow>
                                            ) : (
                                                giftCards.map((card) => (
                                                    <TableRow key={card.id}>
                                                        <TableCell className="font-mono">{card.code}</TableCell>
                                                        <TableCell>€{card.current_balance} <span className="text-muted-foreground text-xs">/ {card.initial_balance}</span></TableCell>
                                                        <TableCell>
                                                            <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>{card.status}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: SETTINGS (EDIT FORM) */}
                        <TabsContent value="settings">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle>Modifier le Profil</CardTitle>
                                    <CardDescription>Mettre à jour les informations personnelles et les accès.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Prénom</Label>
                                            <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nom</Label>
                                            <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Téléphone</Label>
                                        <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label>Abonnement (Plan)</Label>
                                            <Select 
                                                value={formData.plan_id || "none"} 
                                                onValueChange={(val) => setFormData({...formData, plan_id: val === "none" ? "" : val})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir un plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Aucun plan</SelectItem>
                                                    {plans.map((plan) => (
                                                        <SelectItem key={plan.id} value={plan.id}>{plan.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">L'attribution manuelle ne facture pas le client.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Solde de Minutes</Label>
                                            <Input 
                                                type="number" 
                                                value={formData.minutes_balance} 
                                                onChange={(e) => setFormData({...formData, minutes_balance: Number(e.target.value)})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20 mt-4">
                                        <input 
                                            type="checkbox" 
                                            id="admin-check"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={formData.is_admin}
                                            onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label htmlFor="admin-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Accès Administrateur
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Donne un accès complet au backoffice. Prudence.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="flex items-center space-x-2 border p-4 rounded-md bg-purple-50/50 border-purple-100">
                                            <Switch 
                                                id="influencer-check"
                                                checked={formData.is_influencer}
                                                onCheckedChange={(checked) => setFormData({...formData, is_influencer: checked})}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor="influencer-check" className="text-sm font-medium leading-none cursor-pointer">
                                                    Influenciador
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    Habilita link de referência e painel de parceiro.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 border p-4 rounded-md bg-emerald-50/50 border-emerald-100">
                                            <div className="flex items-center space-x-2">
                                                <Switch 
                                                    id="reseller-check"
                                                    checked={formData.is_reseller}
                                                    onCheckedChange={(checked) => setFormData({...formData, is_reseller: checked})}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label htmlFor="reseller-check" className="text-sm font-medium leading-none cursor-pointer">
                                                        Revendedor
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Permite gerar e vender cartões presente.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {formData.is_reseller && (
                                                <div className="pt-2 pl-2 border-t border-emerald-200/50 mt-2">
                                                    <Label className="text-xs font-semibold text-emerald-800">Comissão (%)</Label>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Input 
                                                            type="number" 
                                                            className="h-8 bg-white max-w-[100px]"
                                                            value={formData.reseller_commission}
                                                            onChange={(e) => setFormData({...formData, reseller_commission: Number(e.target.value)})}
                                                            min={0}
                                                            max={100}
                                                        />
                                                        <span className="text-sm text-emerald-700 font-medium">% por venda</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t bg-muted/10 py-4">
                                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[150px]">
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Enregistrer
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}