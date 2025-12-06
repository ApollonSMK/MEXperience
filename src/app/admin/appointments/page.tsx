'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isSameDay, startOfWeek, endOfWeek, addDays, eachDayOfInterval, getDay, addMinutes, parse, differenceInMinutes, startOfDay, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ConciergeBell, MoreHorizontal, Trash2, User, Info, PlusCircle, CreditCard, AlertTriangle, User as UserIcon, Wallet, Star, CheckCircle, XCircle, DollarSign, CheckCircle2, ChevronLeft, ChevronRight, Gift, Move, X, Pencil, ZoomIn, ZoomOut, Percent, Euro, Eye, History, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { AdminAppointmentForm, type AdminAppointmentFormValues, type Plan } from '@/components/admin-appointment-form';
import type { Service } from '@/app/admin/services/page';
import { Input } from '@/components/ui/input';
import { AdminAppointmentsTable } from '@/components/admin-appointments-table';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { logAppointmentAction } from '@/lib/appointment-logger';

// Interfaces
interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string; // ISO string
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception' | 'online' | 'gift' | 'cash' | 'blocked';
  payment_status?: string;
}

interface UserProfile {
  id: string;
  display_name?: string | null;
  photo_url?: string;
  email: string;
  plan_id?: string;
  minutes_balance?: number;
}


interface Schedule {
    id: string;
    day_name: string;
    time_slots: string[];
    order: number;
}

interface NewAppointmentSlot {
    date: Date;
    time: string;
}

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

// Nouvelle interface pour gérer le chèque cadeau appliqué
interface AppliedGiftCard {
    id: string;
    code: string;
    balance: number;
    amountToUse: number;
}

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('');
};

const CurrentTimeIndicator = ({ timeSlots, timeSlotInterval, days }: { timeSlots: string[], timeSlotInterval: number, days: Date[] }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const todayIndex = useMemo(() => days.findIndex(day => isToday(day)), [days]);

    if (timeSlots.length === 0 || todayIndex === -1) return null;

    const firstSlotDate = parse(timeSlots[0], 'HH:mm', new Date());
    const minutesFromStart = differenceInMinutes(currentTime, firstSlotDate);
    const rowHeight = 80; // h-20 = 5rem = 80px
    const topPosition = (minutesFromStart / timeSlotInterval) * rowHeight;
    
    const lastSlotDate = parse(timeSlots[timeSlots.length - 1], 'HH:mm', new Date());
    const endTimeWithInterval = addMinutes(lastSlotDate, timeSlotInterval);
    if (currentTime < firstSlotDate || currentTime > endTimeWithInterval) {
        return null;
    }
    
    // Position the indicator in the correct day column
    const leftPosition = `calc(5rem + ${todayIndex} * (100% - 5rem) / ${days.length})`;
    const width = `calc((100% - 5rem) / ${days.length})`;

    return (
        <div 
            className="absolute z-30 flex items-center pointer-events-none"
            style={{ top: `${topPosition}px`, left: leftPosition, width: width }}
        >
            <div className="h-2 w-2 rounded-full bg-red-500 -ml-1"></div>
            <div className="flex-grow h-[2px] bg-red-500"></div>
        </div>
    );
};

