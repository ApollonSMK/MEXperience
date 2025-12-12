'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { isSameDay, parseISO } from 'date-fns';

export type BillingRecord = {
  id: string;
  date: string;
  description: string;
  amount: number;
  method: string;
  client: string;
  user_id: string | null;
};

async function verifyAdmin() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
    
    if (error || !profile?.is_admin) {
        redirect('/');
    }
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

export async function getBillingRecords(): Promise<BillingRecord[]> {
    await verifyAdmin();
    const supabaseAdmin = await getAdminSupabaseClient();

    // 1. Récupérer les factures payées (Stripe e Manuais)
    const { data: invoices, error: invoicesError } = await supabaseAdmin
        .from('invoices')
        .select('id, date, plan_title, amount, user_id, payment_method')
        .eq('status', 'Pago');

    if (invoicesError) {
        console.error('Error fetching invoices:', JSON.stringify(invoicesError, null, 2));
        throw new Error('Failed to fetch invoices.');
    }

    // 2. Récupérer les rendez-vous "Concluído" payés manuellement
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('id, date, service_name, duration, payment_method, user_id, user_name')
        .eq('status', 'Concluído')
        .in('payment_method', ['reception', 'card', 'cash', 'transfer']);

    if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        throw new Error('Failed to fetch appointments.');
    }

    // 3. Récupérer les services pour trouver les prix des rendez-vous
    const { data: services, error: servicesError } = await supabaseAdmin
        .from('services')
        .select('name, pricing_tiers');

    if (servicesError) {
        console.error('Error fetching services:', servicesError);
        throw new Error('Failed to fetch services.');
    }

    // 3.5 Récupérer les Ventes de Cartes Cadeaux MANUELLES (qui ne sont pas dans invoices)
    // On cherche les cartes créées par admin avec paiement réel
    const { data: giftCards, error: giftError } = await supabaseAdmin
        .from('gift_cards')
        .select('id, created_at, initial_balance, metadata, buyer_id')
        .neq('type', 'promo_code'); // On exclut les codes promo gratuits

    // --- LÓGICA DE DESDUPLICAÇÃO ---
    // Criamos um mapa de invoices para verificar se um agendamento já foi faturado.
    // Chave: user_id + data (YYYY-MM-DD)
    // Isso evita que mostremos o agendamento de 45€ se já existe uma fatura de 209€ para o mesmo serviço naquele dia.
    
    const invoiceKeys = new Set<string>();
    
    invoices?.forEach(inv => {
        if (inv.user_id && inv.date) {
            const dateKey = inv.date.split('T')[0]; // Pega YYYY-MM-DD
            // Chave genérica: user + data
            invoiceKeys.add(`${inv.user_id}_${dateKey}`);
        }
    });

    const servicePriceMap = new Map<string, { duration: number; price: number }[]>();
    services?.forEach(service => {
        servicePriceMap.set(service.name, service.pricing_tiers);
    });

    const getAppointmentPrice = (serviceName: string, duration: number) => {
        const tiers = servicePriceMap.get(serviceName);
        if (!tiers) return 0;
        const tier = tiers.find(t => t.duration === duration);
        return tier ? tier.price : 0;
    };

    // 4. Formater et combiner les données
    const formattedInvoices: BillingRecord[] = invoices?.map(inv => {
        // Traduzir método de pagamento com precisão
        let methodDisplay = 'Inconnu';
        const m = (inv.payment_method || '').toLowerCase();

        if (m === 'stripe' || m === 'online') methodDisplay = 'Stripe (Web)';
        else if (m === 'cash' || m === 'reception') methodDisplay = 'Espèces';
        else if (m === 'card') methodDisplay = 'Carte TPE'; // Terminal Físico
        else if (m === 'gift' || m === 'gift_card') methodDisplay = 'Chèque Cadeau (Utilisation)'; // DEVRAIT ETRE EXCLU SI ON COMPTE A LA VENTE
        else if (m === 'transfer') methodDisplay = 'Virement';
        else if (!m) methodDisplay = 'Stripe (Web)'; // Fallback para registros antigos online que não tinham método
        else methodDisplay = inv.payment_method; // Caso personalizado

        return {
            id: `inv_${inv.id}`,
            date: inv.date,
            description: inv.plan_title || 'Paiement',
            amount: inv.amount || 0,
            method: methodDisplay,
            client: inv.user_id ? 'Chargement...' : 'Client Comptoir (Anonyme)', // Lida com user_id null
            user_id: inv.user_id,
        };
    }) || [];

    // Filter out Invoices that are actually "Gift Card Usage" (if any slipped into invoices table incorrectly)
    // Normally invoices table stores SALES (subscriptions, pack minutes, gift card purchases).
    // So formattedInvoices is generally correct as "Money In".
    
    // NEW: Add Manual Gift Card Sales to the records
    const formattedGiftCards: BillingRecord[] = [];
    giftCards?.forEach(gc => {
        // Check if this gift card sale is already in invoices (e.g. online sales are put in invoices table by webhook)
        const stripeId = gc.metadata?.stripe_payment_intent;
        if (stripeId) {
            // Already handled by invoices table (online sale)
            return;
        }

        const method = gc.metadata?.payment_method;
        
        // Only count if it was a real sale (Cash/Card/Transfer)
        // If method is 'none' or 'gift', it might be a free gift from admin, so we skip revenue.
        if (['cash', 'card', 'transfer', 'reception'].includes(method)) {
            let methodDisplay = 'Autre';
            if (method === 'cash' || method === 'reception') methodDisplay = 'Espèces (Cadeau)';
            else if (method === 'card') methodDisplay = 'Carte TPE (Cadeau)';
            else if (method === 'transfer') methodDisplay = 'Virement (Cadeau)';

            formattedGiftCards.push({
                id: `gc_${gc.id}`,
                date: gc.created_at,
                description: `Vente Carte Cadeau (${gc.initial_balance}€)`,
                amount: gc.initial_balance,
                method: methodDisplay,
                client: 'Vente Comptoir', // Could try to fetch buyer name if buyer_id exists
                user_id: gc.buyer_id || null
            });
        }
    });

    const formattedAppointments: BillingRecord[] = [];
    
    appointments?.forEach(apt => {
        // Verifica se já existe uma fatura para este usuário neste dia
        const aptDateKey = apt.date.split('T')[0];
        const key = `${apt.user_id}_${aptDateKey}`;
        
        // Lógica de filtro:
        // Se existe uma fatura para este usuário neste dia, assumimos que ela cobre este agendamento.
        // Isso resolve o problema de duplicação (209€ vs 45€).
        // Para ser mais seguro, poderíamos checar o nome do serviço, mas como o título da fatura muda (com extras),
        // a data + usuário é um proxy forte o suficiente para evitar a contagem dupla.
        
        const hasMatchingInvoice = invoiceKeys.has(key);

        // Se NÃO tem fatura correspondente, adicionamos à lista como um registro avulso
        if (!hasMatchingInvoice) {
            let methodDisplay = 'Autre';
            if (apt.payment_method === 'cash' || apt.payment_method === 'reception') methodDisplay = 'Espèces';
            else if (apt.payment_method === 'card') methodDisplay = 'Carte TPE';
            // REMOVED: gift checks here. We don't count USE of gift card as revenue.
            // else if (apt.payment_method === 'gift' || apt.payment_method === 'gift_card') methodDisplay = 'Chèque Cadeau';
            else if (apt.payment_method === 'online' || apt.payment_method === 'stripe') methodDisplay = 'Stripe (Web)';
            
            // EXCLUDE: external_me_beauty
            if (apt.payment_method === 'external_me_beauty') return; 

            formattedAppointments.push({
                id: `apt_${apt.id}`,
                date: apt.date,
                description: `${apt.service_name} (${apt.duration} min)`,
                amount: getAppointmentPrice(apt.service_name, apt.duration),
                method: methodDisplay,
                client: apt.user_name || 'Client inconnu',
                user_id: apt.user_id,
            });
        }
    });

    // 5. Récupérer les noms des clients pour les factures Stripe
    const userIds = [
        ...new Set([
            ...formattedInvoices.map(inv => inv.user_id),
            ...formattedGiftCards.map(gc => gc.user_id)
        ].filter((id): id is string => !!id))
    ];

    if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, display_name, first_name, last_name')
            .in('id', userIds);

        const userMap = new Map<string, string>();
        profiles?.forEach(p => {
            const name = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
            userMap.set(p.id, name || 'Utilisateur Inconnu');
        });
        
        // Update names for invoices
        formattedInvoices.forEach(inv => {
            if (inv.user_id) {
                inv.client = userMap.get(inv.user_id) || 'Utilisateur Inconnu';
            }
        });

        // Update names for gift cards
        formattedGiftCards.forEach(gc => {
            if (gc.user_id) {
                gc.client = userMap.get(gc.user_id) || 'Client (Carte Cadeau)';
            }
        });
    }

    const combinedRecords: BillingRecord[] = [...formattedInvoices, ...formattedAppointments, ...formattedGiftCards];

    // 6. Trier par date (du plus récent au plus ancien)
    combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combinedRecords;
}