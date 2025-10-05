
'use server';

import { createClient } from '@/lib/supabase/server';
import { services as fallbackServices, type Service } from './services';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export async function getServices(): Promise<Service[]> {
  const supabase = createClient();

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

  return data.map(service => ({
    ...service,
    allowed_plans: service.allowed_plans || [],
  }));
}

const UpdateServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  description: z.string().nullable(),
  longDescription: z.string().nullable(),
  icon: z.string().nullable(),
  imageId: z.string().nullable(),
  durations: z.array(z.number()),
  allowed_plans: z.array(z.string()).optional(),
});


export async function updateService(formData: FormData) {
    const rawData = {
        id: formData.get('id'),
        name: formData.get('name'),
        description: formData.get('description') || null,
        longDescription: formData.get('longDescription') || null,
        icon: formData.get('icon') || null,
        imageId: formData.get('imageId') || null,
        durations: (formData.get('durations') as string || "")
            .split(',')
            .map(d => parseInt(d.trim(), 10))
            .filter(d => !isNaN(d)),
        allowed_plans: (formData.get('allowed_plans') as string || "")
            .split(',')
            .filter(p => p.trim() !== ''),
    };
  
    const validatedFields = UpdateServiceSchema.safeParse(rawData);
    
    if (!validatedFields.success) {
        console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
        return {
        success: false,
        error: 'Dados inválidos.',
        };
    }

    const { id, ...dataToUpdate } = validatedFields.data;
    
    try {
        const supabase = createClient();

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
    } catch(e) {
        console.error('Catch Error:', e);
        return { success: false, error: 'Ocorreu um erro inesperado no servidor.' };
    }
}

const CreateServiceSchema = z.object({
  id: z.string().min(3, "O ID deve ter pelo menos 3 caracteres."),
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  description: z.string().nullable(),
  longDescription: z.string().nullable(),
  icon: z.string().nullable(),
  imageId: z.string().nullable(),
  durations: z.array(z.number()),
  allowed_plans: z.array(z.string()).optional(),
});


export async function createService(formData: FormData) {
    const rawData = {
        id: formData.get('id') as string,
        name: formData.get('name') as string,
        description: formData.get('description') || null,
        longDescription: formData.get('longDescription') || null,
        icon: formData.get('icon') || null,
        imageId: formData.get('imageId') || null,
        durations: (formData.get('durations') as string || "")
            .split(',')
            .map(d => parseInt(d.trim(), 10))
            .filter(d => !isNaN(d) && d > 0),
        allowed_plans: (formData.get('allowed_plans') as string || "")
            .split(',')
            .filter(p => p.trim() !== ''),
    };

    const validatedFields = CreateServiceSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
        return {
        success: false,
        error: 'Dados inválidos para criar o serviço.',
        };
    }

    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('services')
            .insert(validatedFields.data);

        if (error) {
            console.error('Create Error:', error);
            return { success: false, error: `Não foi possível criar o serviço: ${error.message}` };
        }
        
        revalidatePath('/admin/services');
        revalidatePath('/');
        revalidatePath('/services');
        return { success: true };
    } catch(e) {
         console.error('Catch Error:', e);
        return { success: false, error: 'Ocorreu um erro inesperado no servidor ao criar.' };
    }
}

export async function deleteService(serviceId: string) {
    if (!serviceId) {
        return { success: false, error: 'ID do serviço inválido.' };
    }

    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', serviceId);
        
        if (error) {
            console.error('Delete Error:', error);
            return { success: false, error: `Não foi possível eliminar o serviço: ${error.message}` };
        }

        revalidatePath('/admin/services');
        revalidatePath('/');
        revalidatePath('/services');
        return { success: true };

    } catch (e: any) {
        console.error('Catch Error:', e);
        return { success: false, error: e.message || 'Ocorreu um erro inesperado no servidor ao eliminar.' };
    }
}

    