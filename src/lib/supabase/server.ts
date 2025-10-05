
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// Admin client creation is now part of this file.
// We pass an 'isAdmin' flag to determine which key to use.
export const createClient = (options: { auth?: { persistSession: boolean } } = {}) => {
  const cookieStore = cookies();

  const supabaseKey = options.auth?.persistSession === false
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !supabaseKey) {
    const missingVar = !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : 
                       !supabaseKey ? (options.auth?.persistSession === false ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY") 
                       : "Supabase key";
    throw new Error(
      `Supabase variable ${missingVar} is missing. Make sure you have a .env.local file with all required Supabase variables.`
    );
  }

  // The options object is now dynamically created inside the function.
  const supabaseOptions = {
      auth: {
        autoRefreshToken: options.auth?.persistSession !== false,
        persistSession: options.auth?.persistSession !== false,
        detectSessionInUrl: options.auth?.persistSession !== false,
      },
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      ...supabaseOptions,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
