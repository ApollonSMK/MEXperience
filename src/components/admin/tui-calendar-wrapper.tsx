
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
import { updateBookingDateTime } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { NewBookingDialog } from './new-booking-dialog';
import type { Profile } from '@/types/profile';


interface Props {
  bookings: Booking[];
  profiles: Profile[];
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
     gridSelection: {
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      border: '1px dotted #3b82f6',
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
    timegridSelection: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        color: '#3b82f6',
    },
  },
};


export function TuiCalendarWrapper({ bookings, profiles }: Props) {
  const calendarRef = useRef<Calendar | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isNewBookingDialogOpen, setIsNewBookingDialogOpen] = useState(false);
  const [newBookingData, setNewBookingData] = useState<{start: Date, end: Date} | null>(null);

  const { toast } = useToast();
  
  const timezoneName = 'Europe/Luxembourg';

  const openNewBookingSheet = (start: Date, end: Date) => {
    setNewBookingData({ start, end });
    setIsNewBookingDialogOpen(true);
    calendarRef.current?.clearGridSelections();
  };

  useEffect(() => {
    if (calendarContainerRef.current) {
      const cal = new Calendar(calendarContainerRef.current, {
        defaultView: currentView,
        usageStatistics: false,
        useDetailPopup: false,
        isReadOnly: false,
        calendars: services.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        theme: calendarTheme,
        template: {
          timegridDisplayPrimaryTime({ time }) {
            // Customize time format on the left
            return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
          },
          timegridDisplayTime({ time }) {
            // Don't display time on the event itself
            return '';
          },
          time({ event }) {
             // Main title for the event
            return `<span style="font-weight: 600;">${event?.title || ''}</span>`;
          },
           timegridCurrentTime: {
            bullet: '<div style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></div>',
            line: 'border-top: 1px solid #ef4444;',
          },
          timegridSelection: function(selection) {
             return 'CLIQUE PARA AGENDAR';
          },
        },
        timezone: {
          zones: [{ timezoneName, displayLabel: 'CET' }],
          useCustomTimezone: true,
        },
        week: {
          scheduleView: ['time'],
          taskView: false,
          milestoneView: false,
          allDay: false,
          hourStart: 7,
          hourEnd: 22,
          gridSelection: {
            step: 15,
          },
          timegrid: {
            hour: {
              height: 60,
            },
            quarterHour: {
              height: 15,
            }
          }
        },
        day: {
          scheduleView: ['time'],
          taskView: false,
          milestoneView: false,
          allDay: false,
          hourStart: 7,
          hourEnd: 22,
          gridSelection: {
            step: 15,
          },
           timegrid: {
            hour: {
              height: 60,
            },
            quarterHour: {
              height: 15,
            }
          }
        }
      });

      cal.on('clickEvent', ({ event }) => {
          const bookingId = Number(event.id);
          const booking = bookings.find(b => b.id === bookingId);
          if (booking) {
              setSelectedBooking(booking);
              setIsDetailsDialogOpen(true);
          }
      });
      
      cal.on('select', (event: any) => {
        const { start, end, isAllday } = event;
        if (isAllday || currentView === 'month') return;
        openNewBookingSheet(start, end);
      });

      cal.on('beforeUpdateEvent', async ({ event, changes }) => {
        const { id, calendarId } = event;
        
        // Only handle moves, not resizes for now.
        if (changes && changes.start && changes.end) {
            const tzDate = (changes.start as any);

            const pad = (num: number) => String(num).padStart(2, '0');
            const newDate = `${tzDate.getFullYear()}-${pad(tzDate.getMonth() + 1)}-${pad(tzDate.getDate())}`;
            const newTime = `${pad(tzDate.getHours())}:${pad(tzDate.getMinutes())}:${pad(tzDate.getSeconds())}`;
    
            const { success, error } = await updateBookingDateTime(
              Number(id),
              newDate,
              newTime
            );
    
            if (success) {
              cal.updateEvent(id as string, calendarId as string, changes);
              toast({
                title: 'Agendamento Atualizado!',
                description: 'O horário foi modificado com sucesso.',
              });
            } else {
              toast({
                title: 'Erro ao Atualizar',
                description: error || 'Não foi possível mover o agendamento.',
                variant: 'destructive',
              });
            }
        }
      });
      
      calendarRef.current = cal;

      return () => {
        calendarRef.current?.destroy();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.clear();
      const mappedEvents = bookings.map((b) => {
        const dateString = `${b.date}T${b.time}`;
        const year = parseInt(dateString.substring(0, 4), 10);
        const month = parseInt(dateString.substring(5, 7), 10) - 1;
        const day = parseInt(dateString.substring(8, 10), 10);
        const hour = parseInt(dateString.substring(11, 13), 10);
        const minute = parseInt(dateString.substring(14, 16), 10);

        const startDate = new Date(Date.UTC(year, month, day, hour, minute));
        
        const endDate = new Date(
          startDate.getTime() + (Number(b.duration) || 30) * 60000
        );

        const service = services.find(s => s.id === b.service_id);
        const serviceColor = serviceColors[b.service_id as keyof typeof serviceColors] || { background: '#d1d5db', border: '#6b7280'};

        return {
          id: String(b.id),
          calendarId: b.service_id,
          title: `${service?.name || 'Serviço'} - ${b.profiles?.full_name || 'Cliente'}`,
          body: `<b>Email:</b> ${b.profiles?.email}<br><b>Status:</b> ${b.status}`,
          category: 'time' as const,
          start: startDate,
          end: endDate,
          isReadOnly: false,
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
      calendarRef.current.render();
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
        allBookings={bookings}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
    />
     <NewBookingDialog
        isOpen={isNewBookingDialogOpen}
        onOpenChange={setIsNewBookingDialogOpen}
        bookingData={newBookingData}
        profiles={profiles}
        onSuccess={() => setIsNewBookingDialogOpen(false)}
      />
    </>
  );
}
