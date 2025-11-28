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
import { ChevronsUpDown, Check, User, Mail, Calendar, Clock, CreditCard, Banknote, Sparkles, Store, X, Loader2 } from 'lucide-react';
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
import { format } from 'date-fns';

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

export interface Appointment {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string | null;
    service_name: string;
    date: string;
    duration: number;
    status: string;
    payment_method: string;
    payment_status?: string;
}

const formSchema = z.object({
  userId: z.string({ required_error: 'Veuillez sélectionner un client.' }).min(1, "Veuillez sélectionner un client."),
  serviceId: z.string({ required_error: 'Veuillez sélectionner un service.' }),
  duration: z.coerce.number({ required_error: 'Veuillez sélectionner une durée.' }).min(1, "Veuillez sélectionner une durée."),
  time: z.string({ required_error: "Veuillez sélectionner une heure." }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:mm)."),
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
  initialData?: Appointment | null;
}

export function AdminAppointmentForm({ users, services, plans, onSubmit, onCancel, allTimeSlots, initialTime, initialData }: AdminAppointmentFormProps) {
  const [localUsers, setLocalUsers] = useState<UserProfile[]>(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isClientCreatorOpen, setIsClientCreatorOpen] = useState(false);
  
  // Sync localUsers with props users when they update
  useEffect(() => {
    setLocalUsers(prev => {
        // If we have more users in props (e.g. realtime update), update local state
        // We preserve local additions if they aren't in props yet, but generally props should win eventually
        // For simplicity, let's just merge them or prefer props if the ID exists.
        // A simple strategy: Take all from props. If we added someone locally who isn't in props yet, keep them?
        // Actually, easiest is to just reset to users whenever users changes, BUT if we just created someone, 
        // we want to ensure they are there.
        // Let's just update localUsers to be users, but we might lose the optimistic update if we are not careful.
        // However, since handleClientCreated adds to localUsers, and later the realtime update comes, 
        // it should be fine to just setLocalUsers(users) IF the new user is already there or if we don't care about a flicker.
        // Better strategy for "Nom inconnu": Just trust localUsers for the form.
        // Let's merge:
        const propUserIds = new Set(users.map(u => u.id));
        const uniqueLocalOnly = prev.filter(u => !propUserIds.has(u.id));
        return [...users, ...uniqueLocalOnly];
    });
  }, [users]);

  const form = useForm<AdminAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      time: initialTime || '09:00',
    }
  });

  // Watch for validation
  const selectedUserId = form.watch('userId');
  const duration = form.watch('duration');
  
  const selectedUser = localUsers.find(u => u.id === selectedUserId);

  useEffect(() => {
    if (initialData) {
        const service = services.find(s => s.name === initialData.service_name);
        form.reset({
            userId: initialData.user_id,
            serviceId: service?.id || '',
            duration: initialData.duration,
            time: format(new Date(initialData.date), 'HH:mm'),
        });
    } else {
        form.reset({
            userId: '',
            serviceId: undefined,
            duration: undefined,
            time: initialTime || '09:00',
        });
    }
  }, [initialData, initialTime, form, services]);

  useEffect(() => {
    const filtered = localUsers.filter(user => 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, localUsers]);

  const selectedServiceId = form.watch('serviceId');
  
  const availableServices = useMemo(() => {
    return services.filter(s => !s.is_under_maintenance);
  }, [services]);

  const availableDurations = useMemo(() => {
    const service = services.find(s => s.id === selectedServiceId);
    return service?.pricing_tiers || [];
  }, [selectedServiceId, services]);
  
  const handleClientSelect = (user: UserProfile) => {
    form.setValue('userId', user.id);
    setIsClientSelectorOpen(false);
  };

  const handleClientCreated = (newUser: UserProfile) => {
      setLocalUsers(prev => [...prev, newUser]);
      form.setValue('userId', newUser.id);
      setIsClientCreatorOpen(false);
      setIsClientSelectorOpen(false);
  };

  const getSelectedUserName = () => {
    const userId = form.getValues('userId');
    if (!userId) return '';
    const user = localUsers.find(u => u.id === userId);
    return user?.display_name || user?.email || '';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 h-full">
        
        {/* SECTION 1: QUI ? */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Client
                </h3>
                <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="text-primary h-auto p-0 text-xs"
                    onClick={() => setIsClientCreatorOpen(true)}
                >
                    <UserPlus className="mr-1 h-3 w-3" /> Nouveau Client
                </Button>
            </div>

            <Card className="border-dashed shadow-sm">
                <CardContent className="p-3 space-y-3">
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
                                                className={cn("w-full justify-start text-left h-10 text-sm", !field.value && "text-muted-foreground")}
                                                onClick={() => setIsClientSelectorOpen(true)}
                                            >
                                                <User className="h-4 w-4 mr-2" />
                                                Sélectionner un client...
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-3 p-2 bg-accent/30 border rounded-md">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={localUsers.find(u => u.id === field.value)?.photo_url || undefined} alt="" />
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(localUsers.find(u => u.id === field.value)?.display_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="text-sm font-semibold truncate leading-tight">
                                                        {getSelectedUserName()}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        {localUsers.find(u => u.id === field.value)?.email}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0 rounded-sm">
                                                            {localUsers.find(u => u.id === field.value)?.minutes_balance || 0} min
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => {
                                                        form.setValue('userId', '');
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                </CardContent>
            </Card>
        </div>

        <Separator className="my-1" />
        
        {/* SECTION 2: QUOI & QUAND ? */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
                 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" /> Service
                </h3>
                 <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                const s = services.find(x => x.id === val);
                                if (s && s.pricing_tiers && s.pricing_tiers.length > 0) {
                                    form.setValue('duration', s.pricing_tiers[0].duration);
                                } else {
                                    form.setValue('duration', 0);
                                }
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableServices.map((service) => (
                                        <SelectItem key={service.id} value={service.id} className="text-sm">
                                            {service.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-3">
                 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Horaire
                </h3>
                <div className="flex gap-2">
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Heure" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="h-[200px]">
                                        {allTimeSlots.map((time) => (
                                            <SelectItem key={time} value={time} className="text-sm">
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem className="w-24">
                                <Select
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={String(field.value)}
                                    disabled={availableDurations.length === 0}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Durée" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableDurations.map((tier) => (
                                            <SelectItem key={tier.duration} value={String(tier.duration)} className="text-sm">
                                                {tier.duration} min
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>

         <Separator className="my-1" />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-6 mt-auto border-t bg-background sticky bottom-0 z-10 -mx-6 px-6 pb-4">
            <Button type="button" variant="outline" onClick={onCancel} className="h-9 text-xs">
                Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="h-9 text-xs">
                {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        {initialData ? 'Modification...' : 'Création...'}
                    </>
                ) : (
                    <>
                        <Check className="mr-2 h-3.5 w-3.5" />
                        {initialData ? 'Confirmer la modification' : 'Confirmer'}
                    </>
                )}
            </Button>
        </div>
      </form>

      {/* Client Selector Sheet */}
      <Sheet open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
        <SheetContent 
            className="w-full sm:max-w-[500px] md:max-w-[600px] p-0 [&>button]:hidden border-l shadow-2xl h-full flex flex-col overflow-hidden sm:border-r-0 lg:mr-[32rem] xl:mr-[36rem]" 
            side="right"
        >
            <SheetHeader className="sr-only">
                <SheetTitle>Sélectionner un client</SheetTitle>
                <SheetDescription>Rechercher et sélectionner un client existant</SheetDescription>
            </SheetHeader>
            <AdminClientSelector
                users={localUsers}
                plans={plans}
                onSelect={handleClientSelect}
                onClose={() => setIsClientSelectorOpen(false)}
                selectedUserId={form.getValues('userId')}
            />
        </SheetContent>
      </Sheet>

       {/* Client Creator Sheet */}
       <Sheet open={isClientCreatorOpen} onOpenChange={setIsClientCreatorOpen}>
        <SheetContent 
            className="w-full sm:max-w-[500px] p-0 border-l shadow-2xl sm:border-r-0 lg:mr-[32rem] xl:mr-[36rem]" 
            side="right"
        >
             <SheetHeader className="sr-only">
                <SheetTitle>Créer un nouveau client</SheetTitle>
                <SheetDescription>Formulaire de création rapide de client</SheetDescription>
             </SheetHeader>
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