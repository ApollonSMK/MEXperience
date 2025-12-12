import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const referralCode = requestUrl.searchParams.get('ref') // Capture referral code

  console.log('[DEBUG] /api/auth/callback - Received request with code:', !!code);

  if (code) {
    const supabase = await createSupabaseRouteClient();
    try {
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) throw error;
        
        console.log('[DEBUG] /api/auth/callback - Session exchanged successfully.');

        // --- REFERRAL HANDLING ---
        if (session?.user && referralCode) {
            console.log(`[Callback] Linking user ${session.user.id} to referrer ${referralCode}`);
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            await supabaseAdmin
                .from('profiles')
                .update({ referred_by: referralCode })
                .eq('id', session.user.id);
        }
        // -------------------------

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