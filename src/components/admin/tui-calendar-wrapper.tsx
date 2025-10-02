'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Calendar from '@toast-ui/calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  bookings: Booking[];
}

const serviceColors = {
  'collagen-boost': '#ef4444', // red-500
  'solarium': '#f97316', // orange-500
  'hydromassage': '#3b82f6', // blue-500
  'infrared-dome': '#8b5cf6', // violet-500
};

export function TuiCalendarWrapper({ bookings }: Props) {
  const calendarRef = useRef<Calendar | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'Confirmado':
        return '#22c55e'; // green-500
      case 'Pendente':
        return '#eab308'; // yellow-500
      case 'Cancelado':
        return '#6b7280'; // gray-500
      default:
        return '#6b7280';
    }
  };

  useEffect(() => {
    if (calendarContainerRef.current) {
      calendarRef.current = new Calendar(calendarContainerRef.current, {
        defaultView: 'day',
        usageStatistics: false,
        useDetailPopup: true,
        isReadOnly: true,
        gridSelection: false,
        calendars: services.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        theme: {
          common: {
            backgroundColor: 'hsl(var(--card))',
            dayName: {
                color: 'hsl(var(--card-foreground))',
            },
            gridLine: {
                color: 'hsl(var(--border))',
            },
            timegrid: {
                color: 'hsl(var(--card-foreground))',
            }
          }
        },
        timezone: {
            zones: [{
                timezoneName: 'Europe/Lisbon',
                displayLabel: 'GMT+1',
            }],
        },
        timezones: [{
            timezoneName: 'Europe/Lisbon',
            displayLabel: 'GMT+1',
        }],
      });

      // Set initial date
      calendarRef.current.setDate(currentDate);

      // Add event listener for date/view change
       calendarRef.current.on('beforeUpdateEvent', (event) => {
            // Cannot be updated
            return false;
        });

      return () => {
        calendarRef.current?.destroy();
      };
    }
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.clear();
      const mapped = bookings.map((b) => {
        const startDate = new Date(`${b.date}T${b.time}`);
        const endDate = new Date(
          startDate.getTime() + (Number(b.duration) || 30) * 60000
        );

        return {
          id: String(b.id),
          calendarId: b.service_id,
          title: b.name || 'Agendamento',
          body: b.email,
          category: 'time',
          start: startDate,
          end: endDate,
          isReadOnly: true,
          color: 'hsl(var(--card-foreground))',
          backgroundColor: serviceColors[b.service_id as keyof typeof serviceColors] || '#3b82f6',
          borderColor: getStatusColor(b.status),
          customStyle: {
            border: `2px solid ${getStatusColor(b.status)}`
          },
        };
      });
      calendarRef.current.createEvents(mapped);
    }
  }, [bookings]);

  const handlePrev = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.prev();
      setCurrentDate(calendarRef.current.getDate().toDate());
    }
  }, []);

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.next();
      setCurrentDate(calendarRef.current.getDate().toDate());
    }
  }, []);

  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.today();
      setCurrentDate(calendarRef.current.getDate().toDate());
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, "eeee, d 'de' MMMM", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrev} size="sm">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button variant="outline" onClick={handleToday} size="sm">
            Hoje
          </Button>
          <Button variant="outline" onClick={handleNext} size="sm">
            Seguinte <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
       <div className="flex-grow h-[calc(100vh-14rem)]">
         <div id="calendar-container" ref={calendarContainerRef} style={{ height: '100%' }} />
       </div>
    </div>
  );
}
