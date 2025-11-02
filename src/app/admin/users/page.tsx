'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { UserEditForm, type UserFormValues } from '@/components/user-edit-form';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading, error, mutate } = useCollection<any>(usersCollectionRef);

  const getInitials = (name?: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'U';
  };
  
  const handleOpenDialog = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (values: UserFormValues) => {
    if (!firestore || !selectedUser) return;
    
    const userRef = doc(firestore, 'users', selectedUser.id);

    try {
        await setDocumentNonBlocking(userRef, {
            ...values,
            displayName: `${values.firstName} ${values.lastName}`,
        }, { merge: true });

        toast({
            title: "Utilizador Atualizado!",
            description: `O utilizador '${values.firstName}' foi atualizado com sucesso.`,
        });
        setIsDialogOpen(false);
        setSelectedUser(null);
        mutate(); // Re-fetch data
    } catch (e: any) {
        console.error("Error saving user:", e);
        toast({
            variant: "destructive",
            title: "Erro ao salvar utilizador",
            description: e.message || "Ocorreu um erro inesperado.",
        });
    }
  };


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
            <CardDescription>Une liste de tous les utilisateurs de votre compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden lg:table-cell">Date de création</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
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
                        {user.isAdmin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Utilisateur</Badge>
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(user)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" disabled>Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Modifier l'Utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les détails de l'utilisateur et ses autorisations ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <UserEditForm
              onSubmit={handleFormSubmit}
              initialData={selectedUser}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
  );
}
