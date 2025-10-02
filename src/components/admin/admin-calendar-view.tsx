
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Calendar from '@toast-ui/react-calendar';
import 'tui-calendar/dist/tui-calendar.min.css';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import type { EventObject } from 'tui-calendar';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  bookings: Booking[];
}

const serviceColors = [
    { bg: '#3b82f6', border: '#1d4ed8' }, // blue-500, blue-700
    { bg: '#ef4444', border: '#b91c1c' }, // red-500, red-700
    { bg: '#22c55e', border: '#15803d' }, // green-500, green-700
    { bg: '#f97316', border: '#c2410c' }, // orange-500, orange-700
    { bg: '#8b5cf6', border: '#6d28d9' }, // violet-500, violet-700
]

export function BookingsCalendar({ bookings }: Props) {
  const calendarRef = useRef<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!calendarRef.current) return;

    const calendarInstance = calendarRef.current.getInstance();
    
    // Mapeia os bookings para o formato do TUI Calendar
    const schedules: EventObject[] = bookings.map((b) => {
      const startDate = new Date(`${b.date}T${b.time}`);
      const endDate = new Date(startDate.getTime() + (Number(b.duration) || 30) * 60000);
      const service = services.find((s) => s.id === b.service_id);
      
      return {
        id: String(b.id),
        calendarId: b.service_id,
        title: b.name || 'Cliente',
        body: service?.name || 'Serviço',
        category: 'time',
        start: startDate,
        end: endDate,
        isReadOnly: true,
        raw: {
          status: b.status,
        },
      };
    });

    calendarInstance.clear();
    calendarInstance.createSchedules(schedules);
  }, [bookings]);

  useEffect(() => {
    if (calendarRef.current) {
        calendarRef.current.getInstance().setDate(currentDate);
    }
  }, [currentDate]);
  
  const handlePrev = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getInstance().prev();
      setCurrentDate(calendarRef.current.getInstance().getDate().toDate());
    }
  }, []);

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getInstance().next();
      setCurrentDate(calendarRef.current.getInstance().getDate().toDate());
    }
  }, []);
  
  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getInstance().today();
      setCurrentDate(calendarRef.current.getInstance().getDate().toDate());
    }
  }, []);


  const calendarServices = services.map((s, index) => ({
      id: s.id,
      name: s.name,
      backgroundColor: serviceColors[index % serviceColors.length].bg,
      borderColor: serviceColors[index % serviceColors.length].border,
  }));

  return (
     <div className="h-full flex flex-col">
       <div className="flex items-center justify-between p-4 border-b">
         <h2 className="text-xl font-semibold">
           {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
         </h2>
         <div className="flex items-center gap-2">
           <Button variant="outline" onClick={handlePrev}>
             <ChevronLeft className="h-4 w-4" />
             Anterior
           </Button>
            <Button variant="outline" onClick={handleToday}>
             Hoje
           </Button>
           <Button variant="outline" onClick={handleNext}>
             Seguinte
             <ChevronRight className="h-4 w-4" />
           </Button>
         </div>
       </div>
      <div className="flex-grow h-[calc(100vh-16rem)]">
        <Calendar
          ref={calendarRef}
          height="100%"
          usageStatistics={false}
          view="day"
          taskView={false}
          scheduleView={['time']}
          useDetailPopup={true}
          calendars={calendarServices}
          theme={{
            common: {
                dayname: {
                    color: 'hsl(var(--muted-foreground))'
                },
                holiday: {
                    color: 'hsl(var(--destructive))'
                },
                saturday: {
                    color: 'hsl(var(--muted-foreground))'
                },
                today: {
                    color: 'hsl(var(--primary))'
                }
            },
            week: {
                dayname: {
                  borderLeft: 'none',
                  borderTop: '1px solid hsl(var(--border))',
                  borderBottom: '1px solid hsl(var(--border))',
                  backgroundColor: 'inherit',
                },
                dayGrid: {
                    borderRight: '1px solid hsl(var(--border))',
                },
                dayGridLeft: {
                    borderRight: '1px solid hsl(var(--border))',
                    backgroundColor: 'inherit',
                    width: '72px'
                },
                timeGridLeft: {
                    borderRight: '1px solid hsl(var(--border))',
                    backgroundColor: 'inherit',
                    width: '72px'
                },
                timeGrid: {
                    borderRight: '1px solid hsl(var(--border))'
                },
                timeGridHalfHour: {
                    borderBottom: '1px dashed hsl(var(--border))',
                },
                timeGridHour: {
                    borderBottom: '1px solid hsl(var(--border))',
                },
                currentTimeLine: {
                    border: '1px solid hsl(var(--primary))'
                },
            }
          }}
        />
      </div>
    </div>
  );
}
