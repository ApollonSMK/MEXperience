
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';

export default function AdminBookingsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">
          Gerir Agendamentos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Visualize e gira todos os agendamentos dos seus clientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CalendarCheck className="w-8 h-8 text-accent" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">
                Todos os Agendamentos
              </CardTitle>
              <CardDescription>
                Uma lista completa de agendamentos futuros e passados.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              A tabela de agendamentos de todos os utilizadores aparecerá aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
