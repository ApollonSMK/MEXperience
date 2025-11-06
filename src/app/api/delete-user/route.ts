'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler-client';

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseRouteHandlerClient();
    if (!supabase) {
        throw new Error("Supabase client not initialized.");
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key is not configured.');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: deletionData, error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deletionError) {
      console.error('Supabase admin delete error:', deletionError);
      throw deletionError;
    }
    
    console.log('Supabase admin delete response:', deletionData);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
