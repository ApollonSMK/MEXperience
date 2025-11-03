
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar logs', description: error.message });
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
                    <CardTitle>Logs de Depuração de Admin</CardTitle>
                    <CardDescription>
                        Esta página mostra os resultados das verificações de permissão de administrador. Use-a para diagnosticar problemas.
                    </CardDescription>
                </div>
                <Button onClick={fetchLogs} disabled={isLoading}>
                    {isLoading ? 'A carregar...' : 'Atualizar Logs'}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>ID do Utilizador</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Metadados no Token</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">A carregar logs...</TableCell></TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{format(new Date(log.created_at), "HH:mm:ss 'em' dd/MM/yy", { locale: ptBR })}</TableCell>
                      <TableCell title={log.user_id}>{getUserIdLastChars(log.user_id)}</TableCell>
                      <TableCell>
                        <Badge variant={log.is_admin_result ? 'default' : 'destructive'}>
                          {log.is_admin_result ? 'ADMIN' : 'NÃO ADMIN'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2) || 'sem metadados'}
                          </pre>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhum log de depuração encontrado. Tente executar uma ação de administrador para gerar logs.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
