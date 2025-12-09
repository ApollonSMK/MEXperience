import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';
import { getSupabaseBrowserClient } from '@/lib/supabase/client'; // Atenção: Em rotas de API, idealmente usamos createClient do @supabase/supabase-js ou server client
import { createClient } from '@supabase/supabase-js';

// Usando createClient direto para evitar problemas de contexto de rota, já que é uma admin action
// Em produção real, você deve verificar a sessão do admin aqui.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

export async function POST(request: Request) {
  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar detalhes do cartão e do usuário
    const { data: card, error } = await supabase
        .from('gift_cards')
        .select('*, recipient:profiles(email, display_name)')
        .eq('id', cardId)
        .single();

    if (error || !card) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    if (!card.recipient?.email) {
        return NextResponse.json({ error: 'Gift card has no recipient email' }, { status: 400 });
    }

    // Enviar Email
    await sendEmail({
        type: 'gift_card',
        to: card.recipient.email,
        data: {
            userName: card.recipient.display_name,
            giftCode: card.code,
            giftAmount: card.initial_balance
        }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error sending gift card email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}