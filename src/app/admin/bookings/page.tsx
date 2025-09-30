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
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
      <Button asChild variant="outline" className="mb-4">
        <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Link>
      </Button>
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
    </>
  );
}
