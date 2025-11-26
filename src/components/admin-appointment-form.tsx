'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useMemo, useState } from 'react';
import type { Service } from '@/app/admin/services/page';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown, Check, User, Mail, Calendar, Clock, CreditCard, Banknote, Sparkles, Store, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AdminClientSelector } from './admin-client-selector';
import { AdminClientCreator } from './admin-client-creator';
import { UserPlus } from 'lucide-react';

export interface UserProfile {
    id: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
    photo_url?: string;
    phone?: string;
    plan_id?: string;
    minutes_balance?: number;
    is_admin?: boolean;
}

export interface Plan {
    id: string;
    title: string;
    price: string;
    period: string;
    minutes: number;
    sessions: string;
    features: string[];
    benefits: any;
    popular: boolean;
    order: number;
    pricePerMinute?: number;
    stripe_price_id?: string;
}

const formSchema = z.object({
  userId: z.string({ required_error: 'Veuillez sélectionner un client.' }).min(1, "Veuillez sélectionner un client."),
  serviceId: z.string({ required_error: 'Veuillez sélectionner un service.' }),
  duration: z.coerce.number({ required_error: 'Veuillez sélectionner une durée.' }).min(1, "Veuillez sélectionner une durée."),
  paymentMethod: z.enum(['minutes', 'reception', 'card'], { required_error: 'Veuillez sélectionner un mode de paiement.' }),
  time: z.string({ required_error: "Veuillez sélectionner une heure." }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:mm)."),
}).superRefine((data, ctx) => {
   // Custom validation logic moved to component for access to user balance
});


export type AdminAppointmentFormValues = z.infer<typeof formSchema>;

interface AdminAppointmentFormProps {
  users: UserProfile[];
  services: Service[];
  plans: Plan[];
  onSubmit: (values: AdminAppointmentFormValues) => void;
  onCancel: () => void;
  allTimeSlots: string[];
  initialTime?: string;
}

