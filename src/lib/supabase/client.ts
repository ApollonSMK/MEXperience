'use client';

import { createBrowserClient } from '@supabase/ssr'

// It's crucial to create a new client on every render.
// Avoid memoizing the client, which can lead to issues with session management.
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
