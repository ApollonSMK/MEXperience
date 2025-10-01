
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import { UserBookings, type UserBooking } from '@/components/profile/user-bookings';

async function getBookings() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, date, time, service_id, status, duration')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }

  return data as UserBooking[];
}

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <BackButton />
      <Card>
        <CardHeader>
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
        </CardHeader>
        <UserBookings bookings={bookings} />
      </Card>
    </div>
  );
}
