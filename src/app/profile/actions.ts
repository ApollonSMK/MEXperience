'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateSubscription(formData: FormData) {
  const planName = formData.get('planName') as string;
  if (!planName) {
    return { success: false, error: 'Plano inválido.' };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_plan: planName })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: 'Não foi possível atualizar a subscrição.' };
  }

  revalidatePath('/profile');
  revalidatePath('/'); // Revalidate home page as well
  return { success: true };
}
