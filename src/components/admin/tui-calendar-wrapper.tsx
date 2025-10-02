
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Calendar from '@toast-ui/calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookingActionsDialog } from './booking-actions-dialog';


interface Props {
  bookings: Booking[];
}

const serviceColors: Record<string, { background: string; border: string }> = {
  'collagen-boost': { background: '#fecaca', border: '#ef4444' }, // red-200, red-500
  solarium: { background: '#fed7aa', border: '#f97316' }, // orange-200, orange-500
  hydromassage: { background: '#bfdbfe', border: '#3b82f6' }, // blue-200, blue-500
  'infrared-dome': { background: '#ddd6fe', border: '#8b5cf6' }, // violet-200, violet-500
};

const getStatusColor = (status: Booking['status']) => {
  switch (status) {
    case 'Confirmado':
      return '#22c55e'; // green-500
    case 'Pendente':
      return '#eab308'; // yellow-500
    case 'Cancelado':
      return '#9ca3af'; // gray-400
    default:
      return '#6b7280'; // gray-500
  }
};

// Custom theme for a professional look
const calendarTheme = {
  common: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb', // gray-200
    gridLine: {
      color: '#f3f4f6', // gray-100
    },
    dayName: {
      color: '#374151', // gray-700
    },
    holiday: {
      color: '#ef4444', // red-500
    },
  },
  month: {
      dayName: {
          color: '#374151',
      },
      holiday: {
          color: '#ef4444',
      }
  },
  week: {
    dayName: {
      color: '#374151',
      borderLeft: '1px solid #e5e7eb',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb', // gray-50
    },
    today: {
      color: '#3b82f6', // blue-500
    },
    timegridLeft: {
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
    },
    timegrid: {
        color: '#6b7280', // gray-500
    },
    timegridHalfHour: {
        borderBottom: '1px dotted #f3f4f6',
    },
    timegridHour: {
        borderBottom: '1px solid #e5e7eb',
    },
  },
};


export function TuiCalendarWrapper({ bookings }: Props) {
  const calendarRef = useRef<Calendar | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (calendarContainerRef.current) {
      const cal = new Calendar(calendarContainerRef.current, {
        defaultView: currentView,
        usageStatistics: false,
        useDetailPopup: false, // Disable default popup
        isReadOnly: false, // Allow interactions
        gridSelection: false,
        taskView: false,
        milestoneView: false,
        scheduleView: ['time'],
        calendars: services.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        theme: calendarTheme,
        timezone: {
            zones: [{ timezoneName: 'Europe/Lisbon', displayLabel: 'GMT+1' }],
        },
        week: {
            scheduleView: ['time'],
            taskView: false,
            milestoneView: false,
        },
        day: {
            scheduleView: ['time'],
            taskView: false,
            milestoneView: false,
        }
      });

      cal.on('clickEvent', ({ event }) => {
          const bookingId = Number(event.id);
          const booking = bookings.find(b => b.id === bookingId);
          if (booking) {
              setSelectedBooking(booking);
              setIsDialogOpen(true);
          }
      });
      
      calendarRef.current = cal;

      return () => {
        calendarRef.current?.destroy();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]); // Rerender when bookings change to re-attach events

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.clear();
      const mappedEvents = bookings.map((b) => {
        const startDate = new Date(`${b.date}T${b.time}`);
        const endDate = new Date(
          startDate.getTime() + (Number(b.duration) || 30) * 60000
        );

        const service = services.find(s => s.id === b.service_id);
        const serviceColor = serviceColors[b.service_id as keyof typeof serviceColors] || { background: '#d1d5db', border: '#6b7280'};

        return {
          id: String(b.id),
          calendarId: b.service_id,
          title: `${service?.name || 'Serviço'} - ${b.name || 'Cliente'}`,
          body: `<b>Email:</b> ${b.email}<br><b>Status:</b> ${b.status}`,
          category: 'time',
          start: startDate,
          end: endDate,
          isReadOnly: true,
          color: '#1f2937', // gray-800 text
          backgroundColor: serviceColor.background,
          borderColor: serviceColor.border,
          customStyle: {
            borderLeft: `4px solid ${getStatusColor(b.status)}`,
            fontSize: '12px',
          },
        };
      });
      calendarRef.current.createEvents(mappedEvents);
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
  
  const changeView = useCallback((view: 'day' | 'week' | 'month') => {
      if (calendarRef.current) {
          calendarRef.current.changeView(view);
          setCurrentView(view);
      }
  }, []);

  return (
    <>
    <div className="h-full flex flex-col bg-card rounded-lg border">
      <div className="flex flex-wrap items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-2">
            <Button variant={currentView === 'day' ? 'default' : 'outline'} onClick={() => changeView('day')} size="sm">Dia</Button>
            <Button variant={currentView === 'week' ? 'default' : 'outline'} onClick={() => changeView('week')} size="sm">Semana</Button>
            <Button variant={currentView === 'month' ? 'default' : 'outline'} onClick={() => changeView('month')} size="sm">Mês</Button>
        </div>

        <h2 className="text-xl font-semibold capitalize text-center order-first sm:order-none flex-grow">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
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
       <div className="flex-grow h-[calc(100vh-18rem)]">
         <div id="calendar-container" ref={calendarContainerRef} style={{ height: '100%' }} />
       </div>
    </div>
    <BookingActionsDialog 
        booking={selectedBooking}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
    />
    </>
  );
}
