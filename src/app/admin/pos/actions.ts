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
  userId: string | null; // Null se for 'Walk-in' / Cliente Anónimo
  items: POSItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'stripe_terminal';
}

export async function processPOSSale(data: POSSaleData) {
  const supabase = await createSupabaseRouteClient();

  try {
    // 1. Validar utilizador (se aplicável)
    let finalUserId = data.userId;
    
    // Se não tiver user, idealmente criaríamos um registro de "Venda Balcão" ou similar,
    // mas por enquanto vamos exigir um utilizador ou usar um ID de sistema se existir.
    // Para simplificar, se for null, não associamos a profile (o campo user_id na tabela invoices deve aceitar null ou ter um user genérico).
    
    if (!finalUserId) {
        // Opção: Buscar/Criar um user "Walk-in Guest"
        // Por agora, lançamos erro se o sistema exigir user. 
        // Assumindo que invoices.user_id é obrigatório:
        return { success: false, error: "Selecione um cliente para a venda." };
    }

    // 2. Criar a Fatura
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: finalUserId,
        amount: data.total,
        status: 'Pago',
        payment_method: data.paymentMethod,
        date: new Date().toISOString(),
        plan_title: `POS: ${data.items.map(i => i.title).join(', ')}`, // Resumo simples
        // Pode adicionar metadados JSON se sua tabela suportar
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 3. Processar Itens (Atribuir Minutos/Planos)
    for (const item of data.items) {
      if (item.type === 'plan' || item.type === 'pack') {
        const minutesToAdd = item.originalData?.minutes || 0;
        
        if (minutesToAdd > 0) {
            // Buscar saldo atual
            const { data: profile } = await supabase
                .from('profiles')
                .select('minutes_balance')
                .eq('id', finalUserId)
                .single();
            
            const currentBalance = profile?.minutes_balance || 0;
            
            // Atualizar saldo
            await supabase
                .from('profiles')
                .update({ 
                    minutes_balance: currentBalance + minutesToAdd,
                    // Se for plano, atualizar plan_id também
                    ...(item.type === 'plan' ? { plan_id: item.id } : {})
                })
                .eq('id', finalUserId);
        }
      }
      // Se for 'service', talvez criar um agendamento? 
      // Num POS rápido, geralmente é só venda. O agendamento seria feito na agenda.
      // Vamos assumir que venda de serviço aqui é "Pagar por um serviço avulso".
    }

    revalidatePath('/admin');
    revalidatePath('/admin/pos');
    
    return { success: true, invoiceId: invoice.id };

  } catch (error: any) {
    console.error('POS Error:', error);
    return { success: false, error: error.message };
  }
}