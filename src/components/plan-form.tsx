'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';

const planSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  price: z.string().regex(/^€\d+$/, "Le prix doit être au format '€50'."),
  period: z.string().min(1, 'La période est requise (ex: /mois).'),
  minutes: z.coerce.number().int().min(1, 'Les minutes doivent être un nombre positif.'),
  sessions: z.string().min(1, 'Les sessions sont requises (ex: 2 à 3).'),
  features: z.string().min(1, 'Au moins une caractéristique est requise.'),
  popular: z.boolean().default(false),
  order: z.coerce.number().int(),
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  onSubmit: (values: PlanFormValues) => void;
  initialData?: Partial<PlanFormValues> | null;
  onCancel: () => void;
}

export function PlanForm({ onSubmit, initialData, onCancel }: PlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: '',
      price: '€',
      period: '/mois',
      minutes: 0,
      sessions: '',
      features: '',
      popular: false,
      order: 0,
      ...initialData,
      features: Array.isArray(initialData?.features) ? initialData.features.join('\n') : '',
    },
  });

  useEffect(() => {
    const values = {
        ...initialData,
        features: Array.isArray(initialData?.features) ? initialData.features.join('\n') : '',
    }
    form.reset(values);
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Titre du Plan</FormLabel>
              <FormControl>
                <Input placeholder="Plan Essentiel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix</FormLabel>
              <FormControl>
                <Input placeholder="€49" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minutes</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sessions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Séances (estimation)</FormLabel>
              <FormControl>
                <Input placeholder="2 à 3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre d'affichage</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Caractéristiques (une par ligne)</FormLabel>
              <FormControl>
                <Textarea placeholder="Hydromassage\nCollagen Boost..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="popular"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2">
              <div className="space-y-0.5">
                <FormLabel>Le plus populaire</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Marquer ce plan comme populaire pour le mettre en évidence.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enregistrement..." : "Sauvegarder"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
