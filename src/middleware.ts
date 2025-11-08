
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createSupabaseMiddlewareClient(request);

  // A verificação da sessão só é necessária para rotas que NÃO são o webhook.
  if (!request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    // Atualiza a sessão do utilizador se necessário.
    await supabase.auth.getSession();
  }

  // Retorna a resposta, que agora conterá os cookies de sessão atualizados se aplicável,
  // ou simplesmente continuará o fluxo para o webhook.
  return response;
}

export const config = {
  // O 'matcher' garante que o middleware é executado em todas as rotas,
  // exceto em rotas estáticas e de sistema.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
