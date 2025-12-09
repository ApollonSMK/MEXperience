'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, startOfWeek, endOfWeek, addDays, eachDayOfInterval, addMinutes, differenceInMinutes, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, MoreHorizontal, User, PlusCircle, CreditCard, AlertTriangle, Wallet, Gift, X, Pencil, ZoomIn, ZoomOut, Percent, Lock, Smartphone, QrCode, Banknote, Delete, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Printer, Trash2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AdminAppointmentForm, type AdminAppointmentFormValues, type Plan } from '@/components/admin-appointment-form';
import type { Service } from '@/app/admin/services/page';
import { Input } from '@/components/ui/input';
import { AdminAppointmentsTable } from '@/components/admin-appointments-table';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { logAppointmentAction } from '@/lib/appointment-logger';
import { AgendaView } from '@/components/admin/appointments/agenda-view';
import { MonthView } from '@/components/admin/appointments/month-view';
import { cn } from '@/lib/utils';
import type { Appointment, UserProfile, NewAppointmentSlot, Schedule } from '@/types/appointment';
import { InvoiceDocument } from '@/components/invoice-document'; // Import InvoiceDocument
import html2canvas from 'html2canvas'; // Import html2canvas
import { jsPDF } from 'jspdf'; // Import jsPDF

interface RescheduleDetails {
    appointment: Appointment;
    newDate: Date;
    newTime: string; // HH:mm
}

interface PaymentDetails {
    appointments: Appointment[]; // Alterado para Array
    totalPrice: number; // Preço total base dos serviços
    user: UserProfile | null;
    userPlan: Plan | null;
}

interface PaymentItem {
    id: string;
    method: 'card' | 'cash' | 'minutes' | 'gift' | 'terminal' | 'qr';
    amount: number;
    label: string;
    icon?: any;
    details?: any;
}

// Nouvelle interface pour gérer le chèque cadeau appliqué
interface AppliedGiftCard {
    id: string;
    code: string;
    balance: number;
    amountToUse: number;
}

// Helper function
const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

