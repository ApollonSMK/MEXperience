
'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

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


export async function getAllUsers() {
    await verifyAdmin();
    const supabaseAdmin = await getAdminSupabaseClient();
    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('*');

    if (error) {
        console.error("Error fetching all users with admin client:", error);
        throw new Error('Failed to fetch users.');
    }
    
    return profiles || [];
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
        const appointmentsPromise = supabaseAdmin.from('appointments').select('*').eq('user_id', userId);
        const plansPromise = supabaseAdmin.from('plans').select('*').order('order');
        
        const [
            { data: user, error: userError }, 
            { data: appointments, error: appointmentsError },
            { data: plans, error: plansError }
        ] = await Promise.all([userPromise, appointmentsPromise, plansPromise]);

        if (userError) {
            if (userError.code === 'PGRST116') throw new Error('Utilizador não encontrado.');
            throw userError;
        }

        if (appointmentsError) throw appointmentsError;
        if (plansError) throw plansError;
        
        return { user, appointments: appointments || [], plans: plans || [], error: null };

    } catch (error: any) {
        console.error(`[Server Action Error] getUserById(${userId}):`, error.message);
        return { user: null, appointments: null, plans: null, error: error.message };
    }
}


export async function updateUser(userId: string, dataToUpdate: any) {
    try {
        await verifyAdmin();
        const supabaseAdmin = await getAdminSupabaseClient();

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(dataToUpdate)
            .eq('id', userId);

        if (error) throw error;
        
        return { success: true, error: null };

    } catch (error: any) {
        console.error(`[Server Action Error] updateUser(${userId}):`, error.message);
        return { success: false, error: error.message };
    }
}
