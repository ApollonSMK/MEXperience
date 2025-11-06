
'use server'

import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseRouteHandlerClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient({
    cookies: () => cookieStore,
  });
}
