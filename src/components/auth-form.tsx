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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse e-mail invalide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
})

const signupSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Le nom est requis.' }),
    lastName: z.string().min(1, { message: 'Le nom de famille est requis.' }),
    email: z.string().email({ message: 'Adresse e-mail invalide.' }),
    password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })

type LoginFormValues = z.infer<typeof loginSchema>
type SignupFormValues = z.infer<typeof signupSchema>

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false)

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
      confirmPassword: '',
    },
  })

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur de connexion', description: error.message });
    } else {
      toast({ title: 'Connexion réussie!', description: 'Finalisation de votre réservation...' });
      onAuthSuccess();
    }
    setIsLoading(false);
  };

  const handleSignup = async (data: SignupFormValues) => {
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
        toast({
            title: 'Compte créé!',
            description: "Veuillez vérifier votre e-mail pour confirmer votre compte. Ensuite, revenez et connectez-vous.",
        });
        // The trigger will handle profile creation. After confirmation, user needs to login.
    }
    setIsLoading(false);
  };

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Connexion</TabsTrigger>
        <TabsTrigger value="signup">S'inscrire</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 p-4">
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
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="signup">
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField control={signupForm.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Jean" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
               <FormField control={signupForm.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Sobrenome</FormLabel><FormControl><Input placeholder="Dupont" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={signupForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input placeholder="nom@exemple.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={signupForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirmer le mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                S'inscrire
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  )
}
