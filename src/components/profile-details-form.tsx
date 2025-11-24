'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';
import { fr } from 'date-fns/locale';

const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  email: z.string().email({ message: 'Email invalide.' }),
  phone: z.string().optional(),
  dob: z.date({
    required_error: 'Une date de naissance est requise.',
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileDetailsFormProps {
    onUpdateSuccess: () => void;
}

export function ProfileDetailsForm({ onUpdateSuccess }: ProfileDetailsFormProps) {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [dobDay, setDobDay] = useState<string | undefined>();
  const [dobMonth, setDobMonth] = useState<string | undefined>();
  const [dobYear, setDobYear] = useState<string | undefined>();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) {
          form.reset({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: user?.email || '',
            phone: profile.phone || '',
            dob: profile.dob ? new Date(profile.dob) : undefined,
          });
          if (profile.dob) {
            const dobDate = new Date(profile.dob);
            setDobDay(String(dobDate.getUTCDate()));
            setDobMonth(String(dobDate.getUTCMonth() + 1));
            setDobYear(String(dobDate.getUTCFullYear()));
          }
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [form, supabase]);

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const day = parseInt(dobDay, 10);
      const month = parseInt(dobMonth, 10) - 1;
      const year = parseInt(dobYear, 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        form.setValue('dob', date, { shouldValidate: true });
      }
    }
  }, [dobDay, dobMonth, dobYear, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          display_name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          dob: format(data.dob, 'yyyy-MM-dd'),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
      onUpdateSuccess();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "Erreur de mise à jour",
        description: error.message,
      });
    }
  };

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: format(new Date(2000, i, 1), 'MMMM', { locale: fr })
  }));
  const days = dobMonth && dobYear ? Array.from({ length: new Date(parseInt(dobYear), parseInt(dobMonth), 0).getDate() }, (_, i) => i + 1) : Array.from({ length: 31 }, (_, i) => i + 1);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="nom@exemple.com" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="+33 1 23 45 67 89" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dob"
          render={() => (
            <FormItem>
              <FormLabel>Date de Naissance</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                    <Select onValueChange={setDobDay} value={dobDay}>
                        <SelectTrigger>
                            <SelectValue placeholder="Jour" />
                        </SelectTrigger>
                        <SelectContent>
                            {days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select onValueChange={setDobMonth} value={dobMonth}>
                        <SelectTrigger>
                            <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select onValueChange={setDobYear} value={dobYear}>
                        <SelectTrigger>
                             <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </form>
    </Form>
  );
}