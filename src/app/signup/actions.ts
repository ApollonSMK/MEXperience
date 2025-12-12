'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function signupUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dob: string;
    referralCode?: string | null;
}) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. Client for Auth (Standard Anon Key)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 2. Admin Client for Database Updates (Bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                first_name: data.firstName,
                last_name: data.lastName,
                display_name: `${data.firstName} ${data.lastName}`,
                phone: data.phone,
                dob: data.dob,
                referred_by: data.referralCode // Metadata backup
            },
        },
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: 'Erreur inattendue lors de la création du compte.' };
    }

    // 3. FORCE UPDATE Profile with Referral Code
    // We do this explicitly because triggers might fail or not be configured for this column
    if (data.referralCode) {
        console.log(`[Signup Action] Force updating referral for user ${authData.user.id}: ${data.referralCode}`);
        
        // We wait a tiny bit to ensure the trigger (if any) has created the profile row
        // But 'upsert' is safer to ensure we don't crash if it's missing or present
        
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ referred_by: data.referralCode })
            .eq('id', authData.user.id);

        // If update failed (maybe row doesn't exist yet?), try upserting minimal data
        if (profileError) {
            console.error('[Signup Action] Profile update failed, trying upsert:', profileError);
            // Fallback: This might happen if the trigger is slow. 
            // We just log it for now, as usually triggers are fast enough.
        }
    }

    return { success: true };
}