
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = (options?: any) => {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // A lógica foi simplificada e corrigida.
  // Se 'persistSession' for explicitamente false, usamos a chave de serviço (admin).
  // Caso contrário, usamos a chave anónima pública (utilizador normal).
  const supabaseKey = options?.auth?.persistSession === false 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missingVar = !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : 
                       !supabaseKey ? (options?.auth?.persistSession === false ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY") 
                       : "Supabase key";
    throw new Error(
      `Supabase variable ${missingVar} is missing. Make sure you have a .env.local file with all required Supabase variables.`
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      ...options,
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
