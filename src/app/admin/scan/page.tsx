'use client';

import { useState, useEffect } from 'react';
import { redeemInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ScanLine, CheckCircle2, User, Clock, AlertTriangle } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    pricing_tiers: { duration: number, price: number }[];
}

export default function ScanPage() {
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    
    // States
    const [inviteId, setInviteId] = useState('');
    const [hostData, setHostData] = useState<any>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedDuration, setSelectedDuration] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        // Carregar serviços para o dropdown
        async function loadServices() {
            const { data } = await supabase.from('services').select('*').eq('is_under_maintenance', false);
            if (data) setServices(data as Service[]);
        }
        loadServices();
    }, [supabase]);

    // Quando o ID do convite muda (scan), buscar dados do host
    useEffect(() => {
        const fetchInviteData = async () => {
            if (inviteId.length < 30) { // UUIDs são longos
                setHostData(null);
                setStatusMessage(null);
                return;
            } 

            const { data: invite, error } = await supabase
                .from('invitations')
                .select('*, profiles:host_user_id(display_name, email, minutes_balance)')
                .eq('id', inviteId)
                .single();

            if (error || !invite) {
                setStatusMessage({ type: 'error', text: 'Convite não encontrado.' });
                setHostData(null);
                return;
            }

            if (invite.status !== 'active') {
                setStatusMessage({ type: 'error', text: `Este convite já está ${invite.status}.` });
                setHostData(null);
                return;
            }

            setHostData(invite.profiles);
            setStatusMessage({ type: 'success', text: 'Convite Válido!' });
        };

        const timer = setTimeout(fetchInviteData, 500); // Debounce
        return () => clearTimeout(timer);
    }, [inviteId, supabase]);

    const handleRedeem = async () => {
        if (!selectedServiceId || !selectedDuration || !inviteId) return;

        setIsProcessing(true);
        try {
            const durationNum = parseInt(selectedDuration);
            const res = await redeemInvitation(inviteId, selectedServiceId, durationNum);

            if (res.success) {
                toast({ title: 'Sucesso!', description: 'Entrada liberada e minutos descontados.' });
                // Reset form
                setInviteId('');
                setHostData(null);
                setSelectedServiceId('');
                setSelectedDuration('');
                setStatusMessage(null);
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: res.error });
            }
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Erro', description: 'Erro de sistema.' });
        }
        setIsProcessing(false);
    };

    const selectedService = services.find(s => s.id === selectedServiceId);

    return (
        <div className="container max-w-lg py-10">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <ScanLine className="h-8 w-8 text-primary" /> Scanner de Convites
            </h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Validar Entrada</CardTitle>
                    <CardDescription>Escaneie o QR Code do convidado ou digite o código.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Código do Convite</Label>
                        <Input 
                            placeholder="Escaneie aqui..." 
                            value={inviteId}
                            onChange={(e) => setInviteId(e.target.value.trim())}
                            autoFocus
                            className="text-lg font-mono h-12"
                        />
                    </div>

                    {statusMessage && (
                        <div className={`p-3 rounded-md text-sm font-medium flex items-center gap-2 ${
                            statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {statusMessage.text}
                        </div>
                    )}

                    {hostData && (
                        <div className="bg-muted p-4 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Anfitrião (Paga a conta)</p>
                                    <p className="font-semibold text-lg">{hostData.display_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Saldo Disponível</p>
                                    <p className="font-semibold text-lg">{hostData.minutes_balance} min</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Serviço a realizar</Label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={!hostData}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o serviço..." />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Duração</Label>
                        <Select value={selectedDuration} onValueChange={setSelectedDuration} disabled={!selectedServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tempo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedService?.pricing_tiers?.map(tier => (
                                    <SelectItem key={tier.duration} value={String(tier.duration)}>
                                        {tier.duration} minutos
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        className="w-full h-12 text-lg mt-4" 
                        onClick={handleRedeem}
                        disabled={!hostData || !selectedServiceId || !selectedDuration || isProcessing}
                    >
                        {isProcessing ? 'Processando...' : 'Confirmar Entrada & Debitar Minutos'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}