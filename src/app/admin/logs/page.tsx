
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DebugLog {
    id: number;
    created_at: string;
    user_id: string;
    metadata: any;
    is_admin_result: boolean;
    log_message: string;
}

export default function AdminLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur lors du chargement des logs', description: error.message });
    } else {
      setLogs(data as DebugLog[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);
  
  const getUserIdLastChars = (userId: string) => {
    if (!userId) return 'N/A';
    return `...${userId.slice(-6)}`;
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Logs de Débogage Admin</CardTitle>
                    <CardDescription>
                        Cette page affiche les résultats des vérifications des permissions admin. Utilisez-la pour diagnostiquer les problèmes.
                    </CardDescription>
                </div>
                <Button onClick={fetchLogs} disabled={isLoading}>
                    {isLoading ? 'Chargement...' : 'Actualiser les Logs'}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quand</TableHead>
                  <TableHead>ID Utilisateur</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Métadonnées du Jeton</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Chargement des logs...</TableCell></TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{format(new Date(log.created_at), "HH:mm:ss 'le' dd/MM/yy", { locale: fr })}</TableCell>
                      <TableCell title={log.user_id}>{getUserIdLastChars(log.user_id)}</TableCell>
                      <TableCell>
                        <Badge variant={log.is_admin_result ? 'default' : 'destructive'}>
                          {log.is_admin_result ? 'ADMIN' : 'NON ADMIN'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2) || 'pas de métadonnées'}
                          </pre>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Aucun log de débogage trouvé. Essayez d'effectuer une action admin pour générer des logs.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
