'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, X } from 'lucide-react';
import { UserProfile } from './admin-appointment-form';

const clientSchema = z.object({
  first_name: z.string().min(2, "Le prénom est requis."),
  last_name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide").optional().or(z.literal('')),
  phone: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface AdminClientCreatorProps {
  onSuccess: (newClient: UserProfile) => void;
  onCancel: () => void;
}

export function AdminClientCreator({ onSuccess, onCancel }: AdminClientCreatorProps) {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsLoading(true);
    try {
      // 1. Check if email already exists (if provided)
      if (values.email) {
          const { data: existing } = await supabase.from('profiles').select('id').eq('email', values.email).single();
          if (existing) {
              toast({ variant: 'destructive', title: 'Erreur', description: 'Un client avec cet email existe déjà.' });
              setIsLoading(false);
              return;
          }
      }

      // 2. Create Profile
      const displayName = `${values.first_name} ${values.last_name}`.trim();
      const { data, error } = await supabase.from('profiles').insert({
        first_name: values.first_name,
        last_name: values.last_name,
        display_name: displayName,
        email: values.email || null, // Allow null for guests without email
        phone: values.phone || null,
        minutes_balance: 0, // Starts with 0
      }).select().single();

      if (error) throw error;

      toast({ title: 'Succès', description: 'Client créé avec succès.' });
      onSuccess(data as UserProfile);

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible de créer le client.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
        <div className="p-6 border-b flex items-center justify-between bg-muted/10">
            <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> Nouveau Client
                </h2>
                <p className="text-sm text-muted-foreground">Créer un profil pour un nouveau client.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
                <form id="create-client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prénom *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Jean" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dupont" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="client@exemple.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Téléphone</FormLabel>
                                <FormControl>
                                    <Input type="tel" placeholder="+352 ..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
        </div>

        <div className="p-6 border-t bg-muted/10 mt-auto">
             <Button 
                type="submit" 
                form="create-client-form" 
                className="w-full" 
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Créer le Profil
            </Button>
        </div>
    </div>
  );
}