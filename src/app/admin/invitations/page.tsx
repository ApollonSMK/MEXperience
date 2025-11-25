'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cancelInvitation } from '@/app/actions/invitations';
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Filter, Ban, RefreshCw, Ticket } from 'lucide-react';

interface Invitation {
    id: string;
    status: 'active' | 'used' | 'cancelled';
    created_at: string;
    used_at: string | null;
    profiles: {
        display_name: string | null;
        email: string | null;
    } | null;
}

export default function AdminInvitationsPage() {
    const supabase = getSupabaseBrowserClient();
    const { toast } = useToast();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchInvitations = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('invitations')
            .select('*, profiles:host_user_id(display_name, email)')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao carregar convites.' });
        } else {
            setInvitations(data as any[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este convite?')) return;
        
        const res = await cancelInvitation(id);
        if (res.success) {
            toast({ title: 'Sucesso', description: 'Convite cancelado.' });
            fetchInvitations();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: res.error });
        }
    };

    const filteredInvitations = invitations.filter(inv => {
        const matchesSearch = 
            inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500 hover:bg-green-600">Atif</Badge>;
            case 'used': return <Badge variant="secondary">Utilisé</Badge>;
            case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Invitations</h1>
                    <p className="text-muted-foreground">
                        Histórico e controlo de passes de convidados.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchInvitations} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" /> Filtres
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par ID, nom ou email..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
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
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Host (Membre)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Créé le</TableHead>
                            <TableHead>Utilisé le</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : filteredInvitations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Aucune invitation trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvitations.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{inv.profiles?.display_name || 'Inconnu'}</span>
                                            <span className="text-xs text-muted-foreground">{inv.profiles?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(inv.status)}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(inv.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        {inv.used_at 
                                            ? format(new Date(inv.used_at), "d MMM yyyy HH:mm", { locale: fr }) 
                                            : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {inv.status === 'active' && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleCancel(inv.id)}
                                            >
                                                <Ban className="h-4 w-4 mr-2" />
                                                Annuler
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Total: {filteredInvitations.length} invitation(s)
            </div>
        </div>
    );
}