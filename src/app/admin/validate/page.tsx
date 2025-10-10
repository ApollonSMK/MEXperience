
import { Suspense } from 'react';
import { validateBookingByToken, revalidateAdminPaths } from '@/app/admin/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, User, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function ValidationComponent({ token }: { token: string | undefined }) {
    if (!token) {
        return (
            <div className="text-center">
                 <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit mb-4">
                    <XCircle className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-destructive">Token Inválido</h2>
                <p className="text-muted-foreground mt-2">
                    Nenhum token de validação foi fornecido. Por favor, tente ler o QR Code novamente.
                </p>
            </div>
        );
    }

    const result = await validateBookingByToken(token);

    if (result.success) {
        // Trigger revalidation as a separate action after the successful render
        await revalidateAdminPaths();
    }

    const bookingDetails = result.booking ? (
        <div className="space-y-4 text-sm bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-semibold text-center text-primary">Detalhes do Agendamento</h3>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4"/> Cliente:</span>
                <span className="font-bold">{result.booking.name}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4"/> Data:</span>
                <span className="font-bold">{format(parseISO(result.booking.date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
             <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Hora:</span>
                <span className="font-bold">{result.booking.time.substring(0, 5)}</span>
            </div>
        </div>
    ) : null;

    if (result.success) {
        return (
             <div className="text-center space-y-4">
                 <div className="mx-auto bg-green-500/10 text-green-500 p-4 rounded-full w-fit">
                    <CheckCircle className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-green-500">Check-in Realizado com Sucesso!</h2>
                {bookingDetails}
            </div>
        )
    }

    return (
        <div className="text-center space-y-4">
             <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit">
                <XCircle className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-destructive">Falha na Validação</h2>
            <p className="text-muted-foreground bg-destructive/10 p-3 rounded-md">{result.error}</p>
            {bookingDetails}
        </div>
    )
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
                <CardContent className="space-y-6">
                     <Suspense fallback={
                        <div className="flex flex-col items-center justify-center text-center space-y-4 h-40">
                            <Loader2 className="w-12 h-12 animate-spin text-accent" />
                            <p className="text-muted-foreground">A validar o código...</p>
                        </div>
                     }>
                        <ValidationComponent token={token} />
                    </Suspense>
                    <Separator />
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/admin/bookings">
                            Voltar para Agendamentos
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
