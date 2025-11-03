'use client';

import { useMemo, useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserProfile {
  id: string;
  display_name?: string;
  photo_url?: string;
  email: string;
  dob?: string; // Date string e.g., "YYYY-MM-DD"
}

export default function AdminBirthdaysPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        setError(error);
      } else {
        setUsers(data as UserProfile[] || []);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, [supabase]);


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
    today.setHours(0, 0, 0, 0);

    return users
      .filter((user) => user.dob)
      .map((user) => {
        const dob = new Date(user.dob + 'T00:00:00'); // Ensure it's parsed as local time
        let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
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
                        <AvatarImage src={user.photo_url || ''} alt={user.display_name || 'User'} />
                        <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="font-medium">{user.display_name || 'N/A'}</p>
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
