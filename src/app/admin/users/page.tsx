'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
    id: string;
    display_name?: string;
    email?: string;
    photo_url?: string;
    phone?: string;
    creation_time?: string;
    is_admin?: boolean;
    plan_id?: string;
}

interface Plan {
    id: string;
    title: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsersAndPlans = async () => {
        setIsLoading(true);
        setError(null);

        const usersPromise = supabase.from('profiles').select('*');
        const plansPromise = supabase.from('plans').select('id, title');
        
        const [{ data: usersData, error: usersError }, { data: plansData, error: plansError }] = await Promise.all([
            usersPromise,
            plansPromise,
        ]);

        if (usersError) {
            setError(usersError);
        } else {
            setUsers(usersData as UserProfile[] || []);
        }
        
        if (plansError) {
            // Non-critical error, we can still display users
            console.error("Error fetching plans:", plansError);
        } else {
            setPlans(plansData as Plan[] || []);
        }

        setIsLoading(false);
    };
    fetchUsersAndPlans();
  }, [supabase]);

  const getInitials = (name?: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'U';
  };
  
  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };
  
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (activeTab === 'users') {
      return users.filter(user => !!user.creation_time);
    }
    if (activeTab === 'guests') {
      return users.filter(user => !user.creation_time);
    }
    if (activeTab === 'subscribers') {
        return users.filter(user => !!user.plan_id);
    }
    return users;
  }, [users, activeTab]);
  
  const getUserBadge = (user: UserProfile) => {
    if (user.is_admin) {
      return <Badge variant="default">Admin</Badge>;
    }
    if (user.creation_time) {
      return <Badge variant="secondary">Utilisateur</Badge>;
    }
    return <Badge variant="outline">Invité</Badge>;
  }
  
  const getPlanName = (planId?: string) => {
      if (!planId) return null;
      const plan = plans.find(p => p.id === planId);
      return plan ? <Badge variant="default">{plan.title}</Badge> : <Badge variant="secondary">Plano Desconhecido</Badge>;
  }

  const renderUserTable = (usersList: any[], isSubscriberTab: boolean = false) => {
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
                <TableHead>{isSubscriberTab ? "Abonnement" : "Rôle"}</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {usersList && usersList.length > 0 ? (
                usersList.map((user) => (
                <TableRow key={user.id} onClick={() => handleRowClick(user.id)} className="cursor-pointer">
                    <TableCell>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photo_url || ''} alt={user.display_name || 'User'} />
                        <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="font-medium">{user.display_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                    {user.creation_time ? format(new Date(user.creation_time), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {isSubscriberTab ? getPlanName(user.plan_id) : getUserBadge(user)}
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

  if (error) {
    return <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm text-red-500">Erreur: {error.message}</div>;
  }

  return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
            <CardDescription>Une liste de tous les utilisateurs de votre compte. Cliquez sur un utilisateur pour voir les détails.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="subscribers">Subscritos</TabsTrigger>
                    <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                    <TabsTrigger value="guests">Invités</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    {renderUserTable(filteredUsers)}
                </TabsContent>
                <TabsContent value="subscribers" className="mt-4">
                    {renderUserTable(filteredUsers, true)}
                </TabsContent>
                <TabsContent value="users" className="mt-4">
                    {renderUserTable(filteredUsers)}
                </TabsContent>
                <TabsContent value="guests" className="mt-4">
                     {renderUserTable(filteredUsers)}
                </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </>
  );
}
