import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  // Esta abordagem garante que o cliente e a resposta do Supabase são sempre criados,
  // mas a lógica de autenticação (getSession) só é executada condicionalmente.
  
  const { supabase, response } = await createSupabaseMiddlewareClient(request);

  // A verificação da sessão só é necessária para rotas que NÃO são o webhook do Stripe.
  if (!request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    // Para todas as outras rotas, prossiga com a lógica de autenticação do Supabase.
    await supabase.auth.getSession();
  }

  // Retorna a resposta, que pode ter sido modificada pelo Supabase (com cookies de sessão)
  // ou permanece inalterada para a rota do webhook.
  return response;
}

export const config = {
  // O 'matcher' garante que o middleware é executado em todas as rotas,
  // exceto em rotas estáticas e de sistema.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
