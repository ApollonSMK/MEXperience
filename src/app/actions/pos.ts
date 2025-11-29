'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';

interface POSSaleData {
    amount: number;
    paymentMethod: string;
    userId?: string | null;
    type: 'gift_card';
    metadata?: any;
}

export async function processPOSSale(data: POSSaleData) {
    const supabase = await createSupabaseRouteClient();

    // 1. Verificar Permissão de Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return { success: false, error: 'Permission denied' };

    try {
        let resultItem;

        // 2. Criar o Item (Ex: Gift Card)
        if (data.type === 'gift_card') {
            const { code } = data.metadata;
            const { data: card, error: cardError } = await supabase
                .from('gift_cards')
                .insert({
                    code: code,
                    initial_balance: data.amount,
                    current_balance: data.amount,
                    recipient_id: data.userId || null,
                    status: 'active'
                })
                .select()
                .single();

            if (cardError) throw new Error(`Erro ao criar Gift Card: ${cardError.message}`);
            resultItem = card;
        }

        // 3. Gerar Fatura (Invoice)
        // Nota: Se userId for null e o banco exigir, isso vai falhar aqui se o SQL do passo 1 não for rodado.
        if (data.paymentMethod !== 'none') {
            const invoicePayload = {
                user_id: data.userId || null, // Se o banco exigir NOT NULL, isso falha se for null
                plan_title: data.type === 'gift_card' ? `Chèque Cadeau (${data.metadata.code})` : 'Venda Balcão',
                amount: data.amount,
                status: 'Pago',
                date: new Date().toISOString(),
                payment_method: data.paymentMethod // ADICIONADO: Salva o método real (cash, card, etc)
            };

            const { error: invError } = await supabase.from('invoices').insert(invoicePayload);
            
            if (invError) {
                // Se falhar na fatura, mas criou o cartão, é um estado inconsistente.
                // Idealmente usaríamos RPC/Transação, mas para manter simples:
                console.error("Invoice Error:", invError);
                // Não lançamos erro fatal para não perder o Gift Card já criado, mas avisamos.
                return { success: true, warning: "Cartão criado, mas erro ao gerar fatura (verifique permissões/SQL).", data: resultItem };
            }
        }

        revalidatePath('/admin/gift-cards');
        revalidatePath('/admin/invoicing');
        return { success: true, data: resultItem };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}