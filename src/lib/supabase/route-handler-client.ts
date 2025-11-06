
'use server'

import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function getSupabaseRouteHandlerClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient({
    cookies: () => cookieStore,
  });
}
