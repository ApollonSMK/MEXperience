'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  id: string;
  displayName?: string;
  photoURL?: string;
  email: string;
  dob?: Timestamp; // Date of Birth
}

export default function AdminBirthdaysPage() {
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading, error } = useCollection<User>(usersCollectionRef);

  const getInitials = (name?: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'U';
  };

  const upcomingBirthdays = useMemo(() => {
    if (!users) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    return users
      .filter((user) => user.dob)
      .map((user) => {
        const dob = user.dob!.toDate();
        let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
        // If the birthday for this year has already passed, check next year's birthday
        if (nextBirthday < today) {
          nextBirthday = addYears(nextBirthday, 1);
        }

        const daysUntilBirthday = differenceInDays(nextBirthday, today);
        const age = today.getFullYear() - dob.getFullYear() + (nextBirthday.getFullYear() > today.getFullYear() ? 1 : 0)

        return {
          ...user,
          nextBirthday,
          daysUntilBirthday,
          age,
        };
      })
      .filter((user) => user.daysUntilBirthday >= 0 && user.daysUntilBirthday <= 30)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

  }, [users]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        Carregando aniversariantes...
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
    <Card>
      <CardHeader>
        <CardTitle>Próximos Aniversários</CardTitle>
        <CardDescription>Uma lista dos aniversários dos usuários nos próximos 30 dias.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Data do Aniversário</TableHead>
              <TableHead>Idade a completar</TableHead>
              <TableHead className="text-right">Dias Restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingBirthdays.length > 0 ? (
              upcomingBirthdays.map((user) => (
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
                  <TableCell>
                    {format(user.nextBirthday, "d 'de' MMMM", { locale: ptBR })}
                  </TableCell>
                   <TableCell>{user.age} anos</TableCell>
                  <TableCell className="text-right">{user.daysUntilBirthday}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Nenhum aniversário nos próximos 30 dias.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}