const MonthView = ({ 
    currentMonth, 
    onMonthChange,
    appointments, 
    onSlotClick, 
    onAppointmentClick, 
    services 
}: { 
    currentMonth: Date, 
    onMonthChange: (date: Date) => void,
    appointments: Appointment[], 
    onSlotClick: (slot: NewAppointmentSlot) => void, 
    onAppointmentClick: (app: Appointment) => void,
    services: Service[] 
}) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: fr });
    const endDate = endOfWeek(monthEnd, { locale: fr });
    
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDaysHeader = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });

    const getServiceColor = (name: string) => {
         const service = services.find(s => s.name === name);
         return service?.color || '#3b82f6';
    }

    const nextMonth = () => onMonthChange(addMonths(currentMonth, 1));
    const prevMonth = () => onMonthChange(subMonths(currentMonth, 1));
    const goToToday = () => onMonthChange(new Date());

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
            <div className="flex items-center justify-between p-2 px-3 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                    </h2>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={goToToday}>
                        Aujourd'hui
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekDaysHeader.map((day) => (
                    <div key={day.toString()} className="p-2 text-center text-sm font-medium uppercase text-muted-foreground">
                        {format(day, 'EEE', { locale: fr })}
                    </div>
                ))}
            </div>

            <ScrollArea className="flex-1">
                <div className="grid grid-cols-7 auto-rows-fr h-full">
                    {calendarDays.map((day) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        // Filtra e ORDENA por horário
                        const dayAppointments = appointments
                            .filter(app => format(new Date(app.date), 'yyyy-MM-dd') === dayKey)
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                        const isCurrentMonth = isSameMonth(day, monthStart);
                        
                        return (
                            <div 
                                key={day.toString()} 
                                className={cn(
                                    "min-h-[120px] border-b border-r p-2 transition-colors hover:bg-muted/5 relative group",
                                    !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                    isToday(day) && "bg-primary/5"
                                )}
                                onClick={() => onSlotClick({ date: day, time: '09:00' })}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full bg-background border">
                                        {format(day, 'd')}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSlotClick({ date: day, time: '09:00' });
                                        }}
                                    >
                                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                
                                <div className="space-y-1">
                                    {dayAppointments.map((app) => {
                                        const color = getServiceColor(app.service_name);
                                        // Fix: Incluir todos os métodos de pagamento considerados "Pagos" e o status
                                        const isPaid = app.status === 'Concluído' || ['card', 'minutes', 'cash', 'gift', 'online'].includes(app.payment_method);
                                        
                                        return (
                                            <div
                                                key={app.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAppointmentClick(app);
                                                }}
                                                className="text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 shadow-sm"
                                                style={{
                                                    backgroundColor: `${color}20`,
                                                    borderLeftColor: color,
                                                    color: '#0f172a'
                                                }}
                                            >
                                                <span className="font-semibold shrink-0">
                                                    {format(new Date(app.date), 'HH:mm')}
                                                </span>
                                                <span className="truncate flex-1">
                                                    {app.user_name}
                                                </span>
                                                {isPaid && <CheckCircle2 className="h-2.5 w-2.5 text-green-600 shrink-0" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

const AgendaView = ({ 
    days, 
    timeSlots, 
    appointments, 
    onSlotClick, 
    onPayClick, 
    services,
    onAppointmentDrop,
    onEditClick
}: { 
    days: Date[], 
    timeSlots: string[], 
    appointments: Appointment[], 
    onSlotClick: (slot: NewAppointmentSlot) => void, 
    onPayClick: (app: Appointment) => void, 
    services: Service[],
    onAppointmentDrop: (appointmentId: string, newDate: Date, newTime: string) => void,
    onEditClick: (app: Appointment) => void
}) => {
    
    // Zoom Control
    // Initialize from localStorage if available, otherwise default to 130
    const [zoomLevel, setZoomLevel] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('adminCalendarZoom');
            return saved ? parseInt(saved) : 130;
        }
        return 130;
    });

    // Persist zoom changes
    useEffect(() => {
        localStorage.setItem('adminCalendarZoom', zoomLevel.toString());
    }, [zoomLevel]);
    
    // Configuration de la grille baseada no Zoom
    const minTime = timeSlots.length > 0 ? parseInt(timeSlots[0].split(':')[0]) : 8;
    const maxTime = timeSlots.length > 0 ? parseInt(timeSlots[timeSlots.length-1].split(':')[0]) + 1 : 20;
    const START_HOUR = Math.max(0, minTime - 1);
    const END_HOUR = Math.min(24, maxTime + 1);
    
    const PIXELS_PER_HOUR = zoomLevel;
    const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    // State for Drag & Drop Visuals
    const [draggedApp, setDraggedApp] = useState<Appointment | null>(null);
    const [dropTarget, setDropTarget] = useState<{ date: Date, time: string, top: number } | null>(null);
    
    // State for Hover Visuals
    const [hoverSlot, setHoverSlot] = useState<{ date: Date, time: string, top: number } | null>(null);

    // Helper to calculate time from Y position
    const calculateTimeFromY = (y: number) => {
        const minutesFromStart = y / PIXELS_PER_MINUTE;
        const totalMinutes = minutesFromStart + (START_HOUR * 60);
        const hour = Math.floor(totalMinutes / 60);
        // CHANGE: Snap to 5 minutes
        const minute = Math.floor((totalMinutes % 60) / 5) * 5;
        return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
    };

    // Helper to calculate Y from Time string
    const calculateYFromTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const totalMinutes = (h * 60 + m) - (START_HOUR * 60);
        return totalMinutes * PIXELS_PER_MINUTE;
    };

    // Heure actuelle pour la ligne rouge
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const getCurrentTimeOffset = () => {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = START_HOUR * 60;
        return (currentMinutes - startMinutes) * PIXELS_PER_MINUTE;
    };

    const layoutEvents = useCallback((dayAppointments: Appointment[]) => {
        if (!dayAppointments.length) return [];
        
        // Trier par heure de début puis durée
        const sorted = [...dayAppointments].sort((a, b) => {
            const startA = new Date(a.date).getTime();
            const startB = new Date(b.date).getTime();
            return startA - startB || b.duration - a.duration;
        });

        const nodes = sorted.map(app => ({
            ...app,
            start: new Date(app.date).getTime(),
            end: new Date(app.date).getTime() + app.duration * 60000,
            colIndex: 0
        }));

        const columns: typeof nodes[] = [];
        
        // Packer les événements dans des colonnes virtuelles
        nodes.forEach(node => {
            let i = 0;
            while (true) {
                if (!columns[i]) {
                    columns[i] = [node];
                    node.colIndex = i;
                    break;
                }
                const collision = columns[i].some(other => node.start < other.end);
                if (!collision) {
                    columns[i].push(node);
                    node.colIndex = i;
                    break;
                }
                i++;
            }
        });

        // Calculer la largeur et la position
        return nodes.map(node => {
             const concurrent = nodes.filter(other => 
                 node.start < other.end && node.end > other.start
             );
             const maxColIndex = Math.max(...concurrent.map(n => n.colIndex));
             const totalCols = maxColIndex + 1;
             
             return {
                 data: node,
                 style: {
                     left: `${(node.colIndex / totalCols) * 100}%`,
                     width: `calc(${100 / totalCols}% - 4px)`, // Menos espaço entre colunas
                     top: `${((new Date(node.date).getHours() * 60 + new Date(node.date).getMinutes()) - (START_HOUR * 60)) * PIXELS_PER_MINUTE}px`,
                     height: `${node.duration * PIXELS_PER_MINUTE}px`
                 }
             };
        });
    }, [PIXELS_PER_MINUTE, START_HOUR]);

    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const timeStr = calculateTimeFromY(y);
        onSlotClick({ date: day, time: timeStr });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, app: Appointment) => {
        setDraggedApp(app);
        e.dataTransfer.setData('appointmentId', app.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';

        if (!draggedApp) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const timeStr = calculateTimeFromY(y);
        const snapTop = calculateYFromTime(timeStr);

        if (!dropTarget || dropTarget.time !== timeStr || !isSameDay(dropTarget.date, day)) {
            setDropTarget({ date: day, time: timeStr, top: snapTop });
        }
    };

    const handleDragLeave = () => {
        // Optional cleanup
    };

    const handleDragEnd = () => {
        setDraggedApp(null);
        setDropTarget(null);
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
        if (draggedApp) {
            setHoverSlot(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const timeStr = calculateTimeFromY(y);
        const snapTop = calculateYFromTime(timeStr);

        if (!hoverSlot || hoverSlot.time !== timeStr || !isSameDay(hoverSlot.date, day)) {
            setHoverSlot({ date: day, time: timeStr, top: snapTop });
        }
    };

    const handleMouseLeaveGrid = () => {
        setHoverSlot(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault();
        const appointmentId = e.dataTransfer.getData('appointmentId');
        
        setDraggedApp(null);
        setDropTarget(null);

        if (!appointmentId) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const timeStr = calculateTimeFromY(y);
        
        onAppointmentDrop(appointmentId, day, timeStr);
    };

    const getServiceColor = (name: string) => {
         const service = services.find(s => s.name === name);
         return service?.color || '#3b82f6';
    }

    if (!days.length) return null;

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background relative group/calendar shadow-sm">
            
            {/* Controles de Zoom (Flutuante Moderno) */}
            <div className="absolute bottom-4 left-6 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-md border shadow-lg rounded-full px-3 py-1.5 opacity-0 group-hover/calendar:opacity-100 transition-all duration-300 hover:scale-105">
                <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
                <Slider
                    defaultValue={[130]}
                    value={[zoomLevel]}
                    min={60}
                    max={250}
                    step={10}
                    onValueChange={(vals) => setZoomLevel(vals[0])}
                    className="w-20 cursor-pointer"
                />
                <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* En-tête des jours (Sticky & Glassmorphism) */}
            <div className="flex flex-none border-b z-40 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="w-16 flex-none border-r bg-background/50 flex items-center justify-center text-xs text-muted-foreground/50">
                    <Clock className="h-4 w-4" />
                </div>
                {days.map(day => {
                    const isTodayDate = isToday(day);
                    return (
                        <div key={day.toISOString()} className={cn(
                            "flex-1 py-3 text-center border-r last:border-r-0 transition-colors", 
                            isTodayDate ? "bg-primary/5" : "bg-transparent"
                        )}>
                             <div className={cn("text-xs font-medium uppercase tracking-wider mb-1", isTodayDate ? "text-primary" : "text-muted-foreground")}>
                                {format(day, 'EEE', { locale: fr })}
                             </div>
                             <div className={cn(
                                 "text-xl font-semibold leading-none h-8 w-8 mx-auto flex items-center justify-center rounded-full transition-all", 
                                 isTodayDate ? "bg-primary text-primary-foreground shadow-md scale-110" : "text-foreground"
                             )}>
                                 {format(day, 'd')}
                             </div>
                        </div>
                    );
                })}
            </div>

            {/* Grille Scrollable */}
            <ScrollArea className="flex-1">
                <div className="flex relative min-h-0" style={{ height: (END_HOUR - START_HOUR) * PIXELS_PER_HOUR }}>
                    
                    {/* Linha do Tempo Atual (Indicador Global) */}
                    {now.getHours() >= START_HOUR && now.getHours() <= END_HOUR && (
                        <div 
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                            style={{ top: getCurrentTimeOffset() }}
                        >
                             <div className="absolute left-0 -top-1.5 bg-red-500 text-white text-[9px] font-bold px-1 rounded-r-sm">
                                {format(now, 'HH:mm')}
                             </div>
                             <div className="absolute left-16 -top-[5px] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                             <div className="w-full border-t border-red-500/20"></div>
                        </div>
                    )}

                    {/* Colonne des heures */}
                    <div className="w-16 flex-none border-r bg-background z-20 sticky left-0 text-xs text-muted-foreground text-right pr-2 select-none shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)]">
                        {hours.map(h => (
                            <div key={h} className="relative" style={{ height: PIXELS_PER_HOUR }}>
                                <span className="absolute -top-2.5 right-2 text-[11px] font-medium text-foreground/70">{h}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Colonnes des jours */}
                    {days.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === dayKey);
                        const layoutedEvents = layoutEvents(dayEvents);
                        const isTodayDate = isToday(day);

                        return (
                            <div 
                                key={day.toISOString()} 
                                className={cn(
                                    "flex-1 relative border-r last:border-r-0 min-w-[150px] transition-colors",
                                    isTodayDate && "bg-primary/[0.02]", // Fundo muito sutil para hoje
                                    dropTarget && isSameDay(dropTarget.date, day) && "bg-primary/10"
                                )}
                                onDragOver={(e) => handleDragOver(e, day)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day)}
                                onClick={(e) => handleGridClick(e, day)}
                                onMouseMove={(e) => handleMouseMove(e, day)}
                                onMouseLeave={handleMouseLeaveGrid}
                            >
                                {/* Lignes de la grille */}
                                {hours.map(h => (
                                    <div key={h} className="absolute w-full pointer-events-none select-none" style={{ top: (h - START_HOUR) * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}>
                                         {/* Hora Cheia */}
                                         <div className="absolute w-full border-b border-border/30 top-0"></div>
                                         {/* Meia Hora (Tracejada) */}
                                         <div className="absolute w-full border-b border-dashed border-border/20 top-[50%]"></div>
                                    </div>
                                ))}

                                {/* Hover Slot Indicator */}
                                {hoverSlot && isSameDay(hoverSlot.date, day) && !draggedApp && (
                                    <div 
                                        className="absolute z-10 w-full left-0 border-t-2 border-primary/40 pointer-events-none animate-in fade-in duration-75"
                                        style={{ top: hoverSlot.top }}
                                    >
                                        <div className="bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-sm absolute -top-3 left-0 shadow-sm font-mono">
                                            {hoverSlot.time}
                                        </div>
                                    </div>
                                )}

                                {/* Ghost Drop Indicator */}
                                {dropTarget && draggedApp && isSameDay(dropTarget.date, day) && (
                                    <div 
                                        className="absolute z-40 inset-x-1 rounded-md border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in zoom-in-95 duration-200"
                                        style={{
                                            top: dropTarget.top,
                                            height: draggedApp.duration * PIXELS_PER_MINUTE,
                                        }}
                                    >
                                        <span className="text-xs font-bold text-primary bg-background/80 px-2 py-1 rounded-full shadow-sm">
                                            {dropTarget.time}
                                        </span>
                                    </div>
                                )}

                                {/* Rendez-vous */}
                                {layoutedEvents.map(({ data: app, style }) => {
                                    const color = getServiceColor(app.service_name);
                                    // Fix: Definição abrangente de pago para garantir que o ícone apareça
                                    const isPaid = app.status === 'Concluído' || ['card', 'online', 'minutes', 'cash', 'gift'].includes(app.payment_method);
                                    const isBlocked = app.payment_method === 'blocked';
                                    
                                    // ALTURA REAL DO SERVIÇO
                                    const realHeightPx = app.duration * PIXELS_PER_MINUTE;
                                    
                                    // ALTURA VISUAL DO SERVIÇO (Mínimo de 28px)
                                    const displayHeightPx = Math.max(realHeightPx, 28);
                                    const isVisualOverride = displayHeightPx > realHeightPx;

                                    // ALTURA DO BUFFER (15 min se não for bloqueio)
                                    const bufferHeightPx = isBlocked ? 0 : 15 * PIXELS_PER_MINUTE;

                                    const isTiny = displayHeightPx < 50;
                                    const isSmall = displayHeightPx < 70;
                                    
                                    const isBeingDragged = draggedApp?.id === app.id;

                                    return (
                                        <div
                                            key={app.id}
                                            className={cn(
                                                "absolute inset-x-1 flex flex-col transition-all duration-200 select-none group",
                                                // Z-Index: Se esticado visualmente ou hover, fica por cima
                                                isVisualOverride ? "z-30 hover:z-50" : "z-20 hover:z-50",
                                                isBeingDragged && "opacity-40 grayscale scale-95"
                                            )}
                                            style={{
                                                left: style.left,
                                                width: style.width,
                                                top: style.top,
                                                // Altura automática para conter card + buffer
                                            }}
                                        >
                                            {/* CARD DO SERVIÇO */}
                                            <div
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, app)}
                                                onDragEnd={handleDragEnd}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (isBlocked) {
                                                        onEditClick(app);
                                                    } else {
                                                        onPayClick(app);
                                                    }
                                                }}
                                                className={cn(
                                                    "relative rounded-md border-l-[4px] cursor-pointer overflow-hidden shadow-sm transition-all",
                                                    "hover:shadow-md hover:brightness-95",
                                                    isTiny ? "px-1.5 flex items-center" : "p-2",
                                                    isBlocked 
                                                        ? "bg-slate-100 border-l-slate-400 border border-slate-200" 
                                                        : "bg-white border-y border-r border-border/50"
                                                )}
                                                style={{
                                                    height: `${displayHeightPx}px`,
                                                    ...(isBlocked ? {
                                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #e2e8f0 10px, #e2e8f0 20px)'
                                                    } : {
                                                        backgroundColor: `${color}15`, 
                                                        borderLeftColor: color,
                                                    })
                                                }}
                                            >
                                                <div className="flex flex-col h-full w-full relative justify-center">
                                                    {isTiny ? (
                                                        <div className="flex items-center gap-2 w-full overflow-hidden">
                                                             <span className="text-[10px] font-mono text-muted-foreground shrink-0 leading-none">
                                                                {format(new Date(app.date), 'HH:mm')}
                                                             </span>
                                                             <div className="h-3 w-[1px] bg-border shrink-0"></div>
                                                             {isBlocked ? <Lock className="h-3 w-3 text-slate-500 shrink-0" /> : null}
                                                             <span className={cn("text-[11px] font-bold truncate leading-none text-foreground/90", isBlocked && "italic text-slate-600")}>
                                                                {isBlocked ? app.service_name : app.user_name}
                                                             </span>
                                                             {isPaid && !isBlocked && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 ml-auto" />}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-1 w-full shrink-0 leading-none mb-1">
                                                                 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{format(new Date(app.date), 'HH:mm')}</span>
                                                                 </div>
                                                                 <div className="flex gap-1">
                                                                    {isPaid && !isBlocked && (
                                                                        <div className="bg-emerald-100 p-0.5 rounded-full" title="Payé">
                                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                                        </div>
                                                                    )}
                                                                    {isBlocked && <Lock className="h-3 w-3 text-slate-500" />}
                                                                 </div>
                                                            </div>
                                                            <div className={cn("font-bold truncate text-foreground/90", isSmall ? "text-xs" : "text-sm", isBlocked && "text-slate-600 italic")}>
                                                                {isBlocked ? app.service_name.toUpperCase() : app.user_name}
                                                            </div>
                                                            {!isSmall && !isBlocked && (
                                                                <div className="truncate text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                                                                    {app.service_name}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* BUFFER DE PREPARAÇÃO (15 MIN) */}
                                            {!isBlocked && (
                                                <div 
                                                    className="w-[94%] mx-auto rounded-b-sm border-x border-b border-dashed border-muted-foreground/20 relative -mt-[1px] -z-10 flex items-center justify-center pointer-events-none"
                                                    style={{ 
                                                        height: `${bufferHeightPx}px`,
                                                        backgroundColor: `${color}08`, // Cor muito subtil
                                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)'
                                                    }}
                                                >
                                                     <div className="h-1 w-8 bg-black/5 rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [currentMonthView, setCurrentMonthView] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  // Estado para controlar a semana selecionada
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<NewAppointmentSlot | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // States for 'Edit & Recalculate' flow
  const [returnToPaymentAfterEdit, setReturnToPaymentAfterEdit] = useState(false);
  const [appointmentToReopenPayment, setAppointmentToReopenPayment] = useState<string | null>(null);

  // Lock para prevenir duplo envio
  const [isProcessing, setIsProcessing] = useState(false);

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | 'minutes' | 'gift'>('cash');
  
  // Checkout POS States (New)
  const [extraItems, setExtraItems] = useState<{name: string, price: number}[]>([]);
  const [manualDiscount, setManualDiscount] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [selectedExtraServiceId, setSelectedExtraServiceId] = useState<string>(''); // Novo estado para controlar o 1º select

  // States pour Gift Card
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [isVerifyingGiftCard, setIsVerifyingGiftCard] = useState(false);
  const [availableGiftCards, setAvailableGiftCards] = useState<any[]>([]); // Novo estado

  // Estado para armazenar a fatura encontrada (para agendamentos concluídos)
  const [relatedInvoice, setRelatedInvoice] = useState<any | null>(null);

  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [rescheduleDetails, setRescheduleDetails] = useState<RescheduleDetails | null>(null);
  
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
      if (appointmentToReopenPayment && appointments.length > 0) {
          const app = appointments.find(a => a.id === appointmentToReopenPayment);
          if (app) {
              handleOpenPaymentSheet(app);
              setAppointmentToReopenPayment(null);
          }
      }
  }, [appointmentToReopenPayment, appointments]);


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

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      // --- LOGIC DE REEMBOLSO DE MINUTOS (ADMIN) ---
      // Se for pago com minutos e ainda não estiver cancelado (para evitar reembolso duplo se já foi cancelado pelo user)
      if (selectedAppointment.payment_method === 'minutes' && selectedAppointment.status !== 'Cancelado' && selectedAppointment.user_id) {
           const { data: profile } = await supabase
            .from('profiles')
            .select('minutes_balance')
            .eq('id', selectedAppointment.user_id)
            .single();
           
           if (profile) {
               const newBalance = (profile.minutes_balance || 0) + selectedAppointment.duration;
               await supabase.from('profiles').update({ minutes_balance: newBalance }).eq('id', selectedAppointment.user_id);
               toast({ 
                   title: "Remboursement effectué", 
                   description: `${selectedAppointment.duration} minutes restituées au client.` 
               });
               
               // Log Refund
               await logAppointmentAction(supabase, 'UPDATE', selectedAppointment.id, `Remboursement de minutes lors de la suppression (${selectedAppointment.duration}min)`, selectedAppointment, { minutes_balance: newBalance });
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
      });

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
    setNewAppointmentSlot(slot);
    setIsFormSheetOpen(true);
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
    setIsFormSheetOpen(true);
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

      // Simple Conflict Check (Optional: Reuse logic from creation)
      // For now, assuming admin knows what they are doing with drag & drop, 
      // but ideally we should check conflicts here too.

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
  
    // NOVA LÓGICA DE CONFLITO:
    // 1. Bloqueios (Type=blocked) conflitam com TUDO.
    // 2. Serviços só conflitam com o MESMO serviço (Service A vs Service A).
    // 3. Serviços diferentes (Service A vs Service B) NÃO conflitam.
    
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
            // Removemos campos que não devem ser alterados se não existirem
            const { payment_method, status, ...rest } = dataToSave;
            // Se for bloqueio, forçamos o payment_method
            const updatePayload = isBlockedType ? { ...rest, payment_method: 'blocked' } : rest;

            const { data, error: updateError } = await supabase
                .from('appointments')
                .update(updatePayload)
                .eq('id', editingAppointment.id)
                .select()
                .single();

            if (updateError) throw updateError;
            
            // LOG UPDATE
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
                
                // If we were in payment flow, mark to reopen payment with new data
                if (returnToPaymentAfterEdit) {
                    setAppointmentToReopenPayment(data.id);
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

                // --- EMAIL DE CONFIRMAÇÃO ---
                // Não enviamos email para bloqueios
                if (!isBlockedType && data.user_email) {
                    await fetch('/api/emails/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'confirmation',
                            to: data.user_email,
                            data: {
                                userName: data.user_name,
                                serviceName: data.service_name,
                                date: data.date,
                                duration: data.duration
                            }
                        })
                    });
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

  const handleOpenPaymentSheet = async (clickedAppointment: Appointment) => {
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

    // --- LÓGICA DE MERGE (AGRUPAMENTO) ---
    // Encontrar agendamentos do mesmo cliente no mesmo dia que são consecutivos
    const clickedDate = new Date(clickedAppointment.date);
    const dayKey = format(clickedDate, 'yyyy-MM-dd');

    // Filtra agendamentos do mesmo dia e mesmo usuário
    const userDayAppointments = appointments.filter(app => 
        app.user_id === clickedAppointment.user_id && 
        format(new Date(app.date), 'yyyy-MM-dd') === dayKey &&
        app.status !== 'Cancelado'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Agrupar apenas os que são contíguos (colados ou muito próximos) ao clicado
    // Vamos considerar "conectado" se o intervalo for menor que 15 min
    const connectedAppointments = new Set<string>([clickedAppointment.id]);
    
    // Procura para trás
    let current = clickedAppointment;
    for (let i = userDayAppointments.indexOf(clickedAppointment) - 1; i >= 0; i--) {
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
    current = clickedAppointment;
    for (let i = userDayAppointments.indexOf(clickedAppointment) + 1; i < userDayAppointments.length; i++) {
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

    // Lista final de agendamentos agrupados
    const group = userDayAppointments.filter(app => connectedAppointments.has(app.id));

    // Calcular preço total base
    let totalBasePrice = 0;
    
    group.forEach(app => {
        const service = services.find(s => s.name === app.service_name) || 
                        services.find(s => s.name.toLowerCase().trim() === (app.service_name || '').toLowerCase().trim());
        const tier = service?.pricing_tiers.find(t => t.duration === app.duration);
        if (tier) totalBasePrice += tier.price;
    });

    // Tenta encontrar o usuário registrado
    let user = users.find(u => u.id === clickedAppointment.user_id) || null;

    // Se não encontrar (é Guest), cria um objeto de usuário temporário
    if (!user) {
        user = {
            id: 'guest',
            display_name: clickedAppointment.user_name || 'Invité',
            email: clickedAppointment.user_email || '',
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
        
    // --- LÓGICA DE FATURA JÁ EXISTENTE ---
    // Se o PRINCIPAL já estiver concluído, tentamos buscar a fatura
    // ALSO check if payment method is 'card' or 'online' to show invoice view
    if (clickedAppointment.status === 'Concluído' || ['card', 'online', 'minutes'].includes(clickedAppointment.payment_method)) {
        const startOfDayStr = startOfDay(clickedDate).toISOString();
        const endOfDayStr = new Date(clickedDate);
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
    let method = clickedAppointment.payment_method;
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
      if (!paymentDetails) return { subtotal: 0, discount: 0, total: 0 };
      
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
      const giftCardAmount = appliedGiftCard ? appliedGiftCard.amountToUse : 0;
      
      // O gift card abate do valor APÓS o desconto manual
      // Mas o amountToUse do gift card foi calculado baseado no preço original, precisamos recalcular
      // se o novo total for menor que o saldo do gift card.
      
      let finalTotal = Math.max(0, afterDiscount - giftCardAmount);

      return {
          subtotal,
          discount: discountAmount,
          giftCardUsed: giftCardAmount,
          total: finalTotal
      };
  };

  const handleAddExtraItem = (value: string) => {
      // O value agora vem no formato: "serviceId|duration|price"
      const [serviceId, duration, price] = value.split('|');
      const service = services.find(s => s.id === serviceId);
      
      if (!service) return;
      
      setExtraItems(prev => [...prev, { 
          name: `${service.name} (${duration} min)`, 
          price: parseFloat(price) 
      }]);
      
      // Reseta a seleção do serviço para permitir adicionar outro
      setSelectedExtraServiceId('');
  };

  const handleRemoveExtraItem = (index: number) => {
      setExtraItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmPayment = async () => {
    if (!paymentDetails) return;

    const { total, subtotal } = getCheckoutTotals();
    const totalMinutesDuration = paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0);

    // Validation des minutes
    if (selectedPaymentMethod === 'minutes') {
        const userBalance = paymentDetails.user?.minutes_balance || 0;
        
        if (userBalance < totalMinutesDuration) {
            toast({
                variant: "destructive",
                title: "Solde insuffisant",
                description: `L'utilisateur n'a que ${userBalance} minutes, mais ${totalMinutesDuration} sont nécessaires.`,
            });
            return;
        }
    }

    try {
        // Prepare updates
        const updates: any = {
            status: 'Concluído',
            payment_method: selectedPaymentMethod
        };

        // 1. DEDUCT GIFT CARD IF APPLIED
        if (appliedGiftCard) {
            const newBalance = appliedGiftCard.balance - appliedGiftCard.amountToUse;
            const status = newBalance <= 0 ? 'used' : 'active';
            
            const { error: giftError } = await supabase
                .from('gift_cards')
                .update({ 
                    current_balance: newBalance,
                    status: status
                })
                .eq('id', appliedGiftCard.id);
            
            if (giftError) throw new Error("Erreur lors de la mise à jour du chèque cadeau.");
            
            if (appliedGiftCard.amountToUse >= (paymentDetails.totalPrice || 0)) {
                updates.payment_method = 'gift';
            }
        }

        // If paying with minutes, deduct them
        if (selectedPaymentMethod === 'minutes' && paymentDetails.user && paymentDetails.user.id !== 'guest') {
             const newBalance = (paymentDetails.user.minutes_balance || 0) - totalMinutesDuration;
             
             // Update user profile
             const { error: profileError } = await supabase
                .from('profiles')
                .update({ minutes_balance: newBalance })
                .eq('id', paymentDetails.user.id);

             if (profileError) throw profileError;
        }

        // --- GERAÇÃO DE FATURA (INVOICE) ---
        if (['card', 'cash', 'gift'].includes(selectedPaymentMethod)) {
            const priceToPay = total; 
            
            // Constroi o título da fatura com TODOS os itens agrupados
            let descriptionParts: string[] = [];
            
            paymentDetails.appointments.forEach(app => {
                 descriptionParts.push(`${app.service_name} (${app.duration} min)`);
            });

            // Adiciona extras
            extraItems.forEach(item => {
                descriptionParts.push(`${item.name} - ${item.price}€`);
            });

            // Adiciona info de desconto se houver
            const { discount } = getCheckoutTotals();
            if (discount > 0) {
                const discountLabel = discountType === 'percent' 
                    ? `Remise (${manualDiscount}%)` 
                    : `Remise (Fixe)`;
                descriptionParts.push(`${discountLabel}: -${discount.toFixed(2)}€`);
            }

            // Adiciona info de Gift Card se usado
            if (appliedGiftCard && appliedGiftCard.amountToUse > 0) {
                 descriptionParts.push(`Carte Cadeau (${appliedGiftCard.code}): -${appliedGiftCard.amountToUse.toFixed(2)}€`);
            }

            const finalDescription = descriptionParts.join(' | ');

            const userId = (paymentDetails.user && paymentDetails.user.id !== 'guest') ? paymentDetails.user.id : null;
            
            if (userId) {
                const invoiceData = {
                    id: crypto.randomUUID(), 
                    user_id: userId,
                    plan_title: finalDescription, 
                    date: new Date().toISOString(),
                    amount: priceToPay,
                    status: 'Pago',
                    payment_method: selectedPaymentMethod 
                };

                const { error: invoiceError } = await supabase.from('invoices').insert(invoiceData);
                if (invoiceError) {
                    console.error("Erro ao criar fatura:", invoiceError);
                }
            }
        }
        // --- FIM GERAÇÃO FATURA ---

        // ATUALIZAR TODOS OS AGENDAMENTOS DO GRUPO
        const appIds = paymentDetails.appointments.map(a => a.id);
        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .in('id', appIds) // .in para atualizar múltiplos
            .select();

        if (error) throw error;
        
        // LOG PAYMENT / COMPLETE
        if (data) {
            data.forEach(async (app: Appointment) => {
                await logAppointmentAction(
                    supabase,
                    'COMPLETE',
                    app.id,
                    `Paiement/Terminé via ${selectedPaymentMethod}`,
                    null, // Não temos o estado anterior exato de cada um facilmente aqui sem query extra, mas ok
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
        
        // Refresh users locally to show new balance if needed
        if (selectedPaymentMethod === 'minutes') {
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

  // Nova função para apenas concluir o agendamento (para casos já pagos como Minutos)
  const handleMarkAsCompleted = async () => {
      if (!paymentDetails) return;
      const appIds = paymentDetails.appointments.map(a => a.id);

      // Encontrar o método de pagamento "correto" (se um deles já estiver pago, usamos esse método para todos)
      const alreadyPaidItem = paymentDetails.appointments.find(a => ['card', 'minutes', 'cash', 'gift', 'online'].includes(a.payment_method));
      const targetMethod = alreadyPaidItem ? alreadyPaidItem.payment_method : (paymentDetails.appointments[0].payment_method === 'reception' ? 'cash' : paymentDetails.appointments[0].payment_method);

      try {
          const { data, error } = await supabase
            .from('appointments')
            .update({ 
                status: 'Concluído',
                payment_method: targetMethod // Sincroniza o método de pagamento para todos do grupo
            })
            .in('id', appIds)
            .select();

          if (error) throw error;
          
          // LOG COMPLETE MANUALLY
          if (data) {
              data.forEach(async (app: Appointment) => {
                  await logAppointmentAction(supabase, 'COMPLETE', app.id, 'Marqué comme terminé manuellement', null, app);
              });
          }

          if (data) {
             setAppointments(prev => prev.map(app => {
                const updated = data.find((d: Appointment) => d.id === app.id);
                return updated ? updated as Appointment : app;
            }));
          }
          
          toast({ title: 'Rendez-vous Terminé', description: 'Le statut a été mis à jour avec succès.' });
      } catch (e: any) {
          toast({ variant: "destructive", title: "Erreur", description: e.message });
      } finally {
          setIsPaymentSheetOpen(false);
          setPaymentDetails(null);
      }
  };

  const calculateChange = () => {
    if (!paymentDetails || !amountPaid) return 0;
    const paid = parseFloat(amountPaid);
    if (isNaN(paid)) return 0;
    return paid - paymentDetails.totalPrice; // Usa totalPrice
  }

  const handleDeleteFromPaymentSheet = () => {
    if (!paymentDetails) return;
    setIsPaymentSheetOpen(false);
    setTimeout(() => {
        // Se deletar, deleta apenas o principal clicado (ou perguntamos, mas por segurança deleta 1 por 1)
        // Aqui mantemos comportamento padrão: deleta o primeiro da lista (que é o que o user clicou originalmente)
        handleOpenDeleteDialog(paymentDetails.appointments[0]);
    }, 150);
  };

  // Funções específicas para itens individuais da lista agrupada
  const handleEditSpecific = (app: Appointment) => {
      setReturnToPaymentAfterEdit(true);
      setEditingAppointment(app);
      setIsPaymentSheetOpen(false);
      setTimeout(() => setIsFormSheetOpen(true), 150);
  };

  const handleDeleteSpecific = (app: Appointment) => {
      setSelectedAppointment(app);
      setIsPaymentSheetOpen(false);
      setTimeout(() => setIsDeleteDialogOpen(true), 150);
  };

  const handleEditFromPaymentSheet = () => {
    if (!paymentDetails) return;
    setReturnToPaymentAfterEdit(true);
    setEditingAppointment(paymentDetails.appointments[0]);
    setIsPaymentSheetOpen(false);
    setTimeout(() => {
        setIsFormSheetOpen(true);
    }, 150);
  };

  // Helper para exibir o método de pagamento formatado
  const getPaymentMethodLabel = (method: string) => {
      switch(method) {
          case 'card': 
          case 'online': return { label: 'Carte Bancaire (En Ligne)', icon: CreditCard };
          case 'cash': return { label: 'Espèce', icon: DollarSign };
          case 'minutes': return { label: 'Pack Minutes', icon: Clock };
          case 'gift': 
          case 'gift_card': return { label: 'Chèque Cadeau', icon: Gift };
          default: return { label: method, icon: Wallet };
      }
  };
  
  const DayWithAppointments = ({ date }: { date: Date }) => {
      const dayKey = format(date, 'yyyy-MM-dd');
      const hasAppointments = appointmentsByDay.has(dayKey);
      
      return (
          <div className="relative">
              {date.getDate()}
              {hasAppointments && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />}
          </div>
      )
  }
  
  if (!isMounted) {
    return null;
  }

  return (
    <>
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
                    onEditClick={(app) => {
                        setEditingAppointment(app);
                        setIsFormSheetOpen(true);
                    }}
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
                                onEditClick={(app) => {
                                    setEditingAppointment(app);
                                    setIsFormSheetOpen(true);
                                }}
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
        <SheetContent className="w-full max-w-[100vw] sm:max-w-lg md:max-w-xl p-0 flex flex-col gap-0 h-full" side="right">
          <div className="px-6 py-4 border-b flex-none">
            <SheetHeader className="text-left">
                <SheetTitle>{editingAppointment ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}</SheetTitle>
                {newAppointmentSlot && !editingAppointment && (
                    <SheetDescription>
                        Pour le {format(newAppointmentSlot.date, 'd MMMM, yyyy', {locale: fr})}.
                    </SheetDescription>
                )}
                {editingAppointment && (
                     <SheetDescription>
                        Modification du rendez-vous du {format(new Date(editingAppointment.date), 'd MMMM, yyyy', {locale: fr})}.
                    </SheetDescription>
                )}
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AdminAppointmentForm
                users={users || []}
                services={services || []}
                plans={plans || []}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormSheetOpen(false)}
                allTimeSlots={allTimeSlots}
                initialTime={newAppointmentSlot?.time}
                initialData={editingAppointment}
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
        <SheetContent className="w-full max-w-[100vw] sm:max-w-[420px] p-4 flex flex-col h-full overflow-hidden">
            <SheetHeader className="mb-4 space-y-3">
                <div className="space-y-1 pr-8"> 
                    <SheetTitle className="text-lg flex items-center gap-2">
                        {paymentDetails?.appointments?.some(a => a.status === 'Concluído' || ['minutes', 'card', 'online', 'cash', 'gift'].includes(a.payment_method)) ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                <span className="text-emerald-600">Payé & Terminé</span>
                            </>
                        ) : (
                            <>
                                <Wallet className="h-5 w-5 text-primary" />
                                Règlement
                            </>
                        )}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        {paymentDetails?.appointments?.some(a => a.status === 'Concluído' || ['minutes', 'card', 'online', 'cash', 'gift'].includes(a.payment_method))
                            ? "Détails du rendez-vous passé."
                            : "Encaisser le(s) rendez-vous sélectionné(s)."
                        }
                    </SheetDescription>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleEditFromPaymentSheet}>
                        <Pencil className="h-3.5 w-3.5" /> Modifier Tout
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleDeleteFromPaymentSheet}>
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer Tout
                    </Button>
                </div>
            </SheetHeader>

            {paymentDetails && paymentDetails.appointments && paymentDetails.appointments.length > 0 && (
                <>
                <div className="flex-1 overflow-y-auto -mx-4 px-4 py-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                     {/* Resumo do Agendamento (Agora suporta múltiplos) */}
                    <div className="bg-muted/30 p-3 rounded-lg border border-dashed flex flex-col gap-3 flex-none">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border ring-1 ring-background">
                                    <AvatarFallback className="text-xs">{paymentDetails.user ? getInitials(paymentDetails.user.display_name || paymentDetails.user.email) : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-sm leading-none">{paymentDetails.user?.display_name || 'Client'}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {paymentDetails.appointments.length > 1 
                                            ? `${paymentDetails.appointments.length} services groupés`
                                            : 'Service Unique'
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            {paymentDetails.user && paymentDetails.user.id !== 'guest' && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => setIsProfileSheetOpen(true)}
                                    title="Voir le profil"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-dashed">
                             {paymentDetails.appointments.map((app, idx) => (
                                <div key={app.id} className="flex justify-between items-center text-sm group/item">
                                    <div className="flex flex-col leading-none">
                                        <span className="font-medium">{app.service_name}</span>
                                        <span className="text-[10px] text-muted-foreground">{format(new Date(app.date), 'HH:mm')} ({app.duration} min)</span>
                                    </div>
                                    
                                    {/* Ações Individuais */}
                                    {app.status !== 'Concluído' && (
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                onClick={(e) => { e.stopPropagation(); handleEditSpecific(app); }}
                                                title="Modifier ce service uniquement"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteSpecific(app); }}
                                                title="Supprimer ce service de la liste"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                             ))}
                             
                             <div className="flex items-center justify-between pt-2 border-t border-dashed text-primary font-medium text-xs">
                                <span>Total estimé</span>
                                <span>{paymentDetails.totalPrice}€</span>
                             </div>
                        </div>
                    </div>
                
                {/* --- ITENS EXTRAS & POS --- */}
                {paymentDetails.appointments[0].status !== 'Concluído' && !['minutes', 'online', 'card', 'cash', 'gift'].includes(paymentDetails.appointments[0].payment_method) && (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            {/* Lista de Extras */}
                            {extraItems.map((item, idx) => (
                                <div key={idx} className="bg-muted/30 p-2 rounded-lg border border-dashed flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2">
                                        <PlusCircle className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{item.price}€</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveExtraItem(idx)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Botão Adicionar */}
                            <div className="grid grid-cols-[1.5fr_1fr] gap-2 items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Service</span>
                                    <Select value={selectedExtraServiceId} onValueChange={setSelectedExtraServiceId}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Choisir..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {services.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Durée</span>
                                    <Select 
                                        disabled={!selectedExtraServiceId} 
                                        onValueChange={handleAddExtraItem}
                                        value="" // Sempre reseta visualmente após selecionar
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Ajouter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedExtraServiceId && services.find(s => s.id === selectedExtraServiceId)?.pricing_tiers.map((tier: any, index: number) => (
                                                <SelectItem key={index} value={`${selectedExtraServiceId}|${tier.duration}|${tier.price}`}>
                                                    {tier.duration} min - {tier.price}€
                                                </SelectItem>
                                            ))}
                                            {selectedExtraServiceId && (!services.find(s => s.id === selectedExtraServiceId)?.pricing_tiers?.length) && (
                                                <SelectItem value={`${selectedExtraServiceId}|0|0`}>Standard</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Descontos Manuais */}
                        <div className="flex items-center gap-2 pt-2">
                            <div className="relative flex-1">
                                <Input 
                                    placeholder="Remise..." 
                                    className="h-8 pl-8 text-sm"
                                    value={manualDiscount}
                                    onChange={(e) => setManualDiscount(e.target.value)}
                                    type="number"
                                />
                                <div className="absolute left-2.5 top-2 text-muted-foreground">
                                    {discountType === 'percent' ? <Percent className="h-4 w-4" /> : <Euro className="h-4 w-4" />}
                                </div>
                            </div>
                            <div className="flex bg-muted rounded-md p-0.5 border">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={cn("h-7 px-2 rounded-sm", discountType === 'percent' && "bg-background shadow-sm")}
                                    onClick={() => setDiscountType('percent')}
                                >
                                    <Percent className="h-3 w-3" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={cn("h-7 px-2 rounded-sm", discountType === 'fixed' && "bg-background shadow-sm")}
                                    onClick={() => setDiscountType('fixed')}
                                >
                                    <Euro className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VISTA DE PAGAMENTO JÁ REALIZADO --- */}
                {paymentDetails.appointments.some(a => a.status === 'Concluído' || ['minutes', 'online', 'card', 'cash', 'gift'].includes(a.payment_method)) ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-emerald-50 p-6 rounded-full border-2 border-emerald-100 shadow-sm">
                                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                        </div>
                        
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-gray-900">
                                {paymentDetails.appointments.every(a => a.status === 'Concluído') ? 'Paiement Confirmé' : 'Payé (Synchronisation requise)'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {paymentDetails.appointments.every(a => a.status === 'Concluído') 
                                    ? "Ces services ont déjà été réglés et terminés."
                                    : "Une partie de ce groupe est payée. Cliquez sur Terminer pour synchroniser."}
                            </p>
                        </div>

                        <div className="w-full bg-slate-50 rounded-xl border p-4 space-y-3">
                            {/* Detalhes da Fatura (Se encontrada) */}
                            {relatedInvoice && relatedInvoice.plan_title ? (
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Détails de la Facture</div>
                                    <div className="space-y-2">
                                        {relatedInvoice.plan_title.split('|').map((item: string, idx: number) => {
                                             const cleanItem = item.trim();
                                             const match = cleanItem.match(/(.*)(?: - |: )(-?\d+(?:\.\d+)?€)$/);
                                             
                                             const desc = match ? match[1].trim() : cleanItem;
                                             const price = match ? match[2] : '';
                                             
                                             return (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-700">{desc}</span>
                                                    <span className="font-medium text-gray-900">{price}</span>
                                                </div>
                                             );
                                        })}
                                    </div>
                                    <Separator />
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Méthode</span>
                                <div className="flex items-center gap-2 font-medium">
                                    {(() => {
                                        // Busca o método do item pago, se houver
                                        const paidItem = paymentDetails.appointments.find(a => ['card', 'minutes', 'cash', 'gift', 'online'].includes(a.payment_method));
                                        const methodToShow = paidItem ? paidItem.payment_method : paymentDetails.appointments[0].payment_method;
                                        
                                        const { label, icon: Icon } = getPaymentMethodLabel(methodToShow);
                                        return (
                                            <>
                                                <Icon className="h-4 w-4 text-primary" />
                                                {label}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-medium">
                                    {format(new Date(paymentDetails.appointments[0].date), 'dd MMMM yyyy', { locale: fr })}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Montant Total</span>
                                <span className="font-bold text-lg text-emerald-700">
                                    {relatedInvoice ? `${Number(relatedInvoice.amount).toFixed(2)} €` : (
                                        ['minutes'].includes(paymentDetails.appointments[0].payment_method)
                                            ? `${paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0)} min`
                                            : `${paymentDetails.totalPrice} €`
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="w-full space-y-2">
                             {/* Se for pago (por método) mas status não estiver Concluído, permite concluir */}
                            {paymentDetails.appointments.some(a => a.status !== 'Concluído') && (
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleMarkAsCompleted}>
                                    Terminer le rendez-vous
                                </Button>
                            )}
                            
                            <Button variant="outline" className="w-full" onClick={() => setIsPaymentSheetOpen(false)}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                ) : (
                /* --- VISTA DE FORMULÁRIO DE PAGAMENTO (CÓDIGO ANTIGO) --- */
                <>
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mode de paiement</h4>
                     <div className="grid grid-cols-2 gap-3">
                    <div 
                        onClick={() => setSelectedPaymentMethod('cash')}
                        className={cn(
                            "cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-20",
                            selectedPaymentMethod === 'cash' 
                                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20" 
                                : "border-muted hover:border-primary/50 text-muted-foreground bg-background"
                        )}
                    >
                        <DollarSign className="h-5 w-5 mb-1.5" />
                        <span className="font-semibold text-xs">Espèce</span>
                    </div>

                    <div 
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={cn(
                            "cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-20",
                            selectedPaymentMethod === 'card' 
                                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20" 
                                : "border-muted hover:border-primary/50 text-muted-foreground bg-background"
                        )}
                    >
                        <CreditCard className="h-5 w-5 mb-1.5" />
                        <span className="font-semibold text-xs">Carte / TPE</span>
                    </div>

                    <div 
                        onClick={() => setSelectedPaymentMethod('gift')}
                        className={cn(
                            "cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-20",
                            selectedPaymentMethod === 'gift' 
                                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20" 
                                : "border-muted hover:border-primary/50 text-muted-foreground bg-background"
                        )}
                    >
                        <Gift className="h-5 w-5 mb-1.5" />
                        <span className="font-semibold text-xs">Cadeau</span>
                    </div>
                    
                    <div 
                        onClick={() => {
                             const balance = paymentDetails.user?.minutes_balance || 0;
                             const cost = paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0); // Soma durações
                             if (balance >= cost) {
                                setSelectedPaymentMethod('minutes');
                             } else {
                                 toast({
                                    variant: "destructive",
                                    title: "Solde insuffisant",
                                    description: "Le client n'a pas assez de minutes."
                                 });
                             }
                        }}
                        className={cn(
                            "cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-20 relative overflow-hidden",
                            selectedPaymentMethod === 'minutes' 
                                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20" 
                                : "border-muted hover:border-primary/50 text-muted-foreground bg-background",
                            (paymentDetails.user?.minutes_balance || 0) < paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0) && "opacity-50 grayscale cursor-not-allowed hover:border-muted"
                        )}
                    >
                        {(paymentDetails.user?.minutes_balance || 0) < paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0) && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                                <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">Insuffisant</span>
                            </div>
                        )}
                        <Clock className="h-5 w-5 mb-1.5" />
                        <span className="font-semibold text-xs">Minutes</span>
                        <span className="text-[10px] mt-0.5 opacity-80">Solde: {paymentDetails.user?.minutes_balance || 0}</span>
                    </div>
                </div>
                

                {/* SECTION CHEQUE CADEAU */}
                {selectedPaymentMethod === 'gift' && (
                    <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
                         <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code Promo / Chèque Cadeau</Label>
                         
                         {!appliedGiftCard ? (
                             <div className="space-y-3">
                                 {/* LISTA DE CARTOES DISPONIVEIS */}
                                 {availableGiftCards.length > 0 && (
                                     <div className="space-y-2">
                                         <p className="text-[10px] font-medium text-muted-foreground uppercase">Disponibles sur le compte :</p>
                                         <div className="grid gap-2">
                                             {availableGiftCards.map(card => (
                                                 <div 
                                                    key={card.id} 
                                                    className="flex items-center justify-between bg-background border p-2 rounded cursor-pointer hover:border-primary transition-colors"
                                                    onClick={() => {
                                                        setGiftCardCode(card.code);
                                                        const priceToPay = paymentDetails?.totalPrice || 0; 
                                                        const amountToUse = Math.min(priceToPay, card.current_balance);
                                                        setAppliedGiftCard({
                                                            id: card.id,
                                                            code: card.code,
                                                            balance: card.current_balance,
                                                            amountToUse: amountToUse
                                                        });
                                                        toast({ title: "Code appliqué", description: `Réduction de ${amountToUse}€ appliquée.` });
                                                    }}
                                                 >
                                                     <div className="flex items-center gap-2">
                                                         <Gift className="h-4 w-4 text-primary" />
                                                         <div className="flex flex-col">
                                                             <span className="text-xs font-bold">{card.code}</span>
                                                             <span className="text-[10px] text-muted-foreground">Solde: {card.current_balance}€</span>
                                                         </div>
                                                     </div>
                                                     <Button size="sm" variant="ghost" className="h-6 text-[10px]">Utiliser</Button>
                                                 </div>
                                             ))}
                                         </div>
                                         <div className="relative flex items-center py-1">
                                             <div className="flex-grow border-t"></div>
                                             <span className="flex-shrink-0 mx-2 text-[10px] text-muted-foreground">OU SAISIR UN CODE</span>
                                             <div className="flex-grow border-t"></div>
                                         </div>
                                     </div>
                                 )}

                                 <div className="flex gap-2">
                                     <Input 
                                        value={giftCardCode} 
                                        onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                        placeholder="CODE-1234" 
                                        className="h-8 text-sm uppercase"
                                     />
                                     <Button size="sm" variant="secondary" onClick={handleVerifyGiftCard} disabled={isVerifyingGiftCard || !giftCardCode}>
                                         {isVerifyingGiftCard ? <Loader2 className="h-3 w-3 animate-spin"/> : "Appliquer"}
                                     </Button>
                                 </div>
                             </div>
                         ) : (
                             <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 relative overflow-hidden group">
                                 <div className="absolute right-0 top-0 p-2">
                                     <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 text-emerald-600/50 hover:text-destructive hover:bg-destructive/10 transition-colors" 
                                        onClick={removeGiftCard}
                                     >
                                         <X className="h-4 w-4" />
                                     </Button>
                                 </div>

                                 <div className="flex flex-col gap-3">
                                     {/* Cabeçalho com Código */}
                                     <div className="flex items-center gap-2">
                                         <div className="bg-white p-1.5 rounded-md shadow-sm border border-emerald-100">
                                            <Gift className="h-4 w-4 text-emerald-600"/> 
                                         </div>
                                         <span className="font-mono font-bold text-emerald-800 tracking-wide text-sm">
                                             {appliedGiftCard.code}
                                         </span>
                                         <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 h-5">
                                             Appliqué
                                         </Badge>
                                     </div>

                                     <div className="flex items-end justify-between">
                                         {/* Valor do Desconto */}
                                         <div className="flex flex-col">
                                             <span className="text-[10px] font-medium text-emerald-600/80 uppercase tracking-wider">Réduction</span>
                                             <span className="text-2xl font-bold text-emerald-700 leading-none">
                                                 -{appliedGiftCard.amountToUse}€
                                             </span>
                                         </div>

                                         {/* Saldo Restante */}
                                         <div className="flex flex-col items-end">
                                             <div className="flex items-center gap-1.5 text-emerald-600/70 mb-0.5">
                                                 <span className="text-[10px] font-medium uppercase">Reste sur carte</span>
                                                 <Wallet className="h-3 w-3" />
                                             </div>
                                             <span className="font-semibold text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded text-xs">
                                                 {(appliedGiftCard.balance - appliedGiftCard.amountToUse).toFixed(2)}€
                                             </span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         )}
                    </div>
                )}
                </div>
                {/* --- FOOTER FIXO (TOTAIS & BOTÃO) --- */}
                {(paymentDetails.appointments[0].status as string) !== 'Concluído' && !paymentDetails.appointments.some(a => ['minutes', 'online', 'card', 'cash', 'gift'].includes(a.payment_method)) && (
                    <div className="pt-4 mt-auto border-t bg-background z-20">
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                {/* Breakdown */}
                                {(extraItems.length > 0 || manualDiscount) && (
                                    <>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Sous-total</span>
                                            <span>{getCheckoutTotals().subtotal.toFixed(2)} €</span>
                                        </div>
                                        {getCheckoutTotals().discount > 0 && (
                                            <div className="flex items-center justify-between text-xs text-emerald-600">
                                                <span>Remise</span>
                                                <span>-{getCheckoutTotals().discount.toFixed(2)} €</span>
                                            </div>
                                        )}
                                        <Separator className="my-1"/>
                                    </>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Total à régler</span>
                                    <span className="text-xl font-bold text-foreground">
                                        {selectedPaymentMethod === 'minutes' 
                                            ? `${paymentDetails.appointments.reduce((acc, curr) => acc + curr.duration, 0)} min` 
                                            : `${getCheckoutTotals().total.toFixed(2)} €`
                                        }
                                    </span>
                                </div>
                            </div>
                            <Button 
                                onClick={handleConfirmPayment} 
                                className="w-full h-10 text-sm font-medium" 
                                size="lg"
                                disabled={selectedPaymentMethod === 'gift' && getCheckoutTotals().total > 0}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> 
                                {paymentDetails.appointments.length > 1 ? `Payer Tout (${paymentDetails.appointments.length})` : 'Confirmer le Paiement'}
                            </Button>
                        </div>
                    </div>
                )}
                </>
                )}
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>

      {/* --- SHEET DE PERFIL DO USUÁRIO (CONSULTA RÁPIDA) --- */}
      <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
        <SheetContent className="w-full max-w-[100vw] sm:max-w-md p-0 flex flex-col h-full overflow-hidden" side="right">
            {paymentDetails?.user && (
                <>
                <div className="p-6 bg-muted/30 border-b flex-none">
                     <SheetHeader className="mb-4 text-left">
                        <SheetTitle>Profil Client</SheetTitle>
                     </SheetHeader>
                     
                     <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-sm mb-3">
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {getInitials(paymentDetails.user.display_name || paymentDetails.user.email)}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{paymentDetails.user.display_name || 'Client'}</h2>
                        <p className="text-sm text-muted-foreground">{paymentDetails.user.email}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-background rounded-lg p-3 border text-center shadow-sm">
                            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Solde Minutes</div>
                            <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                                <Clock className="h-4 w-4 opacity-50"/>
                                {paymentDetails.user.minutes_balance || 0}
                            </div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border text-center shadow-sm">
                            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Abonnement</div>
                            <div className="text-sm font-bold truncate px-1 py-1.5">
                                {plans.find(p => p.id === paymentDetails.user?.plan_id)?.title || 'Aucun'}
                            </div>
                        </div>
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-muted-foreground">
                        <History className="h-4 w-4" /> Historique Récent
                    </h3>
                    
                    <div className="space-y-4 relative">
                        {/* Linha do tempo vertical */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-border z-0"></div>

                        {appointments
                            .filter(a => a.user_id === paymentDetails.user?.id && a.status !== 'Cancelado')
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10) // Mostrar apenas os últimos 10
                            .map((app) => (
                                <div key={app.id} className="relative z-10 flex gap-4 items-start">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full border-4 border-background flex items-center justify-center shrink-0 shadow-sm",
                                        app.status === 'Concluído' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                    )}>
                                        {app.status === 'Concluído' ? <CheckCircle2 className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                                    </div>
                                    <div className="bg-muted/20 rounded-lg p-3 flex-1 border text-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold">{app.service_name}</span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {format(new Date(app.date), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-muted-foreground">{app.duration} min</span>
                                            <Badge variant={app.status === 'Concluído' ? 'secondary' : 'outline'} className="text-[10px] h-5">
                                                {app.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                        ))}
                        
                        {appointments.filter(a => a.user_id === paymentDetails.user?.id).length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8 italic">
                                Aucun historique disponible.
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}