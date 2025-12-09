'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/email-service';
import { revalidatePath } from 'next/cache';

// --- Type Definitions ---
export interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  metadata: any;
  created_at: string;
  recipient_id?: string;
  buyer_id?: string;
  type: 'gift_card' | 'promo_code';
}

// --- Helper: Generate Code ---
function generateRandomCode(prefix = 'GIFT') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = `${prefix}-`;
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// --- Action 1: Validate Gift Card (Used by Appointment Scheduler) ---
export async function validateGiftCard(code: string) {
    const supabase = await createSupabaseRouteClient();
    
    if (!code) return { success: false, error: 'Code manquant.' };

    const normalizedCode = code.toUpperCase().trim();

    const { data: card, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', normalizedCode)
        .single();

    if (error || !card) {
        return { success: false, error: 'Code invalide ou introuvable.' };
    }

    if (card.status !== 'active') {
        return { success: false, error: 'Ce code n\'est plus actif.' };
    }

    if (card.current_balance <= 0) {
        return { success: false, error: 'Solde épuisé.' };
    }

    return { success: true, data: card as GiftCard };
}

// --- Action 2: Create Gift Card (Used by Admin) ---
export async function createGiftCard(params: {
    amount: number;
    paymentMethod: 'cash' | 'card' | 'stripe_terminal' | 'none';
    userId?: string;
    code?: string;
    type?: 'gift_card' | 'promo_code';
    metadata?: any;
}) {
    const supabase = await createSupabaseRouteClient();
    
    const { amount, paymentMethod, userId, code, type = 'gift_card', metadata = {} } = params;

    const finalCode = code || generateRandomCode();

    const insertData: any = {
        code: finalCode,
        initial_balance: amount,
        current_balance: amount,
        status: 'active',
        type: type,
        metadata: {
            ...metadata,
            payment_method: paymentMethod,
            created_by: 'admin'
        }
    };

    // If a user is selected, we link it. 
    // Assuming 'recipient_id' is the column for the owner/recipient in your schema
    if (userId) {
        insertData.recipient_id = userId;
    }

    const { data, error } = await supabase
        .from('gift_cards')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Create Gift Card Error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/gift-cards');
    return { success: true, giftCardId: data.id };
}

// --- Action 3: Verify & Create after Payment (Used by Checkout Return) ---
export async function verifyAndCreateGiftCard(paymentIntentId: string) {
    console.log("Verifying Gift Card for PI:", paymentIntentId);
    const supabase = await createSupabaseRouteClient();
    const stripe = getStripe(process.env.STRIPE_SECRET_KEY!);

    try {
        // 1. Check if card already exists (Improved Query)
        // Using .contains is often more reliable for JSONB fields than arrow operators in client libs
        const { data: existingCard } = await supabase
            .from('gift_cards')
            .select('*')
            .contains('metadata', { stripe_payment_intent: paymentIntentId })
            .maybeSingle(); // Use maybeSingle to avoid errors if 0 rows

        if (existingCard) {
            console.log(`[GiftCard] Found existing card ${existingCard.code} for PI ${paymentIntentId}`);
            return { success: true, code: existingCard.code, alreadyExists: true };
        }

        // 2. Retrieve from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return { success: false, error: 'Payment not successful' };
        }

        const metadata = paymentIntent.metadata;
        if (metadata.type !== 'gift_card') {
            return { success: false, error: 'Not a gift card payment' };
        }
        
        // DOUBLE CHECK: Race condition check
        // Sometimes webhook might have created it milliseconds ago while we were fetching Stripe
        const { data: doubleCheck } = await supabase
            .from('gift_cards')
            .select('*')
            .contains('metadata', { stripe_payment_intent: paymentIntentId })
            .maybeSingle();
            
        if (doubleCheck) {
             console.log(`[GiftCard] Found existing card ${doubleCheck.code} on double check.`);
             return { success: true, code: doubleCheck.code, alreadyExists: true };
        }

        // 3. Create the Gift Card
        const { from_name, to_name, recipient_email, message, buyer_id } = metadata;
        const amount = paymentIntent.amount / 100;
        const giftCode = generateRandomCode();

        const insertData: any = {
            code: giftCode,
            initial_balance: amount,
            current_balance: amount,
            metadata: {
                from_name,
                to_name,
                message,
                stripe_payment_intent: paymentIntent.id,
                recipient_email 
            },
            status: 'active',
            type: 'gift_card'
        };

        if (buyer_id) {
            insertData.buyer_id = buyer_id;
        }

        const { error: insertError } = await supabase.from('gift_cards').insert(insertData);

        if (insertError) {
            console.error("Error creating gift card:", insertError);
            return { success: false, error: 'Database error creating card' };
        }

        // --- NEW: Create Invoice ---
        if (buyer_id) {
            const invoiceData = {
                id: paymentIntent.id,
                user_id: buyer_id,
                plan_title: `Carte Cadeau - ${to_name || 'Ami'}`,
                date: new Date(paymentIntent.created * 1000).toISOString(),
                amount: amount,
                status: 'Pago',
                payment_method: 'online'
            };
            
            // We use upsert to avoid conflicts if webhook ran simultaneously
            const { error: invoiceError } = await supabase.from('invoices').upsert(invoiceData, { onConflict: 'id' });
            
            if (invoiceError) {
                console.error("Error creating invoice for gift card:", invoiceError);
                // Non-blocking error
            }
        }

        // 4. Send Email
        if (recipient_email) {
            try {
                await sendEmail({
                    type: 'gift_card',
                    to: recipient_email,
                    data: {
                        userName: to_name,
                        giftAmount: amount,
                        giftCode: giftCode,
                        fromName: from_name,
                        message: message
                    }
                });
            } catch (e) {
                console.error("Email failed:", e);
            }
        }

        revalidatePath('/profile/gift-cards');
        return { success: true, code: giftCode, isNew: true };

    } catch (error: any) {
        console.error("Exception in verifyAndCreateGiftCard:", error);
        return { success: false, error: error.message };
    }
}