'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export async function getPartnerStats() {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // 1. Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, is_influencer')
        .eq('id', user.id)
        .single();

    if (!profile?.is_influencer || !profile?.referral_code) {
        return { 
            totalReferred: 0, 
            activeSubs: 0, 
            totalMinutesEarned: 0,
            code: profile?.referral_code || 'N/A' 
        };
    }

    // 2. Use Admin Client for accurate counting
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Count Total Signups (Profiles with my code)
    const { count: totalCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', user.id);

    // Count Active Subscriptions from those users
    // (Assuming subscription_status is stored on profile, or implies logic check)
    // Here we check if plan_id is not null as a proxy for active sub, 
    // or use stripe_subscription_status if available.
    const { count: activeCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', user.id)
        .eq('stripe_subscription_status', 'active');

    // 3. Calculate Total Rewards (from the new logs table)
    const { data: rewards } = await adminClient
        .from('referral_rewards')
        .select('minutes_amount')
        .eq('referrer_id', user.id);

    const totalMinutesEarned = rewards?.reduce((sum, r) => sum + (r.minutes_amount || 0), 0) || 0;

    return {
        totalReferred: totalCount || 0,
        activeSubs: activeCount || 0,
        totalMinutesEarned: totalMinutesEarned,
        code: profile.referral_code
    };
}