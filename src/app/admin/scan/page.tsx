'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, Search, CheckCircle, User, Calendar, CreditCard, Gift } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { redeemInvitation } from '@/app/actions/invitations';
import { checkInAppointment } from '@/app/actions/appointments';

// Helper para formatar moeda
const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

export default function AdminScanPage() {
    const [scannedCode, setScannedCode] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estado do resultado da busca
    const [result, setResult] = useState<any>(null);
    const [resultType, setResultType] = useState<'invitation' | 'gift_card' | 'appointment' | null>(null);

    const searchParams = useSearchParams();
    const codeFromUrl = searchParams.get('code');
    const hasAutoProcessed = useRef(false);

    // Efeito para processar URL automaticamente
    useEffect(() => {
        if (codeFromUrl && !hasAutoProcessed.current) {
            setScannedCode(codeFromUrl);
            handleProcessCode(codeFromUrl);
            hasAutoProcessed.current = true;
        }
    }, [codeFromUrl]);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Limpar scanner ao desmontar
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const startScanner = () => {
        setIsScanning(true);
        setResult(null);
        
        // Pequeno delay para renderizar a div do scanner
        setTimeout(() => {
            // Se já existir, limpa antes
            if (scannerRef.current) {
                 scannerRef.current.clear().catch(() => {});
            }

            const scanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
                },
                /* verbose= */ false
            );
            
            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log(`Code scanned = ${decodedText}`, decodedResult);
        stopScanner();
        
        // Extrair código se for URL
        let code = decodedText;
        try {
            if (decodedText.includes('http')) {
                const url = new URL(decodedText);
                // Tenta pegar parâmetros ou a última parte do path
                code = url.searchParams.get('code') || url.pathname.split('/').pop() || decodedText;
            }
        } catch (e) {
            // Ignora erro de parse de URL
        }

        setScannedCode(code);
        handleProcessCode(code);
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    // Função central para processar o código (seja digitado ou escaneado)
    const handleProcessCode = async (code: string) => {
        if (!code) return;
        setIsLoading(true);
        setResult(null);
        setResultType(null);

        const supabase = getSupabaseBrowserClient();

        try {
            const normalizedCode = code.trim();
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(normalizedCode);

            // 1. Se parecer UUID, tentar buscar como INVITATION primeiro
            if (isUUID) {
                const { data: invite, error: inviteError } = await supabase
                    .from('invitations')
                    .select('*, profiles:host_user_id (display_name, email)')
                    .eq('id', normalizedCode)
                    .single();

                if (invite && !inviteError) {
                    setResult(invite);
                    setResultType('invitation');
                    setIsLoading(false);
                    return;
                }

                // 1.1 Se não for invitation, tentar APPOINTMENT
                const { data: appointment, error: appError } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('id', normalizedCode)
                    .single();
                
                if (appointment && !appError) {
                    setResult(appointment);
                    setResultType('appointment');
                    setIsLoading(false);
                    return;
                }
            }

            // 2. Se não for convite (ou não achou), buscar como GIFT CARD / PROMO CODE
            // Busca case-insensitive para promo codes
            const { data: card, error: cardError } = await supabase
                .from('gift_cards')
                .select('*, recipient:recipient_id(display_name)') 
                .eq('code', normalizedCode.toUpperCase())
                .single();

            if (card && !cardError) {
                setResult(card);
                setResultType('gift_card');
                setIsLoading(false);
                return;
            }

            toast({ variant: "destructive", title: "Non trouvé", description: "Ce code ne correspond à aucune invitation ou carte cadeau." });

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la vérification du code." });
        } finally {
            setIsLoading(false);
        }
    };

    // Ação: Resgatar Convite
    const handleRedeemInvite = async () => {
        if (!result || resultType !== 'invitation') return;
        setIsLoading(true);
        
        try {
            const res = await redeemInvitation(result.id); 
            if (res.success) {
                toast({ title: "Succès", description: "Invitation validée et utilisée avec succès !" });
                setResult({ ...result, status: 'used', used_at: new Date().toISOString() }); 
            } else {
                toast({ variant: "destructive", title: "Erreur", description: res.error });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur inattendue." });
        }
        setIsLoading(false);
    };

    // Ação: Check-in Agendamento
    const handleCheckInAppointment = async () => {
        if (!result || resultType !== 'appointment') return;
        setIsLoading(true);

        try {
            const res = await checkInAppointment(result.id);
            if (res.success) {
                toast({ title: "Succès", description: "Check-in réalisé avec succès !" });
                setResult({ ...result, status: 'Concluído' });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: res.error });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur inattendue." });
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-8 w-full pb-40">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scanner & Valider</h1>
                <p className="text-sm text-muted-foreground">Scannez des QR codes d'invitations ou vérifiez des cartes cadeaux.</p>
            </div>

            <Card className="border-2 border-dashed w-full">
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
                    
                    {/* ÁREA DO SCANNER */}
                    {isScanning ? (
                        <div className="w-full max-w-sm space-y-4">
                            <div id="reader" className="w-full rounded-lg overflow-hidden border bg-black min-h-[250px]"></div>
                            <Button variant="outline" className="w-full" onClick={stopScanner}>
                                Arrêter la caméra
                            </Button>
                        </div>
                    ) : (
                        !result && (
                            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in w-full">
                                <div className="p-4 bg-muted rounded-full">
                                    <QrCode className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">Prêt à scanner</h3>
                                    <p className="text-sm text-muted-foreground">Utilisez la caméra ou entrez le code manuellement</p>
                                </div>
                                <Button size="lg" className="gap-2 w-full sm:w-auto" onClick={startScanner}>
                                    <QrCode className="w-4 h-4" />
                                    Ouvrir Caméra
                                </Button>
                            </div>
                        )
                    )}

                    {/* INPUT MANUAL */}
                    {!isScanning && (
                        <div className="flex flex-col sm:flex-row w-full max-w-sm items-center gap-2 mt-4">
                            <Input 
                                className="w-full"
                                placeholder="Code manuel (ex: INV-123)" 
                                value={scannedCode}
                                onChange={(e) => setScannedCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleProcessCode(scannedCode)}
                            />
                            <Button className="w-full sm:w-auto" type="submit" onClick={() => handleProcessCode(scannedCode)} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 sm:mr-0" /> : <Search className="h-4 w-4 mr-2 sm:mr-0" />}
                                <span className="sm:hidden">Rechercher</span>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* RESULTADOS */}
            {result && (
                <div className="animate-in slide-in-from-bottom-5 fade-in duration-300 w-full">
                    <Card className={`border-l-4 w-full ${result.status === 'active' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div className="w-full">
                                    <div className="flex justify-between items-start w-full mb-2">
                                        <Badge variant={resultType === 'invitation' ? 'default' : resultType === 'appointment' ? 'outline' : 'secondary'}>
                                            {resultType === 'invitation' ? 'Invitation' : resultType === 'appointment' ? 'RDV' : result.type === 'promo_code' ? 'Code Promo' : 'Carte Cadeau'}
                                        </Badge>
                                        <Badge className={`text-xs px-2 py-0.5 sm:hidden ${
                                            (result.status === 'active' || result.status === 'Confirmado') ? 'bg-green-100 text-green-700' : 
                                            (result.status === 'used' || result.status === 'Concluído') ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {(result.status === 'active' || result.status === 'Confirmado') ? 'VALIDE' : 
                                             (result.status === 'used' || result.status === 'Concluído') ? 'UTILISÉ' : 
                                             result.status === 'expired' ? 'EXPIRÉ' : 'ANNULÉ'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl md:text-2xl break-all leading-tight mb-1">{result.code || result.service_name || 'Code scanné'}</CardTitle>
                                    <CardDescription className="text-xs break-all">ID: {result.id}</CardDescription>
                                </div>
                                <Badge className={`hidden sm:inline-flex text-sm px-3 py-1 ${
                                    (result.status === 'active' || result.status === 'Confirmado') ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                                    (result.status === 'used' || result.status === 'Concluído') ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                    'bg-red-100 text-red-700 hover:bg-red-100'
                                }`}>
                                    {(result.status === 'active' || result.status === 'Confirmado') ? 'VALIDE' : 
                                     (result.status === 'used' || result.status === 'Concluído') ? 'UTILISÉ / FINI' : 
                                     result.status === 'expired' ? 'EXPIRÉ' : 'ANNULÉ'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            {/* DETALHES CONVITE */}
                            {resultType === 'invitation' && (
                                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <User className="h-5 w-5 mt-0.5 text-primary/50 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Hôte (Membre)</p>
                                            <p className="font-medium text-sm break-words">{result.profiles?.display_name || 'Inconnu'}</p>
                                            <p className="text-xs text-muted-foreground break-all">{result.profiles?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Calendar className="h-5 w-5 mt-0.5 text-primary/50 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Créé le</p>
                                            <p className="font-medium text-sm">{new Date(result.created_at).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-xs font-medium mb-1">Service Inclus</p>
                                        <div className="p-3 border rounded-md bg-background text-sm">
                                            {result.service_snapshot?.name || 'Service standard'} ({result.duration} min)
                                        </div>
                                    </div>
                                </div>
                            )}

                             {/* DETALHES AGENDAMENTO */}
                             {resultType === 'appointment' && (
                                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <User className="h-5 w-5 mt-0.5 text-primary/50 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Client</p>
                                            <p className="font-medium text-sm break-words">{result.user_name}</p>
                                            <p className="text-xs text-muted-foreground break-all">{result.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Calendar className="h-5 w-5 mt-0.5 text-primary/50 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Date & Heure</p>
                                            <p className="font-medium text-sm">
                                                {new Date(result.date).toLocaleDateString('fr-FR')} à {new Date(result.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-xs font-medium mb-1">Détails</p>
                                        <div className="p-3 border rounded-md bg-background flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                                            <span className="break-words">{result.service_name} ({result.duration} min)</span>
                                            <Badge variant="outline" className="w-fit self-start sm:self-auto text-xs whitespace-nowrap">
                                                {result.payment_method === 'card' ? 'Carte' : result.payment_method === 'minutes' ? 'Pack Minutes' : 'Sur place'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DETALHES GIFT CARD */}
                            {resultType === 'gift_card' && (
                                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <CreditCard className="h-5 w-5 mt-0.5 text-primary/50 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Solde Actuel</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {result.metadata?.discount_type === 'percentage' 
                                                    ? `${result.initial_balance}% OFF` 
                                                    : formatCurrency(result.current_balance)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Gift className="h-5 w-5 mt-0.5 text-primary/50 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Solde Initial</p>
                                            <p className="font-medium text-sm">
                                                {result.metadata?.discount_type === 'percentage'
                                                    ? `${result.initial_balance}%`
                                                    : formatCurrency(result.initial_balance)}
                                            </p>
                                        </div>
                                    </div>
                                    {result.max_uses && (
                                         <div className="col-span-1 md:col-span-2 flex items-center justify-between p-3 border rounded-md text-sm">
                                            <span className="text-muted-foreground">Utilisations</span>
                                            <span className="font-mono font-medium">{result.uses_count || 0} / {result.max_uses}</span>
                                         </div>
                                    )}
                                </div>
                            )}

                            {/* AÇÕES */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
                                <Button 
                                    className="w-full" 
                                    variant="outline" 
                                    onClick={() => { setResult(null); setScannedCode(''); }}
                                >
                                    Scanner un autre
                                </Button>
                                
                                {resultType === 'invitation' && result.status === 'active' && (
                                    <Button 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                                        onClick={handleRedeemInvite}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Valider
                                    </Button>
                                )}

                                {resultType === 'appointment' && result.status === 'Confirmado' && (
                                    <Button 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                                        onClick={handleCheckInAppointment}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Check-in
                                    </Button>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}