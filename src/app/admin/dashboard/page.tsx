
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import type { Booking } from '@/types/booking';

async function getDashboardData() {
    const supabase = createClient({ auth: { persistSession: false } });

    // 1. Get stats
    const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: bookingCount, error: bookingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Confirmado');
    
    // 2. Get upcoming appointments
    const today = new Date().toISOString().split('T')[0];
    const upcomingPromise = supabase
        .rpc('get_all_bookings_with_details', { 
            start_date: today, 
            end_date: format(new Date(2099, 1, 1), 'yyyy-MM-dd')
        })
        .in('status', ['Confirmado', 'Pendente'])
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(3);

    // 3. Get data for activity chart (last 14 days)
    const fourteenDaysAgo = subDays(new Date(), 13);
    const dateRange = eachDayOfInterval({ start: fourteenDaysAgo, end: new Date() });

    const activityPromise = supabase
        .from('bookings')
        .select('date, id')
        .gte('date', format(fourteenDaysAgo, 'yyyy-MM-dd'))
        .lte('date', format(new Date(), 'yyyy-MM-dd'))
        .eq('status', 'Confirmado');
        

    const [
        { data: upcomingData, error: upcomingError },
        { data: activityData, error: activityError }
    ] = await Promise.all([upcomingPromise, activityPromise]);


    if (userError) console.error("Error fetching user count:", userError);
    if (bookingError) console.error("Error fetching booking count:", bookingError);
    if (upcomingError) console.error("Error fetching upcoming appointments:", upcomingError);
    if (activityError) console.error("Error fetching activity data:", activityError);

    // Process activity data
    const bookingsByDay = (activityData || []).reduce((acc: Record<string, number>, booking) => {
        const day = format(new Date(booking.date), 'dd/MM');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});

    const chartData = dateRange.map(date => {
        const dayKey = format(date, 'dd/MM');
        return {
            date: dayKey,
            bookings: bookingsByDay[dayKey] || 0,
        }
    });

    const stats = {
        totalUsers: userCount || 0,
        totalBookings: bookingCount || 0,
    }

    return {
        stats,
        upcomingBookings: (upcomingData || []) as Booking[],
        chartData,
    };
}


export default async function AdminDashboardPage() {
  const { stats, upcomingBookings, chartData } = await getDashboardData();

  return (
    <DashboardClient 
        stats={stats}
        upcomingBookings={upcomingBookings}
        chartData={chartData}
    />
  );
}
