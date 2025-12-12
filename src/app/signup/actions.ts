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

    // 3. FORCE UPSERT Profile with Referral Code
    // Using UPSERT is safer than UPDATE because if the trigger is slow, UPDATE returns 0 rows.
    // UPSERT will create the row if missing, or update if present.
    // We include all known fields to ensure the profile is valid.
    
    // Construct the profile object
    const profileData: any = {
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        dob: data.dob,
        // Ensure referral code is saved
        referred_by: data.referralCode || null 
    };

    console.log(`[Signup Action] Upserting profile for user ${authData.user.id}. Referral: ${data.referralCode}`);

    const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

    if (upsertError) {
        console.error('[Signup Action] Profile upsert failed:', upsertError);
        // We don't block the user, but we log the error.
        // It might fail if there are constraints we missed, but usually this is safe.
    }

    // Return the session so the client knows we are logged in
    return { success: true, session: authData.session };
}