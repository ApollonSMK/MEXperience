'use client';

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  // Only initialize the client if the env vars are set.
  // This prevents build errors when the vars are not present.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    client = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    );
    return client;
  }
  
  // Return undefined or a mock/dummy client if you need to handle cases
  // where the client cannot be initialized. For many components, checking
  // for an undefined client is sufficient.
  return undefined;
}
