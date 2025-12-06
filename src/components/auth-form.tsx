'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import * as pixel from '@/lib/fpixel';

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse e-mail invalide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
})

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
    lastName: z.string().min(1, { message: 'Le nom est requis.' }),
    email: z.string().email({ message: 'Adresse e-mail invalide.' }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
  })

type LoginFormValues = z.infer<typeof loginSchema>
type SignupFormValues = z.infer<typeof signupSchema>

interface AuthFormProps {
  onAuthSuccess: (didLogin: boolean) => void;
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.411-11.303-8H2.389v8.383C8.173,40.63,15.558,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.622,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const [authStep, setAuthStep] = useState<'initial' | 'login' | 'signup'>('initial');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  })

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Erreur de connexion Google', description: error.message });
        setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    
    loginForm.setValue('email', email);
    signupForm.setValue('email', email);
    setAuthStep('login'); 

    setIsLoading(false);
  };
  
  const handleLogin = async (data: LoginFormValues) => {
    if(!supabase) return;
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur de connexion', description: error.message });
    } else {
      toast({ title: 'Connexion réussie!', description: 'Finalisation de votre réservation...' });
      onAuthSuccess(true);
    }
    setIsLoading(false);
  };

  const handleSignup = async (data: SignupFormValues) => {
    if(!supabase) return;
    setIsLoading(true);
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: `${data.firstName} ${data.lastName}`,
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Erreur lors de l\'inscription', description: error.message });
    } else if (signUpData.user) {
        
        // Track CompleteRegistration
        pixel.event('CompleteRegistration', {
            content_name: 'signup',
            status: 'success'
        });

        toast({
            title: 'Compte créé!',
            description: "Veuillez vérifier votre e-mail pour confirmer votre compte. Ensuite, revenez et connectez-vous.",
        });
        setAuthStep('login');
        onAuthSuccess(false);
    }
    setIsLoading(false);
  };
  
  if (authStep === 'login') {
    return (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 p-4">
             <Button variant="outline" className="w-full" onClick={() => setAuthStep('initial')}>
                Retour
            </Button>
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="nom@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Se connecter et réserver
            </Button>
            <p className="text-center text-sm">
                Nouveau ici? <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setAuthStep('signup')}>Créer un compte.</Button>
            </p>
          </form>
        </Form>
    )
  }
  
  if (authStep === 'signup') {
    return (
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 p-4">
             <Button variant="outline" className="w-full" onClick={() => setAuthStep('initial')}>
                Retour
            </Button>
            <div className="grid grid-cols-2 gap-4">
               <FormField control={signupForm.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
               <FormField control={signupForm.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Dupont" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={signupForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input placeholder="nom@exemple.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={signupForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                S'inscrire et Réserver
            </Button>
            <p className="text-center text-sm">
                Déjà un compte? <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setAuthStep('login')}>Se connecter.</Button>
            </p>
          </form>
        </Form>
    )
  }

  return (
    <div className="p-4 space-y-4">
       <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continuer avec Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              OU
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input 
                id="email" 
                placeholder="nom@exemple.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>
           <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuer
            </Button>
        </form>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
          En cliquant sur continuer, vous acceptez nos{' '}
          <a href="/termos-de-condicao" target="_blank" className="underline underline-offset-4 hover:text-primary">
            Conditions d'utilisation
          </a>{' '}
          et notre{' '}
          <a href="/politica-de-privacidade" target="_blank" className="underline underline-offset-4 hover:text-primary">
            Politique de confidentialité
          </a>
          .
        </p>
    </div>
  )
}