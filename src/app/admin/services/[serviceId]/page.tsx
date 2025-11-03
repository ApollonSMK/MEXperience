'use client';

import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
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
  const { serviceId } = params;
  const isNew = serviceId === 'new';

  const firestore = useFirestore();
  const { toast } = useToast();

  const serviceDocRef = useMemoFirebase(() => {
    if (!firestore || isNew) return null;
    return doc(firestore, 'services', serviceId as string);
  }, [firestore, serviceId, isNew]);

  const { data: service, isLoading } = useDoc<ServiceFormValues>(serviceDocRef);

  const handleFormSubmit = async (values: ServiceFormValues) => {
    if (!firestore) return;

    const id = isNew ? doc(collection(firestore, 'services')).id : (serviceId as string);
    const serviceRef = doc(firestore, 'services', id);

    const dataToSave = { ...values, id };

    try {
      await setDocumentNonBlocking(serviceRef, dataToSave, { merge: true });
      toast({
        title: isNew ? "Serviço Criado!" : "Serviço Atualizado!",
        description: `O serviço '${values.name}' foi salvo com sucesso.`,
      });
      router.push('/admin/services');
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
