'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required.'),
  port: z.coerce.number().int().min(1, 'Port is required.'),
  user: z.string().min(1, 'User is required.'),
  password: z.string().min(1, 'Password is required.'),
  encryption: z.enum(['none', 'ssl', 'tls']).default('ssl'),
  sender_name: z.string().min(1, 'Sender Name is required.').default('M.E Experience'),
});

type SmtpFormValues = z.infer<typeof smtpSchema>;

export default function AdminSmtpSettingsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: '',
      port: 587,
      user: '',
      password: '',
      encryption: 'ssl',
      sender_name: 'M.E Experience',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('smtp_settings').select('*').single();

      if (data) {
        form.reset(data);
      } else if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
        toast({
          variant: 'destructive',
          title: 'Error loading settings',
          description: error.message,
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [form, supabase, toast]);

  const onSubmit = async (values: SmtpFormValues) => {
    setIsSubmitting(true);
    try {
      // We use upsert with a fixed ID to ensure there's only one settings row
      const { error } = await supabase.from('smtp_settings').upsert({ id: 1, ...values });
      if (error) throw error;
      toast({
        title: 'Settings Saved!',
        description: 'Your SMTP settings have been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Settings</CardTitle>
        <CardDescription>Configure your external SMTP server for sending application emails.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="smtp.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="587" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="encryption"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Encryption</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an encryption method" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User (Email Address)</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sender_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name (Display Name)</FormLabel>
                  <FormControl>
                    <Input placeholder="M.E Experience" {...field} />
                  </FormControl>
                  <FormDescription>The name that will appear as the sender in the recipient's inbox.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Input type={passwordVisible ? 'text' : 'password'} placeholder="••••••••" {...field} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                            {passwordVisible ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                  </FormControl>
                   <FormDescription>Your password is stored securely and will not be displayed here again.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}