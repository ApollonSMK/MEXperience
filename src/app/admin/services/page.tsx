'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, orderBy, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ServiceForm, type ServiceFormValues } from '@/components/service-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';

export interface PricingTier {
  duration: number;
  price: number;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    pricingTiers: PricingTier[];
    order: number;
    color: string;
}

const initialServices: Omit<Service, 'id'>[] = [
  {
    name: 'Hydromassage',
    description: 'Détendez-vous et soulagez les tensions musculaires grâce à de puissants jets d\'eau.',
    pricingTiers: [
      { duration: 15, price: 30 },
      { duration: 30, price: 55 },
      { duration: 45, price: 75 },
    ],
    order: 1,
    color: '#3b82f6',
  },
  {
    name: 'Collagen Boost',
    description: 'Rajeunissez votre peau et boostez la production naturelle de collagène.',
    pricingTiers: [
      { duration: 20, price: 50 },
      { duration: 40, price: 90 },
    ],
    order: 2,
    color: '#ec4899',
  },
  {
    name: 'Dôme Infrarouge',
    description: 'Détoxifiez votre corps et apaisez votre esprit dans notre dôme infrarouge.',
    pricingTiers: [
      { duration: 30, price: 45 },
      { duration: 60, price: 80 },
    ],
    order: 3,
    color: '#f97316',
  },
  {
    name: 'Banc Solaire',
    description: 'Obtenez un bronzage doré parfait dans notre solarium de dernière génération.',
    pricingTiers: [
      { duration: 10, price: 10 },
      { duration: 15, price: 15 },
      { duration: 20, price: 20 },
    ],
    order: 4,
    color: '#f59e0b',
  },
];

export default function AdminServicesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const servicesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'), orderBy('order'));
  }, [firestore]);

  const { data: services, isLoading, error, mutate } = useCollection<Service>(servicesCollectionRef);

  const handleSeedServices = async () => {
    if (!firestore) return;
    try {
      for (const service of initialServices) {
        const serviceRef = doc(collection(firestore, 'services'));
        await setDocumentNonBlocking(serviceRef, { ...service, id: serviceRef.id }, {});
      }
      toast({
        title: "Serviços Criados!",
        description: "Os serviços iniciais foram adicionados ao banco de dados.",
      });
      mutate();
    } catch (e: any) {
      console.error("Error seeding services:", e);
      toast({
        variant: "destructive",
        title: "Erro ao criar serviços",
        description: e.message || "Ocorreu um erro inesperado.",
      });
    }
  };

  const handleOpenDialog = (service: Service | null = null) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteService = async () => {
    if (!firestore || !selectedService) return;
    try {
        const serviceRef = doc(firestore, 'services', selectedService.id);
        await deleteDocumentNonBlocking(serviceRef);
        toast({
            title: "Serviço Removido!",
            description: `O serviço '${selectedService.name}' foi removido com sucesso.`,
        });
        mutate();
    } catch (e: any) {
        console.error("Error deleting service:", e);
        toast({
            variant: "destructive",
            title: "Erro ao remover serviço",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
    setIsDeleteDialogOpen(false);
    setSelectedService(null);
  };

  const handleFormSubmit = async (values: ServiceFormValues) => {
    if (!firestore) return;
    
    const id = selectedService ? selectedService.id : doc(collection(firestore, 'services')).id;
    const serviceRef = doc(firestore, 'services', id);

    const dataToSave = {
        ...values,
        id,
    };

    try {
        await setDocumentNonBlocking(serviceRef, dataToSave, { merge: true });
        toast({
            title: selectedService ? "Serviço Atualizado!" : "Serviço Criado!",
            description: `O serviço '${values.name}' foi salvo com sucesso.`,
        });
        setIsDialogOpen(false);
        setSelectedService(null);
        mutate();
    } catch (e: any) {
        console.error("Error saving service:", e);
        toast({
            variant: "destructive",
            title: "Erro ao salvar serviço",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        Carregando serviços...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm text-red-500">
        Erro: {error.message}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Serviços</CardTitle>
              <CardDescription>Gerencie os serviços disponíveis para agendamento.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services && services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Níveis de Preço</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.order}</TableCell>
                    <TableCell>
                      <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: service.color }} />
                    </TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{service.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {service.pricingTiers?.map(tier => (
                           <Badge key={tier.duration} variant="secondary">
                             {tier.duration}min / €{tier.price}
                           </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(service)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(service)}>Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-2xl font-bold tracking-tight">Nenhum serviço encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Comece por alimentar os dados iniciais.
                </p>
                <Button className="mt-4" onClick={handleSeedServices}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Alimentar Serviços Iniciais
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
            <DialogDescription>
              {selectedService ? "Modifique os detalhes do serviço abaixo." : "Preencha os detalhes para criar um novo serviço."}
            </DialogDescription>
          </DialogHeader>
          <ServiceForm
            onSubmit={handleFormSubmit}
            initialData={selectedService}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá remover permanentemente o serviço 
                <span className="font-semibold"> {selectedService?.name} </span>
                dos nossos servidores.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteService} className="bg-destructive hover:bg-destructive/90">
                Remover
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
