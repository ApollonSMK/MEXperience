'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';

export interface POSItem {
  id: string;
  title: string;
  price: number;
  type: 'service' | 'plan' | 'pack' | 'product';
  originalData?: any;
}

export interface POSSaleData {
  userId: string | null;
  items: POSItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'stripe_terminal' | 'gift_card' | 'minutes';
  giftCardId?: string; // Optional: ID if paying with Gift Card
  minutesToDeduct?: number; // Optional: Amount to deduct if paying with minutes
}

export async function processPOSSale(data: POSSaleData) {
  const supabase = await createSupabaseRouteClient();

  try {
    let finalUserId = data.userId;
    
    // Validar User se pagamento requer conta (Minutes) ou se desejável
    if (!finalUserId && data.paymentMethod === 'minutes') {
         return { success: false, error: "Le client doit être identifié pour payer avec des minutes." };
    }
    
    if (!finalUserId && !['cash', 'card', 'stripe_terminal'].includes(data.paymentMethod)) {
         // Para Gift Card, teoricamente pode ser anônimo se tiver o código físico, 
         // mas vamos exigir user para manter histórico por enquanto, ou permitir se giftCardId for passado.
         // Vamos manter simples: Exigir user para tudo exceto Cash/Card simples.
    }

    // 1. Processar Pagamento (Deduções)
    if (data.paymentMethod === 'gift_card') {
        if (!data.giftCardId) return { success: false, error: "ID de la carte cadeau manquant." };
        
        const { data: giftCard } = await supabase.from('gift_cards').select('*').eq('id', data.giftCardId).single();
        if (!giftCard) return { success: false, error: "Carte cadeau introuvable." };
        
        if (giftCard.current_balance < data.total) {
             return { success: false, error: "Solde de la carte cadeau insuffisant." };
        }

        const newBalance = giftCard.current_balance - data.total;
        const status = newBalance <= 0.01 ? 'used' : 'active';
        
        const { error: gcError } = await supabase
            .from('gift_cards')
            .update({ current_balance: newBalance, status })
            .eq('id', data.giftCardId);
            
        if (gcError) throw gcError;
    }
    else if (data.paymentMethod === 'minutes') {
        if (!data.minutesToDeduct || data.minutesToDeduct <= 0) return { success: false, error: "Montant en minutes invalide." };
        if (!finalUserId) return { success: false, error: "Utilisateur requis." };

        const { data: profile } = await supabase.from('profiles').select('minutes_balance').eq('id', finalUserId).single();
        if (!profile || (profile.minutes_balance || 0) < data.minutesToDeduct) {
            return { success: false, error: "Solde de minutes insuffisant." };
        }

        const { error: minError } = await supabase
            .from('profiles')
            .update({ minutes_balance: (profile.minutes_balance || 0) - data.minutesToDeduct })
            .eq('id', finalUserId);
            
        if (minError) throw minError;
    }

    // 2. Criar a Fatura
    // Construir descrição
    let description = `POS: ${data.items.map(i => i.title).join(', ')}`;
    if (data.discount > 0) description += ` | Remise: -${data.discount.toFixed(2)}€`;
    if (data.paymentMethod === 'gift_card') description += ` | Payé par Carte Cadeau`;
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: finalUserId, // Pode ser null
        amount: data.total,
        status: 'Pago',
        payment_method: data.paymentMethod,
        date: new Date().toISOString(),
        plan_title: description,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 3. Processar Itens (Atribuir Minutos/Planos comprados)
    for (const item of data.items) {
      if (item.type === 'plan' || item.type === 'pack') {
        const minutesToAdd = item.originalData?.minutes || 0;
        
        // Só atribuir se tiver user
        if (minutesToAdd > 0 && finalUserId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('minutes_balance')
                .eq('id', finalUserId)
                .single();
            
            const currentBalance = profile?.minutes_balance || 0;
            
            await supabase
                .from('profiles')
                .update({ 
                    minutes_balance: currentBalance + minutesToAdd,
                    ...(item.type === 'plan' ? { plan_id: item.id } : {})
                })
                .eq('id', finalUserId);
        }
      }
    }

    revalidatePath('/admin');
    revalidatePath('/admin/pos');
    
    return { success: true, invoiceId: invoice.id };

  } catch (error: any) {
    console.error('POS Error:', error);
    return { success: false, error: error.message };
  }
}