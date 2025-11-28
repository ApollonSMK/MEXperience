'use server';

import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { createClient } from '@supabase/supabase-js';

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

    // 1. Récupérer les factures payées (Stripe)
    const { data: invoices, error: invoicesError } = await supabaseAdmin
        .from('invoices')
        .select('id, date, plan_title, amount, user_id')
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
        .in('payment_method', ['reception', 'card']);

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
    const formattedInvoices: BillingRecord[] = invoices?.map(inv => ({
        id: `inv_${inv.id}`,
        date: inv.date,
        description: inv.plan_title || 'Paiement Stripe',
        amount: inv.amount || 0,
        method: 'Stripe',
        client: 'Chargement...',
        user_id: inv.user_id,
    })) || [];

    const formattedAppointments: BillingRecord[] = appointments?.map(apt => ({
        id: `apt_${apt.id}`,
        date: apt.date,
        description: `${apt.service_name} (${apt.duration} min)`,
        amount: getAppointmentPrice(apt.service_name, apt.duration),
        method: apt.payment_method === 'reception' ? 'Espèces' : 'Carte',
        client: apt.user_name || 'Client inconnu',
        user_id: apt.user_id,
    })) || [];

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