export default function AdminAppointmentsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isMounted, setIsMounted] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentMonthView, setCurrentMonthView] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  // Estado para controlar a semana selecionada
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  
  // Estado para o Menu de Slot (Balão Fresha)
  const [slotMenu, setSlotMenu] = useState<{
      isOpen: boolean;
      x: number;
      y: number;
      date: Date;
      time: string;
  } | null>(null);

  const [newAppointmentSlot, setNewAppointmentSlot] = useState<NewAppointmentSlot | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Novo estado para controlar o tipo inicial do formulário (Service ou Blocked)
  const [initialFormType, setInitialFormType] = useState<'service' | 'blocked'>('service');

  // States for 'Edit & Recalculate' flow
  const [returnToPaymentAfterEdit, setReturnToPaymentAfterEdit] = useState(false);
  const [appointmentToReopenPayment, setAppointmentToReopenPayment] = useState<string | null>(null);
  const [idsToRestorePayment, setIdsToRestorePayment] = useState<string[]>([]); // NEW: IDs to keep in checkout
  const [preselectedUserId, setPreselectedUserId] = useState<string | undefined>(undefined); // NEW: Pre-select user

  // Lock para prevenir duplo envio
  const [isProcessing, setIsProcessing] = useState(false);

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | 'minutes' | 'gift' | 'terminal' | 'qr'>('cash');
  
  // Checkout States (Fresha Style)
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'tips' | 'payment'>('cart');
  const [tipAmount, setTipAmount] = useState<number>(0);
  
  // Checkout POS States (New)
  const [extraItems, setExtraItems] = useState<{name: string, price: number}[]>([]);
  const [manualDiscount, setManualDiscount] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [selectedExtraServiceId, setSelectedExtraServiceId] = useState<string>(''); // Novo estado para controlar o 1º select

  // New State for Paid View
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);

  // States pour Gift Card
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [isVerifyingGiftCard, setIsVerifyingGiftCard] = useState(false);
  const [availableGiftCards, setAvailableGiftCards] = useState<any[]>([]); // Novo estado

  // NEW: Payment Flow States
  const [addedPayments, setAddedPayments] = useState<PaymentItem[]>([]);
  const [activePaymentModal, setActivePaymentModal] = useState<'cash' | 'gift' | 'card' | 'terminal' | 'minutes' | 'qr' | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');

  // Estado para armazenar a fatura encontrada (para agendamentos concluídos)
  const [relatedInvoice, setRelatedInvoice] = useState<any | null>(null);

  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [rescheduleDetails, setRescheduleDetails] = useState<RescheduleDetails | null>(null);

  // PDF Generation State for Appointments Page
  const printRef = useRef<HTMLDivElement>(null);
  const [printingRecord, setPrintingRecord] = useState<any | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: appointmentsData, error: appointmentsError },
        { data: usersData, error: usersError },
        { data: plansData, error: plansError },
        { data: schedulesData, error: schedulesError },
        { data: servicesData, error: servicesError },
      ] = await Promise.all([
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('plans').select('*'),
        supabase.from('schedules').select('*').order('order', { ascending: true }),
        supabase.from('services').select('*').order('order', { ascending: true }),
      ]);

      if (appointmentsError) throw appointmentsError;
      if (usersError) throw usersError;
      if (plansError) throw plansError;
      if (schedulesError) throw schedulesError;
      if (servicesError) throw servicesError;

      setAppointments(appointmentsData as Appointment[] || []);
      setUsers(usersData as UserProfile[] || []);
      setPlans(plansData as Plan[] || []);
      setSchedules(schedulesData as Schedule[] || []);
      setServices(servicesData as Service[] || []);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur lors du chargement des données', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast, supabase]);

  useEffect(() => {
    setIsMounted(true);
    fetchInitialData();

    // Listen for Appointment changes
    const appointmentChannel = supabase
      .channel('realtime:public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
        (payload: RealtimePostgresChangesPayload<Appointment>) => {
          console.log('Realtime appointment change:', payload);
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => {
                if (prev.find(a => a.id === payload.new.id)) return prev;
                return [payload.new as Appointment, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev => prev.map(app => app.id === payload.new.id ? payload.new as Appointment : app));
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(app => app.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();
      
    // Listen for Profile changes (New Users or Balance Updates)
    const profilesChannel = supabase
      .channel('realtime:public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
        (payload: RealtimePostgresChangesPayload<UserProfile>) => {
            if (payload.eventType === 'INSERT') {
                setUsers(prev => [...prev, payload.new as UserProfile]);
            } else if (payload.eventType === 'UPDATE') {
                setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as UserProfile : u));
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchInitialData, supabase]);

  // Effect to reopen payment sheet automatically after an edit from payment
  useEffect(() => {
      if (appointmentToReopenPayment && appointments.length > 0 && !idsToRestorePayment.length) {
          const app = appointments.find(a => a.id === appointmentToReopenPayment);
          if (app) {
              handleOpenPaymentSheet(app);
              setAppointmentToReopenPayment(null);
          }
      }
  }, [appointmentToReopenPayment, appointments, idsToRestorePayment]);


  const allTimeSlots = useMemo(() => {
    if (!schedules) return [];
    const slots = new Set<string>();
    schedules.forEach(day => {
        day.time_slots.forEach(ts => slots.add(ts));
    })
    return Array.from(slots).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [schedules]);
  
  const appointmentsByDay = useMemo(() => {
      const map = new Map<string, Appointment[]>();
      appointments?.forEach(app => {
          const dayKey = format(new Date(app.date), 'yyyy-MM-dd');
          if (!map.has(dayKey)) {
              map.set(dayKey, []);
          }
          map.get(dayKey)?.push(app);
      });
      return map;
  }, [appointments]);

  const { todayAppointments, weekAppointments, weekDays } = useMemo(() => {
    // Janela Deslizante: Começa sempre na 'currentWeekDate' e mostra 7 dias
    const start = startOfDay(currentWeekDate); 
    const end = addDays(start, 6); 
    
    const weekDays = eachDayOfInterval({start, end});

    const weekAppointments = appointments?.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= start && appDate <= end;
    }) || [];

    // Para a aba 'Hoje'
    const todayAppointments = appointments?.filter(app => isToday(new Date(app.date))) || [];

    return { 
        todayAppointments,
        weekAppointments,
        weekDays,
    };
  }, [appointments, currentWeekDate]);
  
  const appointmentsForSelectedDay = useMemo(() => {
      if (!selectedDay) return [];
      const key = format(selectedDay, 'yyyy-MM-dd');
      return appointmentsByDay.get(key) || [];
  }, [selectedDay, appointmentsByDay]);

  // Filtro para o MonthView
  const monthAppointments = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonthView), { locale: fr });
    const end = endOfWeek(endOfMonth(startOfMonth(currentMonthView)), { locale: fr });
    
    return appointments.filter(app => {
        const d = new Date(app.date);
        return d >= start && d <= end;
    });
  }, [appointments, currentMonthView]);

  const handleOpenDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenCancelDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelDialogOpen(true);
  };

  const handleCancelAppointment = async () => {
      if (!selectedAppointment) return;
      try {
          const { error } = await supabase
              .from('appointments')
              .update({ status: 'Cancelado' })
              .eq('id', selectedAppointment.id);

          if (error) throw error;

          await logAppointmentAction(
              supabase,
              'UPDATE',
              selectedAppointment.id,
              `Annulation du rdv: ${selectedAppointment.service_name}`,
              selectedAppointment,
              { status: 'Cancelado' }
          );

          setAppointments(prev => prev.map(a => 
              a.id === selectedAppointment.id ? { ...a, status: 'Cancelado' } : a
          ));

          // Email Notification for Cancellation
          if (selectedAppointment.user_email) {
              await fetch('/api/emails/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      type: 'cancellation',
                      to: selectedAppointment.user_email,
                      data: {
                          userName: selectedAppointment.user_name,
                          serviceName: selectedAppointment.service_name,
                          date: selectedAppointment.date
                      }
                  })
              }).catch(console.error);
          }

          toast({ title: "Rendez-vous Annulé", description: "Le statut a été mis à jour." });

      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Erreur', description: e.message });
      } finally {
          setIsCancelDialogOpen(false);
          setSelectedAppointment(null);
      }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      // Fetch fresh data to ensure accurate status and payment method before refunding
      const { data: appointmentToDelete, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', selectedAppointment.id)
        .single();
        
      if (fetchError || !appointmentToDelete) {
          throw new Error("Impossible de récupérer les données du rendez-vous.");
      }

      // --- LOGIC DE REEMBOLSO DE MINUTOS (ADMIN) ---
      // Se for pago com minutos e ainda não estiver cancelado
      if (appointmentToDelete.payment_method === 'minutes' && appointmentToDelete.status !== 'Cancelado' && appointmentToDelete.user_id) {
           const { data: profile } = await supabase
            .from('profiles')
            .select('minutes_balance')
            .eq('id', appointmentToDelete.user_id)
            .single();
           
           if (profile) {
               const newBalance = (profile.minutes_balance || 0) + appointmentToDelete.duration;
               const { error: refundError } = await supabase
                    .from('profiles')
                    .update({ minutes_balance: newBalance })
                    .eq('id', appointmentToDelete.user_id);
               
               if (!refundError) {
                   toast({ 
                       title: "Remboursement effectué", 
                       description: `${appointmentToDelete.duration} minutes restituées au client.` 
                   });
                   
                   // Log Refund
                   await logAppointmentAction(
                       supabase, 
                       'UPDATE', 
                       appointmentToDelete.id, 
                       `Remboursement de minutes lors de la suppression (${appointmentToDelete.duration}min)`, 
                       appointmentToDelete, 
                       { minutes_balance: newBalance }
                   );
               } else {
                   console.error("Erreur remboursement:", refundError);
               }
           }
      }
      // ---------------------------------------------

      const { error } = await supabase.from('appointments').delete().eq('id', selectedAppointment.id);
      if (error) throw error;
      
      // LOG DELETE
      await logAppointmentAction(supabase, 'DELETE', selectedAppointment.id, `Suppression rdv: ${selectedAppointment.service_name} pour ${selectedAppointment.user_name}`, selectedAppointment, null);

      // Mise à jour locale immédiate
      setAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));

      // --- EMAIL DE CANCELAMENTO ---
      if (selectedAppointment.user_email) {
          await fetch('/api/emails/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'cancellation',
                to: selectedAppointment.user_email,
                data: {
                    userName: selectedAppointment.user_name,
                    serviceName: selectedAppointment.service_name,
                    date: selectedAppointment.date
                }
            })
          }).catch(err => console.error("Erreur envoi email:", err));
      }

      toast({
        title: "Rendez-vous Supprimé !",
        description: `Le rendez-vous pour ${selectedAppointment.service_name} a été supprimé avec succès.`,
      });
      // Realtime will handle the UI update
    } catch (e: any) {
      console.error("Error deleting appointment:", e);
      toast({
        variant: "destructive",
        title: "Erreur lors de la suppression du rendez-vous",
        description: e.message || "Une erreur inattendue est survenue.",
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleSlotClick = (slot: NewAppointmentSlot) => {
    // Se tiver coordenadas, abrimos o Menu (Balão)
    if (slot.x && slot.y) {
        setSlotMenu({
            isOpen: true,
            x: slot.x,
            y: slot.y,
            date: slot.date,
            time: slot.time
        });
    } else {
        // Fallback para comportamento antigo se não tiver coordenadas (ex: botão manual)
        setNewAppointmentSlot(slot);
        setInitialFormType('service');
        setIsFormSheetOpen(true);
    }
  };

  const handleManualNewAppointment = () => {
    // Set a default slot for "now" rounded to next 15 min if manual button clicked
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes, 0, 0);
    
    setNewAppointmentSlot({
        date: now,
        time: format(now, 'HH:mm')
    });
    setInitialFormType('service');
    setIsFormSheetOpen(true);
  };

  // Funções chamadas pelo Menu de Slot
  const handleMenuAction = (action: 'appointment' | 'blocked') => {
      if (!slotMenu) return;
      
      setNewAppointmentSlot({
          date: slotMenu.date,
          time: slotMenu.time
      });
      setInitialFormType(action === 'blocked' ? 'blocked' : 'service');
      setSlotMenu(null); // Fecha o menu
      setIsFormSheetOpen(true); // Abre o Sheet
  };

  const handleAppointmentDrop = (appointmentId: string, newDate: Date, newTime: string) => {
      const app = appointments.find(a => a.id === appointmentId);
      if (!app) return;
      
      // Don't allow rescheduling if completed (optional constraint)
      if (app.status === 'Concluído') {
          toast({ variant: 'destructive', title: 'Action refusée', description: 'Impossible de déplacer un rendez-vous déjà terminé.' });
          return;
      }

      setRescheduleDetails({
          appointment: app,
          newDate: newDate,
          newTime: newTime
      });
  };

  const confirmReschedule = async () => {
      if (!rescheduleDetails) return;
      
      const { appointment, newDate, newTime } = rescheduleDetails;
      const [hours, minutes] = newTime.split(':').map(Number);
      
      const targetDate = new Date(newDate);
      targetDate.setHours(hours, minutes, 0, 0);

      try {
          const { error } = await supabase
            .from('appointments')
            .update({ date: targetDate.toISOString() })
            .eq('id', appointment.id);
            
          if (error) throw error;

          // LOG RESCHEDULE
          await logAppointmentAction(
              supabase, 
              'RESCHEDULE', 
              appointment.id, 
              `Déplacement de ${format(new Date(appointment.date), 'dd/MM HH:mm')} vers ${format(targetDate, 'dd/MM HH:mm')}`,
              appointment, 
              { date: targetDate.toISOString() }
          );

          // Update Local State
          setAppointments(prev => prev.map(a => 
              a.id === appointment.id ? { ...a, date: targetDate.toISOString() } : a
          ));

          // Email Notification
          if (appointment.user_email) {
             await fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'reschedule',
                    to: appointment.user_email,
                    data: {
                        userName: appointment.user_name,
                        serviceName: appointment.service_name,
                        // Template expects 'date' for formatting logic
                        date: targetDate.toISOString(), 
                        duration: appointment.duration
                    }
                })
             });
          }

          toast({ title: 'Rendez-vous déplacé', description: `Nouveau créneau : ${format(targetDate, 'dd/MM à HH:mm')}` });

      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      } finally {
          setRescheduleDetails(null);
      }
  };

  const handleFormSubmit = async (values: AdminAppointmentFormValues) => {
    // Se já estiver processando, ignora
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const dateSource = editingAppointment ? new Date(editingAppointment.date) : newAppointmentSlot?.date;
    if (!dateSource || !services || !users) return;
  
    const [hours, minutes] = values.time.split(':').map(Number);
    const appointmentDate = new Date(dateSource);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    // TRATAMENTO DE BLOQUEIO
    const isBlockedType = values.type === 'blocked';
    
    // Se for bloqueio, usamos valores dummy para user e service name
    let serviceName = '';
    let userId = '';
    let userName = '';
    let userEmail = '';
    
    if (isBlockedType) {
        serviceName = values.blockReason || 'INDISPONIBLE';
        // Usamos o ID do admin atual (precisa pegar da sessão ou do array users se o admin estiver lá)
        // Como fallback seguro, pegamos o primeiro user que é admin ou o próprio user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        userId = currentUser?.id || users[0]?.id; // Fallback
        userName = 'BLOQUÉ'; // Flag visual
        userEmail = currentUser?.email || '';
    } else {
        const service = services.find(s => s.id === values.serviceId);
        if (!service) {
            toast({ variant: 'destructive', title: 'Service non trouvé' });
            setIsProcessing(false);
            return;
        }
        serviceName = service.name;
        
        userId = values.userId;
        const existingUser = users.find(u => u.id === userId);
        if (!existingUser) {
              toast({ variant: "destructive", title: "Utilisateur non trouvé", description: "Le client sélectionné n'est pas valide." });
              setIsProcessing(false);
              return;
        }
        userName = existingUser.display_name || existingUser.email || 'Client';
        userEmail = existingUser.email || '';
    }
    
    const PREP_TIME = isBlockedType ? 0 : 15; // Bloqueios não precisam de tempo de preparação extra
    const totalBlockedTime = values.duration + PREP_TIME;
    const appointmentEndDate = addMinutes(appointmentDate, totalBlockedTime);
  
    // Calculate the time window we care about (start of appointment - max duration to end of appointment)
    // To be safe, let's just fetch everything for this day.
    const startOfDayDate = new Date(appointmentDate);
    startOfDayDate.setHours(0,0,0,0);
    const endOfDayDate = new Date(appointmentDate);
    endOfDayDate.setHours(23,59,59,999);

    const { data: dayAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id, date, duration, service_name, payment_method') // Adicionado payment_method
      .gte('date', startOfDayDate.toISOString())
      .lte('date', endOfDayDate.toISOString())
      .neq('status', 'Cancelado')
      // When editing, exclude the current appointment from conflict check
      .not('id', 'eq', editingAppointment?.id || '00000000-0000-0000-0000-000000000000');
  
    if (fetchError) {
      toast({ variant: "destructive", title: "Erreur lors de la vérification des conflits", description: fetchError.message });
      setIsProcessing(false);
      return;
    }
  
    
    const hasConflict = dayAppointments.some((existingApp: any) => {
         // Ignorar o próprio agendamento se estiver editando
         if (editingAppointment && existingApp.id === editingAppointment.id) return false;

         const existingAppStartDate = new Date(existingApp.date);
         
         // Se for bloqueio, duration exata. Se for serviço, +15min buffer.
         const isExistingBlocked = existingApp.payment_method === 'blocked';
         const existingDuration = existingApp.duration + (isExistingBlocked ? 0 : 15);
         
         const existingAppEndDate = addMinutes(existingAppStartDate, existingDuration);
         
         // Verifica Colisão de Tempo
         const isTimeOverlapping = appointmentDate < existingAppEndDate && appointmentEndDate > existingAppStartDate;

         if (!isTimeOverlapping) return false;

         // Se tempos colidem, verifica tipo de serviço
         
         // 1. Se o NOVO agendamento for um BLOQUEIO -> Conflita com tudo (pois fecha a agenda)
         if (isBlockedType) return true;

         // 2. Se o AGENDAMENTO EXISTENTE for um BLOQUEIO -> Conflita com o novo (pois a agenda está fechada)
         if (isExistingBlocked) return true;

         // 3. Se ambos são serviços, só conflita se for o MESMO serviço (recurso ocupado)
         return existingApp.service_name === serviceName;
    });
  
    if (hasConflict) {
        setIsConflictDialogOpen(true);
        setIsProcessing(false);
        return;
    }

    // Preparar objeto
    const dataToSave = {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        service_name: serviceName,
        date: appointmentDate.toISOString(),
        duration: values.duration,
        payment_method: isBlockedType ? 'blocked' : 'reception', // 'blocked' é a flag chave
        status: 'Confirmado'
    };

    try {
        if (editingAppointment) {
            // --- UPDATE APPOINTMENT ---
            const { payment_method, status, ...rest } = dataToSave;
            const updatePayload = isBlockedType ? { ...rest, payment_method: 'blocked' } : rest;

            const { data, error: updateError } = await supabase
                .from('appointments')
                .update(updatePayload)
                .eq('id', editingAppointment.id)
                .select()
                .single();

            if (updateError) throw updateError;
            
            await logAppointmentAction(
                supabase,
                'UPDATE',
                data.id,
                `Modification rdv: ${data.service_name} (${format(new Date(data.date), 'HH:mm')})`,
                editingAppointment,
                data
            );

            if (data) {
                setAppointments(prev => prev.map(app => app.id === data.id ? data as Appointment : app));
                
                if (returnToPaymentAfterEdit) {
                    if (idsToRestorePayment.length > 0) {
                         const allIds = Array.from(new Set([...idsToRestorePayment, data.id]));
                         const { data: allApps } = await supabase.from('appointments').select('*').in('id', allIds);
                         if (allApps) {
                             handleOpenPaymentSheet(allApps as Appointment[]);
                         }
                         setIdsToRestorePayment([]);
                    } else {
                         setAppointmentToReopenPayment(data.id);
                    }
                    setReturnToPaymentAfterEdit(false);
                }
            }
            toast({ title: "Rendez-vous Modifié !", description: "Les informations du rendez-vous ont été mises à jour." });

        } else {
            // --- CREATE APPOINTMENT ---
            const finalData = {
                ...dataToSave,
                status: 'Confirmado' as const,
                payment_method: 'reception' as const,
            };

            const { data, error: insertAppError } = await supabase.from('appointments').insert(finalData).select().single();
            if (insertAppError) throw insertAppError;
            
            // LOG CREATE
            if (data) {
                 await logAppointmentAction(
                    supabase,
                    'CREATE',
                    data.id,
                    `Nouveau rdv: ${data.service_name} pour ${data.user_name}`,
                    null,
                    data
                );
                
                setAppointments(prev => {
                    // Evitar duplicatas se o Realtime já tiver inserido
                    if (prev.find(a => a.id === data.id)) return prev;
                    return [data as Appointment, ...prev];
                });

                // Check if we need to return to payment sheet (ADD SERVICE FLOW)
                if (returnToPaymentAfterEdit) {
                     let allIds = [data.id];
                     if (idsToRestorePayment.length > 0) {
                         allIds = [...idsToRestorePayment, data.id];
                     }
                     
                     const { data: allApps } = await supabase.from('appointments').select('*').in('id', allIds);
                     
                     if (allApps) {
                         handleOpenPaymentSheet(allApps as Appointment[]);
                     }
                     
                     setReturnToPaymentAfterEdit(false);
                     setIdsToRestorePayment([]);
                }
            }

            toast({
                title: "Rendez-vous Créé !",
                description: "Le nouveau rendez-vous a été ajouté avec succès.",
            });
        }
        
        setIsFormSheetOpen(false);
        setNewAppointmentSlot(null);
        setEditingAppointment(null);
        setPreselectedUserId(undefined); // Reset

    } catch (e: any) {
        toast({
            variant: "destructive",
            title: editingAppointment ? "Erreur lors de la modification" : "Erreur lors de la création",
            description: e.message || "Une erreur inattendue est survenue.",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleOpenPaymentSheet = async (entry: Appointment | Appointment[]) => {
    if (!services || !users || !plans) return;

    // Reset Gift Card & POS State
    setGiftCardCode('');
    setAppliedGiftCard(null);
    setAvailableGiftCards([]);
    setExtraItems([]);
    setManualDiscount('');
    setDiscountType('percent');
    setSelectedExtraServiceId(''); 
    setRelatedInvoice(null);
    setIsAlreadyPaid(false);
    
    // NEW: Reset Payment Flow
    setAddedPayments([]);
    setActivePaymentModal(null);
    setPaymentAmountInput('');

    let group: Appointment[] = [];
    let primaryAppointment: Appointment;

    if (Array.isArray(entry)) {
        // --- FORCED GROUP (Manual Add) ---
        group = entry;
        const unique = new Map();
        group.forEach(g => unique.set(g.id, g));
        group = Array.from(unique.values());
        
        primaryAppointment = group[0];
    } else {
        // --- AUTO GROUPING (Click on Calendar) ---
        primaryAppointment = entry;
        const clickedDate = new Date(entry.date);
        const dayKey = format(clickedDate, 'yyyy-MM-dd');

        // Filtra agendamentos do mesmo dia e mesmo usuário
        const userDayAppointments = appointments.filter(app => 
            app.user_id === entry.user_id && 
            format(new Date(app.date), 'yyyy-MM-dd') === dayKey &&
            app.status !== 'Cancelado'
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Agrupar apenas os que são contíguos (colados ou muito próximos) ao clicado
        const connectedAppointments = new Set<string>([entry.id]);
        
        // Procura para trás
        let current = entry;
        for (let i = userDayAppointments.indexOf(entry) - 1; i >= 0; i--) {
            const prev = userDayAppointments[i];
            const prevEnd = addMinutes(new Date(prev.date), prev.duration);
            const currentStart = new Date(current.date);
            const diff = differenceInMinutes(currentStart, prevEnd);
            
            if (diff <= 15) { // 15 min de tolerância para considerar "junto"
                connectedAppointments.add(prev.id);
                current = prev;
            } else {
                break;
            }
        }

        // Procura para frente
        current = entry;
        for (let i = userDayAppointments.indexOf(entry) + 1; i < userDayAppointments.length; i++) {
            const next = userDayAppointments[i];
            const currentEnd = addMinutes(new Date(current.date), current.duration);
            const nextStart = new Date(next.date);
            const diff = differenceInMinutes(nextStart, currentEnd);

            if (diff <= 15) {
                connectedAppointments.add(next.id);
                current = next;
            } else {
                break;
            }
        }
        
        group = userDayAppointments.filter(app => connectedAppointments.has(app.id));
    }

    // Calcular preço total base
    let totalBasePrice = 0;
    
    group.forEach(app => {
        const service = services.find(s => s.name === app.service_name) || 
                        services.find(s => s.name.toLowerCase().trim() === (app.service_name || '').toLowerCase().trim());
        const tier = service?.pricing_tiers.find(t => t.duration === app.duration);
        if (tier) totalBasePrice += tier.price;
    });

    // Tenta encontrar o usuário registrado
    let user = users.find(u => u.id === primaryAppointment.user_id) || null;

    // Se não encontrar (é Guest), cria um objeto de usuário temporário
    if (!user) {
        user = {
            id: 'guest',
            display_name: primaryAppointment.user_name || 'Invité',
            email: primaryAppointment.user_email || '',
            minutes_balance: 0,
            plan_id: undefined
        };
    }

    const userPlan = (user.id !== 'guest' && user.plan_id) ? plans.find(p => p.id === user.plan_id) : null;
    
    setPaymentDetails({ 
        appointments: group, // Array com 1 ou mais itens
        totalPrice: totalBasePrice, 
        user, 
        userPlan: userPlan || null 
    });
        
    // Reset Checkout State
    setCheckoutStep('cart');
    setTipAmount(0);

    // --- LÓGICA DE FATURA JÁ EXISTENTE ---
    if (primaryAppointment.status === 'Concluído' || ['card', 'online', 'minutes'].includes(primaryAppointment.payment_method)) {
        const startOfDayStr = startOfDay(new Date(primaryAppointment.date)).toISOString();
        const endOfDayStr = new Date(primaryAppointment.date);
        endOfDayStr.setHours(23, 59, 59, 999);
        
        const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id || '')
            .gte('date', startOfDayStr)
            .lte('date', endOfDayStr.toISOString())
            .order('date', { ascending: false })
            .limit(1);

        if (invoices && invoices.length > 0) {
            setRelatedInvoice(invoices[0]);
        }
    }

    // Check if already paid
    const isPaid = primaryAppointment.status === 'Concluído' || ['card', 'online', 'minutes'].includes(primaryAppointment.payment_method);
    setIsAlreadyPaid(isPaid);

    // --- BUSCAR GIFT CARDS ---
    if (user && user.id !== 'guest') {
        const { data: userCards } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('recipient_id', user.id)
            .eq('status', 'active')
            .gt('current_balance', 0);
        
        if (userCards && userCards.length > 0) {
            setAvailableGiftCards(userCards);
        }
    }
    
    setAmountPaid('');
    // Usa o método do agendamento clicado como padrão
    let method = primaryAppointment.payment_method;
    if (method === 'reception') method = 'cash';
    if (!['card', 'cash', 'minutes', 'gift'].includes(method)) method = 'cash';
    
    setSelectedPaymentMethod(method as any);
    setIsPaymentSheetOpen(true);
  };

  const handleVerifyGiftCard = async () => {
      if (!giftCardCode) return;
      setIsVerifyingGiftCard(true);
      
      try {
          const { data, error } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('code', giftCardCode.toUpperCase())
            .single();
            
          if (error || !data) {
              toast({ variant: "destructive", title: "Code invalide", description: "Ce chèque cadeau n'existe pas." });
              setAppliedGiftCard(null);
          } else if (data.status !== 'active' || data.current_balance <= 0) {
              toast({ variant: "destructive", title: "Code invalide", description: "Ce chèque cadeau est épuisé ou inactif." });
              setAppliedGiftCard(null);
          } else {
              // Calculer combien on peut utiliser
              const priceToPay = paymentDetails?.totalPrice || 0; // Usa totalPrice
              const amountToUse = Math.min(priceToPay, data.current_balance);
              
              setAppliedGiftCard({
                  id: data.id,
                  code: data.code,
                  balance: data.current_balance,
                  amountToUse: amountToUse
              });
              toast({ title: "Code appliqué", description: `Réduction de ${amountToUse}€ appliquée.` });
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsVerifyingGiftCard(false);
      }
  };

  const removeGiftCard = () => {
      setAppliedGiftCard(null);
      setGiftCardCode('');
  };

  // Helper para cálculos do checkout
  const getCheckoutTotals = () => {
      if (!paymentDetails) return { subtotal: 0, discount: 0, giftCardUsed: 0, tip: 0, total: 0, remaining: 0, paid: 0 };
      
      const mainPrice = paymentDetails.totalPrice || 0; // Usa totalPrice
      const extrasTotal = extraItems.reduce((acc, item) => acc + item.price, 0);
      const subtotal = mainPrice + extrasTotal;

      let discountAmount = 0;
      const discountVal = parseFloat(manualDiscount);
      
      if (!isNaN(discountVal) && discountVal > 0) {
          if (discountType === 'percent') {
              discountAmount = subtotal * (discountVal / 100);
          } else {
              discountAmount = discountVal;
          }
      }

      // Garante que o desconto não seja maior que o total
      discountAmount = Math.min(discountAmount, subtotal);
      
      const afterDiscount = subtotal - discountAmount;
      
      const totalBeforeTip = Math.max(0, afterDiscount);
      const finalTotal = totalBeforeTip + tipAmount;

      // Calculate Payments
      const paid = addedPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const remaining = Math.max(0, finalTotal - paid);

      return {
          subtotal,
          discount: discountAmount,
          giftCardUsed: 0,
          tip: tipAmount,
          total: finalTotal,
          remaining: remaining,
          paid: paid
      };
  };

  const handleAddExtraItem = (value: string) => {
      const [serviceId, duration, price] = value.split('|');
      const service = services.find(s => s.id === serviceId);
      
      if (!service) return;
      
      setExtraItems(prev => [...prev, { 
          name: `${service.name} (${duration} min)`, 
          price: parseFloat(price) 
      }]);
      
      setSelectedExtraServiceId('');
  };

  const handleRemoveExtraItem = (index: number) => {
      setExtraItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAppointmentFromCart = (appointmentId: string) => {
      if (!paymentDetails) return;
      
      const updatedAppointments = paymentDetails.appointments.filter(app => app.id !== appointmentId);
      
      if (updatedAppointments.length === 0) {
          setIsPaymentSheetOpen(false);
          setPaymentDetails(null);
      } else {
          // Recalculate base price
          let newTotalBasePrice = 0;
          updatedAppointments.forEach(app => {
            const service = services.find(s => s.name === app.service_name) || 
                            services.find(s => s.name.toLowerCase().trim() === (app.service_name || '').toLowerCase().trim());
            const tier = service?.pricing_tiers.find(t => t.duration === app.duration);
            if (tier) newTotalBasePrice += tier.price;
          });

          setPaymentDetails(prev => prev ? ({
              ...prev,
              appointments: updatedAppointments,
              totalPrice: newTotalBasePrice
          }) : null);
      }
  };

  // NEW: Add Payment Logic
  const initiateAddPayment = (method: 'card' | 'cash' | 'minutes' | 'gift' | 'terminal' | 'qr') => {
      const { remaining } = getCheckoutTotals();
      
      // Special logic for Minutes
      if (method === 'minutes') {
          if (!paymentDetails?.user || paymentDetails.user.id === 'guest') {
              toast({ variant: "destructive", title: "Action impossible", description: "Le client doit avoir un compte pour utiliser des minutes." });
              return;
          }

          // Check if user has a plan (Subscriber check)
          if (!paymentDetails.userPlan) {
              toast({ variant: "destructive", title: "Non éligible", description: "Ce client n'est pas abonné." });
              return;
          }
          
          const totalDuration = paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0);
          const userBalance = paymentDetails.user.minutes_balance || 0;
          
          if (userBalance < totalDuration) {
               toast({ variant: "destructive", title: "Solde insuffisant", description: `Le client a ${userBalance} min, mais ${totalDuration} min sont requises.` });
               return;
          }
          
          // Show confirmation modal instead of auto-adding
          setPaymentAmountInput(totalDuration.toString()); // Store duration in input for the modal
          setActivePaymentModal('minutes');
          return;
      }

      if (remaining <= 0) {
          toast({ title: "Déjà payé", description: "Le montant total a déjà été couvert." });
          return;
      }
      
      setPaymentAmountInput(remaining.toString());
      setActivePaymentModal(method);
      
      // Auto-verify for gift card if code is present (optional, usually empty)
      if (method === 'gift') {
          setGiftCardCode('');
          setAppliedGiftCard(null);
      }
  };

  // Helper for keypad input
  const handleKeypadInput = (val: string) => {
      if (val === 'backspace') {
          setPaymentAmountInput(prev => prev.slice(0, -1));
          return;
      }
      if (val === '.') {
          if (paymentAmountInput.includes('.')) return;
          if (paymentAmountInput === '') {
               setPaymentAmountInput('0.');
               return;
          }
      }
      setPaymentAmountInput(prev => prev + val);
  };

  const confirmAddPayment = (overrideAmount?: number, extraDetails?: any) => {
      const amount = overrideAmount !== undefined ? overrideAmount : parseFloat(paymentAmountInput);
      if (isNaN(amount) || amount <= 0) {
          toast({ variant: 'destructive', title: 'Montant invalide' });
          return;
      }

      const { remaining } = getCheckoutTotals();
      if (amount > remaining + 0.01) { // small epsilon for float precision
           toast({ variant: 'destructive', title: 'Montant trop élevé', description: `Il ne reste que ${remaining.toFixed(2)}€ à payer.` });
           return;
      }

      if (!activePaymentModal) return;

      const { label, icon } = getPaymentMethodLabel(activePaymentModal);

      // Determine amount and details based on method
      let finalAmount = amount;
      let details = extraDetails;

      if (activePaymentModal === 'minutes') {
          // For minutes, the "Euro Amount" to add to the payment list is the REMAINING balance (to zero out the bill)
          // The "Real Cost" is the duration in minutes
          const { remaining } = getCheckoutTotals();
          finalAmount = remaining; 
          details = { minutesDeduced: amount }; // 'amount' here is the duration passed from the modal
      }

      const newPayment: PaymentItem = {
          id: crypto.randomUUID(),
          method: activePaymentModal,
          amount: finalAmount,
          label: activePaymentModal === 'minutes' ? `Minutes (${amount} min)` : label,
          icon: icon,
          details: details
      };

      setAddedPayments(prev => [...prev, newPayment]);
      setActivePaymentModal(null);
      setPaymentAmountInput('');
  };

  const removeAddedPayment = (id: string) => {
      setAddedPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleVerifyAndAddGiftCard = async () => {
      if (!giftCardCode) return;
      setIsVerifyingGiftCard(true);
      
      try {
          const { data, error } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('code', giftCardCode.toUpperCase())
            .single();
            
          if (error || !data) {
              toast({ variant: "destructive", title: "Code invalide", description: "Ce chèque cadeau n'existe pas." });
          } else if (data.status !== 'active' || data.current_balance <= 0) {
              toast({ variant: "destructive", title: "Code invalide", description: "Ce chèque cadeau est épuisé ou inactif." });
          } else {
              const { remaining } = getCheckoutTotals();
              const amountToUse = Math.min(remaining, data.current_balance);
              
              confirmAddPayment(amountToUse, {
                  giftCardId: data.id,
                  code: data.code,
                  originalBalance: data.current_balance
              });
              
              toast({ title: "Carte Cadeau ajoutée", description: `${amountToUse}€ ajoutés au paiement.` });
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsVerifyingGiftCard(false);
      }
  };

  const handleConfirmPayment = async () => {
    if (!paymentDetails) return;

    const { total, paid } = getCheckoutTotals();
    
    // Allow small float diffs
    if (Math.abs(total - paid) > 0.05) {
         toast({ variant: 'destructive', title: 'Paiement incomplet', description: 'Veuillez régler la totalité du montant.' });
         return;
    }

    const totalMinutesDuration = paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0);

    // Check if minutes payment exists
    const minutesPayment = addedPayments.find(p => p.method === 'minutes');

    try {
        const sortedPayments = [...addedPayments].sort((a, b) => b.amount - a.amount);
        const primaryMethod = sortedPayments[0]?.method || 'cash';

        // Prepare updates
        const updates: any = {
            status: 'Concluído',
            payment_method: addedPayments.length > 1 ? 'mixed' : primaryMethod
        };

        // 1. PROCESS GIFT CARDS
        const giftPayments = addedPayments.filter(p => p.method === 'gift' && p.details?.giftCardId);
        const giftBalances: Record<string, number> = {};

        for (const gp of giftPayments) {
            const { data: card } = await supabase.from('gift_cards').select('current_balance').eq('id', gp.details.giftCardId).single();
            if (card) {
                const newBalance = card.current_balance - gp.amount;
                const status = newBalance <= 0.01 ? 'used' : 'active';
                await supabase.from('gift_cards').update({ current_balance: newBalance, status }).eq('id', gp.details.giftCardId);
                giftBalances[gp.id] = newBalance;
            }
        }

        // 2. PROCESS MINUTES
        if (minutesPayment && paymentDetails.user && paymentDetails.user.id !== 'guest') {
             // Use the calculated duration from the payment item details if available, else total duration
             const deduction = minutesPayment.details?.minutesDeduced || totalMinutesDuration;
             
             const newBalance = (paymentDetails.user.minutes_balance || 0) - deduction;
             const { error: profileError } = await supabase
                .from('profiles')
                .update({ minutes_balance: newBalance })
                .eq('id', paymentDetails.user.id);

             if (profileError) throw profileError;
        }

        // --- GERAÇÃO DE FATURA (INVOICE) ---
        const descriptionParts: string[] = [];
        
        paymentDetails.appointments.forEach(app => {
                descriptionParts.push(`${app.service_name} (${app.duration} min)`);
        });
        extraItems.forEach(item => {
            descriptionParts.push(`${item.name} - ${item.price}€`);
        });

        // Add payments info to description
        const paymentInfo = addedPayments.map(p => {
            let info = `${p.label}: ${p.amount}€`;
            if (p.method === 'gift' && giftBalances[p.id] !== undefined) {
                info += ` (Restant: ${giftBalances[p.id].toFixed(2)}€)`;
            }
            return info;
        }).join(', ');
        descriptionParts.push(`Paiements: [${paymentInfo}]`);

        // Adiciona info de desconto se houver
        const { discount } = getCheckoutTotals();
        if (discount > 0) {
            const discountLabel = discountType === 'percent' ? `Remise (${manualDiscount}%)` : `Remise (Fixe)`;
            descriptionParts.push(`${discountLabel}: -${discount.toFixed(2)}€`);
        }
        if (tipAmount > 0) descriptionParts.push(`Pourboire: ${tipAmount.toFixed(2)}€`);

        const finalDescription = descriptionParts.join(' | ');
        const userId = (paymentDetails.user && paymentDetails.user.id !== 'guest') ? paymentDetails.user.id : null;
        
        if (userId) {
            const invoiceData = {
                id: crypto.randomUUID(), 
                user_id: userId,
                plan_title: finalDescription, 
                date: new Date().toISOString(),
                amount: total,
                status: 'Pago',
                payment_method: addedPayments.length > 1 ? 'mixed' : primaryMethod 
            };

            const { error: invoiceError } = await supabase.from('invoices').insert(invoiceData);
            if (invoiceError) console.error("Erro ao criar fatura:", invoiceError);
        }

        // ATUALIZAR TODOS OS AGENDAMENTOS DO GRUPO
        const appIds = paymentDetails.appointments.map(a => a.id);
        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .in('id', appIds) 
            .select();

        if (error) throw error;
        
        // LOG PAYMENT / COMPLETE
        if (data) {
            data.forEach(async (app: Appointment) => {
                await logAppointmentAction(
                    supabase,
                    'COMPLETE',
                    app.id,
                    `Paiement/Terminé via ${addedPayments.map(p => p.method).join('+')}`,
                    null, 
                    app
                );
            });
        }

        // Mise à jour locale immédiate
        if (data) {
            setAppointments(prev => prev.map(app => {
                const updated = data.find((d: Appointment) => d.id === app.id);
                return updated ? updated as Appointment : app;
            }));
        }
        
        if (minutesPayment) {
             setUsers(prev => prev.map(u => 
                u.id === paymentDetails.user?.id 
                ? { ...u, minutes_balance: (u.minutes_balance || 0) - totalMinutesDuration }
                : u
             ));
        }

        toast({ title: 'Paiement Traité !', description: `${paymentDetails.appointments.length} services marqués comme terminés.` });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erreur lors du traitement du paiement", description: e.message });
    } finally {
        setIsPaymentSheetOpen(false);
        setPaymentDetails(null);
    }
  };

  const handleEditSpecific = (app: Appointment) => {
      setReturnToPaymentAfterEdit(true);
      setEditingAppointment(app);
      setIsPaymentSheetOpen(false);
      setTimeout(() => setIsFormSheetOpen(true), 150);
  };

  const handleAddServiceFromPaymentSheet = () => {
      if (!paymentDetails) return;
      setReturnToPaymentAfterEdit(true);
      
      setIdsToRestorePayment(paymentDetails.appointments.map(a => a.id));
      
      setEditingAppointment(null);
      setNewAppointmentSlot({
          date: new Date(), 
          time: format(new Date(), 'HH:mm')
      });
      
      if (paymentDetails.user && paymentDetails.user.id !== 'guest') {
          setPreselectedUserId(paymentDetails.user.id);
      }
      
      setIsPaymentSheetOpen(false);
      setTimeout(() => {
        setIsFormSheetOpen(true);
      }, 150);
  };

  const getPaymentMethodLabel = (method: string) => {
      switch(method) {
          case 'card': 
          case 'online': return { label: 'Carte Bancaire', icon: CreditCard };
          case 'terminal': return { label: 'Terminal', icon: Smartphone };
          case 'cash': return { label: 'Espèce', icon: Banknote };
          case 'minutes': return { label: 'Minutes', icon: Clock };
          case 'gift': 
          case 'gift_card': return { label: 'Chèque Cadeau', icon: Gift };
          case 'qr': return { label: 'QR Code', icon: QrCode };
          default: return { label: method, icon: Wallet };
      }
  };
  
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Hidden container for PDF Generation */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        {printingRecord && <InvoiceDocument ref={printRef} data={printingRecord} />}
      </div>

      {/* OVERLAY INVISÍVEL PARA FECHAR O MENU AO CLICAR FORA */}
      {slotMenu?.isOpen && (
          <div 
            className="fixed inset-0 z-50 bg-transparent" 
            onClick={() => setSlotMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setSlotMenu(null); }}
          />
      )}

      {/* MENU DE SLOT (BALÃO ESTILO FRESHA) */}
      {slotMenu?.isOpen && (
          <div 
            className="fixed z-[60] bg-popover text-popover-foreground rounded-lg shadow-xl border w-64 animate-in fade-in zoom-in-95 duration-100 p-1 overflow-hidden"
            style={{ 
                top: Math.min(slotMenu.y, window.innerHeight - 200), // Evita sair da tela embaixo
                left: Math.min(slotMenu.x + 10, window.innerWidth - 270) // Evita sair da tela na direita
            }}
          >
              <div className="px-3 py-2 bg-muted/30 border-b mb-1">
                  <div className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {format(slotMenu.date, 'EEEE d', { locale: fr })} à {slotMenu.time}
                  </div>
              </div>
              
              <div className="flex flex-col gap-0.5 p-1">
                  <Button 
                    variant="ghost" 
                    className="justify-start h-9 px-2 font-normal hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleMenuAction('appointment')}
                  >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Nouveau Rendez-vous
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start h-9 px-2 font-normal hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => handleMenuAction('blocked')}
                  >
                      <Lock className="mr-2 h-4 w-4 opacity-70" />
                      Bloquer un créneau
                  </Button>

                  <div className="h-px bg-border my-1 mx-2" />

                   <Button 
                    variant="ghost" 
                    className="justify-start h-8 px-2 text-xs text-muted-foreground font-normal hover:bg-muted"
                    disabled
                  >
                      <MoreHorizontal className="mr-2 h-3.5 w-3.5" />
                      Paramètres actions rapides
                  </Button>
              </div>
          </div>
      )}

      <Card className="h-[calc(100vh-100px)] border-0 shadow-none bg-transparent">
        <CardContent className="p-0 h-full">
          <Tabs defaultValue="list" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-none">
                <TabsList>
                    <TabsTrigger value="list">Liste</TabsTrigger>
                    <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
                    <TabsTrigger value="week">Semaine</TabsTrigger>
                    <TabsTrigger value="month">Mois</TabsTrigger>
                </TabsList>
                
                <Button onClick={handleManualNewAppointment}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Nouveau Rendez-vous
                </Button>
            </div>

            {isLoading && (
                 <div className="mt-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}
            
            {!isLoading && services && (
              <div className="flex-1 min-h-0">
                <TabsContent value="list" className="mt-0 h-full">
                    <AdminAppointmentsTable 
                        appointments={appointments}
                        onPay={handleOpenPaymentSheet}
                        onDelete={handleOpenDeleteDialog}
                        onCancel={handleOpenCancelDialog}
                    />
                </TabsContent>
                <TabsContent value="today" className="mt-0 h-full">
                  <AgendaView 
                    days={[new Date()]} 
                    timeSlots={allTimeSlots} 
                    appointments={todayAppointments}
                    onSlotClick={handleSlotClick}
                    onPayClick={handleOpenPaymentSheet}
                    onAppointmentDrop={handleAppointmentDrop}
                    services={services}
                    users={users} 
                    onEditClick={(app: Appointment) => {
                        setEditingAppointment(app);
                        setIsFormSheetOpen(true);
                    }}
                    onCancelClick={handleOpenCancelDialog}
                   />
                </TabsContent>
                <TabsContent value="week" className="mt-0 h-full">
                   <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between py-2 px-1 flex-none">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold capitalize text-lg">
                                        {format(weekDays[0], 'd MMM', { locale: fr })} - {format(weekDays[6], 'd MMM yyyy', { locale: fr })}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" onClick={() => setCurrentWeekDate(d => subWeeks(d, 1))}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => setCurrentWeekDate(new Date())}>
                                        Aujourd'hui
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setCurrentWeekDate(d => addWeeks(d, 1))}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <AgendaView 
                                days={weekDays} 
                                timeSlots={allTimeSlots} 
                                appointments={weekAppointments}
                                onSlotClick={handleSlotClick}
                                onPayClick={handleOpenPaymentSheet}
                                onAppointmentDrop={handleAppointmentDrop}
                                services={services}
                                users={users} 
                                onEditClick={(app: Appointment) => {
                                    setEditingAppointment(app);
                                    setIsFormSheetOpen(true);
                                }}
                                onCancelClick={handleOpenCancelDialog}
                            />
                        </div>
                   </div>
                </TabsContent>
                <TabsContent value="month" className="mt-0 h-full">
                    <MonthView 
                        currentMonth={currentMonthView}
                        onMonthChange={setCurrentMonthView}
                        appointments={monthAppointments}
                        onSlotClick={handleSlotClick}
                        onAppointmentClick={handleOpenPaymentSheet}
                        services={services}
                    />
                </TabsContent>
               </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le rendez-vous pour
              <span className="font-semibold"> {selectedAppointment?.service_name} </span>
              de
              <span className="font-semibold"> {selectedAppointment?.user_name} </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Annuler le rendez-vous ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Le statut passera à "Annulé" et le créneau restera visible mais grisé. Un email sera envoyé au client.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Retour</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelAppointment} className="bg-amber-600 hover:bg-amber-700">
                    Confirmer l'annulation
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rescheduleDetails} onOpenChange={(open) => !open && setRescheduleDetails(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le déplacement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous déplacer le rendez-vous de 
              <span className="font-bold text-foreground"> {rescheduleDetails?.appointment.user_name} </span> 
              pour le soin
              <span className="font-bold text-foreground"> {rescheduleDetails?.appointment.service_name} </span> 
              au
              <br/>
              <span className="font-bold text-lg text-primary mt-2 block">
                {rescheduleDetails && format(rescheduleDetails.newDate, 'EEEE d MMMM', { locale: fr })} à {rescheduleDetails?.newTime}
              </span>
              <br/>
              Un email de notification sera envoyé au client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReschedule}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isFormSheetOpen} onOpenChange={(open) => {
          if (!open) {
              setEditingAppointment(null);
              setNewAppointmentSlot(null);
              // Clear return flag if cancelled
              setReturnToPaymentAfterEdit(false);
          }
          setIsFormSheetOpen(open);
      }}>
        <SheetContent className="w-full max-w-[100vw] sm:max-w-[900px] p-0 flex flex-col gap-0 h-full" side="right">
          <SheetHeader className="sr-only">
            <SheetTitle>Gérer le rendez-vous</SheetTitle>
            <SheetDescription>Formulaire pour créer ou modifier un rendez-vous</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden h-full">
            <AdminAppointmentForm
                users={users || []}
                services={services || []}
                plans={plans || []}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormSheetOpen(false)}
                allTimeSlots={allTimeSlots}
                initialTime={newAppointmentSlot?.time}
                initialData={editingAppointment || (initialFormType === 'blocked' ? { payment_method: 'blocked' } as any : undefined)}
                preselectedUserId={preselectedUserId}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Conflit d'horaire
            </AlertDialogTitle>
            <AlertDialogDescription>
                Il existe déjà un rendez-vous pour ce service qui chevauche l'heure sélectionnée. Veuillez choisir une autre heure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsConflictDialogOpen(false)}>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent className="w-full max-w-[100vw] sm:max-w-[1000px] p-0 flex flex-col h-full overflow-hidden border-l-0 shadow-2xl bg-slate-50/50" side="right">
            <SheetHeader className="sr-only">
                <SheetTitle>Checkout</SheetTitle>
                <SheetDescription>Processus de paiement</SheetDescription>
            </SheetHeader>
            
            {paymentDetails && (
                <div className="flex h-full">
                    
                    {/* --- LEFT PANEL: MAIN CONTENT (STEPS OR RECEIPT) --- */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                        
                        {isAlreadyPaid ? (
                            // --- PAID VIEW (RECEIPT) ---
                            <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Paiement Effectué</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        le {format(new Date(paymentDetails.appointments[0].date), 'd MMMM yyyy à HH:mm', { locale: fr })}
                                    </p>
                                </div>

                                <div className="bg-white border rounded-xl shadow-sm w-full max-w-md overflow-hidden text-left">
                                    {/* Services List */}
                                    <div className="p-6 border-b bg-slate-50/50">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Détails de la commande</h3>
                                        <div className="space-y-3">
                                            {paymentDetails.appointments.map((app) => (
                                                <div key={app.id} className="flex justify-between items-start text-sm">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{app.service_name}</div>
                                                        <div className="text-slate-500 text-xs">{app.duration} min</div>
                                                    </div>
                                                    <div className="font-medium text-slate-900">
                                                        {(app.payment_method === 'minutes') 
                                                            ? '-' 
                                                            : `${services.find(s => s.name === app.service_name)?.pricing_tiers.find(t => t.duration === app.duration)?.price || '?'} €`
                                                        }
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="p-6 space-y-4">
                                         <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Méthode principale</span>
                                            <Badge variant="outline" className="capitalize">
                                                {(paymentDetails.appointments[0].payment_method === 'mixed') 
                                                    ? 'Mixte' 
                                                    : (paymentDetails.appointments[0].payment_method === 'minutes' ? 'Solde Minutes' : paymentDetails.appointments[0].payment_method)
                                                }
                                            </Badge>
                                        </div>
                                        
                                        {/* Invoice Breakdown Details */}
                                        {relatedInvoice && relatedInvoice.plan_title && (
                                            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-2 border border-slate-100">
                                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                    <Wallet className="h-3 w-3" /> Historique des paiements
                                                </div>
                                                <div className="space-y-1 pl-1">
                                                    {relatedInvoice.plan_title.split('|').map((part: string, i: number) => {
                                                        const p = part.trim();
                                                        
                                                        // Handle Payments Block
                                                        if (p.startsWith('Paiements:')) {
                                                            const content = p.replace('Paiements:', '').replace('[', '').replace(']', '').trim();
                                                            const methods = content.split(', ');
                                                            
                                                            return (
                                                                <div key={i} className="mt-2 pt-2 border-t border-dashed border-slate-200 flex flex-col gap-1">
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Moyens de paiement</span>
                                                                    {methods.map((m, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center text-slate-700">
                                                                             <span>• {m.split(':')[0]}</span>
                                                                             <span className="font-medium">{m.split(':')[1]?.trim() || ''}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }

                                                        // Handle Discounts & Tips
                                                        if (p.startsWith('Remise') || p.startsWith('Pourboire')) {
                                                             const [label, val] = p.split(':');
                                                             return (
                                                                 <div key={i} className={cn("flex justify-between items-center font-medium", p.startsWith('Remise') ? "text-emerald-600" : "text-slate-700")}>
                                                                     <span>{label.trim()}</span>
                                                                     <span>{val?.trim()}</span>
                                                                 </div>
                                                             );
                                                        }
                                                        
                                                        return null;
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="flex justify-between items-end">
                                            <span className="font-semibold text-slate-700">Total réglé</span>
                                            <span className="text-2xl font-bold text-emerald-600">
                                                {(paymentDetails.appointments[0].payment_method === 'minutes')
                                                    ? `${paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0)} min`
                                                    : `${relatedInvoice ? relatedInvoice.amount.toFixed(2) : paymentDetails.totalPrice.toFixed(2)} €`
                                                }
                                            </span>
                                        </div>
                                        
                                        {relatedInvoice && (
                                             <div className="text-center pt-2">
                                                 <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Facture #{relatedInvoice.id.slice(0, 8)}</span>
                                             </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        variant="outline" 
                                        onClick={async () => {
                                            if (!paymentDetails) return;
                                            
                                            const isMinutesPayment = paymentDetails.appointments[0].payment_method === 'minutes';
                                            
                                            let subscriberDetails = undefined;
                                            if (isMinutesPayment && paymentDetails.user) {
                                                subscriberDetails = {
                                                    planName: paymentDetails.userPlan?.title || 'Abonnement',
                                                    minutesDebited: paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0),
                                                    minutesRemaining: paymentDetails.user.minutes_balance || 0
                                                };
                                            }

                                            // Construct BillingRecord-like object for InvoiceDocument
                                            const record = {
                                                id: relatedInvoice ? `inv_${relatedInvoice.id}` : `apt_${paymentDetails.appointments[0].id}`,
                                                date: relatedInvoice ? relatedInvoice.date : paymentDetails.appointments[0].date,
                                                description: relatedInvoice ? relatedInvoice.plan_title : paymentDetails.appointments.map(a => `${a.service_name} (${a.duration} min)`).join(' | '),
                                                amount: relatedInvoice ? relatedInvoice.amount : (isMinutesPayment ? 0 : paymentDetails.totalPrice),
                                                method: relatedInvoice ? relatedInvoice.payment_method : paymentDetails.appointments[0].payment_method,
                                                client: paymentDetails.user?.display_name || 'Client',
                                                user_id: paymentDetails.user?.id || null,
                                                subscriberDetails: subscriberDetails
                                            };

                                            setPrintingRecord(record);
                                            
                                            // Wait for render
                                            setTimeout(async () => {
                                                if (printRef.current) {
                                                    try {
                                                        const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
                                                        const imgData = canvas.toDataURL('image/png');
                                                        const pdf = new jsPDF('p', 'mm', 'a4');
                                                        const pdfWidth = pdf.internal.pageSize.getWidth();
                                                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                                                        
                                                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                                        pdf.save(`recu_${record.id.slice(0, 10)}.pdf`);
                                                    } catch (err) {
                                                        console.error("PDF generation failed", err);
                                                        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de générer le PDF." });
                                                    } finally {
                                                        setPrintingRecord(null);
                                                    }
                                                }
                                            }, 100);
                                        }}
                                        disabled={!!printingRecord}
                                    >
                                        {printingRecord ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4" />}
                                        Imprimer Reçu
                                    </Button>
                                    <Button onClick={() => setIsPaymentSheetOpen(false)}>
                                        Fermer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // --- CHECKOUT FLOW ---
                            <>
                                {/* Breadcrumbs / Header */}
                                <div className="px-8 py-6 border-b shrink-0">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <button 
                                            onClick={() => setCheckoutStep('cart')}
                                            className={cn("hover:text-primary transition-colors", checkoutStep === 'cart' && "text-foreground font-semibold")}
                                        >
                                            Panier
                                        </button>
                                        <ChevronRight className="h-4 w-4" />
                                        <button 
                                            onClick={() => setCheckoutStep('tips')}
                                            disabled={checkoutStep === 'cart'}
                                            className={cn("hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed", checkoutStep === 'tips' && "text-foreground font-semibold")}
                                        >
                                            Pourboire
                                        </button>
                                        <ChevronRight className="h-4 w-4" />
                                        <span className={cn(checkoutStep === 'payment' && "text-foreground font-semibold")}>
                                            Paiement
                                        </span >
                                     </div>
                                     <h2 className="text-2xl font-bold text-slate-900">
                                        {checkoutStep === 'cart' && "Détails du panier"}
                                        {checkoutStep === 'tips' && "Sélectionner un pourboire"}
                                        {checkoutStep === 'payment' && "Sélectionnez le mode de paiement"}
                                     </h2>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto p-8">
                                    
                                    {/* STEP 1: CART DETAILS */}
                                    {checkoutStep === 'cart' && (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-lg">Prestations</h3>
                                                {paymentDetails.appointments.map((app) => {
                                                    const color = services.find(s => s.name === app.service_name)?.color || '#3b82f6';
                                                    return (
                                                        <div key={app.id} className="group relative pl-4 py-2 border-l-4 hover:bg-slate-50 rounded-r-md transition-colors pr-2" style={{ borderLeftColor: color }}>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-base text-slate-900">
                                                                            {app.service_name}
                                                                        </span>
                                                                        {/* Edit Button */}
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-6 w-6 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={(e) => { e.stopPropagation(); handleEditSpecific(app); }}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                                        <span>{format(new Date(app.date), 'HH:mm')}</span>
                                                                        <span>•</span>
                                                                        <span>{app.duration} min</span>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <User className="h-3 w-3" /> Admin
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="font-semibold text-slate-900">
                                                                        {services.find(s => s.name === app.service_name)?.pricing_tiers.find(t => t.duration === app.duration)?.price} €
                                                                    </div>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveAppointmentFromCart(app.id); }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            <div className="pt-2">
                                                 <Button 
                                                    variant="outline" 
                                                    className="rounded-full border-dashed border-slate-300 text-slate-600 hover:text-primary hover:border-primary hover:bg-primary/5 h-10 px-6 gap-2"
                                                    onClick={handleAddServiceFromPaymentSheet}
                                                >
                                                    <PlusCircle className="h-4 w-4" /> Ajouter une prestation
                                                </Button>
                                            </div>
                                            
                                            {extraItems.length > 0 && (
                                                <div className="pt-6 border-t border-dashed">
                                                    <h3 className="font-semibold text-lg mb-3">Extras</h3>
                                                    <div className="space-y-2">
                                                        {extraItems.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                                                                <span>{item.name}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span>{item.price} €</span>
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveExtraItem(idx)}>
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 2: TIPS */}
                                    {checkoutStep === 'tips' && (
                                        <div className="max-w-3xl">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <button
                                                    onClick={() => { setTipAmount(0); setCheckoutStep('payment'); }}
                                                    className={cn(
                                                        "h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:border-primary hover:bg-primary/5",
                                                        tipAmount === 0 ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 bg-white"
                                                    )}
                                                >
                                                    <span className="font-bold text-lg">Aucun</span>
                                                    <span className="text-xs text-muted-foreground">Pas de pourboire</span>
                                                </button>
                                                
                                                {[10, 15, 20, 25].map((percent) => {
                                                    const amount = getCheckoutTotals().subtotal * (percent / 100);
                                                    return (
                                                        <button
                                                            key={percent}
                                                            onClick={() => { setTipAmount(amount); setCheckoutStep('payment'); }}
                                                            className={cn(
                                                                "h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:border-primary hover:bg-primary/5",
                                                                Math.abs(tipAmount - amount) < 0.01 && tipAmount > 0 ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 bg-white"
                                                            )}
                                                        >
                                                            <span className="font-bold text-xl">{percent}%</span>
                                                            <span className="text-sm text-muted-foreground">{amount.toFixed(2)} €</span>
                                                        </button>
                                                    )
                                                })}

                                                <div className="h-24 rounded-xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center p-2 relative hover:border-slate-300">
                                                    <span className="text-sm font-medium mb-1 text-muted-foreground">Personnalisé</span>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="font-bold text-lg">€</span>
                                                        <Input 
                                                            type="number" 
                                                            className="w-20 h-8 text-center border-none shadow-none focus-visible:ring-0 p-0 text-lg font-bold bg-transparent"
                                                            placeholder="0.00"
                                                            value={tipAmount > 0 && !([10,15,20,25].some(p => Math.abs(getCheckoutTotals().subtotal * (p/100) - tipAmount) < 0.01)) ? tipAmount : ''}
                                                            onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') setCheckoutStep('payment');
                                                            }}
                                                        />
                                                    </div>
                                                    {tipAmount > 0 && !([10,15,20,25].some(p => Math.abs(getCheckoutTotals().subtotal * (p/100) - tipAmount) < 0.01)) && (
                                                        <Button size="sm" variant="ghost" className="absolute bottom-1 right-1 h-6 w-6 p-0 rounded-full" onClick={() => setCheckoutStep('payment')}>
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: PAYMENT METHOD */}
                                    {checkoutStep === 'payment' && (
                                        <div className="max-w-3xl">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <button
                                                    onClick={() => initiateAddPayment('terminal')}
                                                    className="h-32 rounded-xl border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                        <Smartphone className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">Terminal</span>
                                                    <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Connecté</span>
                                                </button>

                                                <button
                                                    onClick={() => initiateAddPayment('card')}
                                                    className="h-32 rounded-xl border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                        <CreditCard className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex flex-col items-center leading-tight">
                                                        <span className="font-bold text-slate-900">Carte (Manuelle)</span>
                                                        <span className="text-[10px] text-muted-foreground">Saisie manuelle</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => initiateAddPayment('cash')}
                                                    className="h-32 rounded-xl border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                        <Banknote className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">Espèces</span>
                                                </button>

                                                <button
                                                    onClick={() => initiateAddPayment('gift')}
                                                    className="h-32 rounded-xl border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                                                        <Gift className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">Carte Cadeau</span>
                                                </button>

                                                <button
                                                    onClick={() => initiateAddPayment('minutes')}
                                                    disabled={!paymentDetails.userPlan} // Disable if not subscriber
                                                    className={cn(
                                                        "h-32 rounded-xl border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-all",
                                                        paymentDetails.userPlan 
                                                            ? "hover:border-primary hover:bg-primary/5 hover:scale-[1.02]" 
                                                            : "opacity-50 grayscale cursor-not-allowed bg-slate-50"
                                                    )}
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                                        <Clock className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex flex-col items-center leading-tight">
                                                        <span className="font-bold text-slate-900">Minutes</span>
                                                        {!paymentDetails.userPlan && (
                                                            <span className="text-[10px] text-muted-foreground">(Non abonné)</span>
                                                        )}
                                                    </div>
                                                </button>
                                                
                                                <button
                                                    onClick={() => initiateAddPayment('qr')}
                                                    className="h-32 rounded-xl border-2 border-slate-200 bg-white p-4 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                        <QrCode className="h-6 w-6" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">QR Code</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </>
                        )}
                    </div>

                    {/* --- RIGHT PANEL: SIDEBAR SUMMARY --- */}
                    <div className="w-[350px] shrink-0 border-l bg-slate-50 flex flex-col shadow-inner z-10">
                         {/* Client Card */}
                         <div className="p-4 m-4 bg-white rounded-xl shadow-sm border border-slate-100">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-slate-50">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {getInitials(paymentDetails.user?.display_name || paymentDetails.user?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-900 truncate">
                                        {paymentDetails.user?.id !== 'guest' ? paymentDetails.user?.display_name : 'Invité'}
                                    </h3>
                                    {paymentDetails.user?.id === 'guest' ? (
                                        <button className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                                            <PlusCircle className="h-3 w-3" /> Créer un profil
                                        </button>
                                    ) : (
                                        <p className="text-xs text-muted-foreground truncate">{paymentDetails.user?.email}</p>
                                    )}
                                </div>
                             </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto px-6 py-2">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Résumé</h4>
                             
                             {/* Items Summary */}
                             <div className="space-y-3">
                                {paymentDetails.appointments.map((app) => (
                                    <div key={app.id} className="flex justify-between text-sm">
                                        <div className="text-slate-700 truncate pr-2 flex-1">{app.service_name}</div>
                                        <div className="font-medium text-slate-900">
                                            {(addedPayments.some(p => p.method === 'minutes') || paymentDetails.userPlan) 
                                                ? `${app.duration} min`
                                                : `${services.find(s => s.name === app.service_name)?.pricing_tiers.find(t => t.duration === app.duration)?.price} €`
                                            }
                                        </div>
                                    </div>
                                ))}
                                {extraItems.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <div className="text-slate-700 truncate pr-2 flex-1">{item.name}</div>
                                        <div className="font-medium text-slate-900">{item.price} €</div>
                                    </div>
                                ))}
                             </div>
                             
                             <Separator className="my-4" />
                             
                             {/* Totals Calculation */}
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Sous-total</span>
                                    <span>{getCheckoutTotals().subtotal.toFixed(2)} €</span>
                                </div>
                                
                                {/* Discount Input Popover */}
                                <div className="flex justify-between items-center group">
                                    <span className="text-muted-foreground group-hover:text-slate-900 transition-colors">Remise</span>
                                    <div className="flex items-center gap-1">
                                         {getCheckoutTotals().discount > 0 && (
                                             <div className="flex items-center text-emerald-600 mr-1 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-medium">
                                                 -{getCheckoutTotals().discount.toFixed(2)} €
                                                 <button onClick={() => setManualDiscount('')} className="ml-1 hover:text-emerald-800"><X className="h-3 w-3"/></button>
                                             </div>
                                         )}
                                         
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-slate-100">
                                                    <Percent className="h-3.5 w-3.5" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-3" align="end">
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-sm">Ajouter une remise</h4>
                                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                        <button 
                                                            className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all", discountType === 'percent' ? "bg-white shadow-sm text-slate-900" : "text-muted-foreground hover:text-slate-900")}
                                                            onClick={() => setDiscountType('percent')}
                                                        >
                                                            Pourcentage (%)
                                                        </button>
                                                        <button 
                                                            className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all", discountType === 'fixed' ? "bg-white shadow-sm text-slate-900" : "text-muted-foreground hover:text-slate-900")}
                                                            onClick={() => setDiscountType('fixed')}
                                                        >
                                                            Montant (€)
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            type="number" 
                                                            placeholder="0"
                                                            value={manualDiscount}
                                                            onChange={(e) => setManualDiscount(e.target.value)}
                                                            className="h-9"
                                                            autoFocus
                                                        />
                                                        <span className="text-sm font-bold text-muted-foreground w-4">
                                                            {discountType === 'percent' ? '%' : '€'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                         </Popover>
                                    </div>
                                </div>
                                
                                {tipAmount > 0 && (
                                     <div className="flex justify-between text-muted-foreground animate-in slide-in-from-right-2">
                                        <span>Pourboire</span>
                                        <span>{tipAmount.toFixed(2)} €</span>
                                    </div>
                                )}
                             </div>

                             {/* ADDED PAYMENTS LIST */}
                             {addedPayments.length > 0 && (
                                 <div className="mt-6 animate-in slide-in-from-bottom-2">
                                     <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Paiements Ajoutés</h4>
                                     <div className="space-y-2">
                                         {addedPayments.map(p => (
                                             <div key={p.id} className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm transition-all hover:shadow-md">
                                                 <div className="flex justify-between items-center">
                                                     <div className="flex items-center gap-2 text-sm">
                                                         {p.icon && <p.icon className="h-4 w-4 text-slate-500" />}
                                                         <span className="font-medium text-slate-700">{p.label}</span>
                                                     </div>
                                                     <div className="flex items-center gap-2">
                                                         <span className="font-bold text-slate-900">{p.amount.toFixed(2)}€</span>
                                                         <button onClick={() => removeAddedPayment(p.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                             <X className="h-3.5 w-3.5" />
                                                         </button>
                                                     </div>
                                                 </div>
                                                 
                                                 {/* Gift Card Specific Details */}
                                                 {p.method === 'gift' && p.details?.originalBalance !== undefined && (
                                                     <div className="mt-2 pl-6 flex items-center justify-between text-xs text-muted-foreground border-t border-dashed border-slate-100 pt-1.5">
                                                         <div className="flex items-center gap-2">
                                                             <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide text-slate-600 font-bold border border-slate-200">
                                                                 {p.details.code || 'CODE'}
                                                             </span>
                                                         </div>
                                                         <div className="flex items-center gap-1">
                                                             <span>Solde restant:</span>
                                                             <span className={cn(
                                                                 "font-bold", 
                                                                 (p.details.originalBalance - p.amount) <= 0 ? "text-slate-400" : "text-emerald-600"
                                                             )}>
                                                                 {(p.details.originalBalance - p.amount).toFixed(2)}€
                                                             </span>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                         
                         {/* Footer Totals & Action */}
                         <div className="p-6 bg-white border-t space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-slate-900">Total</span>
                                    <span className="text-xl font-bold text-slate-900">
                                        {(addedPayments.some(p => p.method === 'minutes') || paymentDetails.userPlan)
                                            ? `${paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0)} min`
                                            : `${getCheckoutTotals().total.toFixed(2)} €`
                                        }
                                    </span>
                                </div>
                                
                                {/* Show Amount Paid if > 0 */}
                                {getCheckoutTotals().paid > 0 && !(addedPayments.some(p => p.method === 'minutes') || paymentDetails.userPlan) && (
                                    <div className="flex justify-between items-end text-muted-foreground">
                                        <span className="text-xs font-medium uppercase">Déjà réglé</span>
                                        <span className="text-base font-medium">{getCheckoutTotals().paid.toFixed(2)} €</span>
                                    </div>
                                )}

                                {getCheckoutTotals().remaining > 0 && !(addedPayments.some(p => p.method === 'minutes') || paymentDetails.userPlan) ? (
                                    <div className="flex justify-between items-end text-destructive">
                                        <span className="text-xs font-medium uppercase">Reste à payer</span>
                                        <span className="text-lg font-bold">{getCheckoutTotals().remaining.toFixed(2)} €</span>
                                    </div>
                                ) : (
                                     /* Show green 0.00 when fully paid (and not minutes) */
                                     getCheckoutTotals().paid >= getCheckoutTotals().total && getCheckoutTotals().total > 0 && !(addedPayments.some(p => p.method === 'minutes') || paymentDetails.userPlan) && (
                                         <div className="flex justify-between items-end text-emerald-600">
                                            <span className="text-xs font-medium uppercase">Reste à payer</span>
                                            <span className="text-lg font-bold">0.00 €</span>
                                        </div>
                                     )
                                )}
                            </div>

                            {checkoutStep === 'cart' && (
                                <Button 
                                    className="w-full h-12 text-base rounded-full bg-slate-900 hover:bg-black shadow-lg"
                                    onClick={() => setCheckoutStep('tips')}
                                >
                                    Encaisser
                                </Button>
                            )}

                            {checkoutStep === 'tips' && (
                                <Button 
                                    className="w-full h-12 text-base rounded-full bg-slate-900 hover:bg-black shadow-lg"
                                    onClick={() => setCheckoutStep('payment')}
                                >
                                    Continuer
                                </Button>
                            )}
                            
                            {checkoutStep === 'payment' && (
                                <Button 
                                    className={cn(
                                        "w-full h-12 text-base rounded-full shadow-lg transition-all",
                                        getCheckoutTotals().remaining > 0.05 
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                            : "bg-slate-900 hover:bg-black text-white"
                                    )}
                                    onClick={handleConfirmPayment}
                                    disabled={getCheckoutTotals().remaining > 0.05}
                                >
                                    Payer maintenant
                                </Button>
                            )}
                         </div>
                    </div>
                </div>
            )}
        </SheetContent>
      </Sheet>

      {/* DIALOGS FOR PAYMENT INPUTS */}
      <Dialog open={activePaymentModal === 'cash'} onOpenChange={(open) => !open && setActivePaymentModal(null)}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b bg-white">
                <h2 className="text-lg font-bold text-slate-900">Ajouter un montant en espèces</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setActivePaymentModal(null)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-white">
                 {/* Display Amount */}
                 <div className="flex items-center justify-center gap-1 mb-6 relative w-full">
                    <span className="text-4xl font-bold text-slate-900 mb-1">€</span>
                    <input 
                        type="text" 
                        value={paymentAmountInput} 
                        readOnly
                        className="border-none shadow-none text-6xl font-bold w-48 text-center focus-visible:ring-0 bg-transparent p-0 m-0 text-slate-900 placeholder:text-slate-200 cursor-default"
                        placeholder="0"
                    />
                    {/* Underline decoration */}
                    <div className="absolute bottom-1 w-32 h-[3px] bg-slate-200 rounded-full left-1/2 -translate-x-1/2 mt-1"></div>
                 </div>

                 {/* Suggestions Chips */}
                 <div className="w-full mb-8">
                     <ScrollArea className="w-full whitespace-nowrap">
                         <div className="flex w-max space-x-2 px-1 pb-2">
                             {(() => {
                                 const remaining = getCheckoutTotals().remaining;
                                 const suggestions = Array.from(new Set([
                                     remaining,
                                     Math.ceil(remaining / 5) * 5,
                                     Math.ceil(remaining / 10) * 10,
                                     Math.ceil(remaining / 20) * 20,
                                     Math.ceil(remaining / 50) * 50,
                                     Math.ceil(remaining / 100) * 100
                                 ])).sort((a, b) => a - b).filter(v => v >= remaining); // Only show amounts >= remaining (usually)
                                 
                                 return suggestions.map(val => (
                                     <button
                                         key={val}
                                         onClick={() => setPaymentAmountInput(val.toString())}
                                         className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                                     >
                                         {val} €
                                     </button>
                                 ));
                             })()}
                         </div>
                         <ScrollBar orientation="horizontal" />
                     </ScrollArea>
                 </div>

                 {/* Numeric Keypad */}
                 <div className="grid grid-cols-3 gap-x-4 gap-y-3 w-full max-w-[280px] mb-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <button
                              key={num}
                              onClick={() => handleKeypadInput(num.toString())}
                              className="h-16 w-full rounded-full border border-slate-100 bg-white text-3xl font-medium text-slate-900 hover:bg-slate-50 shadow-sm active:scale-95 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-100"
                          >
                              {num}
                          </button>
                      ))}
                      <button
                          onClick={() => handleKeypadInput('.')}
                          className="h-16 w-full rounded-full border border-slate-100 bg-white text-3xl font-medium text-slate-900 hover:bg-slate-50 shadow-sm active:scale-95 transition-all outline-none flex items-start justify-center pt-2"
                      >
                          .
                      </button>
                      <button
                          onClick={() => handleKeypadInput('0')}
                          className="h-16 w-full rounded-full border border-slate-100 bg-white text-3xl font-medium text-slate-900 hover:bg-slate-50 shadow-sm active:scale-95 transition-all outline-none"
                      >
                          0
                      </button>
                      <button
                          onClick={() => handleKeypadInput('backspace')}
                          className="h-16 w-full rounded-full border border-slate-100 bg-white flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95 transition-all outline-none group"
                      >
                          <Delete className="h-7 w-7 text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={1.5} />
                      </button>
                 </div>

                 {/* Footer / Action */}
                 <div className="w-full flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reste à payer</span>
                          <span className="text-lg font-bold text-slate-900">{getCheckoutTotals().remaining.toFixed(2)} €</span>
                      </div>
                      <Button 
                          className="rounded-full px-8 h-12 bg-slate-900 hover:bg-black text-white font-bold text-base shadow-lg hover:shadow-xl transition-all w-40"
                          onClick={() => confirmAddPayment()}
                      >
                          Ajouter
                      </Button>
                 </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activePaymentModal === 'gift'} onOpenChange={(open) => !open && setActivePaymentModal(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Paiement par Carte Cadeau</DialogTitle>
                <DialogDescription>
                    Sélectionnez une carte du client ou saisissez un code manuel.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                
                {/* Available Cards List */}
                {availableGiftCards.length > 0 ? (
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                             <Label className="text-sm font-medium text-muted-foreground">Cartes disponibles ({availableGiftCards.length})</Label>
                        </div>
                        <div className="grid gap-2 max-h-[240px] overflow-y-auto pr-1">
                            {availableGiftCards.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => setGiftCardCode(c.code)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                        giftCardCode === c.code 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center",
                                            giftCardCode === c.code ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <Gift className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm font-mono">{c.code}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                Expire le {c.expires_at ? format(new Date(c.expires_at), 'dd/MM/yyyy') : 'Jamais'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-primary text-base">{c.current_balance} €</div>
                                        <div className="text-[10px] text-muted-foreground">Solde</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Ou saisir un autre code</span>
                            </div>
                        </div>
                     </div>
                ) : (
                     <div className="p-6 bg-slate-50 rounded-lg border border-dashed flex flex-col items-center text-center gap-2">
                         <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                             <Gift className="h-5 w-5" />
                         </div>
                         <p className="text-sm text-muted-foreground">Aucune carte cadeau associée à ce client.</p>
                     </div>
                )}

                {/* Manual Input */}
                <div className="space-y-3">
                    <Label>Code de la carte (Manuel)</Label>
                    <div className="relative">
                        <Input 
                            placeholder="GIFT-XXXX-XXXX" 
                            value={giftCardCode} 
                            onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                            className="uppercase font-mono pl-10 h-11"
                            autoFocus={availableGiftCards.length === 0}
                        />
                        <div className="absolute left-3 top-3 text-slate-400">
                             <QrCode className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button 
                    className="w-full h-11 bg-slate-900 text-white hover:bg-black font-medium text-base shadow-lg" 
                    onClick={handleVerifyAndAddGiftCard} 
                    disabled={isVerifyingGiftCard || !giftCardCode}
                >
                    {isVerifyingGiftCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Vérifier et Ajouter'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Generic Confirmation for Card/Terminal */}
      <Dialog open={['card', 'terminal', 'qr', 'minutes'].includes(activePaymentModal || '')} onOpenChange={(open) => !open && setActivePaymentModal(null)}>
        <DialogContent className="sm:max-w-xs text-center">
            <DialogHeader>
                <DialogTitle className="text-center">
                    {activePaymentModal === 'minutes' ? 'Confirmer le débit' : 'Confirmer le montant'}
                </DialogTitle>
                <DialogDescription className="text-center">
                    {activePaymentModal === 'card' && "Paiement par Carte Bancaire (Manuelle)"}
                    {activePaymentModal === 'terminal' && "Paiement via Terminal"}
                    {activePaymentModal === 'minutes' && "Déduction de Minutes"}
                </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 flex flex-col items-center justify-center gap-4">
                 {activePaymentModal === 'minutes' ? (
                     <div className="w-full space-y-4">
                         <div className="flex flex-col items-center">
                             <span className="text-4xl font-bold text-primary">{paymentAmountInput}</span>
                             <span className="text-sm font-medium text-muted-foreground uppercase">Minutes à déduire</span>
                         </div>
                         
                         <div className="bg-slate-50 rounded-lg p-3 w-full space-y-2 text-sm">
                             <div className="flex justify-between">
                                 <span className="text-muted-foreground">Solde actuel</span>
                                 <span className="font-bold">{paymentDetails?.user?.minutes_balance || 0} min</span>
                             </div>
                             <div className="flex justify-between border-t pt-2 mt-2">
                                 <span className="text-muted-foreground">Nouveau solde</span>
                                 <span className={cn("font-bold", ((paymentDetails?.user?.minutes_balance || 0) - parseInt(paymentAmountInput)) < 0 ? "text-red-500" : "text-green-600")}>
                                     {(paymentDetails?.user?.minutes_balance || 0) - parseInt(paymentAmountInput)} min
                                 </span>
                             </div>
                         </div>
                     </div>
                 ) : (
                     <div className="flex items-center text-4xl font-bold">
                        <span>€</span>
                        <Input 
                            type="number" 
                            value={paymentAmountInput} 
                            onChange={(e) => setPaymentAmountInput(e.target.value)}
                            className="border-none shadow-none text-4xl font-bold w-32 text-center focus-visible:ring-0 bg-transparent p-0"
                            autoFocus
                        />
                     </div>
                 )}
            </div>
             <DialogFooter>
                <Button className="w-full bg-black text-white" onClick={() => confirmAddPayment(activePaymentModal === 'minutes' ? parseInt(paymentAmountInput) : undefined)}>
                    Confirmer
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- SHEET DE PERFIL DO USUÁRIO (CONSULTA RÁPIDA) --- */}
      <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
        <SheetContent className="w-full max-w-[100vw] sm:max-w-md p-0 flex flex-col h-full overflow-hidden" side="right">
            {paymentDetails?.user && (
                <>
                <div className="p-6 bg-muted/30 border-b flex-none">
                     <SheetHeader className="mb-4 text-left">
                        <SheetTitle>
                           {paymentDetails.user.display_name || 'Profil Client'}
                        </SheetTitle>
                     </SheetHeader>
                     <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {getInitials(paymentDetails.user.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold text-lg">{paymentDetails.user.display_name}</div>
                            <div className="text-muted-foreground text-sm">{paymentDetails.user.email}</div>
                        </div>
                     </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border">
                            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Solde Minutes</div>
                            <div className="text-2xl font-bold text-primary">{paymentDetails.user.minutes_balance || 0} min</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border">
                            <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Plan</div>
                            <div className="font-semibold truncate">{paymentDetails.userPlan?.title || 'Aucun'}</div>
                        </div>
                    </div>
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}