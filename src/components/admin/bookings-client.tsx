
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import type { Booking } from '@/app/admin/bookings/page';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const TuiCalendar = dynamic(
  () => import('./tui-calendar-wrapper').then((mod) => mod.TuiCalendarWrapper),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[calc(100vh-10rem)] w-full" />,
  }
);


export function BookingsClient({ bookings: initialBookings }: { bookings: Booking[] }) {
  const [bookings, setBookings] = React.useState(initialBookings);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
           // Re-fetch all data to ensure consistency
           // This is simpler and more robust than trying to manually patch the state
           router.refresh();
           toast({
              title: "Agendamentos Atualizados",
              description: "A lista de agendamentos foi atualizada.",
           });
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
  }, [toast, router]);


  if (!isClient) {
    return <Skeleton className="h-[calc(100vh-10rem)] w-full" />;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <TuiCalendar bookings={bookings} />
    </div>
  );
}
