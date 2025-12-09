'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, getPlans } from './actions';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserProfile {
    id: string;
    display_name?: string;
    email?: string;
    photo_url?: string;
    phone?: string;
    creation_time?: string;
    is_admin?: boolean;
    plan_id?: string;
    first_name?: string;
    last_name?: string;
    // Fields from DB or Stripe
    subscription_start_date?: number | string;
    subscription_end_date?: number | string;
    stripe_cancel_at_period_end?: boolean;
    stripe_subscription_status?: string;
}

interface Plan {
  id: string;
  title: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersAndPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
        const [usersData, plansData] = await Promise.all([
            getAllUsers(),
            getPlans()
        ]);

        setUsers(usersData);
        setPlans(plansData);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndPlans();
  }, [fetchUsersAndPlans]);

  const getInitials = (name?: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'U';
  };

  const getUserPhotoUrl = (user: UserProfile) => {
    // Prioriza a foto do perfil se existir
    if (user.photo_url) {
      return user.photo_url;
    }
    // Se não tiver photo_url, pode ser que o usuário veio do Google
    // e a foto esteja nos metadados (precisamos buscar isso)
    return null;
  };
  
  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };
  
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users;
    
    // Apply tab filter
    if (activeTab === 'users') {
      filtered = filtered.filter(user => !user.plan_id);
    }
    if (activeTab === 'subscribers') {
        filtered = filtered.filter(user => !!user.plan_id);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [users, activeTab, searchTerm]);
  
  const getUserStatusBadge = (user: UserProfile) => {
    if (user.is_admin) {
      return <Badge variant="default">Admin</Badge>;
    }
    const plan = plans.find(p => p.id === user.plan_id);
    if (plan) {
      return <Badge variant="secondary" className="bg-primary/10 text-primary">{plan.title}</Badge>;
    }
    return <Badge variant="outline">Utilisateur</Badge>;
  }

  const getSubscriptionStatusBadge = (user: UserProfile) => {
    if (!user.plan_id || !user.subscription_end_date) {
        return <Badge variant="outline">N/A</Badge>;
    }

    if (user.stripe_subscription_status === 'past_due') {
        return <Badge variant="destructive">Paiement en retard</Badge>;
    }

    if (user.stripe_cancel_at_period_end) {
        return <Badge variant="destructive">Annulation programmée</Badge>;
    }

    const endDate = typeof user.subscription_end_date === 'string' 
        ? new Date(user.subscription_end_date) 
        : new Date(user.subscription_end_date * 1000);

    const daysUntilEnd = differenceInDays(endDate, new Date());

    if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Expire bientôt</Badge>;
    }
    
    if (user.stripe_subscription_status === 'active') {
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Actif</Badge>;
    }

    // Fallback for other statuses
    return <Badge variant="outline">{user.stripe_subscription_status || 'Inconnu'}</Badge>;
  }

  const renderUserTable = (usersList: any[]) => {
    if (isLoading) {
        return (
          <div className="space-y-2 mt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        );
    }
    
    return (
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                <TableHead className="hidden lg:table-cell">Date de Création</TableHead>
                <TableHead>Statut</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {usersList && usersList.length > 0 ? (
                usersList.map((user) => (
                <TableRow key={user.id} onClick={() => handleRowClick(user.id)} className="cursor-pointer">
                    <TableCell>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={getUserPhotoUrl(user) || ''} alt={user.display_name || 'User'} />
                        <AvatarFallback>{getInitials(user.display_name || user.first_name + ' ' + user.last_name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="font-medium">{user.display_name || `${user.first_name || ''} ${user.last_name || ''}` || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                    {user.creation_time ? format(new Date(user.creation_time), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getUserStatusBadge(user)}
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                    Aucun utilisateur trouvé.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
    )
  }

  const renderSubscribersTable = (usersList: any[]) => {
    if (isLoading) {
        return (
          <div className="space-y-2 mt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        );
    }
    
    return (
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Abonné</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin / Renouvellement</TableHead>
                <TableHead>Statut</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {usersList && usersList.length > 0 ? (
                usersList.map((user) => (
                <TableRow key={user.id} onClick={() => handleRowClick(user.id)} className="cursor-pointer">
                    <TableCell>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={getUserPhotoUrl(user) || ''} alt={user.display_name || 'User'} />
                        <AvatarFallback>{getInitials(user.display_name || user.first_name + ' ' + user.last_name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="font-medium">{user.display_name || `${user.first_name || ''} ${user.last_name || ''}` || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>
                        {plans.find(p => p.id === user.plan_id)?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                        {user.subscription_start_date ? format(new Date(typeof user.subscription_start_date === 'string' ? user.subscription_start_date : user.subscription_start_date * 1000), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                        {user.subscription_end_date ? format(new Date(typeof user.subscription_end_date === 'string' ? user.subscription_end_date : user.subscription_end_date * 1000), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getSubscriptionStatusBadge(user)}
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                    Aucun abonné trouvé.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
    )
  }

  if (error) {
    return <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm text-red-500">Erreur: {error}</div>;
  }

  return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
            <CardDescription>Une liste de tous les utilisateurs de votre compte. Cliquez sur un utilisateur pour voir les détails.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, prénom ou email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="subscribers">Abonnés</TabsTrigger>
                    <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    {renderUserTable(filteredUsers)}
                </TabsContent>
                <TabsContent value="subscribers" className="mt-4">
                    {renderSubscribersTable(filteredUsers)}
                </TabsContent>
                <TabsContent value="users" className="mt-4">
                    {renderUserTable(filteredUsers)}
                </TabsContent>
            </Tabs>
            </div>
          </CardContent>
        </Card>
      </>
  );
}