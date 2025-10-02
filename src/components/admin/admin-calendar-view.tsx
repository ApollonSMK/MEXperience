
'use client';

import * as React from 'react';
import type { Booking } from '@/app/admin/bookings/page';
import { services } from '@/lib/services';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`); // 8am to 8pm

const getStatusColor = (status: Booking['status']) => {
  switch (status) {
    case 'Confirmado':
      return 'bg-green-100 border-green-500 text-green-800';
    case 'Pendente':
      return 'bg-amber-100 border-amber-500 text-amber-800';
    case 'Cancelado':
      return 'bg-red-100 border-red-500 text-red-800';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-800';
  }
};

// This type will hold layout properties for each booking
type BookingWithLayout = Booking & {
  width: string;
  left: string;
};

export function AdminCalendarView({ bookings }: { bookings: Booking[] }) {
  const serviceColumns = services.map((s) => s.id);
  const columnCount = serviceColumns.length;

  const getBookingPosition = (booking: Booking) => {
    const [hour, minute] = booking.time.split(':').map(Number);
    const top = (hour - 8 + minute / 60) * 60; // 60px per hour, starting from 8am
    const height = booking.duration || 30;
    return { top: `${top}px`, height: `${height}px` };
  };

  const bookingsWithLayout = React.useMemo(() => {
    const layoutBookings: BookingWithLayout[] = [];

    // Group bookings by service to handle overlaps within each service column
    serviceColumns.forEach((serviceId) => {
      const serviceBookings = bookings
        .filter((b) => b.service_id === serviceId)
        .sort((a, b) => a.time.localeCompare(b.time));

      if (serviceBookings.length === 0) return;

      // This array will hold groups of overlapping bookings
      const eventGroups: Booking[][] = [];
      let lastEventEnd = 0;

      serviceBookings.forEach((booking) => {
        const start = new Date(`1970-01-01T${booking.time}`).getTime();
        if (start >= lastEventEnd) {
          // No overlap, start a new group
          eventGroups.push([booking]);
        } else {
          // Overlap, add to the last group
          eventGroups[eventGroups.length - 1].push(booking);
        }
        const end = start + (booking.duration || 0) * 60000;
        lastEventEnd = Math.max(lastEventEnd, end);
      });

      // Calculate layout for each group
      eventGroups.forEach((group) => {
        const groupColumns: Booking[][] = [];
        group.forEach((booking) => {
          let colIndex = 0;
          let placed = false;
          while (!placed) {
            if (!groupColumns[colIndex]) {
              groupColumns[colIndex] = [booking];
              placed = true;
            } else {
              const lastInColumn = groupColumns[colIndex][groupColumns[colIndex].length - 1];
              const lastEnd = new Date(`1970-01-01T${lastInColumn.time}`).getTime() + (lastInColumn.duration || 0) * 60000;
              const currentStart = new Date(`1970-01-01T${booking.time}`).getTime();
              if (currentStart >= lastEnd) {
                groupColumns[colIndex].push(booking);
                placed = true;
              } else {
                colIndex++;
              }
            }
          }
        });

        const totalColumnsInGroup = groupColumns.length;
        groupColumns.forEach((column, colIndex) => {
          column.forEach((booking) => {
            layoutBookings.push({
              ...booking,
              width: `${100 / totalColumnsInGroup}%`,
              left: `${(colIndex * 100) / totalColumnsInGroup}%`,
            });
          });
        });
      });
    });

    return layoutBookings;
  }, [bookings, serviceColumns]);

  if (bookings.length === 0) {
    return (
      <div className="flex h-[calc(100vh-16rem)] flex-col items-center justify-center gap-2 text-center">
        <CalendarIcon className="h-12 w-12 text-muted" />
        <h3 className="text-xl font-medium tracking-tight">
          Nenhum agendamento
        </h3>
        <p className="text-muted-foreground">
          Não há agendamentos para a data selecionada.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto scrollbar-hide">
      <div className="relative flex min-w-[800px]">
        {/* Time Column */}
        <div className="w-20 flex-shrink-0 sticky left-0 bg-background z-20">
          <div className="h-[50px] border-b"></div>
          {timeSlots.map((time) => (
            <div
              key={time}
              className="h-[60px] text-right pr-2 text-sm text-muted-foreground border-r border-t"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          className="flex-grow grid"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {serviceColumns.map((serviceId, columnIndex) => {
            const service = services.find((s) => s.id === serviceId);
            return (
              <div key={serviceId} className="relative border-r">
                <div className="sticky top-0 z-10 bg-muted/50 p-2 text-center font-semibold text-sm border-b h-[50px] flex items-center justify-center">
                  <p className="truncate">{service?.name || `Máquina`}</p>
                </div>
                {/* Grid Lines */}
                {timeSlots.map((time) => (
                  <div key={time} className="h-[60px] border-t"></div>
                ))}

                {/* Bookings for this service */}
                <div className="absolute top-[50px] left-0 right-0 bottom-0">
                  {bookingsWithLayout
                    .filter((b) => b.service_id === serviceId)
                    .map((booking) => {
                      const { top, height } = getBookingPosition(booking);
                      const { width, left } = booking;
                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            'absolute p-1.5 rounded-lg border text-xs overflow-hidden',
                            getStatusColor(booking.status)
                          )}
                          style={{ top, height, left, width }}
                        >
                          <p className="font-bold truncate">{booking.name}</p>
                          <p className="text-xs truncate">{service?.name}</p>
                          <p className="text-xs opacity-70">
                            {booking.time.substring(0, 5)} - {new Date(new Date(`1970-01-01T${booking.time}`).getTime() + (booking.duration || 0) * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
