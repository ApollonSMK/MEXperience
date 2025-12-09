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
  total: number;
  paymentMethod: 'cash' | 'card' | 'stripe_terminal';
}

export async function processPOSSale(data: POSSaleData) {
  const supabase = await createSupabaseRouteClient();

  try {
    let finalUserId = data.userId;
    
    if (!finalUserId) {
        return { success: false, error: "Selecione um cliente para a venda." };
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: finalUserId,
        amount: data.total,
        status: 'Pago',
        payment_method: data.paymentMethod,
        date: new Date().toISOString(),
        plan_title: `POS: ${data.items.map(i => i.title).join(', ')}`,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    for (const item of data.items) {
      if (item.type === 'plan' || item.type === 'pack') {
        const minutesToAdd = item.originalData?.minutes || 0;
        
        if (minutesToAdd > 0) {
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