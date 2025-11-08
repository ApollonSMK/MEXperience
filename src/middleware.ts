import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  // Ignora o webhook do Stripe
  if (request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    return NextResponse.next();
  }

  const supabase = createSupabaseMiddlewareClient();
  const { data: { session } } = await supabase.auth.getSession();
  const response = NextResponse.next();

  // As rotas de admin são protegidas
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Redireciona para o login se não houver sessão e tentar aceder ao admin
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // As rotas de perfil são protegidas
  if (request.nextUrl.pathname.startsWith('/profile')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  // O 'matcher' garante que o middleware é executado em todas as rotas,
  // exceto em rotas estáticas e de sistema.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
