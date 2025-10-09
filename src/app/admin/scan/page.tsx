'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateBookingByToken } from '@/app/admin/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, QrCode, CameraOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminScanPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationResponse, setValidationResponse] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const getCameraPermission = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("A API de câmara não é suportada neste navegador.");
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for the stream to load and then play
          videoRef.current.onloadedmetadata = () => {
             if (videoRef.current) {
                videoRef.current.play();
                animationFrameId = requestAnimationFrame(tick);
             }
          };
        }
      } catch (error) {
        console.error('Erro ao aceder à câmara:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmara Negado',
          description: 'Por favor, autorize o acesso à câmara nas definições do seu navegador.',
        });
      }
    };
    
    const tick = async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        const jsQR = (await import('jsqr')).default;
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });

                        if (code && !isLoading) { // Ensure we don't process multiple times
                           handleScan(code.data);
                           return; // Stop scanning after a code is found
                        }
                    } catch (e) {
                        console.error("Error loading or using jsQR:", e);
                    }
                }
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    };

    if (hasCameraPermission === null) {
        getCameraPermission();
    }

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission]);

  const handleScan = async (scannedText: string) => {
    if (isLoading || !scannedText) return;
    
    setIsLoading(true);
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
  };
  
  const resetScanner = () => {
    setValidationResponse(null);
    setIsLoading(false);
    setHasCameraPermission(null); // This will trigger the useEffect to re-request camera
  }

  const renderContent = () => {
    if (validationResponse) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 h-80">
            {validationResponse.success ? (
                <CheckCircle className="w-20 h-20 text-green-500" />
            ) : (
                <XCircle className="w-20 h-20 text-destructive" />
            )}
            <Alert variant={validationResponse.success ? 'default' : 'destructive'} className="text-left">
                <AlertTitle className="font-bold">{validationResponse.success ? 'Sucesso' : 'Falha'}</AlertTitle>
                <AlertDescription>{validationResponse.message}</AlertDescription>
            </Alert>
            <Button onClick={resetScanner} className="w-full">
                Ler Novo QR Code
            </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 h-80">
            <Loader2 className="w-16 h-16 animate-spin text-accent" />
            <p className="text-muted-foreground">A validar o código...</p>
        </div>
      );
    }

    if (hasCameraPermission === false) {
        return (
             <div className="flex flex-col items-center justify-center h-80 text-center p-4">
                <Alert variant="destructive" className="items-center">
                    <CameraOff className="w-6 h-6 mr-2"/>
                    <div>
                        <AlertTitle>Permissão da Câmara Negada</AlertTitle>
                        <AlertDescription>
                            Por favor, autorize o acesso à câmara nas definições do seu navegador e atualize a página.
                        </AlertDescription>
                    </div>
                </Alert>
            </div>
        )
    }

    if (hasCameraPermission === null) {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-4 h-80">
                <Loader2 className="w-16 h-16 animate-spin text-accent" />
                <p className="text-muted-foreground">A aceder à câmara...</p>
            </div>
        )
    }
    
    return (
        <div className="relative h-80 w-full overflow-hidden rounded-md border bg-muted">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="absolute inset-0 border-8 border-white/20 rounded-md pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-3/4 h-3/4 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-accent pointer-events-none rounded-lg" />
        </div>
    );
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
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}
