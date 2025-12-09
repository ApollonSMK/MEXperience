import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    console.log(`[API Email] Recebido pedido de envio. Tipo: ${type}, Para: ${to}`);
    console.log(`[API Email] Dados:`, JSON.stringify(data, null, 2));

    if (!type || !to || !data) {
      console.error('[API Email] Parâmetros ausentes.');
      return NextResponse.json({ error: 'Parâmetros ausentes: type, to, e data são obrigatórios.' }, { status: 400 });
    }

    const result = await sendEmail({ type, to, data });
    
    console.log(`[API Email] Resultado do envio:`, result);
    return NextResponse.json({ message: 'E-mail enviado com sucesso.', id: result?.id });
  } catch (error: any) {
    console.error('[API Email] Erro CRÍTICO na API de envio de e-mail:', error);
    return NextResponse.json({ 
        error: error.message || 'Ocorreu um erro no servidor.',
        details: error.stack
    }, { status: 500 });
  }
}