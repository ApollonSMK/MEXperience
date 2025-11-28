'use client';

import { useState, useEffect, useRef } from 'react';
import { redeemInvitation } from '@/app/actions/invitations';
import { checkInAppointment } from '@/app/actions/appointments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ScanLine, CheckCircle2, User, Clock, AlertTriangle, Camera, X, CalendarCheck } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Service {
    id: string;
    name: string;
    pricing_tiers: { duration: number, price: number }[];
}

export default function ScanPage() {
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    
    // States
    const [activeTab, setActiveTab] = useState('camera');
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');
    
    // Data States
    const [scannedType, setScannedType] = useState<'invitation' | 'appointment' | null>(null);
    const [fetchedData, setFetchedData] = useState<any>(null);
    const [
        services, 
        setServices
    ] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedDuration, setSelectedDuration] = useState<string>('');
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);

    // Efeito para carregar serviços
    useEffect(() => {
        async function loadServices() {
            const { data } = await supabase.from('services').select('*').eq('is_under_maintenance', false);
            if (data) setServices(data as Service[]);
        }
        loadServices();
    }, [supabase]);

    // Lógica do Scanner
    useEffect(() => {
        if (activeTab === 'camera' && !scanResult) {
            // Pequeno delay para garantir que o DOM renderizou a div do scanner
            const timeout = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
                    },
                    /* verbose= */ false
                );

                scanner.render((decodedText) => {
                    handleScan(decodedText);
                    scanner.clear(); // Para de escanear ao encontrar
                }, (error) => {
                    // console.warn(error); // Ignorar erros de leitura contínua
                });

                setScannerActive(true);

                return () => {
                    try { scanner.clear(); } catch(e) {}
                };
            }, 100);

            return () => clearTimeout(timeout);
        }
    }, [activeTab, scanResult]);

    const handleScan = (decodedText: string) => {
        // Tentar extrair UUID se for uma URL
        let code = decodedText;
        if (decodedText.includes('?')) {
             try {
                 const url = new URL(decodedText);
                 // Tenta pegar parâmetros comuns ou o pathname
                 code = url.searchParams.get('code') || url.searchParams.get('id') || url.searchParams.get('invite') || decodedText;
             } catch (e) {
                 // Não é uma URL válida, usa o texto puro
             }
        }
        
        // Limpar URL completa se o QR for apenas o link do site
        if (code.includes('/')) {
            const parts = code.split('/');
            code = parts[parts.length - 1];
        }

        setScanResult(code);
        setManualCode(code); // Preenche o input manual também
        verifyCode(code);
    };

    const verifyCode = async (code: string) => {
        setIsProcessing(true);
        setFetchedData(null);
        setScannedType(null);

        // 1. Tentar achar Convite
        const { data: invite } = await supabase
            .from('invitations')
            .select('*, profiles:host_user_id(display_name, email, minutes_balance)')
            .eq('id', code)
            .single();

        if (invite) {
            setScannedType('invitation');
            setFetchedData(invite);
            
            // Auto-selecionar serviço se disponível no convite
            if (invite.service_id) setSelectedServiceId(invite.service_id);
            if (invite.duration) setSelectedDuration(String(invite.duration));
            
            setIsProcessing(false);
            return;
        }

        // 2. Tentar achar Agendamento
        const { data: appointment } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', code)
            .single();

        if (appointment) {
            setScannedType('appointment');
            setFetchedData(appointment);
            setIsProcessing(false);
            return;
        }

        toast({ variant: "destructive", title: "Código não encontrado", description: "Não é um convite nem um agendamento válido." });
        setIsProcessing(false);
        setScanResult(null); // Reseta para escanear de novo
    };

    const processAction = async () => {
        if (!fetchedData) return;
        setIsProcessing(true);

        try {
            if (scannedType === 'invitation') {
                if (!selectedServiceId || !selectedDuration) {
                    toast({ variant: "destructive", title: "Dados incompletos", description: "Selecione serviço e duração." });
                    setIsProcessing(false);
                    return;
                }
                
                const res = await redeemInvitation(fetchedData.id, selectedServiceId, parseInt(selectedDuration));
                if (res.success) {
                    toast({ title: "Convite Validado!", description: "Entrada liberada e minutos descontados." });
                    resetScanner();
                } else {
                    toast({ variant: "destructive", title: "Erro", description: res.error });
                }

            } else if (scannedType === 'appointment') {
                const res = await checkInAppointment(fetchedData.id);
                if (res.success) {
                    toast({ title: "Check-in Realizado!", description: "Presença confirmada." });
                    resetScanner();
                } else {
                    toast({ variant: "destructive", title: "Erro", description: res.error });
                }
            }
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Erro", description: "Falha ao processar." });
        }
        setIsProcessing(false);
    };

    const resetScanner = () => {
        setScanResult(null);
        setManualCode('');
        setFetchedData(null);
        setScannedType(null);
        setSelectedServiceId('');
        setSelectedDuration('');
    };

    const selectedService = services.find(s => s.id === selectedServiceId);

    return (
        <div className="container max-w-lg py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ScanLine className="h-8 w-8 text-primary" /> Scanner
                </h1>
                {scanResult && (
                    <Button variant="ghost" onClick={resetScanner}>
                        <X className="mr-2 h-4 w-4" /> Cancelar / Novo Scan
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" /> Câmera</TabsTrigger>
                    <TabsTrigger value="manual">Digitar Código</TabsTrigger>
                </TabsList>

                <TabsContent value="camera" className="mt-4">
                    {!scanResult ? (
                        <Card>
                            <CardContent className="p-4 pt-6">
                                <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
                                <p className="text-center text-sm text-muted-foreground mt-4">Aponte a câmera para o QR Code</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="p-4 border rounded-lg bg-green-50 border-green-200 text-green-700 flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> Código lido com sucesso
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="manual">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Cole o ID aqui..." 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                        />
                        <Button onClick={() => handleScan(manualCode)}>Verificar</Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* RESULTADOS DA LEITURA */}
            {fetchedData && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 border-primary/50 shadow-lg">
                    <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                {scannedType === 'invitation' ? (
                                    <><User className="h-5 w-5" /> Guest Pass</>
                                ) : (
                                    <><CalendarCheck className="h-5 w-5" /> Agendamento</>
                                )}
                            </CardTitle>
                            <Badge variant={fetchedData.status === 'active' || fetchedData.status === 'Confirmado' ? 'default' : 'destructive'}>
                                {fetchedData.status}
                            </Badge>
                        </div>
                        <CardDescription>
                            {scannedType === 'invitation' 
                                ? "Verifique os dados do anfitrião antes de liberar." 
                                : "Confirme a presença do cliente."}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-6">
                        {/* DADOS DO CLIENTE / HOST */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Cliente / Host</Label>
                                <p className="font-semibold">
                                    {scannedType === 'invitation' ? fetchedData.profiles?.display_name : fetchedData.user_name}
                                </p>
                            </div>
                            {scannedType === 'invitation' && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Saldo Disponível</Label>
                                    <p className="font-semibold text-emerald-600">{fetchedData.profiles?.minutes_balance} min</p>
                                </div>
                            )}
                            {scannedType === 'appointment' && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Serviço</Label>
                                    <p className="font-semibold">{fetchedData.service_name}</p>
                                </div>
                            )}
                        </div>

                        {/* SE FOR CONVITE, OPÇÕES DE SERVIÇO */}
                        {scannedType === 'invitation' && (
                            <>
                                <div className="space-y-2 pt-2 border-t">
                                    <Label>Serviço a realizar</Label>
                                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
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
                                    <Label>Duração a debitar</Label>
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
                            </>
                        )}

                        {/* STATUS MESSAGE */}
                        {(fetchedData.status !== 'active' && scannedType === 'invitation') || (fetchedData.status === 'Concluído' && scannedType === 'appointment') ? (
                             <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                Atenção: Este item já foi utilizado ou não está ativo.
                             </div>
                        ) : (
                            <Button 
                                className="w-full h-12 text-lg mt-2" 
                                size="lg"
                                onClick={processAction}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Processando...' : (
                                    scannedType === 'invitation' ? 'Confirmar Entrada & Debitar' : 'Confirmar Check-in'
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}