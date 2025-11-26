'use server';

import { createSupabaseRouteClient } from "@/lib/supabase/route-handler-client";

export interface GiftCard {
    id: string; // The UUID
    code: string; // The gift card code
    initial_balance: number;
    current_balance: number;
    status: 'active' | 'used' | 'expired' | 'cancelled';
    created_at: string;
    expires_at?: string;
}

export async function validateGiftCard(code: string): Promise<{ success: boolean; data?: GiftCard; error?: string }> {
    if (!code) {
        return { success: false, error: "Le code ne peut pas être vide." };
    }

    const supabase = await createSupabaseRouteClient();

    try {
        const { data, error } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('code', code.trim().toUpperCase())
            .single();

        if (error || !data) {
            return { success: false, error: "Code de chèque cadeau invalide ou non trouvé." };
        }

        if (data.status !== 'active') {
            return { success: false, error: "Ce chèque cadeau n'est plus valide." };
        }

        if (data.current_balance <= 0) {
            return { success: false, error: "Ce chèque cadeau n'a plus de solde." };
        }
        
        // Optional: Check for expiry date if you have one
        // if (data.expires_at && new Date(data.expires_at) < new Date()) {
        //     return { success: false, error: "Ce chèque cadeau a expiré." };
        // }

        return { success: true, data: data as GiftCard };

    } catch (e: any) {
        console.error("Error validating gift card:", e);
        return { success: false, error: "Une erreur est survenue lors de la validation du code." };
    }
}