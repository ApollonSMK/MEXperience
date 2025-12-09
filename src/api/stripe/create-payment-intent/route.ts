import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
        type, // 'appointment' OR 'gift_card'
        amount, // For gift cards
        // Appointment specific
        serviceId, 
        serviceName, 
        price, 
        userId, 
        userName, 
        userEmail, 
        appointmentDate, 
        duration, 
        paymentMethod,
        // Gift Card specific
        metadata
    } = body;
    
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Initialize Stripe
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Clé secrète Stripe non configurée.");
    const stripe = getStripe(secretKey);

    // --- CASE 1: GIFT CARD ---
    if (type === 'gift_card') {
        if (!amount || !metadata) {
            return NextResponse.json({ error: 'Données de carte cadeau manquantes.' }, { status: 400 });
        }

        // Add buyer ID if user is logged in
        // IMPORTANT: We use the user.id from the server-side session check we just did above.
        const finalMetadata = {
            ...metadata,
            type: 'gift_card',
            buyer_id: user?.id || '' // Store the buyer ID if available
        };
        
        console.log(`[API] Creating Gift Card Payment Intent. Buyer: ${user?.id || 'Guest'}`);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // convert to cents
            currency: 'eur',
            payment_method_types: ['card'],
            metadata: finalMetadata,
        });

        if (!paymentIntent.client_secret) {
            throw new Error('Impossible de créer l\'intention de paiement Stripe.');
        }

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }

    // --- CASE 2: APPOINTMENT (Default) ---
    // Validate appointment data
    if (!serviceId || !serviceName || price === undefined || !userId || !appointmentDate || !duration) {
      return NextResponse.json({ error: 'Données de réservation manquantes.' }, { status: 400 });
    }

    // Authenticated user check strictly for appointments if needed, 
    // but usually we trust the client logic or validate existing sessions.
    // Here we proceed.

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100),
        currency: 'eur',
        payment_method_types: ['card'],
        metadata: {
            type: 'appointment',
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            service_id: serviceId,
            service_name: serviceName,
            appointment_date: appointmentDate,
            duration: String(duration),
            price: String(price),
            payment_method: paymentMethod,
        },
    });

    if (!paymentIntent.client_secret) {
        throw new Error('Impossible de créer l\'intention de paiement Stripe.');
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('[API] /create-payment-intent Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}