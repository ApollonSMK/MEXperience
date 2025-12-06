'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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

export interface Plan {
    id: string; // This is now the slug
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
    stripe_price_id?: string;
}

const createSlug = (title: string) => {
    return title
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
};


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
    stripe_price_id: 'price_1PISZqEw2ZItA8vCjS8d6A5s',
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
    stripe_price_id: 'price_1PISbZEw2ZItA8vC4Iu7t47i',
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
    stripe_price_id: 'price_1PISchEw2ZItA8vCl9pL2gLz',
  },
];

export default function AdminPlansPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
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
      toast({ variant: 'destructive', title: 'Erreur lors du chargement des plans', description: plansError.message });
    } else {
      setPlans(plansData as Plan[] || []);
    }
    
    if (servicesError) {
        toast({ variant: 'destructive', title: 'Erreur lors du chargement des services', description: servicesError.message });
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
      const plansToInsert = initialPlans.map(plan => {
        const priceNumber = parseInt(plan.price.replace('€', ''), 10);
        return {
            ...plan,
            id: createSlug(plan.title),
            price_per_minute: priceNumber / plan.minutes,
        };
      });

      const { error } = await supabase.from('plans').upsert(plansToInsert, { onConflict: 'id' });
      if (error) throw error;

      toast({
        title: "Plans Créés !",
        description: "Les plans initiaux ont été ajoutés à la base de données.",
      });
      fetchData();
    } catch (e: any) {
      console.error("Error seeding plans:", e);
      toast({
        variant: "destructive",
        title: "Erreur lors de la création",
        description: e.message || "Une erreur inattendue est survenue.",
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
            title: "Plan Supprimé !",
            description: `Le plan '${selectedPlan.title}' a été supprimé avec succès.`,
        });
        fetchData();
    } catch (e: any) {
        console.error("Error deleting plan:", e);
        toast({
            variant: "destructive",
            title: "Erreur lors de la suppression",
            description: e.message || "Une erreur inattendue est survenue.",
        });
    }
    setIsDeleteDialogOpen(false);
    setSelectedPlan(null);
  };


  const handleFormSubmit = async (values: PlanFormValues) => {
    // The ID is now the slug, generated in the form
    const id = values.slug;
    if (!id) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Le slug du plan n\'a pas pu être généré.'});
        return;
    }
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
        stripe_price_id: values.stripe_price_id,
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
        const { error } = await supabase.from('plans').upsert({
            ...dataToSave,
            price_per_minute: priceNumber / values.minutes,
        }, { onConflict: 'id' });
        if (error) throw error;
        toast({
            title: selectedPlan ? "Plan Mis à Jour !" : "Plan Créé !",
            description: `Le plan '${values.title}' a été enregistré avec succès.`,
        });
        setIsDialogOpen(false);
        setSelectedPlan(null);
        fetchData();
    } catch (e: any) {
        console.error("Error saving plan:", e);
        toast({
            variant: "destructive",
            title: "Erreur lors de l'enregistrement",
            description: e.message || "Une erreur inattendue est survenue.",
        });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        Chargement des plans...
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Plans d'Abonnement</CardTitle>
              <CardDescription>Gérez les plans d'abonnement disponibles pour les utilisateurs.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.order}</TableCell>
                    <TableCell className="font-medium">{plan.title}</TableCell>
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
                <h3 className="text-2xl font-bold tracking-tight">Aucun plan trouvé</h3>
                <p className="text-sm text-muted-foreground">
                  Il semble que vous n'ayez pas encore de plan. Commencez par générer les plans initiaux.
                </p>
                <Button className="mt-4" onClick={handleSeedPlans}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Générer les Plans Initiaux
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