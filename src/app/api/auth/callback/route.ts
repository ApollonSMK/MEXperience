
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('[DEBUG] /api/auth/callback - Received request with code:', !!code);

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
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
    console.warn('[DEBUG] /api/auth/callback - No code found in request.');
  }

  // URL to redirect to after sign in process completes
  const redirectUrl = requestUrl.origin + '/profile';
  console.log('[DEBUG] /api/auth/callback - Redirecting to:', redirectUrl);
  return NextResponse.redirect(redirectUrl);
}