export function AdminAppointmentForm({ users, services, plans, onSubmit, onCancel, allTimeSlots, initialTime }: AdminAppointmentFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isClientCreatorOpen, setIsClientCreatorOpen] = useState(false);
  
  const form = useForm<AdminAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      paymentMethod: 'reception',
      time: initialTime || '09:00',
    }
  });

  // Watch for validation
  const selectedUserId = form.watch('userId');
  const paymentMethod = form.watch('paymentMethod');
  const duration = form.watch('duration');
  
  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    // Validate Minutes Balance dynamically
    if (paymentMethod === 'minutes' && selectedUser && duration > 0) {
         const balance = selectedUser.minutes_balance || 0;
         if (balance < duration) {
             form.setError('paymentMethod', { 
                 type: 'manual', 
                 message: `Solde insuffisant (${balance} min disponibles vs ${duration} min requises).` 
             });
         } else {
             form.clearErrors('paymentMethod');
         }
    } else {
        form.clearErrors('paymentMethod');
    }
  }, [paymentMethod, selectedUser, duration, form]);

  useEffect(() => {
    if (initialTime) {
      form.reset({ ...form.getValues(), time: initialTime });
    }
  }, [initialTime, form]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

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

  const handleClientSelect = (user: UserProfile) => {
    form.setValue('userId', user.id);
    setIsClientSelectorOpen(false);
  };

  const handleClientCreated = (newUser: UserProfile) => {
      // Add to local list logic should be handled by parent, but here we assume parent updates 'users' prop or we just select it
      // For now, we set the ID. The parent needs to refresh the user list ideally, 
      // but since we get 'users' as prop, we might need to rely on the parent refreshing or passing the new user.
      // However, we can set the value and close the sheet.
      form.setValue('userId', newUser.id);
      setIsClientCreatorOpen(false);
      setIsClientSelectorOpen(false);
  };

  const getSelectedUserName = () => {
    const userId = form.getValues('userId');
    if (!userId) return '';
    const user = users.find(u => u.id === userId);
    return user?.display_name || user?.email || '';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 h-full">
        
        {/* SECTION 1: QUI ? */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Client
                </h3>
                <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="text-primary h-auto p-0"
                    onClick={() => setIsClientCreatorOpen(true)}
                >
                    <UserPlus className="mr-1 h-3 w-3" /> Nouveau Client
                </Button>
            </div>

            <Card className="border-dashed shadow-sm">
                <CardContent className="p-4 space-y-4">
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <div className="space-y-2">
                                        {!field.value ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn("w-full justify-start text-left h-12", !field.value && "text-muted-foreground")}
                                                onClick={() => setIsClientSelectorOpen(true)}
                                            >
                                                <User className="h-4 w-4 mr-2" />
                                                Sélectionner un client...
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 bg-accent/30 border rounded-md">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={users.find(u => u.id === field.value)?.photo_url || ''} alt="" />
                                                    <AvatarFallback>
                                                        {getInitials(users.find(u => u.id === field.value)?.display_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="text-sm font-semibold truncate">
                                                        {getSelectedUserName()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {users.find(u => u.id === field.value)?.email}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                            {users.find(u => u.id === field.value)?.minutes_balance || 0} min
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        form.setValue('userId', '');
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                </CardContent>
            </Card>
        </div>

        <Separator />

        {/* SECTION 2: QUOI ? */}
        <div className="space-y-4">
             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Service
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                        <FormItem className="col-span-1 sm:col-span-2">
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
                        <FormItem className="col-span-1">
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
                <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>Heure</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une heure..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <ScrollArea className="h-64">
                                        {allTimeSlots.map(slot => (
                                            <SelectItem key={slot} value={slot}>
                                                {slot}
                                            </SelectItem>
                                        ))}
                                    </ScrollArea>
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
                        <FormLabel className={cn(
                            "[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer",
                            // Disable visually if balance insufficient
                             paymentMethod === 'minutes' && form.formState.errors.paymentMethod && "opacity-70"
                        )}>
                            <FormControl>
                                <RadioGroupItem value="minutes" className="sr-only" />
                            </FormControl>
                            <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent transition-colors h-24 text-center relative overflow-hidden">
                                {selectedUser && (selectedUser.minutes_balance || 0) < duration && (
                                     <div className="absolute inset-x-0 top-0 bg-destructive text-destructive-foreground text-[10px] py-0.5 text-center">
                                         Insuffisant ({selectedUser.minutes_balance} min)
                                     </div>
                                )}
                                <Clock className="h-6 w-6 text-muted-foreground" />
                                <span className="font-medium text-sm">Minutes</span>
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


        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 mt-auto border-t bg-background sticky bottom-0 z-10">
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

      {/* Client Selector Sheet */}
      <Sheet open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen} modal={false}>
        <SheetContent 
            className="w-full sm:max-w-[800px] p-0 [&>button]:hidden sm:mr-[36rem] border-r-0 shadow-xl" 
            side="right"
        >
            <SheetHeader className="sr-only">
                <SheetTitle>Sélectionner un client</SheetTitle>
                <SheetDescription>Rechercher et sélectionner un client existant</SheetDescription>
            </SheetHeader>
            <AdminClientSelector
                users={users}
                plans={plans}
                onSelect={handleClientSelect}
                onClose={() => setIsClientSelectorOpen(false)}
                selectedUserId={form.getValues('userId')}
            />
        </SheetContent>
      </Sheet>

       {/* Client Creator Sheet */}
       <Sheet open={isClientCreatorOpen} onOpenChange={setIsClientCreatorOpen} modal={false}>
        <SheetContent 
            className="w-full sm:max-w-[500px] p-0 border-r-0 shadow-xl sm:mr-[36rem]" 
            side="right"
        >
             <AdminClientCreator 
                onSuccess={handleClientCreated}
                onCancel={() => setIsClientCreatorOpen(false)}
             />
        </SheetContent>
      </Sheet>
    </Form>
  );
}

// Helper function moved outside component
const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};