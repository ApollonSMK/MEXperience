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
    return 'Could not authenticate user.';
  }

  revalidatePath('/', 'layout');
  redirect('/profile');
}

const SignupFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.'),
  full_name: z.string().min(2, 'Please enter your full name.'),
});

export async function signup(prevState: string | undefined, formData: FormData) {
  const supabase = createClient();

  const validatedFields = SignupFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return 'Invalid form data.';
  }

  const { email, password, full_name } = validatedFields.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';


  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
      emailRedirectTo: `${new URL(siteUrl).origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === 'user_already_exists') {
      return 'A user with this email already exists.';
    }
    return `Could not sign up user: ${error.message}`;
  }

  revalidatePath('/', 'layout');
  // Usually you would want to show a "Check your email" message
  // For this example, we redirect directly.
  redirect('/profile');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function signupWithGoogle() {
  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${new URL(siteUrl).origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    redirect('/login?message=Could not authenticate with Google');
  }

  if (data.url) {
    redirect(data.url); // Redirect the user to the Google authentication page
  }
}
