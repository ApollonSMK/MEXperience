'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { ConfirmEmailTemplate } from '@/emails/confirm-email';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const FormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.'),
});

export async function login(prevState: string | undefined, formData: FormData) {
  const supabase = createClient();
  const validatedFields = FormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return 'Invalid form data.';
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return 'Por favor, confirme seu email antes de fazer login.';
    }
    return 'Could not authenticate user.';
  }

  revalidatePath('/', 'layout');
  redirect('/profile');
}

const SignupFormSchema = z
  .object({
    first_name: z.string().min(2, 'Por favor, insira o seu nome.'),
    last_name: z.string().min(2, 'Por favor, insira o seu sobrenome.'),
    email: z.string().email('Por favor, insira um email válido.'),
    phone: z.string().min(9, 'Por favor, insira um telefone válido.'),
    password: z
      .string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirm_password: z
      .string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    terms: z.literal('on', {
      errorMap: () => ({ message: 'Você deve aceitar os termos e condições.' }),
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'As senhas não coincidem.',
    path: ['confirm_password'],
  });

export async function signup(prevState: string | undefined, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors
      .map((e) => e.message)
      .join(', ');
    return `Dados inválidos: ${errorMessages}`;
  }

  const {
    email,
    password,
    first_name,
    last_name,
    phone,
  } = validatedFields.data;
  const full_name = `${first_name} ${last_name}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');
  console.log('Supabase Service Key:', supabaseServiceKey ? 'Loaded' : 'Missing');
  console.log('Resend API Key:', resendApiKey ? 'Loaded' : 'Missing');

  if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    return 'Variáveis de ambiente em falta no servidor. A configuração está incompleta.';
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);
  const supabase = createClient();
  
  // We check if the user exists first.
  const { data: existingUser, error: userError } = await supabase.from('users').select('id').eq('email', email).maybeSingle();

  if(userError) {
    console.error('Error checking for existing user:', userError);
    return 'Ocorreu um erro. Por favor, tente novamente.';
  }

  if (existingUser) {
     return 'Já existe uma conta com este email.';
  }

  const { data: { user }, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: {
        full_name,
        phone,
    },
    email_confirm: true, // Mark as confirmed to prevent Supabase from sending its own email.
  });

  if (signUpError) {
    console.error('Signup Error:', signUpError);
    return `Não foi possível registar o utilizador: ${signUpError.message}`;
  }

  if (!user) {
    return 'Não foi possível criar o utilizador. Por favor, tente novamente.';
  }
  
  const siteUrl = 'https://6000-firebase-studio-1758837619142.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev';
  
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
  });

  if (linkError || !linkData?.properties?.action_link) {
      console.error('Error generating magic link:', linkError);
      return 'Ocorreu um erro ao gerar o link de confirmação.';
  }

  const confirmationLink = linkData.properties.action_link;

  const resend = new Resend(resendApiKey);
  try {
    await resend.emails.send({
      from: 'M.E Wellness <onboarding@resend.dev>',
      to: email,
      subject: 'Confirme a sua conta na M.E. Wellness',
      react: ConfirmEmailTemplate({
        userEmail: email,
        confirmationLink: confirmationLink,
      }),
    });
  } catch (error) {
    console.error('Resend Error:', error);
    return 'Não foi possível enviar o email de confirmação.';
  }
  
  redirect(`/auth/confirm?email=${email}`);
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function signupWithGoogle() {
  const supabase = createClient();
  const siteUrl = 'https://6000-firebase-studio-1758837619142.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    redirect('/login?message=Could not authenticate with Google');
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function resendConfirmationEmail(email: string) {
    if (!email) {
        return { success: false, message: 'Email não fornecido.' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
        return { success: false, message: 'Variáveis de ambiente em falta no servidor.' };
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);
    const siteUrl = 'https://6000-firebase-studio-1758837619142.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev';
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            redirectTo: `${siteUrl}/auth/callback`
        }
    });

    if (linkError || !linkData?.properties?.action_link) {
        console.error('Error resending confirmation email (link generation):', linkError);
        return { success: false, message: 'Ocorreu um erro ao gerar um novo link de confirmação.' };
    }

    const confirmationLink = linkData.properties.action_link;

    const resend = new Resend(resendApiKey);
    try {
        await resend.emails.send({
            from: 'M.E Wellness <onboarding@resend.dev>',
            to: email,
            subject: 'Confirme a sua conta na M.E. Wellness (Reenvio)',
            react: ConfirmEmailTemplate({
                userEmail: email,
                confirmationLink: confirmationLink,
            }),
        });
        return { success: true, message: 'Email de confirmação reenviado com sucesso!' };
    } catch (error) {
        console.error('Resend Error (resending):', error);
        return { success: false, message: 'Ocorreu um erro ao reenviar o email. Tente novamente mais tarde.' };
    }
}
