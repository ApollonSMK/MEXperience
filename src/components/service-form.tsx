'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

const serviceSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  durations: z.string().min(1, 'Pelo menos uma duração é obrigatória.').regex(/^\d+(,\s*\d+)*$/, 'As durações devem ser números separados por vírgulas (ex: 15, 30, 45).'),
  order: z.coerce.number().int(),
  pricePerMinute: z.coerce.number().min(0, 'O preço por minuto deve ser um número positivo.'),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSubmit: (values: ServiceFormValues) => void;
  initialData?: Partial<ServiceFormValues & { durations: number[] | string }> | null;
  onCancel: () => void;
}

export function ServiceForm({ onSubmit, initialData, onCancel }: ServiceFormProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      durations: '',
      order: 0,
      pricePerMinute: 0,
      ...initialData,
      durations: Array.isArray(initialData?.durations) ? initialData.durations.join(', ') : '',
    },
  });

  useEffect(() => {
    const values = {
        ...initialData,
        durations: Array.isArray(initialData?.durations) ? initialData.durations.join(', ') : '',
    }
    form.reset(values);
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
          name="durations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durações (em minutos, separadas por vírgula)</FormLabel>
              <FormControl>
                <Input placeholder="15, 30, 45" {...field} />
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
              <FormLabel>Ordem de Exibição</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pricePerMinute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço por Minuto (para não subscritos)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="2.50" {...field} />
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
