
import { NextResponse } from 'next/server'
import { getSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler-client'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('[DEBUG] /api/auth/callback - Received request with code:', !!code);

  if (code) {
    const supabase = getSupabaseRouteHandlerClient()
    if (supabase) {
        try {
            await supabase.auth.exchangeCodeForSession(code)
            console.log('[DEBUG] /api/auth/callback - Session exchanged successfully.');
        } catch (error) {
            console.error('[DEBUG] /api/auth/callback - Error exchanging code for session:', error);
            // Optionally, redirect to an error page
            const errorUrl = requestUrl.origin + '/login?error=auth_failed'
            return NextResponse.redirect(errorUrl);
        }
    } else {
        console.error('[DEBUG] /api/auth/callback - Supabase client is undefined.');
    }
  } else {
    console.warn('[DEBUG] /api/auth/callback - No code found in request.');
  }

  // URL to redirect to after sign in process completes
  const redirectUrl = requestUrl.origin + '/profile';
  console.log('[DEBUG] /api/auth/callback - Redirecting to:', redirectUrl);
  return NextResponse.redirect(redirectUrl);
}
