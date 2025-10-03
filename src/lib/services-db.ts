
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { services as fallbackServices, type Service } from './services';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// This function can be called from Server Components
export async function getServices(): Promise<Service[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error.message);
    // In case of error (e.g., table not created yet), return the hardcoded fallback.
    // This allows the app to keep working before the DB is set up.
    return fallbackServices;
  }

  // If data is null or empty, it could mean the table is empty.
  // Return fallback data so the app has services to show.
  if (!data || data.length === 0) {
    return fallbackServices;
  }

  return data;
}

const ServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  imageId: z.string().optional(),
  durations: z.array(z.number()).optional(),
});


export async function updateService(serviceData: Service) {
  const validatedFields = ServiceSchema.safeParse(serviceData);

  if (!validatedFields.success) {
    console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: 'Dados inválidos.',
    };
  }

  const { id, ...dataToUpdate } = validatedFields.data;
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from('services')
    .update(dataToUpdate)
    .eq('id', id);

  if (error) {
    console.error('Update Error:', error);
    return { success: false, error: 'Não foi possível atualizar o serviço.' };
  }

  revalidatePath('/admin/services');
  revalidatePath('/');
  revalidatePath('/services');
  return { success: true };
}
