'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export async function getPartnerStats() {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Get user profile to get the referral code
    const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, is_influencer')
        .eq('id', user.id)
        .single();

    if (!profile?.is_influencer || !profile?.referral_code) {
        return { totalReferred: 0, activeSubs: 0, code: profile?.referral_code };
    }

    // Use Service Role client to bypass RLS for counting
    // We only return counts, so no privacy leak
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count: totalCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', profile.referral_code);

    const { count: activeCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', profile.referral_code)
        .eq('subscription_status', 'active');

    return {
        totalReferred: totalCount || 0,
        activeSubs: activeCount || 0,
        code: profile.referral_code
    };
}