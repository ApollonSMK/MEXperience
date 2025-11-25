'use client';

import { useState, useEffect } from 'react';
import { generateInvitation, cancelInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Plus, Trash2, Ticket, History, Ban, CheckCircle2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Invitation {
    id: string;
    status: 'active' | 'used' | 'cancelled';
    created_at: string;
    used_at?: string;
}

export default function InvitePage() {
    const { toast } = useToast();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        const { data } = await supabase
            .from('invitations')
            .select('*')
            .eq('host_user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (data) setInvitations(data as Invitation[]);
        setIsLoading(false);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await generateInvitation();
            if (!res.success) {
                toast({ variant: 'destructive', title: 'Erreur', description: res.error });
            } else {
                toast({ title: 'Succès', description: 'Nouvelle invitation générée !' });
                loadInvitations();
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
        }
        setIsGenerating(false);
    };

    const handleCancel = async (id: string) => {
        if(!confirm("Voulez-vous vraiment annuler cette invitation ?")) return;
        
        await cancelInvitation(id);
        loadInvitations();
        toast({ title: 'Annulé', description: 'L\'invitation a été invalidée.' });
    };

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
                        Partagez vos minutes avec vos amis et votre famille.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="shadow-md">
                    {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                    Générer Invitation
                </Button>
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
                                    <Button variant="outline" onClick={handleGenerate}>Créer ma première invitation</Button>
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
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Code Invitation</p>
                                                <p className="font-mono text-sm bg-muted px-2 py-1 rounded select-all">
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
                                                <p className="text-sm font-medium">Utilisé le</p>
                                                <p className="text-muted-foreground">
                                                    {invite.used_at ? format(new Date(invite.used_at), "d MMMM yyyy à HH:mm", { locale: fr }) : '-'}
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
                                            <p className="text-sm text-muted-foreground text-center">
                                                Cette invitation a été annulée manuellement et n'est plus valide.
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