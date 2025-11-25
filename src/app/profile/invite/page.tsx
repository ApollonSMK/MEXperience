'use client';

import { useState, useEffect } from 'react';
import { generateInvitation, cancelInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Plus, Trash2, Ticket, History, Ban, CheckCircle2, QrCode, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Invitation {
    id: string;
    status: 'active' | 'used' | 'cancelled';
    created_at: string;
    used_at?: string;
    duration?: number;
    service_snapshot?: { name: string };
}

interface Service {
    id: string;
    name: string;
    pricing_tiers: { duration: number, price: number }[];
}

export default function InvitePage() {
    const { toast } = useToast();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [userBalance, setUserBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal & Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('');

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        // 1. Invitations
        const { data: invites } = await supabase
            .from('invitations')
            .select('*')
            .eq('host_user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (invites) setInvitations(invites as any[]);

        // 2. Services
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('is_under_maintenance', false)
            .order('order');
        if (servicesData) setServices(servicesData as Service[]);

        // 3. User Balance
        const { data: profile } = await supabase
            .from('profiles')
            .select('minutes_balance')
            .eq('id', user.id)
            .single();
        if (profile) setUserBalance(profile.minutes_balance || 0);

        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!selectedServiceId || !selectedDuration) return;

        setIsGenerating(true);
        try {
            const res = await generateInvitation(selectedServiceId, parseInt(selectedDuration));
            if (!res.success) {
                toast({ variant: 'destructive', title: 'Erreur', description: res.error });
            } else {
                toast({ title: 'Succès', description: 'Nouvelle invitation générée !' });
                setIsDialogOpen(false);
                // Reset form
                setSelectedServiceId('');
                setSelectedDuration('');
                loadData(); // Reload invites and balance might have changed (if we deduced immediately, but we don't yet)
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
        }
        setIsGenerating(false);
    };

    const handleCancel = async (id: string) => {
        if(!confirm("Voulez-vous vraiment annuler cette invitation ?")) return;
        
        await cancelInvitation(id);
        loadData();
        toast({ title: 'Annulé', description: 'L\'invitation a été invalidée.' });
    };

    const selectedService = services.find(s => s.id === selectedServiceId);
    const durationNum = parseInt(selectedDuration || '0');
    const hasEnoughBalance = userBalance >= durationNum;

    // Filter lists
    const activeInvites = invitations.filter(i => i.status === 'active');
    const usedInvites = invitations.filter(i => i.status === 'used');
    const cancelledInvites = invitations.filter(i => i.status === 'cancelled');

    return (
        <div className="container max-w-4xl py-8 px-4 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-6 rounded-xl border border-primary/10">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Ticket className="h-6 w-6" /> Passes Invité
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Partagez vos minutes avec vos amis. Solde actuel: <span className="font-bold text-foreground">{userBalance} min</span>.
                    </p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="shadow-md">
                            <Plus className="mr-2 h-5 w-5" />
                            Générer Invitation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Créer un Pass Invité</DialogTitle>
                            <DialogDescription>
                                Sélectionnez le service et la durée à offrir. Les minutes seront déduites de votre solde lors de l'utilisation.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Service</Label>
                                <Select value={selectedServiceId} onValueChange={(val) => { setSelectedServiceId(val); setSelectedDuration(''); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un service..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Durée</Label>
                                <Select value={selectedDuration} onValueChange={setSelectedDuration} disabled={!selectedServiceId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir la durée..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedService?.pricing_tiers.map(tier => (
                                            <SelectItem 
                                                key={tier.duration} 
                                                value={String(tier.duration)}
                                                disabled={userBalance < tier.duration}
                                                className={userBalance < tier.duration ? 'opacity-50' : ''}
                                            >
                                                {tier.duration} minutes {userBalance < tier.duration && '(Solde insuffisant)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {!hasEnoughBalance && selectedDuration && (
                                <p className="text-sm text-destructive font-medium">
                                    Vous n'avez pas assez de minutes pour cette durée.
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleGenerate} disabled={isGenerating || !selectedServiceId || !selectedDuration || !hasEnoughBalance}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                                Générer QR Code
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Chargement des invitations...</p>
                </div>
            ) : (
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="active" className="gap-2">
                            <QrCode className="h-4 w-4" /> Actifs ({activeInvites.length})
                        </TabsTrigger>
                        <TabsTrigger value="used" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Utilisés ({usedInvites.length})
                        </TabsTrigger>
                        <TabsTrigger value="cancelled" className="gap-2">
                            <Ban className="h-4 w-4" /> Annulés ({cancelledInvites.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* ACTIVE TAB */}
                    <TabsContent value="active" className="space-y-4">
                        {activeInvites.length === 0 ? (
                            <EmptyState 
                                icon={Ticket} 
                                title="Aucune invitation active" 
                                description="Générez un QR Code pour inviter un ami dès maintenant."
                                action={
                                    <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Créer ma première invitation</Button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeInvites.map((invite) => (
                                    <Card key={invite.id} className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2 bg-primary/5 border-b border-primary/10">
                                            <div className="flex justify-between items-center">
                                                <Badge className="bg-green-500 hover:bg-green-600">Actif</Badge>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {format(new Date(invite.created_at), "d MMM yyyy", { locale: fr })}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center py-6 space-y-4">
                                            <div className="bg-white p-3 rounded-xl border shadow-inner">
                                                <QRCodeSVG value={invite.id} size={160} />
                                            </div>
                                            <div className="text-center w-full">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <span className="font-semibold text-lg">{invite.service_snapshot?.name || 'Service'}</span>
                                                    <Badge variant="outline" className="flex gap-1">
                                                        <Clock className="h-3 w-3" /> {invite.duration || '?'} min
                                                    </Badge>
                                                </div>
                                                <p className="font-mono text-sm bg-muted px-2 py-1 rounded select-all mx-auto w-fit">
                                                    {invite.id.split('-')[0]}...
                                                </p>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-2">
                                            <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={() => handleCancel(invite.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Annuler
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* USED TAB */}
                    <TabsContent value="used">
                        {usedInvites.length === 0 ? (
                            <EmptyState 
                                icon={History} 
                                title="Aucun historique" 
                                description="Vos invitations utilisées apparaîtront ici."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {usedInvites.map((invite) => (
                                    <Card key={invite.id} className="opacity-80 bg-muted/30">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center">
                                                <Badge variant="secondary">Utilisé</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Créé le {format(new Date(invite.created_at), "d MMM", { locale: fr })}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center py-8">
                                            <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium">{invite.service_snapshot?.name}</p>
                                                <p className="text-sm text-muted-foreground mb-2">{invite.duration} min</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Utilisé le {invite.used_at ? format(new Date(invite.used_at), "d MMMM yyyy à HH:mm", { locale: fr }) : '-'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* CANCELLED TAB */}
                    <TabsContent value="cancelled">
                         {cancelledInvites.length === 0 ? (
                            <EmptyState 
                                icon={Ban} 
                                title="Aucune invitation annulée" 
                                description="L'historique des invitations annulées apparaîtra ici."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cancelledInvites.map((invite) => (
                                    <Card key={invite.id} className="opacity-60 bg-muted border-dashed">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center">
                                                <Badge variant="destructive">Annulé</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(invite.created_at), "d MMM yyyy", { locale: fr })}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center py-8">
                                            <div className="h-24 w-24 bg-muted-foreground/10 rounded-full flex items-center justify-center mb-4">
                                                <Ban className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <p className="font-medium mb-1">{invite.service_snapshot?.name || 'Service'}</p>
                                            <p className="text-sm text-muted-foreground text-center">
                                                Annulée manuellement.
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: any, title: string, description: string, action?: React.ReactNode }) {
    return (
        <Card className="border-dashed shadow-none bg-muted/10 py-10">
            <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
                {action}
            </CardContent>
        </Card>
    );
}