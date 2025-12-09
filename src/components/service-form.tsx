'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { useRouter } from 'next/navigation';

const pricingTierSchema = z.object({
  duration: z.coerce.number().int().min(1, 'La durée doit être positive.'),
  price: z.coerce.number().min(0, 'Le prix ne peut pas être négatif.'),
});

const serviceSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  description: z.string().min(1, 'La description est requise.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "La couleur doit être un code hexadécimal valide (ex: #RRGGBB)."),
  pricing_tiers: z.array(pricingTierSchema).min(1, 'Ajoutez au moins un niveau de prix.'),
  order: z.coerce.number().int(),
  is_under_maintenance: z.boolean().default(false),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  initialData?: Partial<ServiceFormValues> | null;
}

export function ServiceForm({ onSubmit, initialData }: ServiceFormProps) {
  const router = useRouter();
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3b82f6',
      pricing_tiers: [],
      order: 0,
      is_under_maintenance: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pricing_tiers',
  });

  useEffect(() => {
    form.reset({
      name: '',
      description: '',
      color: '#3b82f6',
      pricing_tiers: [],
      order: 0,
      is_under_maintenance: false,
      ...initialData,
    });
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Service</FormLabel>
              <FormControl>
                <Input placeholder="Hydromassage" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Décrivez le service..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur du Service</FormLabel>
              <FormControl>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-12 h-10 p-1" {...field} />
                    <Input type="text" placeholder="#3b82f6" {...field} />
                  </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Niveaux de Prix</FormLabel>
          <div className="mt-2 grid grid-cols-12 gap-2">
              <div className="col-span-5"><p className="text-sm font-medium text-muted-foreground">Durée (min)</p></div>
              <div className="col-span-5"><p className="text-sm font-medium text-muted-foreground">Prix (€)</p></div>
          </div>
          <div className="space-y-2 mt-1">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`pricing_tiers.${index}.duration`}
                  render={({ field }) => (
                    <FormItem className="col-span-5">
                      <FormControl>
                        <Input type="number" placeholder="Durée" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`pricing_tiers.${index}.price`}
                  render={({ field }) => (
                    <FormItem className="col-span-5">
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Prix" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer niveau</span>
                    </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => append({ duration: 0, price: 0 })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un Niveau de Prix
          </Button>
           <FormMessage>{form.formState.errors.pricing_tiers?.root?.message || form.formState.errors.pricing_tiers?.message}</FormMessage>
        </div>

        <Separator />
         <FormField
          control={form.control}
          name="is_under_maintenance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Mode Maintenance</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Si activé, ce service ne pourra pas être réservé.
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
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/services')}>Annuler</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
        </div>
      </form>
    </Form>
  );
}