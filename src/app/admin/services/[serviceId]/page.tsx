'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ServiceForm, type ServiceFormValues } from '@/components/service-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = getSupabaseBrowserClient();
  
  // Robustly get the service ID, whether it's a string or an array.
  const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
  const isNew = serviceId === 'new';
  
  const { toast } = useToast();

  const [service, setService] = useState<ServiceFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && serviceId) {
      const fetchService = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId) // Use the sanitized serviceId string
          .single();
        
        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao carregar serviço', description: error.message });
          setIsLoading(false);
          return;
        }
        setService(data);
        setIsLoading(false);
      };
      fetchService();
    }
  }, [isNew, serviceId, toast, supabase]);

  const handleFormSubmit = async (values: ServiceFormValues) => {
    const idToSave = isNew ? `service_${Date.now()}` : serviceId;
    const dataToSave = { ...values, id: idToSave };

    try {
      const { error } = await supabase.from('services').upsert(dataToSave);
      if (error) throw error;
      
      toast({
        title: isNew ? "Serviço Criado!" : "Serviço Atualizado!",
        description: `O serviço '${values.name}' foi salvo com sucesso.`,
      });
      router.push('/admin/services');
      router.refresh(); // Force a re-fetch on the services page
    } catch (e: any) {
      console.error("Error saving service:", e);
      toast({
        variant: "destructive",
        title: "Erro ao salvar serviço",
        description: e.message || "Ocorreu um erro inesperado.",
      });
    }
  };
  
  if (isLoading && !isNew) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
        <div>
            <Button variant="ghost" onClick={() => router.push('/admin/services')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Serviços
            </Button>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>{isNew ? 'Adicionar Novo Serviço' : 'Editar Serviço'}</CardTitle>
            <CardDescription>
            {isNew ? "Preencha os detalhes para criar um novo serviço." : "Modifique os detalhes do serviço abaixo."}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ServiceForm
                onSubmit={handleFormSubmit}
                initialData={service}
            />
        </CardContent>
        </Card>
    </div>
  );
}
