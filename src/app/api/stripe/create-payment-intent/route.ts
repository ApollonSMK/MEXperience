import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
        serviceId, 
        serviceName, 
        price, 
        userId, 
        userName, 
        userEmail, 
        appointmentDate, 
        duration, 
        paymentMethod,
        // Novos campos para pacotes de minutos
        type, 
        packName,
        minutesAmount
    } = body;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe secret key not set' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20', 
    });

    // Lógica para Pacotes de Minutos
    if (type === 'minute_pack') {
         const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100), // converter para centimos
            currency: 'eur',
            metadata: {
                type: 'minute_pack',
                user_id: userId,
                user_email: userEmail,
                pack_name: packName,
                minutes_amount: minutesAmount,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }

    // Lógica existente para Agendamentos
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: 'eur',
      metadata: {
        type: 'appointment',
        service_id: serviceId,
        service_name: serviceName,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        appointment_date: appointmentDate,
        duration: duration,
        payment_method: paymentMethod,
        price: price
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}