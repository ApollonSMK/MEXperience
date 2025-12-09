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
        .in('payment_method', ['reception', 'card', 'cash', 'gift']);

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
        else if (m === 'gift' || m === 'gift_card') methodDisplay = 'Chèque Cadeau';
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
            else if (apt.payment_method === 'gift' || apt.payment_method === 'gift_card') methodDisplay = 'Chèque Cadeau';
            else if (apt.payment_method === 'online' || apt.payment_method === 'stripe') methodDisplay = 'Stripe (Web)';

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
    const userIds = [...new Set(formattedInvoices.map(inv => inv.user_id).filter((id): id is string => !!id))];
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
        formattedInvoices.forEach(inv => {
            if (inv.user_id) {
                inv.client = userMap.get(inv.user_id) || 'Utilisateur Inconnu';
            }
        });
    }

    const combinedRecords: BillingRecord[] = [...formattedInvoices, ...formattedAppointments];

    // 6. Trier par date (du plus récent au plus ancien)
    combinedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combinedRecords;
}