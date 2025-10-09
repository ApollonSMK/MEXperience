
'use client';

import { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { useToast } from '@/hooks/use-toast';
import { validateBookingByToken } from '@/app/admin/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, QrCode } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminScanPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResponse, setValidationResponse] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  const handleScan = async (data: any) => {
    if (data && !isLoading && data.text !== result) {
      const scannedText = data.text;
      setIsLoading(true);
      setResult(scannedText);
      setValidationResponse(null);

      const response = await validateBookingByToken(scannedText);
      
      if (response.success) {
        toast({
          title: 'Check-in com Sucesso!',
          description: response.message,
        });
        setValidationResponse({ success: true, message: response.message || 'Agendamento validado.' });
      } else {
        toast({
          title: 'Erro na Validação',
          description: response.error,
          variant: 'destructive',
        });
         setValidationResponse({ success: false, message: response.error || 'Falha na validação.' });
      }
      setIsLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setHasCameraPermission(false);
    toast({
        title: 'Erro na Câmara',
        description: 'Não foi possível aceder à câmara. Verifique as permissões no seu navegador.',
        variant: 'destructive',
    });
  };

  const resetScanner = () => {
    setResult(null);
    setValidationResponse(null);
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto py-10">
       <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Validar Check-in</h1>
                <p className="text-muted-foreground">
                    Aponte a câmara para o QR code do agendamento do cliente.
                </p>
            </div>
        </div>

        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <QrCode className="w-6 h-6 text-accent" />
                    <div>
                        <CardTitle>Leitor de QR Code</CardTitle>
                        <CardDescription>Aguardando a leitura de um código válido...</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {validationResponse ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 h-80">
                         {validationResponse.success ? (
                            <CheckCircle className="w-20 h-20 text-green-500" />
                        ) : (
                            <XCircle className="w-20 h-20 text-destructive" />
                        )}
                        <Alert variant={validationResponse.success ? 'default' : 'destructive'} className="text-left">
                            <AlertTitle className="font-bold">{validationResponse.success ? 'Sucesso' : 'Falha'}</AlertTitle>
                            <AlertDescription>
                                {validationResponse.message}
                            </AlertDescription>
                        </Alert>
                        <Button onClick={resetScanner} className="w-full">
                            Ler Novo QR Code
                        </Button>
                    </div>
                ) : isLoading ? (
                     <div className="flex flex-col items-center justify-center text-center space-y-4 h-80">
                        <Loader2 className="w-16 h-16 animate-spin text-accent" />
                        <p className="text-muted-foreground">A validar o código...</p>
                    </div>
                ) : (
                    <div className="relative h-80 w-full overflow-hidden rounded-md border bg-muted">
                        {!hasCameraPermission ? (
                           <div className="flex flex-col items-center justify-center h-full text-center p-4">
                               <Alert variant="destructive">
                                <AlertTitle>Permissão da Câmara Negada</AlertTitle>
                                <AlertDescription>
                                    Por favor, autorize o acesso à câmara nas definições do seu navegador para usar esta funcionalidade.
                                </AlertDescription>
                                </Alert>
                           </div>
                        ) : (
                           <QrScanner
                                onScan={handleScan}
                                onError={handleError}
                                constraints={{
                                    audio: false,
                                    video: { facingMode: 'environment' }
                                }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        )}
                         <div className="absolute inset-0 border-8 border-white/20 rounded-md pointer-events-none" />
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
