
import { getServices } from '@/lib/services-db';
import { HomeClient } from '@/components/home-client';
import { createClient } from '@/lib/supabase/server';
import type { Service } from '@/lib/services';

export default async function HomePage() {
  const services: Service[] = await getServices();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();
    initialProfile = profileData;
  }

  return <HomeClient initialServices={services} initialUser={user} initialProfile={initialProfile} />;
}
