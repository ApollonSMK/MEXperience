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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  userId: z.string().min(1, { message: "Selecione um cliente ou crie um novo."}),
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const form = useForm<AdminAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      paymentMethod: 'reception',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
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
    form.resetField('userId');
    form.resetField('guestName');
    form.resetField('guestEmail');
    form.resetField('guestPhone');
    if (value === 'guest') {
      form.setValue('userId', 'new-guest');
    }
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

        {clientType === 'existing' ? (
             <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Cliente</FormLabel>
                     <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value
                                    ? users.find(
                                        (user) => user.id === field.value
                                    )?.displayName
                                    : "Selecione um cliente"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                            <Command>
                                <CommandInput placeholder="Pesquisar cliente..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                         <ScrollArea className="h-64">
                                            {users.map((user) => (
                                            <CommandItem
                                                value={user.displayName}
                                                key={user.id}
                                                onSelect={() => {
                                                    form.setValue("userId", user.id)
                                                    setPopoverOpen(false)
                                                }}
                                            >
                                                <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    user.id === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                                />
                                                {user.displayName} ({user.email})
                                            </CommandItem>
                                            ))}
                                        </ScrollArea>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
        ) : (
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
