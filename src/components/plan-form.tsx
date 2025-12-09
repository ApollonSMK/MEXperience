
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
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Service } from '@/app/admin/services/page';
import { ScrollArea } from './ui/scroll-area';

const planSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  price: z.string().regex(/^€\d+$/, "Le prix doit être au format '€50'."),
  period: z.string().min(1, 'La période est requise (ex: /mois).'),
  minutes: z.coerce.number().int().min(1, 'Les minutes doivent être un nombre positif.'),
  sessions: z.string().min(1, 'Les sessions sont requises (ex: 2 à 3).'),
  features: z.string().min(1, 'Au moins une caractéristique est requise.'), // Visual description
  popular: z.boolean().default(false),
  order: z.coerce.number().int(),
  stripe_price_id: z.string().startsWith('price_', { message: "L'ID doit commencer par 'price_'." }).min(1, "Le Stripe Price ID est requis."),
  // Invisible benefits
  includedServices: z.array(z.string()).default([]),
  guestPassesQuantity: z.coerce.number().int().min(0).default(0),
  guestPassesPeriod: z.enum(['week', 'month']).default('month'),
  productDiscount: z.coerce.number().int().min(0).max(100).default(0),
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  onSubmit: (values: PlanFormValues) => void;
  initialData?: any | null;
  onCancel: () => void;
  availableServices: Service[];
}

const createSlug = (title: string) => {
    return title
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
};

export function PlanForm({ onSubmit, initialData, onCancel, availableServices }: PlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: '',
      slug: '',
      price: '€',
      period: '/mois',
      minutes: 0,
      sessions: '',
      features: '',
      popular: false,
      order: 0,
      stripe_price_id: '',
      includedServices: [],
      guestPassesQuantity: 0,
      guestPassesPeriod: 'month',
      productDiscount: 0,
    },
  });

  const title = form.watch('title');
  useEffect(() => {
      if (title) {
          form.setValue('slug', createSlug(title));
      }
  }, [title, form]);


  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        slug: initialData.id, // The ID from the DB is the slug
        features: Array.isArray(initialData.features) ? initialData.features.join('\n') : '',
        includedServices: initialData.benefits?.includedServices || [],
        guestPassesQuantity: initialData.benefits?.guestPasses?.quantity || 0,
        guestPassesPeriod: initialData.benefits?.guestPasses?.period || 'month',
        productDiscount: initialData.benefits?.productDiscount || 0,
      });
    } else {
        form.reset({
            title: '', price: '€', period: '/mois', minutes: 0, sessions: '', features: '',
            popular: false, order: 0, stripe_price_id: '', includedServices: [], guestPassesQuantity: 0,
            guestPassesPeriod: 'month', productDiscount: 0,
        });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        
        <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name="slug"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                            <FormLabel>Slug (URL)</FormLabel>
                            <FormControl>
                                <Input placeholder="plan-essentiel" {...field} disabled />
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
                </div>
                
                {/* Visible Features */}
                <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Caractéristiques Visibles (une par ligne)</FormLabel>
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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

                <Separator />
                
                {/* Stripe Integration */}
                <div className="space-y-4">
                     <h3 className="text-lg font-medium">Intégration Stripe</h3>
                     <FormField
                        control={form.control}
                        name="stripe_price_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Stripe Price ID</FormLabel>
                            <FormControl>
                                <Input placeholder="price_1PISZqEw2ZItA8vCjS8d6A5s" {...field} />
                            </FormControl>
                             <p className="text-xs text-muted-foreground">
                                Copiez l'ID du Prix depuis votre produit sur le dashboard Stripe.
                            </p>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>


                <Separator />

                {/* Invisible Benefits */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bénéfices du Plan (Logique Interne)</h3>
                    
                    <FormField
                        control={form.control}
                        name="includedServices"
                        render={() => (
                            <FormItem>
                                <FormLabel>Serviços Incluídos</FormLabel>
                                <div className="p-4 border rounded-md max-h-48 overflow-y-auto">
                                    <FormField
                                        key="all-services"
                                        control={form.control}
                                        name="includedServices"
                                        render={({ field }) => {
                                            return (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes('all')}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange(['all', ...availableServices.map(s => s.id)])
                                                                    : field.onChange(field.value?.filter(id => id === 'all' ? false : availableServices.find(s => s.id === id) === undefined));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-primary">
                                                        Accès à tous les services
                                                    </FormLabel>
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {availableServices.map((service) => (
                                        <FormField
                                            key={service.id}
                                            control={form.control}
                                            name="includedServices"
                                            render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={service.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(service.id)}
                                                        onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), service.id])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                (value) => value !== service.id
                                                                )
                                                            )
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {service.name}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                            }}
                                        />
                                        ))}
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="guestPassesQuantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Convidados</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="guestPassesPeriod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Período (Convidados)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um período" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="week">por Semana</SelectItem>
                                            <SelectItem value="month">por Mês</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="productDiscount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Desconto em Produtos (%)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </ScrollArea>
        
        <Separator />

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enregistrement..." : "Sauvegarder"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
