
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { services as fallbackServices, type Service } from './services';

// This function can be called from Server Components
export async function getServices(): Promise<Service[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error.message);
    // In case of error (e.g., table not created yet), return the hardcoded fallback.
    // This allows the app to keep working before the DB is set up.
    return fallbackServices;
  }

  // If data is null or empty, it could mean the table is empty.
  // Return fallback data so the app has services to show.
  if (!data || data.length === 0) {
    return fallbackServices;
  }

  return data;
}
