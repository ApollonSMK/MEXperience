'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Loader2, AlertTriangle, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

interface InvitePayload {
    host_id: string;
    plan_id: string;
    exp: number;
}

interface HostProfile {
    display_name: string;
}

export default function GuestInvitePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const token = Array.isArray(params.token) ? params.token[0] : params.token;

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired'>('loading');
    const [host, setHost] = useState<HostProfile | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const validateTokenAndFetchData = async () => {
            if (!token) {
                setStatus('invalid');
                return;
            }
            try {
                const payload: InvitePayload = JSON.parse(atob(token));

                // Check expiration
                if (payload.exp * 1000 < Date.now()) {
                    setStatus('expired');
                    return;
                }

                // Check if host exists
                const { data: hostData, error: hostError } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', payload.host_id)
                    .single();

                if (hostError || !hostData) {
                    throw new Error('Hôte introuvable.');
                }
                setHost(hostData);

                // Check if user is logged in
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);
                
                setStatus('valid');

            } catch (error) {
                console.error("Token validation error:", error);
                setStatus('invalid');
            }
        };

        validateTokenAndFetchData();
    }, [token, supabase]);
    
    const handleLogin = () => {
        sessionStorage.setItem('post-login-redirect', `/guest-invite/${token}`);
        router.push('/login');
    }

    const handleSignup = () => {
        sessionStorage.setItem('post-login-redirect', `/guest-invite/${token}`);
        router.push('/signup');
    }
    
    const handleAccept = () => {
        toast({
            title: 'Invitation acceptée !',
            description: "Vous allez être redirigé vers l'agenda pour choisir votre séance.",
        });
        
        // Store the token in session storage so the scheduler can pick it up
        sessionStorage.setItem('guest_invite_token', token);
        router.push('/agendar');
    };

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-4">Vérification de l'invitation...</p>
            </div>
        );
    }
    
    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Card className="mx-auto w-full max-w-md">
                    {status === 'valid' && host && (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit mb-4">
                                     <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <CardTitle className="text-2xl">Vous êtes invité !</CardTitle>
                                <CardDescription>
                                    <span className="font-semibold">{host.display_name}</span> vous a invité(e) à profiter d'une séance gratuite.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                {user ? (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-4">Connecté en tant que <span className="font-medium">{user.email}</span>.</p>
                                        <Button className="w-full" onClick={handleAccept}>
                                            Accepter et Planifier ma Séance
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-4">Pour accepter, veuillez vous connecter ou créer un compte.</p>
                                        <div className="flex gap-4">
                                            <Button className="flex-1" onClick={handleLogin}>Se Connecter</Button>
                                            <Button className="flex-1" variant="outline" onClick={handleSignup}>Créer un Compte</Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </>
                    )}
                     {(status === 'invalid' || status === 'expired') && (
                         <CardHeader className="text-center">
                             <div className="mx-auto bg-red-100 dark:bg-red-900 rounded-full p-3 w-fit mb-4">
                                 <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl">Lien Invalide ou Expiré</CardTitle>
                            <CardDescription>
                                Ce lien d'invitation n'est plus valide. Veuillez demander un nouveau lien à la personne qui vous a invité.
                            </CardDescription>
                         </CardHeader>
                    )}
                </Card>
            </main>
            <Footer />
        </>
    );
}
