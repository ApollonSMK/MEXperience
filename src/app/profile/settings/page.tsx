
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <BackButton />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Settings className="w-8 h-8 text-accent" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">
                Definições
              </CardTitle>
              <CardDescription>
                Atualize os seus dados de perfil e preferências.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              As opções de definições da conta aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
