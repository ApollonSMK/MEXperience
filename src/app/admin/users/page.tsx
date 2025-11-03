'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading, error } = useCollection<any>(usersCollectionRef);

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
    // Guests are users without a creationTime (created manually by admin)
    if (activeTab === 'users') {
      return users.filter(user => !!user.creationTime);
    }
    if (activeTab === 'guests') {
      return users.filter(user => !user.creationTime);
    }
    return users;
  }, [users, activeTab]);
  
  const getUserBadge = (user: any) => {
    if (user.isAdmin) {
      return <Badge variant="default">Admin</Badge>;
    }
    // Check if the user is a registered user or a guest
    if (user.creationTime) {
      return <Badge variant="secondary">Utilizador</Badge>;
    }
    return <Badge variant="outline">Convidado</Badge>;
  }


  const renderUserTable = (usersList: any[]) => {
    return (
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                <TableHead className="hidden lg:table-cell">Date de création</TableHead>
                <TableHead>Role</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {usersList && usersList.length > 0 ? (
                usersList.map((user) => (
                <TableRow key={user.id} onClick={() => handleRowClick(user.id)} className="cursor-pointer">
                    <TableCell>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="font-medium">{user.displayName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                    {user.creationTime ? format(new Date(user.creationTime.seconds * 1000), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getUserBadge(user)}
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

  if (isLoading) {
    return <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">Chargement des utilisateurs...</div>;
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
                <TabsList>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="users">Utilizadores</TabsTrigger>
                    <TabsTrigger value="guests">Convidados</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    {renderUserTable(filteredUsers)}
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

    