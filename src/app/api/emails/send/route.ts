import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    console.log(`[API Email] Recebido pedido de envio. Tipo: ${type}, Para: ${to}`);

    if (!type || !to || !data) {
      console.error('[API Email] Parâmetros ausentes.');
      return NextResponse.json({ error: 'Parâmetros ausentes: type, to, e data são obrigatórios.' }, { status: 400 });
    }

    await sendEmail({ type, to, data });
    
    console.log(`[API Email] E-mail enviado com sucesso para ${to}`);
    return NextResponse.json({ message: 'E-mail enviado com sucesso.' });
  } catch (error: any) {
    console.error('[API Email] Erro na API de envio de e-mail:', error);
    return NextResponse.json({ error: error.message || 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}