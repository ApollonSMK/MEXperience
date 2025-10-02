'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

import type { Booking } from '@/app/admin/bookings/page';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { createClient } from '@/lib/supabase/client';

const BookingsCalendar = dynamic(
  () => import('./admin-calendar-view').then(mod => mod.BookingsCalendar),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[calc(100vh-10rem)] w-full" />,
  }
);


export function BookingsClient({ bookings: initialBookings }: { bookings: Booking[] }) {
  const [bookings, setBookings] = React.useState(initialBookings);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);
  
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('bookings-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBooking = payload.new as Booking;
            setBookings(currentBookings => {
                const updatedBookings = [newBooking, ...currentBookings];
                updatedBookings.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (dateA !== dateB) return dateB - dateA;
                    
                    const timeA = a.time.split(':').map(Number);
                    const timeB = b.time.split(':').map(Number);
                    if (timeA[0] !== timeB[0]) return timeB[0] - timeA[0];
                    if (timeA[1] !== timeB[1]) return timeB[1] - timeA[1];
                    return (timeB[2] || 0) - (timeA[2] || 0);
                });
                return updatedBookings;
            });
            toast({
              title: "Novo Agendamento!",
              description: `Um novo agendamento para ${newBooking.name} foi criado.`,
            });
          } else if (payload.eventType === 'UPDATE') {
             const updatedBooking = payload.new as Booking;
             setBookings(currentBookings => 
                currentBookings.map(b => 
                    b.id === updatedBooking.id ? updatedBooking : b
                )
             );
          } else if (payload.eventType === 'DELETE') {
             const deletedBookingId = payload.old.id;
             setBookings(currentBookings => 
                currentBookings.filter(b => b.id !== deletedBookingId)
             );
          }
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
  }, [toast]);


  if (!isClient) {
    return <Skeleton className="h-[calc(100vh-10rem)] w-full" />;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <BookingsCalendar bookings={bookings} />
    </div>
  );
}
