
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
      return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    case 'Cancelado':
      return 'bg-red-100 border-red-500 text-red-800';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-800';
  }
};

type BookingWithLayout = Booking & {
  width: string;
  left: string;
  top: string;
  height: string;
};

// Helper function to convert time string "HH:mm:ss" to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function AdminCalendarView({ bookings }: { bookings: Booking[] }) {
  const serviceColumns = services.map((s) => s.id);
  const columnCount = serviceColumns.length;

  const bookingsWithLayout = React.useMemo(() => {
    const positionedBookings: BookingWithLayout[] = [];

    // Group bookings by service
    serviceColumns.forEach((serviceId) => {
      const serviceBookings = bookings
        .filter((b) => b.service_id === serviceId)
        .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

      // This array holds groups of overlapping bookings
      let overlapGroups: Booking[][] = [];
      if (serviceBookings.length > 0) {
        let currentGroup = [serviceBookings[0]];
        let groupEndTime = timeToMinutes(serviceBookings[0].time) + (serviceBookings[0].duration || 0);

        for (let i = 1; i < serviceBookings.length; i++) {
          const booking = serviceBookings[i];
          const bookingStartTime = timeToMinutes(booking.time);

          if (bookingStartTime < groupEndTime) {
            currentGroup.push(booking);
            groupEndTime = Math.max(groupEndTime, bookingStartTime + (booking.duration || 0));
          } else {
            overlapGroups.push(currentGroup);
            currentGroup = [booking];
            groupEndTime = bookingStartTime + (booking.duration || 0);
          }
        }
        overlapGroups.push(currentGroup);
      }
      
      // Process each overlap group to calculate horizontal layout
      overlapGroups.forEach(group => {
        // Sort group by start time just in case
        group.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        const columns: Booking[][] = []; // Columns for this overlap group
        
        for (const booking of group) {
            let placed = false;
            // Find the first column where this booking can fit
            for(let i = 0; i < columns.length; i++) {
                const lastBookingInColumn = columns[i][columns[i].length - 1];
                const lastBookingEndTime = timeToMinutes(lastBookingInColumn.time) + (lastBookingInColumn.duration || 0);

                if (timeToMinutes(booking.time) >= lastBookingEndTime) {
                    columns[i].push(booking);
                    placed = true;
                    break;
                }
            }
            // If it could not be placed in any existing column, create a new one
            if (!placed) {
                columns.push([booking]);
            }
        }

        const groupColumnCount = columns.length;
        columns.forEach((col, colIndex) => {
          col.forEach(booking => {
             const top = (timeToMinutes(booking.time) - 8 * 60); // minutes from 8am
             const height = booking.duration || 30; // height in minutes
             
             positionedBookings.push({
                ...booking,
                top: `${top}px`,
                height: `${height}px`,
                width: `${100 / groupColumnCount}%`,
                left: `${(colIndex * 100) / groupColumnCount}%`,
             })
          })
        })
      });
    });

    return positionedBookings;
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
          {serviceColumns.map((serviceId) => {
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
                      const endTime = new Date(new Date(`1970-01-01T${booking.time}`).getTime() + (booking.duration || 0) * 60000);
                      const formattedEndTime = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            'absolute p-1.5 rounded-lg border text-xs',
                            getStatusColor(booking.status)
                          )}
                          style={{ top: booking.top, height: booking.height, left: booking.left, width: booking.width }}
                        >
                          <p className="font-bold truncate">{booking.name}</p>
                          <p className="text-xs truncate">{service?.name}</p>
                          <p className="text-xs opacity-70">
                            {booking.time.substring(0, 5)} - {formattedEndTime}
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
