
import { Suspense } from 'react';
import { validateBookingByToken } from '@/app/admin/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function ValidationComponent({ token }: { token: string | undefined }) {
    if (!token) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Token Inválido</AlertTitle>
                <AlertDescription>
                    Nenhum token de validação foi fornecido. Por favor, tente ler o QR Code novamente.
                </AlertDescription>
            </Alert>
        );
    }

    const result = await validateBookingByToken(token);

    return (
        <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? 'Check-in Realizado com Sucesso' : 'Falha na Validação'}</AlertTitle>
            <AlertDescription>
                {result.success ? result.message : result.error}
            </AlertDescription>
        </Alert>
    );
}

export default function ValidatePage({
    searchParams,
}: {
    searchParams: { token?: string };
}) {
    const { token } = searchParams;

    return (
        <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Validação de Agendamento</CardTitle>
                    <CardDescription>Resultado do check-in automático via QR Code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Suspense fallback={
                        <div className="flex flex-col items-center justify-center text-center space-y-4 h-40">
                            <Loader2 className="w-12 h-12 animate-spin text-accent" />
                            <p className="text-muted-foreground">A validar o código...</p>
                        </div>
                     }>
                        <ValidationComponent token={token} />
                    </Suspense>
                    <Button asChild className="w-full">
                        <Link href="/admin/bookings">
                            Voltar para Agendamentos
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
