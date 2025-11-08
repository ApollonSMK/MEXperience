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


export async function getAllUsers() {
    await verifyAdmin();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase service role key is not configured.');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('*');

    if (error) {
        console.error("Error fetching all users with admin client:", error);
        throw new Error('Failed to fetch users.');
    }
    
    return profiles || [];
}

export async function getPlans() {
    await verifyAdmin();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase service role key is not configured.');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: plans, error } = await supabaseAdmin.from('plans').select('id, title');
    
    if (error) {
        console.error("Error fetching plans with admin client:", error);
        throw new Error('Failed to fetch plans.');
    }

    return plans || [];
}
