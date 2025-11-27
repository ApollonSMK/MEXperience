import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export async function POST() {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Chave secreta Stripe não configurada.");
    
    // Check environment mode
    const isLive = secretKey.startsWith('sk_live');
    console.log(`[Connection Token] Using Stripe Key: ${isLive ? 'LIVE MODE' : 'TEST MODE'}`);

    const stripe = getStripe(secretKey);

    // 1. Obter Localização (Stripe Terminal requer que os leitores estejam associados a uma Location)
    const locations = await stripe.terminal.locations.list({ limit: 1 });
    let locationId = locations.data[0]?.id;
    
    if (!locationId) {
        console.log("[Connection Token] Nenhuma localização encontrada. A criar 'Sede'...");
        const newLocation = await stripe.terminal.locations.create({
            display_name: 'Sede M.E Experience',
            address: { 
                line1: '20 Grand-Rue', 
                city: 'Tétange', 
                country: 'LU', 
                postal_code: '3650' 
            }
        });
        locationId = newLocation.id;
    }

    console.log(`[Connection Token] Location ID: ${locationId}`);

    // 2. Criar token de conexão
    const connectionToken = await stripe.terminal.connectionTokens.create({
        location: locationId
    });

    return NextResponse.json({ 
        secret: connectionToken.secret,
        locationId: locationId,
        isLive: isLive
    });

  } catch (error: any) {
    console.error('Erro ao criar token de conexão:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}