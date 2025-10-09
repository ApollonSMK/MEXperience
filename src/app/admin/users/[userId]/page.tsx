
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getServices } from '@/lib/services-db';
import { subDays, format } from 'date-fns';
import type { Profile } from '@/types/profile';
import { UserDetailsClient } from '@/components/admin/users/user-details-client';


type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

type PastBooking = {
  date: string;
  duration: number;
  service_id: string;
};

async function getUserData(userId: string) {
      const supabase = createClient({ admin: true });

      const profilePromise = supabase
        .from('profiles')
        .select(`*`)
        .eq('id', userId)
        .single();

      const userPromise = supabase.auth.admin.getUserById(userId);

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const pastBookingsPromise = supabase
        .from('bookings')
        .select('date, duration, service_id')
        .eq('user_id', userId)
        .eq('status', 'Confirmado')
        .gte('date', thirtyDaysAgo)
        .lte('date', today)
        .order('date', { ascending: false });

      const servicesPromise = getServices();

      const [
          { data: profileData, error: profileError },
          { data: userData, error: userError },
          { data: pastBookingsData, error: pastBookingsError },
          servicesData
      ] = await Promise.all([profilePromise, userPromise, pastBookingsPromise, servicesPromise]);

      if (profileError || !profileData || userError) {
          console.error("Error fetching user data for details page:", profileError || userError);
          notFound();
      }
      
      if (pastBookingsError) {
          console.error("Error fetching past bookings for details page:", pastBookingsError);
      }

      const combinedProfile: Profile = {
        ...profileData,
        created_at: userData.user?.created_at || profileData.created_at,
        email: userData.user?.email || profileData.email,
      };

      return {
          profile: combinedProfile,
          pastBookings: (pastBookingsData || []) as PastBooking[],
          services: servicesData
      }
}

// This is now a Server Component
export default async function UserProfileAdminPage(props: UserPageProps) {
  const { params } = await props;
  const { profile, pastBookings, services } = await getUserData(params.userId);

  return <UserDetailsClient profile={profile} pastBookings={pastBookings} services={services} />;
}
