'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Rocket, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export interface PricingTier {
  duration: number;
  price: number;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    pricing_tiers: PricingTier[];
    order: number;
    color: string;
    is_under_maintenance?: boolean;
}

const initialServices: Omit<Service, 'id'>[] = [
  {
    name: 'Hydromassage',
    description: 'Détendez-vous et soulagez les tensions musculaires grâce à de puissants jets d\'eau.',
    pricing_tiers: [
      { duration: 15, price: 30 },
      { duration: 30, price: 55 },
      { duration: 45, price: 75 },
    ],
    order: 1,
    color: '#3b82f6',
    is_under_maintenance: false,
  },
  {
    name: 'Collagen Boost',
    description: 'Rajeunissez votre peau et boostez la production naturelle de collagène.',
    pricing_tiers: [
      { duration: 20, price: 50 },
      { duration: 40, price: 90 },
    ],
    order: 2,
    color: '#ec4899',
    is_under_maintenance: false,
  },
  {
    name: 'Dôme Infrarouge',
    description: 'Détoxifiez votre corps et apaisez votre esprit dans notre dôme infrarouge.',
    pricing_tiers: [
      { duration: 30, price: 45 },
      { duration: 60, price: 80 },
    ],
    order: 3,
    color: '#f97316',
    is_under_maintenance: false,
  },
  {
    name: 'Banc Solaire',
    description: 'Obtenez un bronzage doré parfait dans notre solarium de dernière génération.',
    pricing_tiers: [
      { duration: 10, price: 10 },
      { duration: 15, price: 15 },
      { duration: 20, price: 20 },
    ],
    order: 4,
    color: '#f59e0b',
    is_under_maintenance: true,
  },
];

export default function AdminServicesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase.from('services').select('*').order('order');
    if (error) {
      setError(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar serviços', description: error.message });
    } else {
      setServices(data as Service[] || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSeedServices = async () => {
    try {
      const servicesToInsert = initialServices.map((service, index) => {
        const safeName = service.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '');
        return {
            ...service,
            id: `service_${safeName}_${Date.now() + index}`
        }
      });
      
      const { error } = await supabase.from('services').upsert(servicesToInsert, { onConflict: 'id' });
      if (error) throw error;

      toast({
        title: "Serviços Criados!",
        description: "Os serviços iniciais foram adicionados ao banco de dados.",
      });
      fetchServices();
    } catch (e: any) {
      console.error("Error seeding services:", e);
      toast({
        variant: "destructive",
        title: "Erro ao criar serviços",
        description: e.message || "Ocorreu um erro inesperado.",
      });
    }
  };

  const handleOpenDeleteDialog = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    try {
        const { error } = await supabase.from('services').delete().eq('id', selectedService.id);
        if (error) throw error;
        toast({
            title: "Serviço Removido!",
            description: `O serviço '${selectedService.name}' foi removido com sucesso.`,
        });
        fetchServices();
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


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
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
            <Button onClick={() => router.push('/admin/services/new')}>
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
                  <TableHead>Estado</TableHead>
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
                        {service.pricing_tiers?.map(tier => (
                           <Badge key={tier.duration} variant="secondary">
                             {tier.duration}min / €{tier.price}
                           </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.is_under_maintenance ? (
                        <Badge variant="destructive">
                          <Wrench className="mr-1 h-3 w-3" />
                          Manutenção
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Ativo</Badge>
                      )}
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
                          <DropdownMenuItem onClick={() => router.push(`/admin/services/${service.id}`)}>Editar</DropdownMenuItem>
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