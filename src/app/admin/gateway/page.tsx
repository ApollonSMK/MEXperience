'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const gatewaySchema = z.object({
  test_mode: z.boolean().default(true),
  public_key: z.string().optional(),
  secret_key: z.string().optional(),
  webhook_secret: z.string().optional(),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

export default function GatewaySettingsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      test_mode: true,
      public_key: '',
      secret_key: '',
      webhook_secret: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gateway_settings')
        .select('*')
        .eq('id', 'stripe')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found'
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les paramètres du gateway.' });
      } else if (data) {
        form.reset({
            test_mode: data.test_mode,
            public_key: data.public_key || '',
            secret_key: data.secret_key || '',
            webhook_secret: data.webhook_secret || '',
        });
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [supabase, toast, form]);

  const onSubmit = async (values: GatewayFormValues) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('gateway_settings')
        .upsert({ 
            id: 'stripe',
            test_mode: values.test_mode,
            public_key: values.public_key,
            secret_key: values.secret_key,
            webhook_secret: values.webhook_secret,
            updated_at: new Date().toISOString()
         });

      if (error) throw error;
      toast({ title: 'Paramètres sauvegardés', description: 'Vos paramètres Stripe ont été mis à jour avec succès.' });
      form.reset(values); // Re-sync form state
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    }
  };
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-1" />
            </CardHeader>
            <CardContent className="space-y-8">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-32 ml-auto" />
            </CardFooter>
        </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du Gateway de Paiement</CardTitle>
            <CardDescription>
              Gérez les clés API et le mode de fonctionnement de votre intégration Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Information Importante</AlertTitle>
                <AlertDescription>
                   Les clés secrètes sont stockées de manière sécurisée et ne sont accessibles que par les administrateurs. Assurez-vous de n'utiliser que les clés API de Stripe.
                </AlertDescription>
            </Alert>
            
            <FormField
              control={form.control}
              name="test_mode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Mode de Test</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Activez ce mode pour utiliser les clés de test de Stripe. Les paiements ne seront pas réels.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
                <FormField
                control={form.control}
                name="public_key"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Clé Publique Stripe</FormLabel>
                    <FormControl>
                        <Input placeholder="pk_test_..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="secret_key"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Clé Secrète Stripe</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="sk_test_..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="webhook_secret"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Segredo do Webhook Stripe</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="whsec_..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="ml-auto">
                {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder les Paramètres"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
