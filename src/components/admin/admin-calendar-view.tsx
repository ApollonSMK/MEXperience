'use client';

import React, { useRef, useEffect, useState } from 'react';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';

interface Props {
  bookings: Booking[];
  selectedDate?: Date;
}

export function BookingsCalendar({ bookings, selectedDate }: Props) {
  const calendarRef = useRef<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    // converte os bookings para o formato do TUI Calendar
    const mapped = bookings.map((b) => {
      const startDate = new Date(`${b.date}T${b.time}`);
      const endDate = new Date(startDate.getTime() + (Number(b.duration) || 30) * 60000);
      const service = services.find((s) => s.id === b.service_id);

      return {
        id: b.id,
        calendarId: b.service_id,
        title: `${b.name} - ${service?.name || 'Serviço'}`,
        category: 'time',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        isReadOnly: true,
      };
    });

    setSchedules(mapped);
  }, [bookings]);

  return (
    <div className="h-[calc(100vh-16rem)]">
      <Calendar
        ref={calendarRef}
        height="100%"
        usageStatistics={false}
        view="week" // daily | week | month
        taskView={false}
        scheduleView
        calendars={services.map((s) => ({
          id: s.id,
          name: s.name,
          backgroundColor: '#3b82f6', // Azul Tailwind
          borderColor: '#1d4ed8',
        }))}
        schedules={schedules}
      />
    </div>
  );
}
