'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { UserProfile } from './admin-appointment-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const clientSchema = z.object({
  first_name: z.string().min(2, "Le prénom est requis."),
  last_name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide").optional().or(z.literal('')),
  phone: z.string().optional(),
  // New fields
  gender: z.enum(['male', 'female', 'other']).optional(),
  birth_date: z.date().optional(),
  language: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface AdminClientCreatorProps {
  onSuccess: (newClient: UserProfile) => void;
  onCancel: () => void;
}

export function AdminClientCreator({ onSuccess, onCancel }: AdminClientCreatorProps) {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      language: 'fr',
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    setIsLoading(true);
    try {
      // 1. Check if email already exists (if provided)
      if (values.email) {
          const { data: existing } = await supabase.from('profiles').select('id').eq('email', values.email).single();
          if (existing) {
              toast({ variant: 'destructive', title: 'Erreur', description: 'Un client avec cet email existe déjà.' });
              setIsLoading(false);
              return;
          }
      }

      // 2. Create Profile
      const displayName = `${values.first_name} ${values.last_name}`.trim();
      const { data, error } = await supabase.from('profiles').insert({
        first_name: values.first_name,
        last_name: values.last_name,
        display_name: displayName,
        email: values.email || null,
        phone: values.phone || null,
        minutes_balance: 0,
        // birth_date: values.birth_date ? format(values.birth_date, 'yyyy-MM-dd') : null, // Assuming DB has this field or metadata
        // For now storing extra info in metadata if schema doesn't support columns directly yet, or ignoring if strict.
        // Assuming basic profile fields for now based on existing types.
      }).select().single();

      if (error) throw error;

      toast({ title: 'Succès', description: 'Client créé avec succès.' });
      onSuccess(data as UserProfile);

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible de créer le client.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (first: string, last: string) => {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const firstName = form.watch('first_name');
  const lastName = form.watch('last_name');

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-3 p-6 pb-2">
            <Button variant="outline" onClick={onCancel} className="rounded-full px-6 border-slate-300 h-10">
                Fermer
            </Button>
            <Button 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={isLoading}
                className="rounded-full px-8 bg-black hover:bg-slate-800 text-white h-10 shadow-lg"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-16 pb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Ajouter un nouveau client</h1>

            <div className="flex gap-10 items-start">
                
                {/* Left Sidebar Menu (Mock) */}
                <div className="w-64 shrink-0 hidden lg:block space-y-1">
                     <div className="space-y-4 border rounded-xl p-4">
                        <h3 className="font-semibold px-2">Personnel</h3>
                        <nav className="space-y-1">
                            <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium text-sm">
                                Profil
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 font-medium text-sm">
                                Adresses
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 font-medium text-sm">
                                Contacts d'urgence
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 font-medium text-sm">
                                Configurations
                            </button>
                        </nav>
                     </div>
                </div>

                {/* Main Form Content */}
                <div className="flex-1 max-w-3xl">
                    <Form {...form}>
                        <form className="space-y-10">
                            
                            {/* Profile Section */}
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">Profil</h2>
                                    <p className="text-muted-foreground text-sm">Gérez le profil personnel de votre client.</p>
                                </div>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative group cursor-pointer">
                                        <Avatar className="h-24 w-24 bg-indigo-50 text-indigo-600 border-2 border-white shadow-sm">
                                            <AvatarFallback className="text-2xl font-semibold bg-indigo-50 text-indigo-600">
                                                {firstName || lastName ? getInitials(firstName, lastName) : <User className="h-10 w-10 opacity-50"/>}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow border border-slate-200 text-slate-500 group-hover:text-primary transition-colors">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-900 font-semibold">Prénom</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: João" {...field} className="h-11 bg-white border-slate-200" />
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
                                                <FormLabel className="text-slate-900 font-semibold">Nom de famille</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Dupont" {...field} className="h-11 bg-white border-slate-200" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-900 font-semibold">Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="exemple@domaine.fr" {...field} className="h-11 bg-white border-slate-200" />
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
                                                <FormLabel className="text-slate-900 font-semibold">Numéro de téléphone</FormLabel>
                                                <div className="flex gap-2">
                                                    <div className="h-11 px-3 border border-slate-200 rounded-md bg-white flex items-center text-sm font-medium text-slate-600 shrink-0">
                                                        +352
                                                    </div>
                                                    <FormControl>
                                                        <Input placeholder="Ex: 621 123 456" {...field} className="h-11 bg-white border-slate-200" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <FormField
                                        control={form.control}
                                        name="birth_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-slate-900 font-semibold">Date de naissance</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "h-11 pl-3 text-left font-normal border-slate-200",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", { locale: fr })
                                                                ) : (
                                                                    <span>Sélectionner une date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-900 font-semibold">Genre</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-white border-slate-200">
                                                            <SelectValue placeholder="Sélectionner une option" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="female">Femme</SelectItem>
                                                        <SelectItem value="male">Homme</SelectItem>
                                                        <SelectItem value="other">Autre</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>
                            
                            <Separator className="bg-slate-100" />

                            {/* Additional Info Section */}
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">Informations additionnelles</h2>
                                    <p className="text-muted-foreground text-sm">Gérez les informations supplémentaires.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="language"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-900 font-semibold">Langue préférée</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-white border-slate-200">
                                                            <SelectValue placeholder="Sélectionner une langue" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="fr">Français</SelectItem>
                                                        <SelectItem value="en">Anglais</SelectItem>
                                                        <SelectItem value="pt">Portugais</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <FormLabel className="text-slate-900 font-semibold">Notes</FormLabel>
                                        <Input placeholder="Notes internes sur le client..." className="h-11 bg-white border-slate-200" />
                                    </div>
                                </div>
                            </section>

                        </form>
                    </Form>
                </div>
            </div>
        </div>
    </div>
  );
}