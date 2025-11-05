'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMemo, useState } from 'react';
import type { Service } from '@/app/admin/services/page';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface UserProfile {
    id: string;
    display_name?: string;
    email?: string;
}

const formSchema = z.object({
  userId: z.string().min(1, { message: "Veuillez sélectionner un client ou en créer un nouveau."}),
  serviceId: z.string({ required_error: 'Veuillez sélectionner un service.' }),
  duration: z.coerce.number({ required_error: 'Veuillez sélectionner une durée.' }).min(1, "Veuillez sélectionner une durée."),
  paymentMethod: z.enum(['minutes', 'reception', 'card'], { required_error: 'Veuillez sélectionner un mode de paiement.' }),
  guestName: z.string().optional(),
  guestEmail: z.string().email({ message: "L'e-mail du client invité est invalide."}).optional().or(z.literal('')),
  guestPhone: z.string().optional(),
}).refine(data => {
    if (data.userId === 'new-guest') {
        return !!data.guestName && !!data.guestEmail;
    }
    return true;
}, {
    message: "Le nom et l'e-mail sont obligatoires pour les nouveaux clients invités.",
    path: ['guestName'],
});


export type AdminAppointmentFormValues = z.infer<typeof formSchema>;

interface AdminAppointmentFormProps {
  users: UserProfile[];
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
  
  const availableServices = useMemo(() => {
    return services.filter(s => !s.is_under_maintenance);
  }, [services]);

  const availableDurations = useMemo(() => {
    const service = services.find(s => s.id === selectedServiceId);
    return service?.pricing_tiers || [];
  }, [selectedServiceId, services]);
  
  const handleServiceChange = (serviceId: string) => {
    form.setValue('serviceId', serviceId);
    form.setValue('duration', 0); // Reset duration when service changes
  };
  
  const handleClientTypeChange = (value: string) => {
    const newClientType = value as 'existing' | 'guest';
    setClientType(newClientType);
    // Reset relevant fields when changing client type
    form.resetField('userId');
    form.resetField('guestName');
    form.resetField('guestEmail');
    form.resetField('guestPhone');
    if (newClientType === 'guest') {
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
            <FormLabel>Type de Client</FormLabel>
            <RadioGroup
              onValueChange={handleClientTypeChange}
              defaultValue={clientType}
              className="flex space-x-4"
            >
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="existing" id="existing"/>
                </FormControl>
                <FormLabel htmlFor="existing" className="font-normal">Client Existant</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="guest" id="guest"/>
                </FormControl>
                <FormLabel htmlFor="guest" className="font-normal">Client Invité</FormLabel>
              </FormItem>
            </RadioGroup>
        </FormItem>

        {clientType === 'existing' ? (
             <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Client</FormLabel>
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
                                    )?.display_name
                                    : "Sélectionnez un client"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                            <Command>
                                <CommandInput placeholder="Rechercher un client..." />
                                <CommandList>
                                    <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                                    <CommandGroup>
                                         <ScrollArea className="h-64">
                                            {users.map((user) => (
                                            <CommandItem
                                                value={user.display_name || user.email || ''}
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
                                                {user.display_name} ({user.email})
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
                            <FormLabel>Nom du Client Invité</FormLabel>
                            <FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="guestEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail du Client Invité</FormLabel>
                            <FormControl><Input placeholder="jean@exemple.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="guestPhone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Téléphone du Client Invité (Optionnel)</FormLabel>
                            <FormControl><Input placeholder="+33 1 23 45 67 89" {...field} /></FormControl>
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
              <FormLabel>Service</FormLabel>
              <Select onValueChange={handleServiceChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableServices.map(service => (
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
                <FormLabel>Durée</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value) || undefined}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une durée" />
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
              <FormLabel>Mode de Paiement</FormLabel>
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
                    <FormLabel className="font-normal">Payer à la Réception</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="minutes" />
                    </FormControl>
                    <FormLabel className="font-normal">Utiliser les Minutes d'Abonnement</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Planification..." : "Planifier"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
