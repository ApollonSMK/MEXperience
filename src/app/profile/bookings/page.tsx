
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function BookingsPage() {
  return (
    <>
      <BackButton />
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-accent" />
              <div>
                <CardTitle className="font-headline text-2xl text-primary">
                  Meus Agendamentos
                </CardTitle>
                <CardDescription>
                  Veja e gira as suas sessões futuras e passadas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-20 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                A lista de agendamentos aparecerá aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
