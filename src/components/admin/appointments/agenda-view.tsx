'use client';

import { useState, useEffect, useCallback } from 'react';
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ZoomIn, ZoomOut, Clock, Lock, CheckCircle2, Ban } from "lucide-react";
import { format, isToday, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppointmentTooltip } from "./appointment-tooltip";
import type { Appointment, NewAppointmentSlot, UserProfile } from "@/types/appointment";
import type { Service } from "@/app/admin/services/page";

interface AgendaViewProps {
    days: Date[];
    timeSlots: string[];
    appointments: Appointment[];
    onSlotClick: (slot: NewAppointmentSlot) => void;
    onPayClick: (app: Appointment) => void;
    services: Service[];
    users: UserProfile[];
    onAppointmentDrop: (appointmentId: string, newDate: Date, newTime: string) => void;
    onEditClick: (app: Appointment) => void;
    onCancelClick: (app: Appointment) => void;
}

export function AgendaView({ 
    days, 
    timeSlots, 
    appointments, 
    onSlotClick, 
    onPayClick, 
    services,
    users, 
    onAppointmentDrop,
    onEditClick,
    onCancelClick
}: AgendaViewProps) {
    
    // Zoom Control
    const [zoomLevel, setZoomLevel] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('adminCalendarZoom');
            return saved ? parseInt(saved) : 130;
        }
        return 130;
    });

    useEffect(() => {
        localStorage.setItem('adminCalendarZoom', zoomLevel.toString());
    }, [zoomLevel]);
    
    // Grid Configuration
    const minTime = timeSlots.length > 0 ? parseInt(timeSlots[0].split(':')[0]) : 8;
    const maxTime = timeSlots.length > 0 ? parseInt(timeSlots[timeSlots.length-1].split(':')[0]) + 1 : 20;
    const START_HOUR = Math.max(0, minTime - 1);
    const END_HOUR = Math.min(24, maxTime + 1);
    
    const PIXELS_PER_HOUR = zoomLevel;
    const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    // Drag & Drop State
    const [draggedApp, setDraggedApp] = useState<Appointment | null>(null);
    const [dropTarget, setDropTarget] = useState<{ date: Date, time: string, top: number } | null>(null);
    
    // Hover State
    const [hoverSlot, setHoverSlot] = useState<{ date: Date, time: string, top: number } | null>(null);
    
    // Tooltip State
    const [hoveredAppInfo, setHoveredAppInfo] = useState<{ app: Appointment, rect: DOMRect } | null>(null);

    const calculateTimeFromY = (y: number) => {
        const minutesFromStart = y / PIXELS_PER_MINUTE;
        const totalMinutes = minutesFromStart + (START_HOUR * 60);
        const hour = Math.floor(totalMinutes / 60);
        const minute = Math.floor((totalMinutes % 60) / 5) * 5;
        return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
    };

    const calculateYFromTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const totalMinutes = (h * 60 + m) - (START_HOUR * 60);
        return totalMinutes * PIXELS_PER_MINUTE;
    };

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
                     width: `calc(${100 / totalCols}% - 4px)`,
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
        onSlotClick({ date: day, time: timeStr, x: e.clientX, y: e.clientY });
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

    const handleAppMouseEnter = (e: React.MouseEvent<HTMLDivElement>, app: Appointment) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredAppInfo({ app, rect });
    };

    const handleAppMouseLeave = () => {
        setHoveredAppInfo(null);
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

            <ScrollArea className="flex-1">
                <div className="flex relative min-h-0" style={{ height: (END_HOUR - START_HOUR) * PIXELS_PER_HOUR }}>
                    
                    {hoveredAppInfo && (
                        <AppointmentTooltip 
                            app={hoveredAppInfo.app}
                            anchorRect={hoveredAppInfo.rect}
                            services={services}
                            users={users}
                        />
                    )}

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

                    <div className="w-16 flex-none border-r bg-background z-20 sticky left-0 text-xs text-muted-foreground text-right pr-2 select-none shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)]">
                        {hours.map(h => (
                            <div key={h} className="relative" style={{ height: PIXELS_PER_HOUR }}>
                                <span className="absolute -top-2.5 right-2 text-[11px] font-medium text-foreground/70">{h}:00</span>
                            </div>
                        ))}
                    </div>

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
                                    isTodayDate ? "bg-slate-50/40" : "bg-white", 
                                    dropTarget && isSameDay(dropTarget.date, day) && "bg-primary/10"
                                )}
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 11px)'
                                }}
                                onDragOver={(e) => handleDragOver(e, day)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day)}
                                onClick={(e) => handleGridClick(e, day)}
                                onMouseMove={(e) => handleMouseMove(e, day)}
                                onMouseLeave={handleMouseLeaveGrid}
                            >
                                {hours.map(h => (
                                    <div key={h} className="absolute w-full pointer-events-none select-none" style={{ top: (h - START_HOUR) * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}>
                                         <div className="absolute w-full border-t border-slate-300/70 top-0"></div>
                                         <div className="absolute w-full border-t border-slate-100 top-[50%]"></div>
                                    </div>
                                ))}

                                {hoverSlot && isSameDay(hoverSlot.date, day) && !draggedApp && (
                                    <div 
                                        className="absolute z-10 w-full left-0 pointer-events-none animate-in fade-in duration-75"
                                        style={{ top: hoverSlot.top }}
                                    >
                                        <div className="absolute w-full border-t border-violet-400/40 top-0"></div>
                                        <div className="absolute -top-3.5 left-0.5 bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold px-2 py-0.5 rounded shadow-sm z-20">
                                            {hoverSlot.time}
                                        </div>
                                    </div>
                                )}

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

                                {layoutedEvents.map(({ data: app, style }) => {
                                    const color = getServiceColor(app.service_name);
                                    const isPaid = app.status === 'Concluído' || ['card', 'online', 'minutes', 'cash', 'gift'].includes(app.payment_method);
                                    const isBlocked = app.payment_method === 'blocked';
                                    const isCancelled = app.status === 'Cancelado';
                                    
                                    const realHeightPx = app.duration * PIXELS_PER_MINUTE;
                                    const displayHeightPx = Math.max(realHeightPx, 28);
                                    const isVisualOverride = displayHeightPx > realHeightPx;

                                    const bufferHeightPx = isBlocked ? 0 : 15 * PIXELS_PER_MINUTE;

                                    const isTiny = displayHeightPx < 50;
                                    const isSmall = displayHeightPx < 70;
                                    
                                    const isBeingDragged = draggedApp?.id === app.id;

                                    return (
                                        <div
                                            key={app.id}
                                            className={cn(
                                                "absolute inset-x-1 flex flex-col transition-all duration-200 select-none group",
                                                isVisualOverride ? "z-30 hover:z-50" : "z-20 hover:z-50",
                                                isBeingDragged && "opacity-40 grayscale scale-95"
                                            )}
                                            style={{
                                                left: style.left,
                                                width: style.width,
                                                top: style.top,
                                            }}
                                        >
                                            <div
                                                draggable={!isCancelled}
                                                onDragStart={(e) => !isCancelled && handleDragStart(e, app)}
                                                onDragEnd={handleDragEnd}
                                                onClick={(e) => { 
                                                    e.preventDefault();
                                                    e.stopPropagation(); 
                                                    if (isCancelled) {
                                                        // Maybe show context menu or simple alert? For now, do nothing on left click or re-open edit?
                                                        // Let's allow edit just to see details
                                                        onEditClick(app);
                                                        return;
                                                    }
                                                    if (isBlocked) {
                                                        onEditClick(app);
                                                    } else {
                                                        onPayClick(app);
                                                    }
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (!isBlocked && !isCancelled) {
                                                        onCancelClick(app);
                                                    }
                                                }}
                                                onMouseEnter={(e) => handleAppMouseEnter(e, app)}
                                                onMouseLeave={handleAppMouseLeave}
                                                className={cn(
                                                    "relative rounded-md border-l-[4px] cursor-pointer overflow-hidden shadow-sm transition-all",
                                                    "hover:shadow-md hover:brightness-95 active:scale-[0.98]",
                                                    isTiny ? "px-1.5 flex items-center" : "p-2",
                                                    isCancelled
                                                        ? "bg-slate-200 border-l-slate-500 border border-slate-300 opacity-60 grayscale"
                                                        : isBlocked 
                                                            ? "bg-slate-100 border-l-slate-400 border border-slate-200" 
                                                            : "bg-white border-y border-r border-border/50"
                                                )}
                                                style={{
                                                    height: `${displayHeightPx}px`,
                                                    ...(isBlocked || isCancelled ? {
                                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #e2e8f0 10px, #e2e8f0 20px)'
                                                    } : {
                                                        backgroundColor: `${color}80`, 
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
                                                             {isCancelled ? <Ban className="h-3 w-3 text-slate-600 shrink-0" /> : null}
                                                             <span className={cn(
                                                                 "text-[11px] font-bold truncate leading-none text-foreground/90", 
                                                                 (isBlocked || isCancelled) && "italic text-slate-600 decoration-slate-400",
                                                                 isCancelled && "line-through"
                                                             )}>
                                                                {isBlocked ? app.service_name : app.user_name}
                                                             </span>
                                                             {isPaid && !isBlocked && !isCancelled && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 ml-auto" />}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-1 w-full shrink-0 leading-none mb-1">
                                                                 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{format(new Date(app.date), 'HH:mm')}</span>
                                                                 </div>
                                                                 <div className="flex gap-1">
                                                                    {isPaid && !isBlocked && !isCancelled && (
                                                                        <div className="bg-emerald-100 p-0.5 rounded-full" title="Payé">
                                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                                        </div>
                                                                    )}
                                                                    {isBlocked && <Lock className="h-3 w-3 text-slate-500" />}
                                                                    {isCancelled && <Ban className="h-3 w-3 text-slate-500" />}
                                                                 </div>
                                                            </div>
                                                            <div className={cn(
                                                                "font-bold truncate text-foreground/90", 
                                                                isSmall ? "text-xs" : "text-sm", 
                                                                (isBlocked || isCancelled) && "text-slate-600 italic",
                                                                isCancelled && "line-through decoration-slate-400"
                                                            )}>
                                                                {isBlocked ? app.service_name.toUpperCase() : app.user_name}
                                                            </div>
                                                            {!isSmall && !isBlocked && !isCancelled && (
                                                                <div className="truncate text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                                                                    {app.service_name}
                                                                </div>
                                                            )}
                                                            {isCancelled && (
                                                                <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Annulé</div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {!isBlocked && !isCancelled && (
                                                <div 
                                                    className="w-[94%] mx-auto rounded-b-sm border-x border-b border-dashed border-muted-foreground/20 relative -mt-[1px] -z-10 flex items-center justify-center pointer-events-none"
                                                    style={{ 
                                                        height: `${bufferHeightPx}px`,
                                                        backgroundColor: `${color}25`, 
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