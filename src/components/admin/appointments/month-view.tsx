'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, PlusCircle, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addMonths, subMonths, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Appointment, NewAppointmentSlot } from "@/types/appointment";
import type { Service } from "@/app/admin/services/page";

interface MonthViewProps {
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
    appointments: Appointment[];
    onSlotClick: (slot: NewAppointmentSlot) => void;
    onAppointmentClick: (app: Appointment) => void;
    services: Service[];
}

export function MonthView({ 
    currentMonth, 
    onMonthChange,
    appointments, 
    onSlotClick, 
    onAppointmentClick, 
    services 
}: MonthViewProps) {
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
                                onClick={(e) => onSlotClick({ date: day, time: '09:00', x: e.clientX, y: e.clientY })}
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
                                            onSlotClick({ date: day, time: '09:00', x: e.clientX, y: e.clientY });
                                        }}
                                    >
                                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                
                                <div className="space-y-1">
                                    {dayAppointments.map((app) => {
                                        const color = getServiceColor(app.service_name);
                                        const isPaid = app.status === 'Concluído' || ['card', 'minutes', 'cash', 'gift', 'online'].includes(app.payment_method);
                                        
                                        const bgColor = isPaid ? '#f1f5f9' : `${color}40`; // slate-100 if paid
                                        const borderColor = isPaid ? '#94a3b8' : color;    // slate-400 if paid

                                        return (
                                            <div
                                                key={app.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAppointmentClick(app);
                                                }}
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 shadow-sm",
                                                    isPaid && "text-slate-500" // Grey text if paid
                                                )}
                                                style={{
                                                    backgroundColor: bgColor,
                                                    borderLeftColor: borderColor,
                                                    color: isPaid ? '#475569' : '#0f172a' // slate-600 if paid
                                                }}
                                            >
                                                <span className="font-semibold shrink-0">
                                                    {format(new Date(app.date), 'HH:mm')}
                                                </span>
                                                <span className="truncate flex-1">
                                                    {app.user_name}
                                                </span>
                                                {isPaid && <CheckCircle2 className="h-2.5 w-2.5 text-slate-500 shrink-0" />}
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
}