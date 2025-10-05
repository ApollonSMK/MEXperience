
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Loader2, Save } from 'lucide-react';
import type { OperatingHours } from '@/types/operating-hours';
import { useToast } from '@/hooks/use-toast';
import { updateOperatingHours } from '@/app/admin/actions';

const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const operatingHoursSchema = z.object({
  hours: z.array(
    z.object({
      id: z.number(),
      day_of_week: z.number().min(0).max(6),
      start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Formato de hora inválido (HH:mm)"),
      end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Formato de hora inválido (HH:mm)"),
      interval_minutes: z.coerce.number().int().positive(),
      is_active: z.boolean(),
    })
  ),
});

type FormValues = z.infer<typeof operatingHoursSchema>;

interface OperatingHoursClientProps {
  initialHours: OperatingHours[];
}

export function OperatingHoursClient({ initialHours }: OperatingHoursClientProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(operatingHoursSchema),
    defaultValues: {
      hours: initialHours,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'hours',
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const result = await updateOperatingHours(data.hours);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Horários Atualizados',
        description: 'Os horários de funcionamento foram guardados com sucesso.',
      });
    } else {
      toast({
        title: 'Erro ao Atualizar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-accent" />
          <div>
            <CardTitle>Horários de Funcionamento</CardTitle>
            <CardDescription>Defina os horários em que os agendamentos estão disponíveis.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/50">
                 <div className="flex items-center justify-between">
                   <h4 className="font-semibold text-lg">{daysOfWeek[field.day_of_week]}</h4>
                   <FormField
                        control={form.control}
                        name={`hours.${index}.is_active`}
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                 <FormLabel className="text-sm">
                                    {field.value ? 'Aberto' : 'Fechado'}
                                </FormLabel>
                            </FormItem>
                        )}
                    />
                 </div>

                {form.watch(`hours.${index}.is_active`) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`hours.${index}.start_time`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abertura</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`hours.${index}.end_time`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecho</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`hours.${index}.interval_minutes`}
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Intervalo</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value)}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {[15, 30, 45, 60].map(val => (
                                        <SelectItem key={val} value={String(val)}>{val} min</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Guardar...
                </>
              ) : (
                <>
                    <Save className="mr-2 h-4 w-4" /> Guardar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
