
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// This is the standard client for use in Server Components
export const createClient = (options: { admin?: boolean } = {}) => {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabaseOptions: { auth: { autoRefreshToken: boolean, persistSession: boolean, detectSessionInUrl?: boolean } } = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    }
  };

  if (options.admin) {
    supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Admin client should not persist sessions or manage auth state via cookies
    supabaseOptions.auth = {
      autoRefreshToken: false,
      persistSession: false
    };
  }

  if (!supabaseUrl || !supabaseKey) {
    const missingVar = !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : 
                       !supabaseKey ? (options.admin ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY") 
                       : "Supabase key";
    throw new Error(
      `Supabase variable ${missingVar} is missing. Make sure you have a .env.local file with all required Supabase variables.`
    );
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
            if (!supabaseOptions.auth.persistSession) return;
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            if (!supabaseOptions.auth.persistSession) return;
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
