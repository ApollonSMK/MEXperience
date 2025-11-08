'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const gatewaySchema = z.object({
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

export default function GatewaySettingsPage() {
  const { toast } = useToast();

  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
        NEXT_PUBLIC_STRIPE_PUBLIC_KEY: '',
        STRIPE_SECRET_KEY: '',
        STRIPE_WEBHOOK_SECRET: '',
    },
  });

  const onSubmit = async (values: GatewayFormValues) => {
    toast({ title: 'Funcionalidade em Desenvolvimento', description: 'A edição de variáveis de ambiente diretamente ainda não é suportada.' });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du Gateway de Paiement (Stripe)</CardTitle>
            <CardDescription>
                Gérez les clés API de votre intégration Stripe. Ces valeurs sont stockées dans votre fichier <code>.env.local</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Information Importante</AlertTitle>
                <AlertDescription>
                   Les clés secrètes sont stockées de manière sécurisée dans les variables d'environnement et ne sont jamais exposées au client. Pour modifier ces clés, veuillez éditer votre fichier <code>.env.local</code> et redémarrer le serveur.
                </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
                <FormField
                control={form.control}
                name="NEXT_PUBLIC_STRIPE_PUBLIC_KEY"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Clé Publique Stripe</FormLabel>
                    <FormControl>
                        <Input placeholder="pk_test_..." {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="STRIPE_SECRET_KEY"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Clé Secrète Stripe</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="sk_test_..." value="••••••••••••••••" disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="STRIPE_WEBHOOK_SECRET"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Segredo do Webhook Stripe</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="whsec_..." value="••••••••••••••••" disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
