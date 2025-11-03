'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';

const profileSchema = z.object({
  first_name: z.string().min(1, { message: 'Le nom est requis.' }),
  last_name: z.string().min(1, { message: 'Le nom de famille est requis.' }),
  email: z.string().email({ message: 'Adresse e-mail invalide.' }).optional(),
  phone: z.string().min(1, { message: 'Le numéro de téléphone est requis.' }),
  dob: z.date({
    required_error: 'Une date de naissance est requise.',
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileDetailsForm() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [dobDay, setDobDay] = useState<string | undefined>();
  const [dobMonth, setDobMonth] = useState<string | undefined>();
  const [dobYear, setDobYear] = useState<string | undefined>();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
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
            ...profile,
            email: user?.email || '',
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
  }, [form]);

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
          first_name: data.first_name,
          last_name: data.last_name,
          display_name: `${data.first_name} ${data.last_name}`,
          phone: data.phone,
          dob: format(data.dob, 'yyyy-MM-dd'),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Profil mis à jour!',
        description: 'Vos informations ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Oh non! Quelque chose s\'est mal passé.',
        description: 'Impossible de mettre à jour le profil.',
      });
    }
  };

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
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
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
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
              <FormLabel>Date de naissance</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                <Select onValueChange={setDobDay} value={dobDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setDobMonth} value={dobMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={String(month)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setDobYear} value={dobYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Sauvegarder les modifications
        </Button>
      </form>
    </Form>
  );
}
