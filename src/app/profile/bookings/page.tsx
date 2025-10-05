
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserBookings, type UserBooking } from '@/components/profile/user-bookings';
import { BookingModal } from '@/components/booking-modal';
import { Button } from '@/components/ui/button';
import { getServices } from '@/lib/services-db';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { BackButton } from '@/components/back-button';

async function getPageData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const servicesPromise = getServices();
  const bookingsPromise = supabase
    .from('bookings')
    .select('id, date, time, service_id, status, duration')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  const [services, { data: bookingsData, error: bookingsError }] = await Promise.all([servicesPromise, bookingsPromise]);


  if (bookingsError) {
    console.error('Error fetching user bookings:', bookingsError);
    return { bookings: [], services: [] };
  }

  const sanitizedBookings = bookingsData.map(b => ({...b, time: b.time || "00:00:00"})) as UserBooking[];

  return { bookings: sanitizedBookings, services };
}

export default async function BookingsPage() {
  const { bookings, services } = await getPageData();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <BackButton />
      <Card>
        <CardHeader>
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="w-8 h-8 text-accent" />
                <div>
                  <CardTitle className="font-headline text-2xl text-primary">
                    Meus Agendamentos
                  </CardTitle>
                  <CardDescription>
                    Veja e gira as suas sessões futuras e passadas.
                  </CardDescription>
                </div>
              </div>
               <BookingModal services={services}>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Agendar Novo Serviço
                </Button>
            </BookingModal>
          </div>
        </CardHeader>
        <UserBookings bookings={bookings} services={services} />
      </Card>
    </div>
  );
}
