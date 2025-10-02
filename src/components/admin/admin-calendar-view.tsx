
'use client';

import React, { useRef, useEffect, useState } from 'react';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import { useTheme } from 'next-themes';

interface Props {
  bookings: Booking[];
  selectedDate?: Date;
}

const getStatusColor = (status: Booking['status']) => {
    switch (status) {
        case 'Confirmado':
            return { bg: '#22c55e', border: '#16a34a' }; // green-500, green-600
        case 'Pendente':
            return { bg: '#f59e0b', border: '#d97706' }; // amber-500, amber-600
        case 'Cancelado':
            return { bg: '#ef4444', border: '#dc2626' }; // red-500, red-600
        default:
            return { bg: '#6b7280', border: '#4b5563' }; // gray-500, gray-600
    }
}

export function BookingsCalendar({ bookings, selectedDate }: Props) {
  const calendarRef = useRef<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  useEffect(() => {
    if (calendarRef.current) {
        calendarRef.current.getInstance().changeView('day');
        if (selectedDate) {
          calendarRef.current.getInstance().setDate(selectedDate);
        }
    }
  }, [selectedDate]);

  useEffect(() => {
    // converte os bookings para o formato do TUI Calendar
    const mapped = bookings.map((b) => {
      const startDate = new Date(`${b.date}T${b.time}`);
      const endDate = new Date(startDate.getTime() + (Number(b.duration) || 30) * 60000);
      const service = services.find((s) => s.id === b.service_id);
      const colors = getStatusColor(b.status);

      return {
        id: String(b.id),
        calendarId: b.service_id,
        title: `${b.name}`,
        body: `${service?.name || 'Serviço'} (${b.duration} min)`,
        category: 'time',
        start: startDate,
        end: endDate,
        isReadOnly: true,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: '#ffffff',
      };
    });

    setSchedules(mapped);
  }, [bookings]);

  const calendarServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      backgroundColor: '#3b82f6', 
      borderColor: '#1d4ed8',
      color: '#ffffff'
  }));

  const theme = {
    common: {
        backgroundColor: 'transparent',
        border: '1px solid hsl(var(--border))',
    },
    week: {
        today: {
            backgroundColor: 'hsl(var(--muted))',
        },
        dayName: {
            color: 'hsl(var(--foreground))',
            borderLeft: '1px solid hsl(var(--border))',
        },
        timegridLeft: {
            backgroundColor: 'hsl(var(--card))',
            borderRight: '1px solid hsl(var(--border))',
        },
        timegrid: {
             border: '1px solid hsl(var(--border))',
        }
    },
  };


  return (
    <div className="h-[calc(100vh-16rem)] p-2">
      <Calendar
        ref={calendarRef}
        height="100%"
        usageStatistics={false}
        view="day"
        taskView={false}
        scheduleView={['time']}
        useDetailPopup={true}
        calendars={calendarServices}
        schedules={schedules}
        timezones={['Europe/Lisbon']}
        theme={theme}
        week={{
            hourStart: 8,
            hourEnd: 21,
            taskView: false,
            scheduleView: ['time'],
        }}
      />
    </div>
  );
}
