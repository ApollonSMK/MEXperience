import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware-client'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const { data: { session } } = await supabase.auth.getSession()

  // URL to redirect to after sign in process completes
  const redirectUrl = request.nextUrl.clone()

  // Protected routes
  const protectedPaths = ['/admin', '/profile', '/checkout', '/agendar']

  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  // O matcher garante que o middleware é executado em todas as rotas,
  // exceto em rotas estáticas, de sistema e no webhook do Stripe.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
