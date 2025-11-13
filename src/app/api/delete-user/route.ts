
'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
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
      // Fornecer uma mensagem de erro mais clara se o utilizador não for encontrado
      if (deletionError.message.includes('User not found')) {
        return NextResponse.json({ error: 'User not found in Supabase Auth.' }, { status: 404 });
      }
      throw deletionError;
    }
    
    console.log('Supabase admin delete response:', deletionData);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
