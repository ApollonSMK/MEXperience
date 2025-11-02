'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMemo } from 'react';
import type { User } from '@/firebase/firestore/use-collection';
import type { Service } from '@/app/admin/services/page';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';

const formSchema = z.object({
  userId: z.string({ required_error: 'Selecione um cliente ou crie um novo.' }),
  serviceId: z.string({ required_error: 'Selecione um serviço.' }),
  duration: z.coerce.number({ required_error: 'Selecione uma duração.' }).min(1, "Selecione uma duração"),
  paymentMethod: z.enum(['minutes', 'reception'], { required_error: 'Selecione um método de pagamento.' }),
  // Guest fields, optional
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string().optional(),
}).refine(data => {
    if (data.userId === 'new-guest') {
        return !!data.guestName && !!data.guestEmail;
    }
    return true;
}, {
    message: "Nome e Email são obrigatórios para novos clientes.",
    path: ['guestName'], // You can point to a specific field
});


export type AdminAppointmentFormValues = z.infer<typeof formSchema>;

interface AdminAppointmentFormProps {
  users: User[];
  services: Service[];
  onSubmit: (values: AdminAppointmentFormValues) => void;
  onCancel: () => void;
}

export function AdminAppointmentForm({ users, services, onSubmit, onCancel }: AdminAppointmentFormProps) {
  const form = useForm<AdminAppointmentFormValues>({
    resolver: zodResolver(formSchema),
  });

  const selectedServiceId = form.watch('serviceId');
  const selectedUserId = form.watch('userId');

  const availableDurations = useMemo(() => {
    const service = services.find(s => s.id === selectedServiceId);
    return service ? service.pricingTiers : [];
  }, [selectedServiceId, services]);
  
  const handleServiceChange = (serviceId: string) => {
    form.setValue('serviceId', serviceId);
    form.setValue('duration', 0); // Reset duration when service changes
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Cliente</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                    >
                      {field.value === 'new-guest'
                        ? "Novo Cliente (Convidado)"
                        : field.value
                        ? users.find((user) => user.id === field.value)?.displayName
                        : "Selecione um cliente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Procurar cliente..." />
                    <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-48">
                                 <CommandItem
                                    value="new-guest"
                                    onSelect={() => form.setValue("userId", "new-guest")}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", field.value === "new-guest" ? "opacity-100" : "opacity-0")} />
                                    + Criar Novo Cliente (Convidado)
                                </CommandItem>
                                {users.map((user) => (
                                    <CommandItem
                                    value={user.displayName || user.email}
                                    key={user.id}
                                    onSelect={() => form.setValue("userId", user.id)}
                                    >
                                    <Check className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")} />
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
        
        {selectedUserId === 'new-guest' && (
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
                            <FormLabel>Telefone do Convidado</FormLabel>
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
