
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

// Initialize Supabase Admin Client
const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase environment variables are not configured.');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
        return NextResponse.json({ error: 'Missing payment_intent parameter' }, { status: 400 });
    }
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 });
    }
    
    const stripe = getStripe(secretKey);
    const supabaseAdmin = getSupabaseAdminClient();

    try {
        // Retrieve the Payment Intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['invoice'],
        });

        // The invoice is directly on the PI if it's for a subscription
        const invoice = paymentIntent.invoice;
        if (!invoice || typeof invoice === 'string') {
             console.warn(`[API] /subscription-status: No invoice object found for Payment Intent ${paymentIntentId}. Retrying...`);
             return NextResponse.json({ status: 'processing', message: 'Invoice not found yet.' });
        }

        const subscriptionId = invoice.subscription;
        if (!subscriptionId || typeof subscriptionId !== 'string') {
            console.warn(`[API] /subscription-status: No subscription found on Invoice ${invoice.id}. Retrying...`);
            return NextResponse.json({ status: 'processing', message: 'Subscription not found yet.' });
        }
        
        // Now check the Supabase database to see if the webhook has updated the user's profile
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('plan_id, stripe_subscription_id, stripe_subscription_status')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error, it just means not processed yet
             console.error(`[API] /subscription-status: Supabase error fetching profile for subscription ${subscriptionId}:`, error);
             return NextResponse.json({ status: 'processing', error: 'Database error while checking status.' });
        }

        // The webhook has run successfully! The user's profile is updated.
        if (profile && profile.plan_id && profile.stripe_subscription_status === 'active') {
            console.log(`[API] /subscription-status: Status is complete for subscription ${subscriptionId}.`);
            return NextResponse.json({ status: 'complete' });
        }

        // If we reach here, it means the webhook is still processing or there was an issue.
        console.log(`[API] /subscription-status: Profile not yet updated for subscription ${subscriptionId}. Current profile state:`, profile);
        return NextResponse.json({ status: 'processing', message: 'Webhook processing.' });

    } catch (error: any) {
        console.error('[API] /subscription-status: Error:', error);
        return NextResponse.json({ error: error.message, status: 'error' }, { status: 500 });
    }
}
