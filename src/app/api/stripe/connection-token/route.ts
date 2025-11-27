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
    
    const isLive = secretKey.startsWith('sk_live');
    console.log(`[Connection Token] Using Stripe Key: ${isLive ? 'LIVE MODE' : 'TEST MODE'}`);

    const stripe = getStripe(secretKey);

    // ID ESPECÍFICO FORNECIDO PELO UTILIZADOR
    const TARGET_LOCATION_ID = 'tml_GSUkSAISqeQk11';
    let locationId = '';

    try {
        // 1. Tentar obter a localização específica
        const location = await stripe.terminal.locations.retrieve(TARGET_LOCATION_ID);
        if (location && !location.deleted) {
            console.log(`[Connection Token] Sucesso! Localização alvo encontrada: ${location.display_name} (${location.id})`);
            locationId = location.id;
        }
    } catch (err) {
        console.warn(`[Connection Token] Aviso: Não foi possível encontrar a localização alvo ${TARGET_LOCATION_ID}. A tentar listar outras...`);
    }

    // 2. Se não encontrou a específica, listar a primeira disponível
    if (!locationId) {
        const locations = await stripe.terminal.locations.list({ limit: 1 });
        locationId = locations.data[0]?.id;
    }

    // 3. Se ainda não existe, criar padrão (apenas em último caso)
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

    console.log(`[Connection Token] Location ID Final: ${locationId}`);

    // 4. Criar token de conexão
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