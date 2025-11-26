'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

async function verifyAdmin() {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Authentication required.');
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
    
    if (error || !profile?.is_admin) {
        throw new Error('Administrator access required.');
    }
}

async function getStripeAdminClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error('Stripe secret key is not configured.');
    }
    return getStripe(secretKey);
}

async function getAdminSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase service role key is not configured.');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}


export async function getAllUsers() {
    await verifyAdmin();
    const supabaseAdmin = await getAdminSupabaseClient();
    const stripe = await getStripeAdminClient();
    
    // Busca usuários e também os metadados de autenticação
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*');

    if (error) {
        console.error("Error fetching all users with admin client:", error);
        throw new Error('Failed to fetch users.');
    }
    
    if (!profiles) {
        return [];
    }

    // Augment profiles with Stripe subscription data
    const augmentedProfiles = await Promise.all(
        profiles.map(async (profile) => {
            if (profile.stripe_subscription_id) {
                try {
                    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
                    return {
                        ...profile,
                        subscription_start_date: subscription.current_period_start,
                        subscription_end_date: subscription.current_period_end,
                        stripe_cancel_at_period_end: subscription.cancel_at_period_end,
                    };
                } catch (stripeError: any) {
                    console.warn(`Could not fetch Stripe subscription ${profile.stripe_subscription_id} for user ${profile.id}: ${stripeError.message}`);
                    // Return profile as is, so the user still shows up in the list
                    return profile;
                }
            }
            return profile;
        })
    );
    
    return augmentedProfiles || [];
}

export async function getPlans() {
    await verifyAdmin();
    const supabaseAdmin = await getAdminSupabaseClient();
    const { data: plans, error } = await supabaseAdmin.from('plans').select('id, title, price, minutes');
    
    if (error) {
        console.error("Error fetching plans with admin client:", error);
        throw new Error('Failed to fetch plans.');
    }

    return plans || [];
}


export async function getUserById(userId: string) {
    try {
        await verifyAdmin();
        const supabaseAdmin = await getAdminSupabaseClient();
        
        const userPromise = supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
        // Ordenar agendamentos do mais recente para o mais antigo
        const appointmentsPromise = supabaseAdmin.from('appointments').select('*').eq('user_id', userId).order('date', { ascending: false });
        const plansPromise = supabaseAdmin.from('plans').select('*').order('order');
        
        // Buscar Gift Cards associados a este user
        const giftCardsPromise = supabaseAdmin.from('gift_cards').select('*').eq('recipient_id', userId).order('created_at', { ascending: false });

        // Buscar Faturas (Histórico de compras Stripe/Assinaturas)
        const invoicesPromise = supabaseAdmin.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });

        const [
            { data: user, error: userError }, 
            { data: appointments, error: appointmentsError },
            { data: plans, error: plansError },
            { data: giftCards, error: giftCardsError },
            { data: invoices, error: invoicesError }
        ] = await Promise.all([userPromise, appointmentsPromise, plansPromise, giftCardsPromise, invoicesPromise]);

        if (userError) {
            if (userError.code === 'PGRST116') throw new Error('Utilizador não encontrado.');
            throw userError;
        }

        if (appointmentsError) throw appointmentsError;
        if (plansError) throw plansError;
        
        // Calcular Total Gasto (LTV)
        // Soma de Invoices (Stripe) + Agendamentos pagos manualmente (Recepção/Dinheiro)
        // Nota: Isto é uma aproximação. Idealmente, todos os pagamentos manuais deveriam gerar um registo na tabela invoices.
        // Por agora, assumimos que invoices cobre stripe e appointments cobre manual se status concluido.
        
        let totalSpent = 0;

        // Somar invoices (Pagos)
        invoices?.forEach((inv: any) => {
            if (inv.status === 'Pago' || inv.status === 'paid') {
                totalSpent += Number(inv.amount || 0);
            }
        });

        // Somar agendamentos pagos na recepção (para não duplicar com stripe se tiverem invoice)
        // Assumimos aqui que se está em 'appointments' e pago como 'reception', conta para o total.
        // Se a lógica de negócio mudar (ex: tudo gera invoice), ajustamos aqui.
        
        return { 
            user, 
            appointments: appointments || [], 
            plans: plans || [], 
            giftCards: giftCards || [],
            invoices: invoices || [],
            stats: {
                totalSpent: totalSpent,
                totalAppointments: appointments?.length || 0,
                completedAppointments: appointments?.filter((a: any) => a.status === 'Concluído').length || 0,
                cancelledAppointments: appointments?.filter((a: any) => a.status === 'Cancelado').length || 0
            },
            error: null 
        };

    } catch (error: any) {
        console.error(`[Server Action Error] getUserById(${userId}):`, error.message);
        return { user: null, appointments: [], plans: [], giftCards: [], invoices: [], stats: null, error: error.message };
    }
}


export async function updateUser(userId: string, dataToUpdate: any) {
    try {
        await verifyAdmin();
        const supabaseAdmin = await getAdminSupabaseClient();

        // Limpar dados antes de enviar.
        // Se plan_id for string vazia, transformar em null para não quebrar a Foreign Key.
        const cleanData = { ...dataToUpdate };
        if (cleanData.plan_id === "") {
            cleanData.plan_id = null;
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(cleanData)
            .eq('id', userId);

        if (error) throw error;
        
        return { success: true, error: null };

    } catch (error: any) {
        console.error(`[Server Action Error] updateUser(${userId}):`, error.message);
        return { success: false, error: error.message };
    }
}