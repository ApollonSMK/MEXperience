'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { revalidatePath } from 'next/cache';

// Função auxiliar para gerar códigos únicos (ex: GIFT-ABCD-1234)
function generateGiftCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 1, 0 para evitar confusão
    let result = '';
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) result += '-';
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function createResellerGiftCard(amount: number) {
    const supabase = await createSupabaseRouteClient();
    
    // 1. Verificar Autenticação e Permissão
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        console.error("Reseller Create Card Auth Error:", authError);
        throw new Error("Non autorisé - Veuillez vous reconnecter");
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_reseller')
        .eq('id', user.id)
        .single();

    if (!profile?.is_reseller) throw new Error("Accès revendeur refusé");

    // 2. Gerar Código
    const code = generateGiftCode();

    // 3. Inserir no Banco
    // Nota: O buyer_id é o revendedor. O recipient é null pois é um cartão ao portador (físico/impresso).
    const { error } = await supabase.from('gift_cards').insert({
        code: code,
        initial_balance: amount,
        current_balance: amount,
        buyer_id: user.id,
        status: 'active',
        metadata: {
            source: 'reseller_console',
            created_by_email: user.email,
            to_name: 'Porteur', // Genérico
            from_name: 'Revendeur',
            message: 'Achat en boutique'
        }
    });

    if (error) {
        console.error('Error creating reseller card:', error);
        throw new Error("Erreur lors de la création de la carte");
    }

    revalidatePath('/profile/reseller');
    return { success: true, code, amount };
}

export async function getResellerStats() {
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        console.error("Reseller Stats Auth Error:", authError);
        throw new Error("Non autorisé - Veuillez vous reconnecter");
    }

    // Buscar todos os cartões gerados por este revendedor
    const { data: cards, error } = await supabase
        .from('gift_cards')
        .select('id, created_at, initial_balance, current_balance, status, code')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw new Error("Erreur de chargement des données");

    const totalSold = cards.reduce((acc, card) => acc + card.initial_balance, 0);
    const totalCards = cards.length;
    
    // Preparar dados para o gráfico (agrupado por dia, últimos 30 dias simplificado)
    // No frontend podemos processar melhor, aqui retornamos raw data
    
    return {
        cards,
        stats: {
            totalSold,
            totalCards
        }
    };
}