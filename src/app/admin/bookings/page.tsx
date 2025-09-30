
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BookingsClient } from '@/components/admin/bookings-client';
import { parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cookies } from 'next/headers';
import { BackButton } from '@/components/back-button';

export type Booking = {
  id: number;
  created_at: string;
  user_id: string;
  service_id: string;
  date: string;
  time: string;
  status: string;
  name: string | null;
  email: string | null;
  duration: number | null;
  bookingDate: Date;
};

async function getBookings() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  // Combine date and time and parse it
  return data.map((booking) => ({
    ...booking,
    bookingDate: parseISO(`${booking.date}T${booking.time}`),
  }));
}

export default async function AdminBookingsPage() {
  const bookings = (await getBookings()) as Booking[];

  return (
    <>
      <BackButton />
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-bold text-primary">
            Gerir Agendamentos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visualize, confirme e gira todos os agendamentos dos seus clientes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos os Agendamentos</CardTitle>
            <CardDescription>
              Uma lista completa de agendamentos futuros e passados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsClient bookings={bookings} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
