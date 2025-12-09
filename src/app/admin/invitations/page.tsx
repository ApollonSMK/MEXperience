'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cancelInvitation, redeemInvitation } from '@/app/actions/invitations';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
    Search, 
    Filter, 
    Ban, 
    RefreshCw, 
    Ticket, 
    MoreHorizontal, 
    CheckCircle2, 
    Clock, 
    Copy,
    User,
    Timer
} from 'lucide-react';

interface Invitation {
    id: string;
    status: 'active' | 'used' | 'cancelled';
    created_at: string;
    used_at: string | null;
    duration: number;
    service_snapshot: { name: string } | null;
    profiles: {
        display_name: string | null;
        email: string | null;
        photo_url: string | null;
    } | null;
}

export default function AdminInvitationsPage() {
    const supabase = getSupabaseBrowserClient();
    const { toast } = useToast();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Action States
    const [inviteToCancel, setInviteToCancel] = useState<Invitation | null>(null);
    const [inviteToRedeem, setInviteToRedeem] = useState<Invitation | null>(null);

    const fetchInvitations = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('invitations')
            .select('*, profiles:host_user_id(display_name, email, photo_url)')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les invitations.' });
        } else {
            setInvitations(data as any[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleCancel = async () => {
        if (!inviteToCancel) return;
        
        try {
            const res = await cancelInvitation(inviteToCancel.id);
            if (res.success) {
                toast({ title: 'Invitation Annulée', description: 'Les minutes ont été remboursées au membre.' });
                fetchInvitations();
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: res.error });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur inattendue est survenue.' });
        }
        setInviteToCancel(null);
    };

    const handleRedeem = async () => {
        if (!inviteToRedeem) return;
        
        try {
            const res = await redeemInvitation(inviteToRedeem.id);
            if (res.success) {
                toast({ title: 'Invitation Validée', description: 'Le passe a été marqué comme utilisé.' });
                fetchInvitations();
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: res.error });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur inattendue est survenue.' });
        }
        setInviteToRedeem(null);
    };

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast({ description: "ID copié dans le presse-papier" });
    };

    const filteredInvitations = invitations.filter(inv => {
        const matchesSearch = 
            inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Metrics
    const totalActive = invitations.filter(i => i.status === 'active').length;
    const totalUsed = invitations.filter(i => i.status === 'used').length;
    const minutesConsumed = invitations
        .filter(i => i.status === 'used')
        .reduce((acc, curr) => acc + (curr.duration || 0), 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none gap-1"><Ticket className="w-3 h-3"/> Actif</Badge>;
            case 'used': 
                return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="w-3 h-3"/> Utilisé</Badge>;
            case 'cancelled': 
                return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none gap-1"><Ban className="w-3 h-3"/> Annulé</Badge>;
            default: 
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Guest Passes</h1>
                    <p className="text-muted-foreground">Gestion des invitations générées par les membres.</p>
                </div>
                <Button variant="outline" onClick={fetchInvitations} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Passes Actifs</CardTitle>
                        <Ticket className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActive}</div>
                        <p className="text-xs text-muted-foreground">Prêts à être utilisés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Passes Utilisés</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsed}</div>
                        <p className="text-xs text-muted-foreground">Historique total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Minutes Offertes</CardTitle>
                        <Timer className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{minutesConsumed} min</div>
                        <p className="text-xs text-muted-foreground">Consommées via invitations</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par ID, nom ou email..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les status</SelectItem>
                                <SelectItem value="active">Actifs</SelectItem>
                                <SelectItem value="used">Utilisés</SelectItem>
                                <SelectItem value="cancelled">Annulés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-6">Membre (Host)</TableHead>
                                <TableHead>Détails du Passe</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Création / Utilisation</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        Chargement...
                                    </TableCell>
                                </TableRow>
                            ) : filteredInvitations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Aucune invitation trouvée.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvitations.map((inv) => (
                                    <TableRow key={inv.id} className="group">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarImage src={inv.profiles?.photo_url || ''} />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {inv.profiles?.display_name?.substring(0,2).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{inv.profiles?.display_name || 'Inconnu'}</span>
                                                    <span className="text-xs text-muted-foreground">{inv.profiles?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">
                                                    {inv.service_snapshot?.name || 'Service Standard'}
                                                </span>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-xs h-5 px-1.5 font-normal">
                                                        {inv.duration} min
                                                    </Badge>
                                                    <span 
                                                        className="font-mono bg-muted px-1.5 rounded cursor-pointer hover:bg-muted/80 transition-colors"
                                                        onClick={() => handleCopyId(inv.id)}
                                                        title="Copier ID"
                                                    >
                                                        #{inv.id.substring(0,8)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(inv.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{format(new Date(inv.created_at), "d MMM yyyy", { locale: fr })}</span>
                                                </div>
                                                {inv.used_at && (
                                                    <div className="flex items-center gap-2 text-emerald-600 text-xs mt-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>{format(new Date(inv.used_at), "HH:mm", { locale: fr })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleCopyId(inv.id)}>
                                                        <Copy className="mr-2 h-4 w-4" /> Copier l'ID Complet
                                                    </DropdownMenuItem>
                                                    
                                                    {inv.status === 'active' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setInviteToRedeem(inv)}>
                                                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> 
                                                                Valider Manuellement
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setInviteToCancel(inv)} className="text-destructive focus:text-destructive">
                                                                <Ban className="mr-2 h-4 w-4" /> 
                                                                Annuler & Rembourser
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Cancel Dialog */}
            <AlertDialog open={!!inviteToCancel} onOpenChange={(open) => !open && setInviteToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler l'invitation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le passe sera désactivé et <strong>{inviteToCancel?.duration} minutes</strong> seront remboursées au solde de {inviteToCancel?.profiles?.display_name}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Retour</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
                            Confirmer l'annulation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Redeem Dialog */}
            <AlertDialog open={!!inviteToRedeem} onOpenChange={(open) => !open && setInviteToRedeem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Valider l'invitation manuellement ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Utilisez cette option si le scanner ne fonctionne pas. Cela marquera le passe comme <strong>UTILISÉ</strong> immédiatement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Retour</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRedeem} className="bg-emerald-600 hover:bg-emerald-700">
                            Valider le Passe
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}