
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  // A verificação da sessão só é necessária para rotas que NÃO são o webhook.
  if (request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    // Se for o webhook, simplesmente continue sem fazer nada.
    return NextResponse.next();
  }

  // Para todas as outras rotas, prossiga com a lógica de autenticação do Supabase.
  const { supabase, response } = await createSupabaseMiddlewareClient(request);
  await supabase.auth.getSession();
  return response;
}

export const config = {
  // O 'matcher' garante que o middleware é executado em todas as rotas,
  // exceto em rotas estáticas e de sistema.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
