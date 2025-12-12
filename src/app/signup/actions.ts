'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. Client for Auth with Cookies (So user stays logged in)
    const supabase = await createSupabaseRouteClient();

    // 2. Admin Client for Database Updates (Bypass RLS for profile update)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Sign Up User
    // With email confirmation disabled, this will return a session immediately
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
    if (data.referralCode) {
        console.log(`[Signup Action] Force updating referral for user ${authData.user.id}: ${data.referralCode}`);
        
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ referred_by: data.referralCode })
            .eq('id', authData.user.id);

        if (profileError) {
            console.error('[Signup Action] Profile update failed (referral), trying upsert:', profileError);
        }
    }

    // Return the session so the client knows we are logged in
    return { success: true, session: authData.session };
}