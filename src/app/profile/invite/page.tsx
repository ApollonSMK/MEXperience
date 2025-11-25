'use client';

import { useState, useEffect } from 'react';
import { generateInvitation, cancelInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Plus, Trash2, Ticket, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Invitation {
    id: string;
    status: 'active' | 'used' | 'cancelled';
    created_at: string;
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
                toast({ variant: 'destructive', title: 'Erro', description: res.error });
            } else {
                toast({ title: 'Sucesso', description: 'Novo convite gerado!' });
                loadInvitations();
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Algo correu mal.' });
        }
        setIsGenerating(false);
    };

    const handleCancel = async (id: string) => {
        await cancelInvitation(id);
        loadInvitations();
        toast({ title: 'Cancelado', description: 'O convite foi invalidado.' });
    };

    return (
        <div className="container max-w-4xl py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Ticket className="h-6 w-6 text-primary" /> Passes de Convidado
                    </h1>
                    <p className="text-muted-foreground">Convide amigos para usar os seus minutos.</p>
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Novo Convite
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {invitations.length === 0 && (
                        <Card className="col-span-full border-dashed shadow-none bg-muted/30">
                            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                <Ticket className="h-10 w-10 text-muted-foreground mb-4" />
                                <p className="font-medium text-lg">Nenhum convite ativo</p>
                                <p className="text-sm text-muted-foreground mb-4">Gere um QR Code para trazer um amigo.</p>
                                <Button variant="outline" onClick={handleGenerate}>Gerar Primeiro Convite</Button>
                            </CardContent>
                        </Card>
                    )}

                    {invitations.map((invite) => (
                        <Card key={invite.id} className={`overflow-hidden ${invite.status !== 'active' ? 'opacity-60 bg-muted' : ''}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={invite.status === 'active' ? 'default' : 'secondary'}>
                                        {invite.status === 'active' ? 'Ativo' : invite.status === 'used' ? 'Usado' : 'Cancelado'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(invite.created_at), "d MMM yyyy", { locale: fr })}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center py-4">
                                {invite.status === 'active' ? (
                                    <div className="bg-white p-2 rounded-lg border">
                                        <QRCodeSVG value={invite.id} size={150} />
                                    </div>
                                ) : (
                                    <div className="h-[150px] w-[150px] bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                                        <Ticket className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                )}
                                <p className="mt-4 text-xs font-mono text-muted-foreground break-all text-center px-4">
                                    {invite.id}
                                </p>
                            </CardContent>
                            <CardFooter className="bg-muted/50 pt-4 flex gap-2">
                                {invite.status === 'active' && (
                                    <Button variant="destructive" size="sm" className="w-full" onClick={() => handleCancel(invite.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Cancelar
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}