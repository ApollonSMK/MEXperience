
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

const getServiceMachineCount = () => {
    const machineCount: Record<string, number> = {};
    services.forEach(service => {
        machineCount[service.id] = 1; 
    });
    return machineCount;
}

// Extends Booking with layout properties
type BookingWithLayout = Booking & { column: number; totalColumns: number };

export function AdminCalendarView({ bookings }: { bookings: Booking[] }) {
    
  const serviceMachineCount = getServiceMachineCount();
  const machineColumns = Object.keys(serviceMachineCount).map(serviceId => ({ serviceId }));

  const getBookingPosition = (booking: Booking) => {
    const [hour, minute] = booking.time.split(':').map(Number);
    const top = (hour - 8 + minute / 60) * 60; // 60px per hour, starting from 8am
    const height = booking.duration || 30;
    return { top: `${top}px`, height: `${height}px` };
  };

  const distributedBookings = machineColumns.map(mc => {
      let serviceBookings = bookings
          .filter(b => b.service_id === mc.serviceId)
          .sort((a,b) => a.time.localeCompare(b.time)) as BookingWithLayout[];

      // Calculate overlaps and columns
      for (let i = 0; i < serviceBookings.length; i++) {
        let column = 0;
        let overlaps;
        do {
            overlaps = false;
            const currentBooking = serviceBookings[i];
            const startA = new Date(`1970-01-01T${currentBooking.time}`).getTime();
            const endA = startA + (currentBooking.duration || 0) * 60000;

            for(let j = 0; j < i; j++) {
                const existingBooking = serviceBookings[j];
                if (existingBooking.column === column) {
                    const startB = new Date(`1970-01-01T${existingBooking.time}`).getTime();
                    const endB = startB + (existingBooking.duration || 0) * 60000;
                    if (startA < endB && endA > startB) {
                        overlaps = true;
                        column++;
                        break;
                    }
                }
            }
        } while (overlaps);
        serviceBookings[i].column = column;
      }
      
      // Set totalColumns for each booking in the same time slot
      serviceBookings.forEach(booking => {
          const startA = new Date(`1970-01-01T${booking.time}`).getTime();
          const endA = startA + (booking.duration || 0) * 60000;

          const overlappingBookings = serviceBookings.filter(otherBooking => {
            const startB = new Date(`1970-01-01T${otherBooking.time}`).getTime();
            const endB = startB + (otherBooking.duration || 0) * 60000;
            return startA < endB && endA > startB;
          });
          booking.totalColumns = Math.max(1, ...overlappingBookings.map(b => b.column + 1));
      });


      return { ...mc, bookings: serviceBookings };
  });


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
      )
  }

  return (
    <div className="h-[calc(100vh-16rem)] overflow-auto scrollbar-hide">
      <div className="relative flex">
        {/* Time Column */}
        <div className="w-20 flex-shrink-0">
           <div className="h-[50px] sticky top-0 bg-background z-20"></div>
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
        <div className="flex-grow grid grid-cols-4">
          {distributedBookings.map(({ serviceId, bookings: serviceBookings }) => {
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
                {/* Bookings */}
                <div className="absolute top-[50px] inset-0">
                   {serviceBookings.map((booking) => {
                       const { top, height } = getBookingPosition(booking);
                       const width = `${100 / booking.totalColumns}%`;
                       const left = `${booking.column * (100 / booking.totalColumns)}%`;

                       return (
                         <div
                            key={booking.id}
                            className={cn(
                                'absolute p-2 rounded-lg border text-xs overflow-hidden',
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
                       )
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

    