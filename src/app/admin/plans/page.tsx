'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlanForm, type PlanFormValues } from '@/components/plan-form';
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
import type { Service } from '@/app/admin/services/page';

interface Plan {
    id: string;
    title: string;
    price: string;
    period: string;
    minutes: number;
    sessions: string;
    features: string[];
    benefits: any;
    popular: boolean;
    order: number;
    pricePerMinute?: number;
}

const initialPlans: Omit<Plan, 'id' | 'pricePerMinute'>[] = [
  {
    title: 'Plan Essentiel',
    price: '€49',
    period: '/mois',
    minutes: 50,
    sessions: '2 à 3',
    features: [
      'Hydromassage',
      'Collagen Boost',
      'Dôme Infrarouge',
      'Banc Solaire',
      '1 invité par mois',
    ],
    benefits: {
        includedServices: ['hydromassage', 'collagen-boost', 'dome-infrarouge', 'banc-solaire'],
        guestPasses: { quantity: 1, period: 'month' },
        productDiscount: 0
    },
    popular: false,
    order: 1,
  },
  {
    title: 'Plan Avantage',
    price: '€79',
    period: '/mois',
    minutes: 90,
    sessions: '4 à 6',
    features: [
      'Accès à tous les services',
      'Priorité de réservation',
      '2 invités par mois',
      '5% de réduction sur les forfaits',
    ],
    benefits: {
        includedServices: ['all'],
        guestPasses: { quantity: 2, period: 'month' },
        productDiscount: 5
    },
    popular: true,
    order: 2,
  },
  {
    title: 'Plan Privilège',
    price: '€99',
    period: '/mois',
    minutes: 130,
    sessions: '6 à 9',
    features: [
      'Accès à tous les services',
      'Priorité de réservation',
      '10% de réduction sur les produits',
      '1 invité par semaine',
      'Forfaits et Réductions Exclusifs',
    ],
    benefits: {
        includedServices: ['all'],
        guestPasses: { quantity: 1, period: 'week' },
        productDiscount: 10
    },
    popular: false,
    order: 3,
  },
];

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: plansData, error: plansError } = await supabase.from('plans').select('*').order('order');
    const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('order');

    if (plansError) {
      toast({ variant: 'destructive', title: 'Erro ao carregar planos', description: plansError.message });
    } else {
      setPlans(plansData as Plan[] || []);
    }
    
    if (servicesError) {
        toast({ variant: 'destructive', title: 'Erro ao carregar serviços', description: servicesError.message });
    } else {
        setServices(servicesData as Service[] || []);
    }

    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedPlans = async () => {
    try {
      const plansToInsert = initialPlans.map((plan, index) => {
        const priceNumber = parseInt(plan.price.replace('€', ''), 10);
        return {
            ...plan,
            id: `plan_${index + 1}`,
            price_per_minute: priceNumber / plan.minutes,
        };
      });

      const { error } = await supabase.from('plans').upsert(plansToInsert);
      if (error) throw error;

      toast({
        title: "Planos Criados!",
        description: "Os planos iniciais foram adicionados ao banco de dados.",
      });
      fetchData();
    } catch (e: any) {
      console.error("Error seeding plans:", e);
      toast({
        variant: "destructive",
        title: "Erro ao criar planos",
        description: e.message || "Ocorreu um erro inesperado.",
      });
    }
  };

  const handleOpenDialog = (plan: Plan | null = null) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
        const { error } = await supabase.from('plans').delete().eq('id', selectedPlan.id);
        if (error) throw error;
        toast({
            title: "Plano Removido!",
            description: `O plano '${selectedPlan.title}' foi removido com sucesso.`,
        });
        fetchData();
    } catch (e: any) {
        console.error("Error deleting plan:", e);
        toast({
            variant: "destructive",
            title: "Erro ao remover plano",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
    setIsDeleteDialogOpen(false);
    setSelectedPlan(null);
  };


  const handleFormSubmit = async (values: PlanFormValues) => {
    const id = selectedPlan ? selectedPlan.id : `plan_${Date.now()}`;
    const priceNumber = parseInt(values.price.replace('€', ''), 10);
    
    const dataToSave = {
        id,
        title: values.title,
        price: values.price,
        period: values.period,
        minutes: values.minutes,
        sessions: values.sessions,
        popular: values.popular,
        order: values.order,
        price_per_minute: priceNumber / values.minutes,
        features: values.features.split('\n').map(f => f.trim()).filter(f => f),
        benefits: {
            includedServices: values.includedServices,
            guestPasses: {
                quantity: values.guestPassesQuantity,
                period: values.guestPassesPeriod
            },
            productDiscount: values.productDiscount
        }
    };

    try {
        const { error } = await supabase.from('plans').upsert(dataToSave);
        if (error) throw error;
        toast({
            title: selectedPlan ? "Plano Atualizado!" : "Plano Criado!",
            description: `O plano '${values.title}' foi salvo com sucesso.`,
        });
        setIsDialogOpen(false);
        setSelectedPlan(null);
        fetchData();
    } catch (e: any) {
        console.error("Error saving plan:", e);
        toast({
            variant: "destructive",
            title: "Erro ao salvar plano",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        Chargement des planos...
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Planos de Assinatura</CardTitle>
              <CardDescription>Gerencie os planos de assinatura disponíveis para os usuários.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Minutos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.order}</TableCell>
                    <TableCell className="font-medium">{plan.title}</TableCell>
                    <TableCell>{plan.price}{plan.period}</TableCell>
                    <TableCell>{plan.minutes}</TableCell>
                    <TableCell>
                      {plan.popular ? (
                        <Badge variant="default">Populaire</Badge>
                      ) : (
                        <Badge variant="outline">Standard</Badge>
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(plan)}>Modifier</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(plan)}>Supprimer</DropdownMenuItem>
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
                <h3 className="text-2xl font-bold tracking-tight">Nenhum plano encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Parece que você ainda não tem nenhum plano. Comece por alimentar os dados iniciais.
                </p>
                <Button className="mt-4" onClick={handleSeedPlans}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Alimentar Planos Iniciais
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Modifier le Plan' : 'Ajouter un nouveau Plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? "Modifiez les détails du plan ci-dessous." : "Remplissez les détails pour créer un nouveau plan."}
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            onSubmit={handleFormSubmit}
            initialData={selectedPlan}
            onCancel={() => setIsDialogOpen(false)}
            availableServices={services || []}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
                <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera définitivement le plan 
                <span className="font-semibold"> {selectedPlan?.title} </span>
                de nos serveurs.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive hover:bg-destructive/90">
                Supprimer
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
