
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

  const supabase = createClient();
  const siteUrl = 'https://6000-firebase-studio-1758837619142.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev';

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
        email_confirm: true, // Considera o email como confirmado
      },
    },
  });

  if (error) {
    console.error('Signup Error:', error.message);
    if (error.message.includes('User already registered')) {
        return 'Já existe uma conta com este email.';
    }
    return `Não foi possível registar o utilizador: ${error.message}`;
  }
  
  // Apenas redireciona para a página de boas-vindas
  redirect(`/auth/confirm?email=${email}&name=${first_name}`);
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
    return { success: true, message: 'A confirmação de email não é mais necessária.' };
}
