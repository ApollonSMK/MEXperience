'use client';

import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, orderBy, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialPlans = [
    {
      id: 'plan_essentiel',
      title: 'Plan Essentiel',
      price: '€49',
      period: '/mois',
      minutes: 50,
      pricePerMinute: 49 / 50,
      sessions: '2 à 3',
      features: [
        'Hydromassage',
        'Collagen Boost',
        'Dôme Infrarouge',
        'Banc Solaire',
        '1 invité par mois',
      ],
      popular: false,
      order: 1,
    },
    {
      id: 'plan_avantage',
      title: 'Plan Avantage',
      price: '€79',
      period: '/mois',
      minutes: 90,
      pricePerMinute: 79 / 90,
      sessions: '4 à 6',
      features: [
        'Accès à tous les services',
        'Priorité de réservation',
        '2 invités par mois',
        '5% de réduction sur les forfaits',
      ],
      popular: true,
      order: 2,
    },
    {
      id: 'plan_privilege',
      title: 'Plan Privilège',
      price: '€99',
      period: '/mois',
      minutes: 130,
      pricePerMinute: 99 / 130,
      sessions: '6 à 9',
      features: [
        'Accès à tous les services',
        'Priorité de réservation',
        '10% de réduction sur les produits',
        '1 invité par semaine',
        'Forfaits et Réductions Exclusifs',
      ],
      popular: false,
      order: 3,
    },
  ];


export default function AdminPlansPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const plansCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'plans'), orderBy('order'));
  }, [firestore]);

  const { data: plans, isLoading, error, mutate } = useCollection<any>(plansCollectionRef);

  const handleSeedPlans = async () => {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Erro de Conexão",
            description: "Não foi possível conectar ao banco de dados.",
        });
        return;
    }

    try {
        for (const plan of initialPlans) {
            const planRef = doc(firestore, 'plans', plan.id);
            // Using non-blocking set, but you can await if you want to show a final toast
            setDocumentNonBlocking(planRef, plan, {});
        }

        toast({
            title: "Planos Criados!",
            description: "Os planos iniciais foram adicionados ao banco de dados.",
        });

        // Optimistically update the UI by forcing a re-fetch of the collection
        mutate();
    } catch (e: any) {
        console.error("Error seeding plans:", e);
        toast({
            variant: "destructive",
            title: "Erro ao criar planos",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        Chargement des planos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm text-red-500">
        Erreur: {error.message}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Planos de Assinatura</CardTitle>
            <CardDescription>Gerencie os planos de assinatura disponíveis para os usuários.</CardDescription>
          </div>
          <Button>
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
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
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
  );
}
