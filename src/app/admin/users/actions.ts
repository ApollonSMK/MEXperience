'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { addMonths } from 'date-fns';

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
        .select('*, is_influencer, is_reseller, referral_code');

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
                        stripe_subscription_status: subscription.status,
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

        // --- FETCH LOGS ---
        // 1. Email Logs (baseado no email do usuário)
        let emailLogs = [];
        if (user.email) {
            const { data: eLogs } = await supabaseAdmin
                .from('email_logs')
                .select('*')
                .eq('to_email', user.email)
                .order('created_at', { ascending: false });
            emailLogs = eLogs || [];
        }

        // 2. Appointment Audit Logs
        let auditLogs = [];
        if (appointments && appointments.length > 0) {
            const appointmentIds = appointments.map((a: any) => a.id);
            const { data: aLogs } = await supabaseAdmin
                .from('appointment_logs')
                .select('*')
                .in('appointment_id', appointmentIds)
                .order('created_at', { ascending: false });
            auditLogs = aLogs || [];
        }
        
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
            emailLogs: emailLogs,
            auditLogs: auditLogs,
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
        return { user: null, appointments: [], plans: [], giftCards: [], invoices: [], stats: null, emailLogs: [], auditLogs: [], error: error.message };
    }
}


export async function updateUser(userId: string, dataToUpdate: any) {
    try {
        await verifyAdmin();
        const supabaseAdmin = await getAdminSupabaseClient();

        // 1. Fetch a cópia atual do perfil para comparar as alterações
        const { data: currentProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('plan_id, referral_code, first_name')
            .eq('id', userId)
            .single();

        if (fetchError) throw new Error('Failed to fetch current user profile before update.');

        const cleanData = { ...dataToUpdate };

        // 2. Lógica para definir/limpar datas de assinatura manual
        const oldPlanId = currentProfile.plan_id;
        const newPlanId = cleanData.plan_id;

        if (newPlanId && newPlanId !== oldPlanId) {
            // Um novo plano foi atribuído ou alterado
            cleanData.subscription_start_date = new Date().toISOString();
            cleanData.subscription_end_date = addMonths(new Date(), 1).toISOString();
        } else if (!newPlanId && oldPlanId) {
            // O plano foi removido (de um plano para 'aucun')
            cleanData.subscription_start_date = null;
            cleanData.subscription_end_date = null;
        }

        // Se plan_id for string vazia, transformar em null para não quebrar a Foreign Key.
        if (cleanData.plan_id === "") {
            cleanData.plan_id = null;
        }

        // Permitir atualizar roles
        // Nota: is_influencer e is_reseller já devem estar em cleanData se passados pelo form
        
        // Gerar referral_code automaticamente se for tornado influenciador e não tiver um
        if (cleanData.is_influencer && !currentProfile.referral_code && !cleanData.referral_code) {
             const generateCode = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let code = '';
                for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                return code;
             };
             // Tentativa simples de gerar código (em produção idealmente verifica colisão)
             cleanData.referral_code = (currentProfile.first_name?.substring(0,3) || 'REF') + generateCode();
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