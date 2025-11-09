
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
    const paymentIntentSecret = searchParams.get('payment_intent_client_secret');

    if (!paymentIntentSecret) {
        return NextResponse.json({ error: 'Missing payment_intent_client_secret parameter' }, { status: 400 });
    }
    
    const paymentIntentId = paymentIntentSecret.split('_secret_')[0];

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 });
    }
    
    const stripe = getStripe(secretKey);
    const supabaseAdmin = getSupabaseAdminClient();

    try {
        // Retrieve the Payment Intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // From the payment intent, get the invoice, and from the invoice, the subscription
        if (!paymentIntent.invoice) {
            console.warn(`[API] /subscription-status: No invoice found for Payment Intent ${paymentIntentId}. Retrying...`);
            return NextResponse.json({ status: 'processing' });
        }

        const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);
        
        if (!invoice.subscription) {
            console.warn(`[API] /subscription-status: No subscription found for Invoice ${invoice.id}. Retrying...`);
            return NextResponse.json({ status: 'processing' });
        }
        
        const subscriptionId = invoice.subscription as string;
        
        // Now check the Supabase database to see if the webhook has updated the user's profile
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('plan_id, stripe_subscription_id, stripe_subscription_status')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

        if (error || !profile) {
            // This is an expected state while the webhook is still processing.
            console.warn(`[API] /subscription-status: Profile not yet updated for subscription ${subscriptionId}. Retrying...`);
            return NextResponse.json({ status: 'processing' });
        }

        // The webhook has run successfully! The user's profile is updated.
        if (profile.plan_id && profile.stripe_subscription_status === 'active') {
            return NextResponse.json({ status: 'complete' });
        }

        // If we found the profile but the plan isn't active yet, it means the webhook is still in progress.
        return NextResponse.json({ status: 'processing' });

    } catch (error: any) {
        console.error('[API] /subscription-status: Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
