'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isSameDay, startOfWeek, endOfWeek, addDays, eachDayOfInterval, getDay, addMinutes, parse, differenceInMinutes, startOfDay, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ConciergeBell, MoreHorizontal, Trash2, User, Info, PlusCircle, CreditCard, AlertTriangle, User as UserIcon, Wallet, Star, CheckCircle, XCircle, DollarSign, CheckCircle2, ChevronLeft, ChevronRight, Gift, Move, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
  payment_method: 'card' | 'minutes' | 'reception' | 'online' | 'gift' | 'cash';
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
    appointment: Appointment;
    price: number;
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
        <div className="flex flex-col h-[calc(100vh-220px)] border rounded-lg overflow-hidden bg-background">
            <div className="flex items-center justify-between p-4 border-b">
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
                <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                    {calendarDays.map((day) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayAppointments = appointments.filter(app => format(new Date(app.date), 'yyyy-MM-dd') === dayKey);
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
                                    <span className={cn(
                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                        isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    )}>
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
                                        const isPaid = app.status === 'Concluído' || app.payment_method === 'card' || app.payment_method === 'minutes';
                                        
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
    onAppointmentDrop 
}: { 
    days: Date[], 
    timeSlots: string[], 
    appointments: Appointment[], 
    onSlotClick: (slot: NewAppointmentSlot) => void, 
    onPayClick: (app: Appointment) => void, 
    services: Service[],
    onAppointmentDrop: (appointmentId: string, newDate: Date, newTime: string) => void
}) => {
    
    // Configuration de la grille
    const minTime = timeSlots.length > 0 ? parseInt(timeSlots[0].split(':')[0]) : 8;
    const maxTime = timeSlots.length > 0 ? parseInt(timeSlots[timeSlots.length-1].split(':')[0]) + 1 : 20;
    const START_HOUR = Math.max(0, minTime - 1);
    const END_HOUR = Math.min(24, maxTime + 1);
    const PIXELS_PER_HOUR = 160;
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

    // Algorithme de mise en page des événements (gestion des chevauchements)
    const layoutEvents = (dayAppointments: Appointment[]) => {
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
                     width: `calc(${100 / totalCols}% - 12px)`, // Laisse 12px d'espace pour cliquer à côté
                     top: `${((new Date(node.date).getHours() * 60 + new Date(node.date).getMinutes()) - (START_HOUR * 60)) * PIXELS_PER_MINUTE}px`,
                     height: `${node.duration * PIXELS_PER_MINUTE}px`
                 }
             };
        });
    }

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
        
        // Custom drag image could be set here, but browser default is usually fine if opacity is handled
        // e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';

        if (!draggedApp) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const timeStr = calculateTimeFromY(y);
        
        // Calculate snap position for the ghost element
        const snapTop = calculateYFromTime(timeStr);

        // Only update state if position changed significantly to avoid render thrashing
        if (!dropTarget || dropTarget.time !== timeStr || !isSameDay(dropTarget.date, day)) {
            setDropTarget({
                date: day,
                time: timeStr,
                top: snapTop
            });
        }
    };

    const handleDragLeave = () => {
        // Optional: clear target if leaving the grid area completely
        // tricky because it fires when entering child elements too.
        // Simplest is to clear on drop or dragend.
    };

    const handleDragEnd = () => {
        setDraggedApp(null);
        setDropTarget(null);
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
        // Ne pas montrer le hover si on est en train de drag & drop
        if (draggedApp) {
            setHoverSlot(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Calculer l'heure et la position "snappée"
        const timeStr = calculateTimeFromY(y);
        const snapTop = calculateYFromTime(timeStr);

        // Mise à jour optimisée (seulement si changement)
        if (!hoverSlot || hoverSlot.time !== timeStr || !isSameDay(hoverSlot.date, day)) {
            setHoverSlot({
                date: day,
                time: timeStr,
                top: snapTop
            });
        }
    };

    const handleMouseLeaveGrid = () => {
        setHoverSlot(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault();
        const appointmentId = e.dataTransfer.getData('appointmentId');
        
        // Clear visuals
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
        <div className="flex flex-col h-[calc(100vh-220px)] border rounded-lg overflow-hidden bg-background">
            {/* En-tête des jours */}
            <div className="flex flex-none border-b bg-muted/20">
                <div className="w-16 flex-none border-r bg-background/50" />
                {days.map(day => (
                    <div key={day.toISOString()} className={cn("flex-1 py-3 text-center border-r last:border-r-0 font-medium", isToday(day) && "text-primary bg-primary/5")}>
                         <div className="text-sm opacity-80 uppercase">{format(day, 'EEE', { locale: fr })}</div>
                         <div className={cn("text-lg leading-none mt-1 h-8 w-8 mx-auto flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>
                             {format(day, 'd')}
                         </div>
                    </div>
                ))}
            </div>

            {/* Grille Scrollable */}
            <ScrollArea className="flex-1">
                <div className="flex relative min-h-0" style={{ height: (END_HOUR - START_HOUR) * PIXELS_PER_HOUR }}>
                    {/* Colonne des heures */}
                    <div className="w-16 flex-none border-r bg-background z-10 sticky left-0 text-xs text-muted-foreground text-right pr-2 select-none shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                        {hours.map(h => (
                            <div key={h} className="relative border-b border-border/40" style={{ height: PIXELS_PER_HOUR }}>
                                {/* Hora cheia */}
                                <span className="absolute -top-2.5 right-2 bg-background px-1 font-semibold text-foreground/80 z-10">{h}:00</span>
                                
                                {/* Visual Markers for every 5 minutes */}
                                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                    <div key={m} className="absolute right-0 w-full" style={{ top: `${(m/60)*100}%` }}>
                                        {/* Show time label every 15 mins to avoid clutter */}
                                        {m % 15 === 0 && (
                                            <span 
                                                className="absolute -translate-y-1/2 right-2 text-[10px] text-muted-foreground/40"
                                            >
                                                {h}:{m}
                                            </span>
                                        )}
                                        {/* Small tick mark for others */}
                                        {m % 15 !== 0 && (
                                            <div className="absolute top-0 right-0 w-1 border-t border-muted-foreground/20" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Colonnes des jours */}
                    {days.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = appointments.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === dayKey);
                        const layoutedEvents = layoutEvents(dayEvents);

                        return (
                            <div 
                                key={day.toISOString()} 
                                className={cn(
                                    "flex-1 relative border-r last:border-r-0 transition-colors",
                                    // Highlight column on drag over
                                    dropTarget && isSameDay(dropTarget.date, day) && "bg-primary/5"
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
                                    <div key={h} className="absolute w-full pointer-events-none select-none border-b border-border/40" style={{ top: (h - START_HOUR) * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}>
                                         {/* Grid lines for every 5 minutes */}
                                         {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                            <div 
                                                key={m}
                                                className={cn(
                                                    "absolute w-full border-b",
                                                    m === 30 ? "border-dashed border-border/20" : "border-dotted border-border/10"
                                                )}
                                                style={{ top: `${(m/60)*100}%` }}
                                            />
                                         ))}
                                    </div>
                                ))}

                                {/* Hover Effect Placeholder */}
                                <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 bg-primary/5 transition-opacity" />

                                {/* --- HOVER INDICATOR (Nouveau) --- */}
                                {hoverSlot && isSameDay(hoverSlot.date, day) && !draggedApp && (
                                    <div 
                                        className="absolute z-10 w-[calc(100%-8px)] left-1 rounded border-t-2 border-primary/40 bg-primary/5 pointer-events-none flex items-start pl-1 animate-in fade-in duration-75"
                                        style={{
                                            top: hoverSlot.top,
                                            height: 5 * PIXELS_PER_MINUTE, // CHANGE: Default hover height to 5 min
                                        }}
                                    >
                                        <span className="text-[10px] font-bold text-primary bg-background/80 backdrop-blur-sm px-1 rounded shadow-sm -mt-2.5 ml-0.5 border border-primary/20">
                                            {hoverSlot.time}
                                        </span>
                                    </div>
                                )}

                                {/* Indicateur "Maintenant" */}
                                {isToday(day) && (
                                    <div 
                                        className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none flex items-center shadow-sm"
                                        style={{ top: getCurrentTimeOffset() }}
                                    >
                                        <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 -mt-[1px] ring-2 ring-background" />
                                    </div>
                                )}

                                {/* --- GHOST DROP INDICATOR --- */}
                                {dropTarget && draggedApp && isSameDay(dropTarget.date, day) && (
                                    <div 
                                        className="absolute z-40 w-[calc(100%-8px)] left-1 rounded-md border-2 border-dashed border-primary bg-primary/10 flex flex-col p-2 pointer-events-none animate-in fade-in duration-75"
                                        style={{
                                            top: dropTarget.top,
                                            height: draggedApp.duration * PIXELS_PER_MINUTE,
                                        }}
                                    >
                                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {dropTarget.time}
                                        </span>
                                        <span className="text-[10px] text-primary/80 truncate">
                                            {draggedApp.user_name}
                                        </span>
                                    </div>
                                )}

                                {/* Rendez-vous */}
                                {layoutedEvents.map(({ data: app, style }) => {
                                    const color = getServiceColor(app.service_name);
                                    const isPaid = app.status === 'Concluído' || app.payment_method === 'card' || app.payment_method === 'minutes';
                                    const isSmall = app.duration < 30; // Modo compacto para < 30 min
                                    const isBeingDragged = draggedApp?.id === app.id;

                                    return (
                                        <div
                                            key={app.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, app)}
                                            onDragEnd={handleDragEnd}
                                            onClick={(e) => { e.stopPropagation(); onPayClick(app); }}
                                            className={cn(
                                                "absolute rounded-lg border-l-[3px] cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-lg hover:z-30 transition-all shadow-sm z-20 overflow-hidden group select-none",
                                                isSmall ? "p-1 text-[10px]" : "p-2 text-xs",
                                                isBeingDragged && "opacity-50 grayscale" // Diminuir opacidade do original enquanto arrasta
                                            )}
                                            style={{
                                                ...style,
                                                backgroundColor: `${color}15`, 
                                                borderLeftColor: color,
                                                color: '#0f172a' 
                                            }}
                                        >
                                            <div className="flex flex-col h-full w-full">
                                                {/* Header */}
                                                <div className={cn(
                                                    "flex items-center justify-between gap-1 w-full shrink-0",
                                                    isSmall ? "mb-0.5" : "border-b border-black/5 pb-1 mb-1"
                                                )}>
                                                     <div className="flex items-center gap-1.5 min-w-0">
                                                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                        <span className="truncate font-bold opacity-75" style={{ color }}>
                                                            {isSmall 
                                                                ? format(new Date(app.date), 'HH:mm') 
                                                                : `${format(new Date(app.date), 'HH:mm')} - ${format(addMinutes(new Date(app.date), app.duration), 'HH:mm')}`
                                                            }
                                                        </span>
                                                     </div>
                                                     {isPaid && <CheckCircle2 className={cn("text-green-600 shrink-0", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />}
                                                </div>
                                                
                                                {/* Service Title */}
                                                <div className={cn(
                                                    "font-bold leading-tight truncate text-foreground/90",
                                                    isSmall ? "text-[11px]" : "text-sm"
                                                )}>
                                                    {app.service_name || <span className="text-red-500 italic">Service Inconnu</span>}
                                                </div>

                                                {/* Footer / User */}
                                                <div className={cn(
                                                    "truncate text-muted-foreground flex items-center gap-1.5 min-h-0",
                                                    isSmall ? "mt-0.5" : "mt-auto pt-1"
                                                )}>
                                                    {!isSmall && (
                                                        <Avatar className="h-4 w-4 shrink-0">
                                                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                                                                {getInitials(app.user_name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <span className="truncate">{app.user_name}</span>
                                                </div>
                                            </div>
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
  
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<NewAppointmentSlot | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | 'minutes' | 'gift'>('cash');
  
  // States pour Gift Card
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [isVerifyingGiftCard, setIsVerifyingGiftCard] = useState(false);

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
        (payload) => {
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
        (payload) => {
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
    const today = new Date();
    
    const start = startOfWeek(today, { locale: fr });
    const end = endOfWeek(today, { locale: fr });
    const weekDays = eachDayOfInterval({start, end});

    const todayAppointments = appointments?.filter(app => isToday(new Date(app.date))) || [];

    const weekAppointments = appointments?.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= start && appDate <= end;
    }) || [];

    return { 
        todayAppointments,
        weekAppointments,
        weekDays,
    };
  }, [appointments]);
  
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
      const { error } = await supabase.from('appointments').delete().eq('id', selectedAppointment.id);
      if (error) throw error;
      
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
    const dateSource = editingAppointment ? new Date(editingAppointment.date) : newAppointmentSlot?.date;
    if (!dateSource || !services || !users) return;
  
    const [hours, minutes] = values.time.split(':').map(Number);
    const appointmentDate = new Date(dateSource);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    const service = services.find(s => s.id === values.serviceId);
    if (!service) {
        toast({ variant: 'destructive', title: 'Service non trouvé' });
        return;
    }
    
    const PREP_TIME = 15;
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
      .select('id, date, duration, service_name')
      .gte('date', startOfDayDate.toISOString())
      .lte('date', endOfDayDate.toISOString())
      .neq('status', 'Cancelado')
      // When editing, exclude the current appointment from conflict check
      .not('id', 'eq', editingAppointment?.id || '00000000-0000-0000-0000-000000000000');
  
    if (fetchError) {
      toast({ variant: "destructive", title: "Erreur lors de la vérification des conflits", description: fetchError.message });
      return;
    }
  
    // Filter strictly for the SAME service name in memory with robust string comparison
    const targetServiceName = service.name.trim();
    const sameServiceAppointments = dayAppointments.filter(app => 
        app.service_name && app.service_name.trim() === targetServiceName
    );

    const hasConflict = sameServiceAppointments.some(existingApp => {
      const existingAppStartDate = new Date(existingApp.date);
      // Use the actual duration from the database + prep time for conflict checking
      const existingAppEndDate = addMinutes(existingAppStartDate, existingApp.duration + PREP_TIME);
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return appointmentDate < existingAppEndDate && appointmentEndDate > existingAppStartDate;
    });
  
    if (hasConflict) {
        setIsConflictDialogOpen(true);
        return;
    }

    const userId = values.userId;
    const existingUser = users.find(u => u.id === userId);
    if (!existingUser) {
          toast({ variant: "destructive", title: "Utilisateur non trouvé", description: "Le client sélectionné n'est pas valide." });
          return;
    }
    const userName = existingUser.display_name || existingUser.email || 'Client';
    const userEmail = existingUser.email || '';
    
    const dataToSave = {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        service_name: service.name,
        date: appointmentDate.toISOString(),
        duration: values.duration,
    };

    try {
        if (editingAppointment) {
            // --- UPDATE APPOINTMENT ---
            const { data, error: updateError } = await supabase
                .from('appointments')
                .update(dataToSave)
                .eq('id', editingAppointment.id)
                .select()
                .single();

            if (updateError) throw updateError;

            if (data) {
                setAppointments(prev => prev.map(app => app.id === data.id ? data as Appointment : app));
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
            
            if (data) {
                setAppointments(prev => [data as Appointment, ...prev]);

                // --- EMAIL DE CONFIRMAÇÃO ---
                if (data.user_email) {
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
    }
  };

  const handleOpenPaymentSheet = (appointment: Appointment) => {
    if (!services || !users || !plans) return;

    // Reset Gift Card State
    setGiftCardCode('');
    setAppliedGiftCard(null);

    // Tenta encontrar o serviço pelo nome exato ou normalizado (case insensitive)
    const service = services.find(s => s.name === appointment.service_name) || 
                    services.find(s => s.name.toLowerCase().trim() === (appointment.service_name || '').toLowerCase().trim());
    
    // Converte a duração para número para garantir comparação correta
    const appDuration = Number(appointment.duration);
    const tier = service?.pricing_tiers.find(t => t.duration === appDuration);
    
    console.log('Payment Debug:', { 
        appName: appointment.service_name, 
        appDuration, 
        foundService: service?.name, 
        foundTier: tier 
    });

    if (tier) {
        // Tenta encontrar o usuário registrado
        let user = users.find(u => u.id === appointment.user_id) || null;

        // Se não encontrar (é Guest), cria um objeto de usuário temporário com os dados do agendamento
        if (!user) {
            user = {
                id: 'guest',
                display_name: appointment.user_name || 'Invité',
                email: appointment.user_email || '',
                minutes_balance: 0,
                plan_id: undefined
            };
        }

        const userPlan = (user.id !== 'guest' && user.plan_id) ? plans.find(p => p.id === user.plan_id) : null;
        
        setPaymentDetails({ appointment, price: tier.price, user, userPlan: userPlan || null });
        setAmountPaid('');
        // Mapping old 'reception' to 'cash' default, but respecting DB value if valid
        let method = appointment.payment_method;
        if (method === 'reception') method = 'cash';
        
        // Ensure it's a valid type for our state
        if (!['card', 'cash', 'minutes', 'gift'].includes(method)) {
            method = 'cash';
        }
        
        setSelectedPaymentMethod(method as any);
        setIsPaymentSheetOpen(true);
    } else {
        toast({
            variant: "destructive",
            title: "Prix non trouvé",
            description: "Impossible de trouver le prix pour ce service et cette durée.",
        });
    }
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
              const priceToPay = paymentDetails?.price || 0;
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

  const handleConfirmPayment = async () => {
    if (!paymentDetails) return;

    // Validation des minutes
    if (selectedPaymentMethod === 'minutes') {
        const userBalance = paymentDetails.user?.minutes_balance || 0;
        const requiredMinutes = paymentDetails.appointment.duration;
        
        if (userBalance < requiredMinutes) {
            toast({
                variant: "destructive",
                title: "Solde insuffisant",
                description: `L'utilisateur n'a que ${userBalance} minutes, mais ${requiredMinutes} sont nécessaires.`,
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
            
            // Si le chèque couvre tout, le mode de paiement final est 'gift'
            // Sinon, c'est un paiement mixte, mais on garde le mode principal sélectionné (ex: carte + gift)
            // Pour simplifier l'historique, si > 0 reste à payer, on garde le mode selecionado (cash/card).
            // Si 0 reste à payer, on force 'gift'.
            if (appliedGiftCard.amountToUse >= (paymentDetails.price || 0)) {
                updates.payment_method = 'gift';
            }
        }

        // If paying with minutes, deduct them
        if (selectedPaymentMethod === 'minutes' && paymentDetails.user && paymentDetails.user.id !== 'guest') {
             const newBalance = (paymentDetails.user.minutes_balance || 0) - paymentDetails.appointment.duration;
             
             // Update user profile
             const { error: profileError } = await supabase
                .from('profiles')
                .update({ minutes_balance: newBalance })
                .eq('id', paymentDetails.user.id);

             if (profileError) throw profileError;
        }

        // --- GERAÇÃO DE FATURA (INVOICE) ---
        // Se o pagamento envolve dinheiro (Card, Cash) ou Gift Card (misto), criamos uma fatura oficial.
        // Isso permite que apareça no painel financeiro e no perfil do utilizador.
        if (['card', 'cash', 'gift'].includes(selectedPaymentMethod)) {
            const priceToPay = paymentDetails.price || 0;
            // Se foi totalmente pago por gift card, o valor monetário é 0, mas registamos a transação.
            // Se foi misto, o amount é o restante. Se foi normal, é o preço total.
            const amountPaid = Math.max(0, priceToPay - (appliedGiftCard?.amountToUse || 0));
            
            // Apenas geramos fatura se houver um valor a pagar OU se foi um gift card cobrindo tudo (para registo)
            // Se for 'minutes', geralmente não gera fatura fiscal neste momento (já foi na compra do pack).
            
            const userId = (paymentDetails.user && paymentDetails.user.id !== 'guest') ? paymentDetails.user.id : null;
            
            // Se o utilizador for convidado (guest/null), o DB pode aceitar null ou falhar dependendo da constraint.
            // Assumindo que invoices aceita user_id null ou que apenas registamos para users com conta.
            if (userId) {
                const invoiceData = {
                    id: crypto.randomUUID(), // Gera um ID único para a fatura
                    user_id: userId,
                    plan_title: `${paymentDetails.appointment.service_name} - ${paymentDetails.appointment.duration} min`,
                    date: new Date().toISOString(),
                    amount: amountPaid,
                    status: 'Pago'
                };

                const { error: invoiceError } = await supabase.from('invoices').insert(invoiceData);
                if (invoiceError) {
                    console.error("Erro ao criar fatura:", invoiceError);
                    toast({ variant: "destructive", title: "Aviso", description: "O agendamento foi atualizado, mas houve erro ao gerar a fatura." });
                }
            }
        }
        // --- FIM GERAÇÃO FATURA ---

        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', paymentDetails.appointment.id)
            .select()
            .single();

        if (error) throw error;

        // Mise à jour locale immédiate
        if (data) {
            setAppointments(prev => prev.map(app => app.id === data.id ? data as Appointment : app));
        }
        
        // Refresh users locally to show new balance if needed
        if (selectedPaymentMethod === 'minutes') {
             setUsers(prev => prev.map(u => 
                u.id === paymentDetails.user?.id 
                ? { ...u, minutes_balance: (u.minutes_balance || 0) - paymentDetails.appointment.duration }
                : u
             ));
        }

        toast({ title: 'Paiement Traité !', description: 'Le rendez-vous a été marqué comme terminé.' });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erreur lors du traitement du paiement", description: e.message });
    } finally {
        setIsPaymentSheetOpen(false);
        setPaymentDetails(null);
    }
  };

  const calculateChange = () => {
    if (!paymentDetails || !amountPaid) return 0;
    const paid = parseFloat(amountPaid);
    if (isNaN(paid)) return 0;
    return paid - paymentDetails.price;
  }

  const handleDeleteFromPaymentSheet = () => {
    if (!paymentDetails) return;
    setIsPaymentSheetOpen(false);
    setTimeout(() => {
        handleOpenDeleteDialog(paymentDetails.appointment);
    }, 150);
  };

  const handleEditFromPaymentSheet = () => {
    if (!paymentDetails) return;
    setEditingAppointment(paymentDetails.appointment);
    setIsPaymentSheetOpen(false);
    setTimeout(() => {
        setIsFormSheetOpen(true);
    }, 150);
  };

  // Helper para exibir o método de pagamento formatado
  const getPaymentMethodLabel = (method: string) => {
      switch(method) {
          case 'card': return { label: 'Carte Bancaire', icon: CreditCard };
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
            <div className="flex items-center justify-between mb-4 flex-none">
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
                   />
                </TabsContent>
                <TabsContent value="week" className="mt-0 h-full">
                   <AgendaView 
                    days={weekDays} 
                    timeSlots={allTimeSlots} 
                    appointments={weekAppointments}
                    onSlotClick={handleSlotClick}
                    onPayClick={handleOpenPaymentSheet}
                    onAppointmentDrop={handleAppointmentDrop}
                    services={services}
                   />
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
            <SheetHeader className="mb-4 space-y-1">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <SheetTitle className="text-lg flex items-center gap-2">
                            {paymentDetails?.appointment.status === 'Concluído' ? (
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
                            {paymentDetails?.appointment.status === 'Concluído' 
                                ? "Détails du rendez-vous passé."
                                : "Encaisser le rendez-vous sélectionné."
                            }
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleEditFromPaymentSheet}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleDeleteFromPaymentSheet}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SheetHeader>

            {paymentDetails && (
                <>
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                     {/* Resumo do Agendamento */}
                    <div className="bg-muted/30 p-3 rounded-lg border border-dashed flex items-start gap-3">
                        <Avatar className="h-10 w-10 border ring-1 ring-background">
                            <AvatarFallback className="text-xs">{paymentDetails.user ? getInitials(paymentDetails.user.display_name || paymentDetails.user.email) : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                             <h4 className="font-semibold text-sm leading-none">{paymentDetails.user?.display_name || 'Client'}</h4>
                             <p className="text-xs text-muted-foreground">{paymentDetails.appointment.service_name}</p>
                             <div className="flex items-center gap-2 pt-1">
                                <Badge variant="outline" className="text-[10px] h-5 px-1 bg-background">{paymentDetails.appointment.duration} min</Badge>
                                <span className="text-xs font-medium text-primary">
                                    {paymentDetails.price ? `${paymentDetails.price}€` : 'Prix standard'}
                                </span>
                             </div>
                        </div>
                    </div>
                
                {/* --- VISTA DE PAGAMENTO JÁ REALIZADO --- */}
                {paymentDetails.appointment.status === 'Concluído' ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-emerald-50 p-6 rounded-full border-2 border-emerald-100 shadow-sm">
                                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                        </div>
                        
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-gray-900">Paiement Confirmé</h3>
                            <p className="text-sm text-muted-foreground">Ce rendez-vous a déjà été réglé.</p>
                        </div>

                        <div className="w-full bg-slate-50 rounded-xl border p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Méthode</span>
                                <div className="flex items-center gap-2 font-medium">
                                    {(() => {
                                        const { label, icon: Icon } = getPaymentMethodLabel(paymentDetails.appointment.payment_method);
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
                                    {format(new Date(paymentDetails.appointment.date), 'dd MMMM yyyy', { locale: fr })}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Montant Total</span>
                                <span className="font-bold text-lg text-emerald-700">
                                    {paymentDetails.appointment.payment_method === 'minutes' 
                                        ? `${paymentDetails.appointment.duration} min`
                                        : `${paymentDetails.price} €`
                                    }
                                </span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" onClick={() => setIsPaymentSheetOpen(false)}>
                            Fermer
                        </Button>
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
                             const cost = paymentDetails.appointment.duration;
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
                            (paymentDetails.user?.minutes_balance || 0) < paymentDetails.appointment.duration && "opacity-50 grayscale cursor-not-allowed hover:border-muted"
                        )}
                    >
                        {(paymentDetails.user?.minutes_balance || 0) < paymentDetails.appointment.duration && (
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
                         ) : (
                             <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded p-2 text-green-700">
                                 <div className="flex flex-col">
                                     <span className="text-xs font-bold flex items-center gap-1">
                                         <Gift className="h-3 w-3"/> {appliedGiftCard.code}
                                     </span>
                                     <span className="text-[10px]">-{appliedGiftCard.amountToUse}€ (Solde restant: {(appliedGiftCard.balance - appliedGiftCard.amountToUse).toFixed(2)}€)</span>
                                 </div>
                                 <Button size="icon" variant="ghost" className="h-6 w-6 text-green-700 hover:text-green-900" onClick={removeGiftCard}>
                                     <X className="h-3 w-3" />
                                 </Button>
                             </div>
                         )}
                    </div>
                )}
                </div>

                <div className="space-y-3 mt-auto">
                    <Separator />
                     <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-muted-foreground">Total à régler</span>
                         <span className="text-xl font-bold text-foreground">
                             {selectedPaymentMethod === 'minutes' 
                                ? `${paymentDetails.appointment.duration} min` 
                                : `${Math.max(0, (paymentDetails.price || 0) - (appliedGiftCard?.amountToUse || 0)).toFixed(2)} €`
                             }
                         </span>
                     </div>
                     <Button 
                        onClick={handleConfirmPayment} 
                        className="w-full h-10 text-sm font-medium" 
                        size="lg"
                        disabled={selectedPaymentMethod === 'gift' && Math.max(0, (paymentDetails.price || 0) - (appliedGiftCard?.amountToUse || 0)) > 0}
                     >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> 
                        Confirmer le Paiement
                     </Button>
                </div>
                </>
                )}
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}