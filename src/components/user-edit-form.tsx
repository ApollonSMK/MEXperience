'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';

const userSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis.'),
  lastName: z.string().min(1, 'Le nom de famille est requis.'),
  email: z.string().email(),
  phone: z.string().min(1, 'Le numéro de téléphone est requis.'),
  isAdmin: z.boolean().default(false),
  dob: z.union([z.any(), z.date()]).optional(),
  minutesBalance: z.coerce.number().int().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserEditFormProps {
  onSubmit: (values: UserFormValues) => void;
  initialData?: any | null;
  onCancel: () => void;
}

export function UserEditForm({ onSubmit, initialData, onCancel }: UserEditFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isAdmin: false,
      minutesBalance: 0,
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        minutesBalance: initialData.minutesBalance ?? 0,
        isAdmin: initialData.isAdmin ?? false,
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
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
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                    <Input placeholder="nom@exemple.com" {...field} disabled />
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
                    <Input placeholder="+33 1 23 45 67 89" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="minutesBalance"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Solde de minutes</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Administrateur</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Accorder des privilèges d'administrateur à cet utilisateur.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enregistrement..." : "Sauvegarder"}
            </Button>
        </div>
      </form>
    </Form>
  );
}