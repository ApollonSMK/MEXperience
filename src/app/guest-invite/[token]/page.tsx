'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvitePayload {
    host_id: string;
    plan_id: string;
    exp: number;
}

export default function GuestInvitePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const token = Array.isArray(params.token) ? params.token[0] : params.token;

    useEffect(() => {
        const validateTokenAndRedirect = async () => {
            if (!token) {
                toast({ variant: 'destructive', title: 'Lien Invalide', description: "Ce lien d'invitation n'est pas valide." });
                router.push('/');
                return;
            }

            try {
                // 1. Validate Token
                const payload: InvitePayload = JSON.parse(atob(token));
                if (payload.exp * 1000 < Date.now()) {
                    toast({ variant: 'destructive', title: 'Lien Expiré', description: "Ce lien d'invitation a expiré." });
                    router.push('/');
                    return;
                }
                
                // 2. Check if user is already logged in
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                     // If user is logged in, send them straight to schedule with the token
                    router.push(`/agendar?invite_token=${token}`);
                } else {
                    // If not logged in, redirect to signup, passing the token
                    router.push(`/signup?invite_token=${token}`);
                }

            } catch (error) {
                console.error("Token validation error:", error);
                toast({ variant: 'destructive', title: 'Lien Invalide', description: "Ce lien d'invitation est corrompu ou invalide." });
                router.push('/');
            }
        };

        if (supabase) {
          validateTokenAndRedirect();
        }
    }, [token, supabase, router, toast]);
    
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Vérification de l'invitation et redirection...</p>
            </div>
        </div>
    );
}
