import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to || !data) {
      return NextResponse.json({ error: 'Parâmetros ausentes: type, to, e data são obrigatórios.' }, { status: 400 });
    }

    await sendEmail({ type, to, data });

    return NextResponse.json({ message: 'E-mail enviado com sucesso.' });
  } catch (error: any) {
    console.error('Erro na API de envio de e-mail:', error);
    return NextResponse.json({ error: error.message || 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}