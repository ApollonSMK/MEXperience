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
import { ChevronsUpDown, Check, User, Mail, Calendar, Clock, CreditCard, Banknote, Sparkles, Store, X, Loader2, Search, ChevronRight, PlusCircle, Footprints, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { UserPlus, Ban, Lock } from 'lucide-react';
import { format, addMinutes, differenceInMinutes, parse } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/types/appointment';

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
  // Changed to array for multi-select
  serviceIds: z.array(z.string()).min(1, "Veuillez sélectionner au moins un service."),
  // Duration is now calculated derived, but we keep it for validation if needed, or remove.
  // We will pass the specific duration for each service in the onSubmit payload manually.
  time: z.string({ required_error: "Veuillez sélectionner une heure." }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:mm)."),
  type: z.enum(['appointment', 'blocked']).default('appointment'),
  blockReason: z.string().optional(),
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
  preselectedUserId?: string; // NEW PROP
  onDelete?: (app: Appointment) => void;
  onCancelAppt?: (app: Appointment) => void;
  onPay?: (app: Appointment) => void;
}

export function AdminAppointmentForm({ users, services, plans, onSubmit, onCancel, allTimeSlots, initialTime, initialData, preselectedUserId, onDelete, onCancelAppt, onPay }: AdminAppointmentFormProps) {
  const { toast } = useToast();
  const [localUsers, setLocalUsers] = useState<UserProfile[]>(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  
  // Controls whether we are showing the list of clients or the summary/placeholder
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  
  const [isClientCreatorOpen, setIsClientCreatorOpen] = useState(false);
  
  // State para controlar o modo (Appointment vs Block)
  const [formType, setFormType] = useState<'appointment' | 'blocked'>('appointment');
  
  // Custom State for Multi-Service Selection
  // Map of ServiceID -> Duration (allows user to customize duration per selected service if needed, defaults to tier 1)
  const [selectedServicesMap, setSelectedServicesMap] = useState<Map<string, number>>(new Map());

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
      serviceIds: [],
      time: initialTime || '09:00',
    }
  });

  // Watch for validation
  const selectedUserId = form.watch('userId');
  
  const selectedUser = localUsers.find(u => u.id === selectedUserId);

  useEffect(() => {
    if (initialData) {
        const isBlocked = initialData.payment_method === 'blocked';
        setFormType(isBlocked ? 'blocked' : 'appointment');
        
        // Robust service matching (case insensitive)
        const service = services.find(s => 
            s.name === initialData.service_name || 
            s.name.toLowerCase().trim() === initialData.service_name.toLowerCase().trim()
        );
        
        // Initialize Map
        const map = new Map();
        if (service) map.set(service.id, initialData.duration);
        setSelectedServicesMap(map);

        form.reset({
            type: isBlocked ? 'blocked' : 'appointment',
            userId: initialData.user_id,
            serviceIds: isBlocked ? ['blocked-placeholder'] : (service ? [service.id] : []),
            time: format(new Date(initialData.date), 'HH:mm'),
            blockReason: isBlocked ? initialData.service_name : undefined,
        });
    } else {
        setSelectedServicesMap(new Map());
        form.reset({
            type: 'appointment',
            userId: preselectedUserId || '',
            serviceIds: [],
            time: initialTime || '09:00',
            blockReason: '',
        });
        setFormType('appointment');
    }
  }, [initialData, initialTime, form, services, preselectedUserId]);

  // Efeito para ajustar validação "fake" quando mudar o tipo
  // O Zod schema exige userId e serviceIds.
  useEffect(() => {
      form.setValue('type', formType);
      if (formType === 'blocked') {
          form.setValue('userId', 'blocked-admin-placeholder'); 
          form.setValue('serviceIds', ['blocked-service-placeholder']);
          if (!form.getValues('blockReason')) {
             form.setValue('blockReason', 'Indisponible');
          }
          // Duration logic for blocked handled separately in submit
      } else if (!initialData) {
          // Reset if switching back
          if (form.getValues('userId') === 'blocked-admin-placeholder') {
              form.setValue('userId', preselectedUserId || '');
          }
          if (form.getValues('serviceIds')?.[0] === 'blocked-service-placeholder') form.setValue('serviceIds', []);
      }
  }, [formType, form, initialData, preselectedUserId]);

  useEffect(() => {
    const filtered = localUsers.filter(user => 
      (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );
    setFilteredUsers(filtered);
  }, [searchTerm, localUsers]);

  // Handle Multi-Select Logic
  const handleServiceClick = (serviceId: string, defaultDuration: number) => {
      const currentMap = new Map(selectedServicesMap);
      
      if (currentMap.has(serviceId)) {
          // Toggle Off (Only if not in Edit Mode with initialData, creating weird states)
          // Actually allow toggling off even in edit mode to change service
          currentMap.delete(serviceId);
      } else {
          // Toggle On
          currentMap.set(serviceId, defaultDuration);
      }
      
      setSelectedServicesMap(currentMap);
      form.setValue('serviceIds', Array.from(currentMap.keys()));
  };
  
  const handleDurationChange = (serviceId: string, newDuration: number) => {
      const currentMap = new Map(selectedServicesMap);
      if (currentMap.has(serviceId)) {
          currentMap.set(serviceId, newDuration);
          setSelectedServicesMap(currentMap);
      }
  };

  const selectedServiceIds = Array.from(selectedServicesMap.keys());
  
  // Calculate Totals
  const { totalDuration, totalPrice, selectedServicesData } = useMemo(() => {
      let totalDur = 0;
      let totalP = 0;
      const sData: { service: Service, duration: number, price: number }[] = [];

      selectedServicesMap.forEach((duration, serviceId) => {
          const service = services.find(s => s.id === serviceId);
          if (service) {
              const tier = service.pricing_tiers.find(t => t.duration === duration) || service.pricing_tiers[0];
              const price = tier ? tier.price : 0;
              
              totalDur += duration;
              totalP += price;
              sData.push({ service, duration, price });
          }
      });
      
      return { totalDuration: totalDur, totalPrice: totalP, selectedServicesData: sData };
  }, [selectedServicesMap, services]);

  const availableServices = useMemo(() => {
    return services.filter(s => !s.is_under_maintenance);
  }, [services]);

  const handleClientSelect = (user: UserProfile) => {
    form.setValue('userId', user.id);
    setIsClientSearchOpen(false); // Close search view, show summary
  };

  const handleClientCreated = (newUser: UserProfile) => {
      setLocalUsers(prev => [...prev, newUser]);
      form.setValue('userId', newUser.id);
      setIsClientCreatorOpen(false);
      setIsClientSearchOpen(false);
  };

  const getSelectedUserName = () => {
    const userId = form.getValues('userId');
    if (!userId) return '';
    const user = localUsers.find(u => u.id === userId);
    if (!user) return '';
    
    // Lógica robusta para nome
    if (user.display_name) return user.display_name;
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return user.email || 'Nom inconnu';
  };
  
  const handleRemoveClient = (e: React.MouseEvent) => {
      e.stopPropagation();
      form.setValue('userId', '');
      setIsClientSearchOpen(false); // Go back to empty placeholder
  };

  // Helper para iniciais que usa o nome robusto
  const getDisplayInitials = () => {
    const userId = form.getValues('userId');
    if (!userId) return 'U';
    const user = localUsers.find(u => u.id === userId);
    if (!user) return 'U';
    
    const name = getSelectedUserName();
    return getInitials(name);
  };

  // --- Lógica para Bloqueio (De -> À) ---
  const startTime = form.watch('time');
  // For Blocked mode, we need a manual duration input since it's not based on services
  const [blockedDuration, setBlockedDuration] = useState(60); 

  useEffect(() => {
     if (initialData && initialData.payment_method === 'blocked') {
         setBlockedDuration(initialData.duration);
     }
  }, [initialData]);

  // --- FIX: Gerar opções de tempo de 5 em 5 minutos ---
  // A tabela permite clicar em 10:05, mas o allTimeSlots pode ter só 10:00, 10:15.
  // Geramos uma lista granular baseada no range de funcionamento + margem.
  const granularTimeOptions = useMemo(() => {
      let startH = 7; // Começa cedo (07:00) por padrão
      let endH = 22;  // Termina tarde (22:00) por padrão

      // Se tivermos slots configurados, usamos eles como base para o range, expandindo um pouco
      if (allTimeSlots && allTimeSlots.length > 0) {
          const first = parseInt(allTimeSlots[0].split(':')[0]);
          const last = parseInt(allTimeSlots[allTimeSlots.length - 1].split(':')[0]);
          startH = Math.max(0, first - 1);
          endH = Math.min(23, last + 1);
      }

      const options: string[] = [];
      for (let h = startH; h <= endH; h++) {
          for (let m = 0; m < 60; m += 5) {
               const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
               options.push(timeStr);
          }
      }

      // Garantir que o horário inicial (ex: 10:05) esteja na lista, mesmo que fora do range padrão
      if (initialTime && !options.includes(initialTime)) {
          options.push(initialTime);
          options.sort();
      }

      return options;
  }, [allTimeSlots, initialTime]);

  // Submit Handler Wrapper
  const handleSubmit = (values: AdminAppointmentFormValues) => {
      // Inject the detailed service map into the parent handler
      // We pass the raw values, but the parent needs to know the specific durations selected
      // So we'll augment the values or let the parent read from a shared state?
      // Better: we pass a custom object structure that the page accepts.
      
      // However, the props define onSubmit as (values: AdminAppointmentFormValues) => void.
      // We need to pass the extra data. We can attach it to the values object dynamically 
      // or change the interface. Let's cast it.
      
      const payload: any = { ...values };
      
      if (formType === 'blocked') {
          payload.duration = blockedDuration;
          payload.selectedServices = [];
      } else {
          payload.selectedServices = selectedServicesData.map(d => ({
              id: d.service.id,
              name: d.service.name,
              duration: d.duration,
              price: d.price
          }));
      }

      onSubmit(payload);
  };

  const calculatedEndTime = useMemo(() => {
     if (!startTime) return '';
     const durationToUse = formType === 'blocked' ? blockedDuration : totalDuration;
     if (!durationToUse) return '';
     
     const [h, m] = startTime.split(':').map(Number);
     const start = new Date();
     start.setHours(h, m, 0, 0);
     const end = addMinutes(start, durationToUse);
     return format(end, 'HH:mm');
  }, [startTime, totalDuration, blockedDuration, formType]);

  const onEndTimeChange = (val: string) => {
      const [sh, sm] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(sh, sm, 0, 0);
      
      const [eh, em] = val.split(':').map(Number);
      const end = new Date();
      end.setHours(eh, em, 0, 0);
      
      if (end < start) {
          end.setDate(end.getDate() + 1);
      }
      
      const diff = differenceInMinutes(end, start);
      if (formType === 'blocked') {
          setBlockedDuration(diff);
      }
      // For services, we can't easily auto-adjust individual durations based on total end time
      // So this is mostly for the 'blocked' mode.
  };

  // UI Components helpers
  // Novo Card de Serviço Estilo Fresha
  const ServiceCard = ({ service, isSelected }: { service: Service, isSelected: boolean }) => {
      const isTiny = false; 
      const color = service.color || '#000';
      const currentDuration = selectedServicesMap.get(service.id);

      return (
        <div 
            className={cn(
                "group relative pl-4 pr-4 py-3 cursor-pointer transition-all border-b border-border/40 hover:bg-muted/30",
                isSelected && "bg-primary/5"
            )}
            onClick={() => {
                // Default to first tier duration if selecting
                const defaultDur = service.pricing_tiers[0]?.duration || 30;
                handleServiceClick(service.id, defaultDur);
            }}
        >
            {/* Colored Bar */}
            <div 
                className={cn("absolute left-0 top-0 bottom-0 w-[4px] transition-all", isSelected ? "w-[6px]" : "group-hover:w-[6px]")} 
                style={{ backgroundColor: color }}
            ></div>
            
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                         {isSelected && (
                             <div className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                                 {Array.from(selectedServicesMap.keys()).indexOf(service.id) + 1}
                             </div>
                         )}
                        <span className={cn("font-medium text-base", isSelected ? "text-primary font-semibold" : "text-slate-900")}>
                            {service.name}
                        </span>
                    </div>
                    {/* Duration Selector inside card */}
                    <div className="flex flex-wrap gap-2 mt-1">
                         {service.pricing_tiers.map((tier, idx) => {
                             const isTierSelected = isSelected && currentDuration === tier.duration;
                             return (
                                <div 
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Only update duration if already selected, or select with this duration
                                        handleDurationChange(service.id, tier.duration);
                                        if (!isSelected) handleServiceClick(service.id, tier.duration);
                                    }}
                                    className={cn(
                                        "text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer",
                                        isTierSelected 
                                            ? "bg-slate-900 text-white border-slate-900" 
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    {tier.duration} min
                                </div>
                             )
                         })}
                    </div>
                </div>
                
                <div className="font-semibold text-slate-900 text-sm">
                    {/* Show price of selected duration or range */}
                    {isSelected && currentDuration 
                        ? `${service.pricing_tiers.find(t => t.duration === currentDuration)?.price} €`
                        : `${service.pricing_tiers[0]?.price} €`
                    }
                </div>
            </div>
        </div>
      );
  };

  // Filter services locally for the right column search
  const [serviceSearch, setServiceSearch] = useState('');
  const filteredServices = useMemo(() => {
      return services.filter(s => 
          !s.is_under_maintenance && 
          s.name.toLowerCase().includes(serviceSearch.toLowerCase())
      );
  }, [services, serviceSearch]);

  const ChevronUpDown = ChevronsUpDown; // Alias for icon

  // --- VIEW MODE SWAPPING ---
  // If Client Creator is open, we render IT instead of the main form
  if (isClientCreatorOpen) {
      return (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
              <AdminClientCreator 
                  onSuccess={handleClientCreated}
                  onCancel={() => setIsClientCreatorOpen(false)}
              />
          </div>
      );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full w-full bg-background">
        
        {/* MAIN SPLIT CONTENT */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* --- LEFT COL: CLIENT SELECTOR (Fresha Style) --- */}
            <div className={cn(
                "flex-none border-r flex flex-col h-full bg-white z-10 shadow-sm transition-all duration-300 ease-in-out",
                isClientSearchOpen ? "w-[380px]" : "w-[240px]"
            )}>
                {/* MODE 1: SEARCH OPEN - Show List */}
                {isClientSearchOpen ? (
                    <>
                        <div className="p-5 pb-2 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-xl">Clients</h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsClientSearchOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Rechercher..." 
                                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-4">
                            {/* Special Options */}
                            <div className="space-y-1 mb-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsClientCreatorOpen(true)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                        <PlusCircle className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold text-sm text-slate-900">Nouveau client</span>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Logic for walk-in: Clear user and close search
                                        form.setValue('userId', '');
                                        setIsClientSearchOpen(false);
                                    }}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                                >
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                        <Footprints className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold text-sm text-slate-900">Sans rendez-vous</span>
                                </button>
                            </div>

                            <Separator className="mb-4" />

                            {/* Users List */}
                            <div className="space-y-1">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => {
                                        const isSelected = selectedUserId === user.id;
                                        return (
                                            <div 
                                                key={user.id}
                                                onClick={() => handleClientSelect(user)}
                                                className={cn(
                                                    "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border",
                                                    isSelected 
                                                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                                                        : "hover:bg-slate-50 border-transparent"
                                                )}
                                            >
                                                <Avatar className="h-10 w-10 border bg-white">
                                                    <AvatarImage src={user.photo_url} />
                                                    <AvatarFallback className={cn("text-xs font-medium", isSelected ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600")}>
                                                        {getInitials(user.display_name || user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className={cn("font-semibold text-sm truncate", isSelected ? "text-primary" : "text-slate-900")}>
                                                        {user.display_name || 'Sans nom'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                                                        <span>{user.phone || user.email}</span>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Aucun client trouvé.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* MODE 2: SEARCH CLOSED - Show Placeholder OR Selected User */
                    selectedUser ? (
                        /* Selected User View */
                        <div className="flex flex-col h-full">
                            <div className="p-6 flex flex-col items-center text-center pt-10">
                                <div className="relative mb-4">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                                        <AvatarImage src={selectedUser.photo_url} />
                                        <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700 font-medium">
                                            {getDisplayInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button 
                                        type="button"
                                        onClick={handleRemoveClient}
                                        className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md border hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 line-clamp-2 px-2">
                                    {getSelectedUserName()}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 break-all px-4">
                                    {selectedUser.email || selectedUser.phone}
                                </p>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full rounded-full border-slate-300 hover:border-primary hover:text-primary"
                                    onClick={() => setIsClientSearchOpen(true)}
                                >
                                    Changer de client
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Empty/Placeholder View (Fresha Style) */
                        <div 
                            className="flex flex-col h-full items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors group"
                            onClick={() => setIsClientSearchOpen(true)}
                        >
                            <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                                <UserPlus className="h-8 w-8 text-indigo-600" />
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                Ajouter un client
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-[180px] leading-relaxed">
                                Ou laisser vide pour les clients sans rendez-vous
                            </p>
                        </div>
                    )
                )}
            </div>

            {/* --- RIGHT COL: SERVICE SELECTOR --- */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
                 {/* Top Shadow/Gradient for depth */}
                 <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10" />

                 <div className="p-6 pb-2 shrink-0">
                     <div className="flex items-center justify-between mb-4">
                         <h2 className="font-bold text-xl">Sélectionner des prestations</h2>
                         {selectedServicesMap.size > 0 && (
                             <Badge variant="secondary" className="text-xs">
                                 {selectedServicesMap.size} sélectionné(s)
                             </Badge>
                         )}
                     </div>
                     <div className="relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher un service..." 
                            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                        />
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                     {/* Services Group (Single group for now or could be categorized) */}
                     <div className="mb-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                            Tous les services
                        </h3>
                        
                        <div className="space-y-2">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <ServiceCard 
                                        key={service.id} 
                                        service={service} 
                                        isSelected={selectedServicesMap.has(service.id)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    Aucun service trouvé.
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>

        </div>

        {/* --- FOOTER: SUMMARY & ACTIONS --- */}
        <div className="shrink-0 border-t bg-white p-4 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-6 pl-2">
                 {initialData && (
                     <div className="flex items-center gap-1 mr-4 border-r pr-4">
                         {/* Action Buttons for Existing Appointment */}
                         {onDelete && (
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => onDelete(initialData)}
                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                title="Supprimer"
                             >
                                 <Trash2 className="h-5 w-5" />
                             </Button>
                         )}
                         
                         {onCancelAppt && initialData.status !== 'Cancelado' && (
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => onCancelAppt(initialData)}
                                className="text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                                title="Annuler le rendez-vous"
                             >
                                 <Ban className="h-5 w-5" />
                             </Button>
                         )}

                         {onPay && initialData.status !== 'Concluído' && !['card', 'minutes', 'cash', 'gift', 'online'].includes(initialData.payment_method) && initialData.payment_method !== 'blocked' && (
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onPay(initialData);
                                }}
                                className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                                title="Payer / Détails"
                             >
                                 <CreditCard className="h-5 w-5" />
                             </Button>
                         )}
                     </div>
                 )}

                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase">Date</div>
                        <div className="font-semibold text-sm">
                            {initialData ? format(new Date(initialData.date), 'd MMM yyyy', { locale: fr }) : format(new Date(), 'd MMM yyyy', { locale: fr })}
                        </div>
                    </div>
                 </div>

                 <Separator orientation="vertical" className="h-8" />

                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase">Heure</div>
                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-7 w-[90px] text-sm border-none shadow-none bg-transparent p-0 focus:ring-0 font-semibold">
                                                <SelectValue placeholder="Heure" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="h-[300px]">
                                            {granularTimeOptions.map((time) => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                 </div>
                 
                 {(totalPrice > 0 || formType === 'blocked') && (
                     <>
                        <Separator orientation="vertical" className="h-8" />
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground font-medium uppercase">Total</div>
                                <div className="font-bold text-lg text-primary leading-none">
                                    {formType === 'blocked' ? '-' : `${totalPrice} €`}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    {formType === 'blocked' ? `${blockedDuration} min` : `${totalDuration} min`}
                                </div>
                            </div>
                        </div>
                     </>
                 )}
            </div>

            <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6 rounded-full border-slate-300">
                    Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="h-11 px-8 rounded-full bg-black hover:bg-slate-900 text-white shadow-lg">
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Traitement...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            {initialData ? 'Enregistrer' : `Confirmer (${selectedServicesMap.size})`}
                        </>
                    )}
                </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}

// Helper function moved outside component
const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};