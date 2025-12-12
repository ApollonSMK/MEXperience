'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { addDays, format, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';

export type TreeNode = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    level: number;
    status: string;
    joinedAt: string;
    children: TreeNode[];
};

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
            clicks: 0,
            code: profile?.referral_code || 'N/A',
            chartData: [],
            tree: []
        };
    }

    const referralCode = profile.referral_code;

    // 2. Use Admin Client for database queries
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --- A. BASIC COUNTS ---
    // Count Signups
    const { count: totalCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', user.id);

    // Count Active Subscriptions
    const { count: activeCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', user.id)
        .eq('stripe_subscription_status', 'active');

    // Count Clicks
    const { count: clicksCount } = await adminClient
        .from('referral_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_code', referralCode);

    // Rewards
    const { data: rewards } = await adminClient
        .from('referral_rewards')
        .select('minutes_amount')
        .eq('referrer_id', user.id);
    const totalMinutesEarned = rewards?.reduce((sum, r) => sum + (r.minutes_amount || 0), 0) || 0;


    // --- B. CHART DATA (Last 30 Days) ---
    // We want to show Signups per day
    const { data: last30DaysSignups } = await adminClient
        .from('profiles')
        .select('creation_time')
        .eq('referred_by', user.id)
        .gte('creation_time', subDays(new Date(), 30).toISOString());
    
    // Process data for Chart
    const chartMap = new Map<string, number>();
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
        const d = subDays(new Date(), i);
        chartMap.set(format(d, 'dd/MM'), 0);
    }
    // Fill with data
    last30DaysSignups?.forEach(p => {
        const d = format(new Date(p.creation_time!), 'dd/MM');
        if (chartMap.has(d)) {
            chartMap.set(d, chartMap.get(d)! + 1);
        }
    });
    
    const chartData = Array.from(chartMap.entries()).map(([date, count]) => ({ date, signups: count }));


    // --- C. REFERRAL TREE (Network) ---
    // We call the Postgres function we created
    const { data: rawTreeNodes, error: treeError } = await adminClient
        .rpc('get_referral_tree', { root_user_id: user.id });

    if (treeError) console.error("Tree Error:", treeError);

    // Transform flat list into nested tree
    const buildTree = (nodes: any[], parentId: string): TreeNode[] => {
        return nodes
            .filter(node => node.referred_by === parentId)
            .map(node => ({
                id: node.id,
                name: node.display_name || 'Usuário',
                email: node.email, // Maybe hide part of email for privacy?
                avatar: node.photo_url,
                level: node.level,
                status: node.plan_status === 'active' ? 'Ativo' : 'Inativo',
                joinedAt: node.joined_at,
                children: buildTree(nodes, node.id)
            }));
    };

    // The root of the tree are those referred directly by current user (level 1)
    // Note: The RPC returns referred_by. For level 1, referred_by is the user.id
    const tree = rawTreeNodes ? buildTree(rawTreeNodes, user.id) : [];

    return {
        totalReferred: totalCount || 0,
        activeSubs: activeCount || 0,
        totalMinutesEarned,
        clicks: clicksCount || 0,
        code: referralCode,
        chartData,
        tree
    };
}