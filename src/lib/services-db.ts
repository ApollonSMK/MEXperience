
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
    return fallbackServices;
  }

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
  durations: z.array(z.number()),
});


export async function updateService(formData: FormData) {
   const rawData = {
      id: formData.get('id'),
      name: formData.get('name'),
      description: formData.get('description'),
      longDescription: formData.get('longDescription'),
      icon: formData.get('icon'),
      imageId: formData.get('imageId'),
      durations: formData.get('durations'),
   };
  
   const durationsArray = typeof rawData.durations === 'string' 
    ? rawData.durations.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d))
    : [];

  const validatedFields = ServiceSchema.safeParse({ ...rawData, durations: durationsArray });
  
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
