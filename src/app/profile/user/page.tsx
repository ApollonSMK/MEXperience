
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { User } from 'lucide-react';

export default function UserProfilePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <User className="w-8 h-8 text-accent" />
            <div>
              <CardTitle className="font-headline text-2xl text-primary">
                Meu Perfil
              </CardTitle>
              <CardDescription>
                Consulte e edite os seus dados pessoais e de acesso.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              O formulário para editar os dados do perfil aparecerá aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
