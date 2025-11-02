'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMemo, useState } from 'react';
import type { User } from '@/firebase/firestore/use-collection';
import type { Service } from '@/app/admin/services/page';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  userId: z.string().optional(),
  serviceId: z.string({ required_error: 'Selecione um serviço.' }),
  duration: z.coerce.number({ required_error: 'Selecione uma duração.' }).min(1, "Selecione uma duração"),
  paymentMethod: z.enum(['minutes', 'reception'], { required_error: 'Selecione um método de pagamento.' }),
  guestName: z.string().optional(),
  guestEmail: z.string().email({ message: "Email de convidado inválido."}).optional().or(z.literal('')),
  guestPhone: z.string().optional(),
}).refine(data => {
    if (data.userId === 'new-guest') {
        return !!data.guestName && !!data.guestEmail;
    }
    return true;
}, {
    message: "Nome e Email são obrigatórios para novos clientes convidados.",
    path: ['guestName'],
}).refine(data => {
    // If client type is 'existing', a userId must be selected
    if (data.userId !== 'new-guest' && !data.userId) {
        return false;
    }
    return true;
}, {
    message: "Por favor, selecione um cliente existente.",
    path: ['userId'],
});


export type AdminAppointmentFormValues = z.infer<typeof formSchema>;

interface AdminAppointmentFormProps {
  users: User[];
  services: Service[];
  onSubmit: (values: AdminAppointmentFormValues) => void;
  onCancel: () => void;
}

export function AdminAppointmentForm({ users, services, onSubmit, onCancel }: AdminAppointmentFormProps) {
  const [clientType, setClientType] = useState<'existing' | 'guest'>('existing');
  
  const form = useForm<AdminAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: 'reception',
    }
  });

  const selectedServiceId = form.watch('serviceId');

  const availableDurations = useMemo(() => {
    const service = services.find(s => s.id === selectedServiceId);
    return service ? service.pricingTiers : [];
  }, [selectedServiceId, services]);
  
  const handleServiceChange = (serviceId: string) => {
    form.setValue('serviceId', serviceId);
    form.setValue('duration', 0); // Reset duration when service changes
  };
  
  const handleClientTypeChange = (value: 'existing' | 'guest') => {
    setClientType(value);
    // Reset relevant fields when changing client type
    form.setValue('userId', value === 'guest' ? 'new-guest' : undefined);
    form.setValue('guestName', '');
    form.setValue('guestEmail', '');
    form.setValue('guestPhone', '');
    form.clearErrors();
  }

  function internalOnSubmit(values: AdminAppointmentFormValues) {
    onSubmit(values);
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(internalOnSubmit)} className="space-y-6 py-4">
        
        <FormItem>
            <FormLabel>Tipo de Cliente</FormLabel>
            <RadioGroup
              onValueChange={handleClientTypeChange}
              defaultValue={clientType}
              className="flex space-x-4"
            >
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="existing" id="existing"/>
                </FormControl>
                <FormLabel htmlFor="existing" className="font-normal">Cliente Existente</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="guest" id="guest"/>
                </FormControl>
                <FormLabel htmlFor="guest" className="font-normal">Cliente Convidado</FormLabel>
              </FormItem>
            </RadioGroup>
        </FormItem>


        {clientType === 'existing' && (
             <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cliente</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente existente" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <ScrollArea className="h-64">
                                {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.displayName} ({user.email})
                                </SelectItem>
                                ))}
                           </ScrollArea>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        
        {clientType === 'guest' && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Convidado</FormLabel>
                            <FormControl><Input placeholder="João Silva" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="guestEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email do Convidado</FormLabel>
                            <FormControl><Input placeholder="joao@exemplo.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="guestPhone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone do Convidado (Opcional)</FormLabel>
                            <FormControl><Input placeholder="+351 912 345 678" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select onValueChange={handleServiceChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedServiceId && (
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Duração</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value) || undefined}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione uma duração" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {availableDurations.map(tier => (
                        <SelectItem key={tier.duration} value={String(tier.duration)}>
                            {tier.duration} min (€{tier.price.toFixed(2)})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
        
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Método de Pagamento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="reception" />
                    </FormControl>
                    <FormLabel className="font-normal">Pagar na Recepção</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="minutes" />
                    </FormControl>
                    <FormLabel className="font-normal">Usar Minutos da Subscrição</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "A agendar..." : "Agendar"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
