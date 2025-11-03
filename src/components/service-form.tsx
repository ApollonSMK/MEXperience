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

const pricingTierSchema = z.object({
  duration: z.coerce.number().int().min(1, 'A duração deve ser positiva.'),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
});

const serviceSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "A cor deve ser um código hexadecimal válido (ex: #RRGGBB)."),
  pricingTiers: z.array(pricingTierSchema).min(1, 'Adicione pelo menos um nível de preço.'),
  order: z.coerce.number().int(),
  isUnderMaintenance: z.boolean().default(false),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSubmit: (values: ServiceFormValues) => void;
  initialData?: Partial<ServiceFormValues> | null;
  onCancel: () => void;
}

export function ServiceForm({ onSubmit, initialData, onCancel }: ServiceFormProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3b82f6',
      pricingTiers: [],
      order: 0,
      isUnderMaintenance: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pricingTiers',
  });

  useEffect(() => {
    form.reset({
      name: '',
      description: '',
      color: '#3b82f6',
      pricingTiers: [],
      order: 0,
      isUnderMaintenance: false,
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
              <FormLabel>Nome do Serviço</FormLabel>
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o serviço..." {...field} />
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
              <FormLabel>Cor do Serviço</FormLabel>
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
          <FormLabel>Níveis de Preço</FormLabel>
          <div className="space-y-4 mt-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <FormField
                  control={form.control}
                  name={`pricingTiers.${index}.duration`}
                  render={({ field }) => (
                    <FormItem className="col-span-5">
                      <FormLabel className="sr-only">Duração</FormLabel>
                      <Input type="number" placeholder="Duração (min)" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`pricingTiers.${index}.price`}
                  render={({ field }) => (
                    <FormItem className="col-span-5">
                      <FormLabel className="sr-only">Preço</FormLabel>
                      <Input type="number" step="0.01" placeholder="Preço (€)" {...field} />
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
                        <span className="sr-only">Remover nível</span>
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
            Adicionar Nível de Preço
          </Button>
           <FormMessage>{form.formState.errors.pricingTiers?.message}</FormMessage>
        </div>

        <Separator />
         <FormField
          control={form.control}
          name="isUnderMaintenance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Modo de Manutenção</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Se ativo, este serviço não poderá ser agendado.
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
              <FormLabel>Ordem de Exibição</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
