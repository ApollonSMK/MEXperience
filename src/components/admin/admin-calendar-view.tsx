'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Clock, User, Mail, CalendarCheck, CalendarX } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '../ui/badge';


interface Props {
  bookings: Booking[];
}

const START_HOUR = 8;
const END_HOUR = 21;
const serviceColors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#22c55e', // green-500
    '#f97316', // orange-500
    '#8b5cf6', // violet-500
];

const getStatusClasses = (status: Booking['status']) => {
  switch (status) {
    case 'Confirmado':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Pendente':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Cancelado':
      return 'bg-red-500/20 text-red-300 border-red-500/30 line-through';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

const StatusIcon = ({ status }: { status: Booking['status']}) => {
    switch (status) {
        case 'Confirmado':
            return <CalendarCheck className="w-3 h-3" />;
        case 'Cancelado':
            return <CalendarX className="w-3 h-3" />;
        case 'Pendente':
        default:
            return <Clock className="w-3 h-3" />;
    }
}

export function BookingsCalendar({ bookings }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevDay = useCallback(() => {
    setCurrentDate(prev => subDays(prev, 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setCurrentDate(prev => addDays(prev, 1));
  }, []);
  
  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => `${(START_HOUR + i).toString().padStart(2, '0')}:00`);
  const serviceMap = new Map(services.map((s, i) => [s.id, { ...s, color: serviceColors[i % serviceColors.length] }]));

  const getPositionAndDimensions = (booking: Booking) => {
    const startTime = new Date(`${booking.date}T${booking.time}`);
    const top = ((startTime.getHours() - START_HOUR) * 60 + startTime.getMinutes()) * 1; // 1px per minute
    const height = (booking.duration || 30) * 1; // 1px per minute
    return { top, height };
  };

  const dayBookings = bookings.filter(b => format(new Date(b.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'));

  // Process bookings for layout
  const processedBookings: (Booking & { width: number; left: number, top: number, height: number })[] = [];

  for (const service of services) {
      const serviceBookings = dayBookings.filter(b => b.service_id === service.id);
      
      const collisionGroups: Booking[][] = [];
      serviceBookings.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).forEach(booking => {
          let placed = false;
          for (const group of collisionGroups) {
              const lastBookingInGroup = group[group.length - 1];
              const bookingStart = new Date(`${booking.date}T${booking.time}`).getTime();
              const lastEnd = new Date(`${lastBookingInGroup.date}T${lastBookingInGroup.time}`).getTime() + (lastBookingInGroup.duration || 30) * 60000;
              if (bookingStart < lastEnd) {
                  group.push(booking);
                  placed = true;
                  break;
              }
          }
          if (!placed) {
              collisionGroups.push([booking]);
          }
      });
      
      collisionGroups.forEach(group => {
          const groupWidth = 100 / group.length;
          group.forEach((booking, index) => {
              const { top, height } = getPositionAndDimensions(booking);
              processedBookings.push({
                  ...booking,
                  width: groupWidth,
                  left: index * groupWidth,
                  top,
                  height
              });
          });
      });
  }


  return (
    <div className="h-full flex flex-col bg-card rounded-lg border">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, "eeee, d 'de' MMMM", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevDay} size="sm">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button variant="outline" onClick={handleToday} size="sm">
            Hoje
          </Button>
          <Button variant="outline" onClick={handleNextDay} size="sm">
            Seguinte <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 text-right pr-2 text-xs text-muted-foreground">
            {timeSlots.map(time => (
              <div key={time} className="h-[60px] relative -top-2">
                {time}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${services.length}, 1fr)`}}>
            {services.map(service => (
              <div key={service.id} className="relative border-l border-border/50">
                <div className="sticky top-0 z-10 p-2 text-center font-semibold text-sm bg-card border-b">
                    {service.name}
                </div>
                <div className="absolute inset-0 top-[49px]">
                  {timeSlots.slice(1).map(time => (
                    <div key={`line-${service.id}-${time}`} className="h-[60px] border-t border-dashed border-border/30"></div>
                  ))}
                </div>

                {processedBookings.filter(b => b.service_id === service.id).map(booking => (
                  <TooltipProvider key={booking.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          style={{
                            top: `${booking.top}px`,
                            height: `${booking.height}px`,
                            width: `${booking.width}%`,
                            left: `${booking.left}%`,
                            backgroundColor: `${serviceMap.get(booking.service_id)?.color}20`, // 20% opacity
                            borderColor: serviceMap.get(booking.service_id)?.color,
                          }}
                          className={cn(
                            'absolute p-1.5 rounded-lg border text-xs text-white overflow-hidden',
                            {'line-through': booking.status === 'Cancelado'}
                          )}
                        >
                          <p className="font-bold truncate">{booking.name}</p>
                          <p className="text-white/80">{booking.time.substring(0,5)}</p>
                        </div>
                      </TooltipTrigger>
                       <TooltipContent className="bg-background border-accent text-foreground p-0 max-w-xs">
                        <div className="p-3">
                            <h4 className="font-bold text-base mb-2">{booking.name}</h4>
                             <hr className="border-border my-2"/>
                            <p className="flex items-center gap-2"><User className="w-4 h-4 text-accent" /> {booking.email}</p>
                            <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /> {booking.date} às {booking.time}</p>
                            <p className="flex items-center gap-2">
                                <span>{serviceMap.get(booking.service_id)?.name} ({booking.duration} min)</span>
                            </p>
                            <div className="flex items-center mt-2">
                                <Badge variant={
                                    booking.status === 'Confirmado' ? 'default' : booking.status === 'Cancelado' ? 'destructive' : 'secondary'
                                } className="capitalize flex items-center gap-1.5">
                                    <StatusIcon status={booking.status} />
                                    {booking.status}
                                </Badge>
                            </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
