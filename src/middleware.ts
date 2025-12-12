import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

export async function middleware(request: NextRequest) {
  // Use the dedicated middleware client
  const { supabase, response } = createMiddlewareClient(request)

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  await supabase.auth.getSession()

  // --- REFERRAL SYSTEM ---
  // Se o URL contém ?ref=CODE, guardamos num cookie para atribuição futura (mesmo que navegue)
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode) {
    // 1. Set Cookie
    response.cookies.set('referral_code', refCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      httpOnly: false, // Permitir acesso client-side se necessário
      sameSite: 'lax'
    })

    // 2. Track Click (Fire and forget, don't await to not slow down user)
    // We use a separate async IIFE to handle the insert without blocking response
    // Note: In Next.js Middleware (Edge), we must be careful. 
    // We can't fire-and-forget easily like Node. We will do a quick insert.
    // For high traffic, this should be moved to a dedicated API route or analytics service.
    // For now, it's fine.
    try {
       await supabase.from('referral_clicks').insert({
          referrer_code: refCode,
          user_agent: request.headers.get('user-agent'),
          // Simple privacy-friendly IP hash logic could go here, omitting for simplicity
       });
    } catch (err) {
       console.error("Error tracking referral click", err);
    }
  }

  return response
}

export const config = {
  // The matcher ensures that the middleware is executed on all routes,
  // except for static routes, system routes, and the Stripe webhook.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}