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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown, Check, User, Mail, Calendar, Clock, CreditCard, Banknote, Sparkles, Store } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface UserProfile {
    id: string;
    display_name?: string | null;
    email?: string;
}

const formSchema = z.object({
  isGuest: z.boolean().default(false),
  userId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().or(z.literal('')),
  serviceId: z.string({ required_error: 'Veuillez sélectionner un service.' }),
  duration: z.coerce.number({ required_error: 'Veuillez sélectionner une durée.' }).min(1, "Veuillez sélectionner une durée."),
  paymentMethod: z.enum(['minutes', 'reception', 'card'], { required_error: 'Veuillez sélectionner un mode de paiement.' }),
}).superRefine((data, ctx) => {
  if (!data.isGuest && !data.userId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Veuillez sélectionner un client.",
      path: ["userId"],
    });
  }
  if (data.isGuest && !data.guestName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Veuillez entrer le nom du client.",
      path: ["guestName"],
    });
  }
});


export type AdminAppointmentFormValues = z.infer<typeof formSchema>;

interface AdminAppointmentFormProps {
  users: UserProfile[];
  services: Service[];
  onSubmit: (values: AdminAppointmentFormValues) => void;
  onCancel: () => void;
}

export function AdminAppointmentForm({ users, services, onSubmit, onCancel }: AdminAppointmentFormProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const form = useForm<AdminAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isGuest: false,
      userId: '',
      guestName: '',
      guestEmail: '',
      paymentMethod: 'reception',
    }
  });

  const isGuest = form.watch('isGuest');
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 py-4">
        
        {/* SECTION 1: QUI ? */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Client
                </h3>
                <FormField
                    control={form.control}
                    name="isGuest"
                    render={({ field }) => (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="guest-mode"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel htmlFor="guest-mode" className="text-xs cursor-pointer font-normal text-muted-foreground">
                                Mode Invité (Sans compte)
                            </FormLabel>
                        </div>
                    )}
                />
            </div>

            <Card className="border-dashed shadow-sm">
                <CardContent className="p-4 space-y-4">
                    {!isGuest ? (
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="sr-only">Client</FormLabel>
                                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between h-11",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value
                                                ? users.find(
                                                    (user) => user.id === field.value
                                                )?.display_name
                                                : "Rechercher un client..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Nom ou email..." />
                                            <CommandList>
                                                <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    <ScrollArea className="h-64">
                                                        {users.map((user) => (
                                                        <CommandItem
                                                            value={user.display_name || user.email}
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
                                                            <div className="flex flex-col">
                                                                <span>{user.display_name}</span>
                                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                                            </div>
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
                        <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <FormField
                                control={form.control}
                                name="guestName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Nom complet de l'invité" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="guestEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Email (optionnel)" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <Separator />

        {/* SECTION 2: QUOI ? */}
        <div className="space-y-4">
             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Service
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Type de soin</FormLabel>
                        <Select onValueChange={handleServiceChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir..." />
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

                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Durée</FormLabel>
                        <Select 
                            onValueChange={(value) => field.onChange(parseInt(value, 10))} 
                            value={String(field.value) || undefined}
                            disabled={!selectedServiceId}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={!selectedServiceId ? "Soin d'abord" : "Durée..."} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableDurations.map(tier => (
                                <SelectItem key={tier.duration} value={String(tier.duration)}>
                                    <div className="flex items-center justify-between w-full min-w-[120px]">
                                        <span>{tier.duration} min</span>
                                        <span className="text-muted-foreground font-medium">€{tier.price.toFixed(2)}</span>
                                    </div>
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        <Separator />

        {/* SECTION 3: COMMENT ? */}
        <div className="space-y-4">
             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Paiement
            </h3>
            
            <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                    >
                    <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value="reception" className="sr-only" />
                            </FormControl>
                            <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent transition-colors h-24 text-center">
                                <Store className="h-6 w-6 text-muted-foreground" />
                                <span className="font-medium text-sm">Réception</span>
                            </div>
                        </FormLabel>
                    </FormItem>
                    
                    <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value="minutes" className="sr-only" />
                            </FormControl>
                            <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent transition-colors h-24 text-center">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                                <span className="font-medium text-sm">Minutes d'Abonnement</span>
                            </div>
                        </FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>


        <div className="flex justify-end gap-3 pt-6 mt-auto">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90">
                {form.formState.isSubmitting ? (
                    <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" /> Création...
                    </>
                ) : (
                    <>
                        <Check className="mr-2 h-4 w-4" /> Confirmer le RDV
                    </>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}