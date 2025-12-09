'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, Bug, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DebugLog {
    id: number;
    created_at: string;
    user_id: string;
    metadata: any;
    is_admin_result: boolean;
    log_message: string;
}

interface AppointmentLog {
    id: number;
    created_at: string;
    action_type: string;
    performed_by: string;
    details: string;
    old_data: any;
    new_data: any;
}

export default function AdminLogsPage() {
  const { toast } = useToast();
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AppointmentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = getSupabaseBrowserClient();

  const fetchLogs = async () => {
    setIsLoading(true);
    
    // Fetch Debug Logs
    const { data: debugData } = await supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    // Fetch Audit Logs
    const { data: auditData, error: auditError } = await supabase
        .from('appointment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (auditError) {
       console.error(auditError);
       // Não mostramos toast de erro aqui para não assustar se a tabela ainda não existir
    }

    setDebugLogs(debugData as DebugLog[] || []);
    setAuditLogs(auditData as AppointmentLog[] || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);
  
  const getUserIdLastChars = (userId: string) => {
    if (!userId) return 'N/A';
    return `...${userId.slice(-6)}`;
  }

  const getActionColor = (action: string) => {
      switch(action) {
          case 'CREATE': return 'bg-green-100 text-green-800 hover:bg-green-100';
          case 'DELETE': return 'bg-red-100 text-red-800 hover:bg-red-100';
          case 'UPDATE': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
          case 'RESCHEDULE': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  const filteredAuditLogs = auditLogs.filter(log => 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold tracking-tight">Historique & Logs</h1>
             <Button onClick={fetchLogs} disabled={isLoading} size="sm">
                Actualiser
            </Button>
        </div>

        <Tabs defaultValue="audit" className="w-full">
            <TabsList>
                <TabsTrigger value="audit" className="flex gap-2">
                    <Activity className="h-4 w-4" /> Activité Rendez-vous
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex gap-2">
                    <Bug className="h-4 w-4" /> Debug Système
                </TabsTrigger>
            </TabsList>

            <TabsContent value="audit" className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher une action..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base">Historique des actions</CardTitle>
                        <CardDescription>Traçabilité des ajouts, modifications et suppressions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Date</TableHead>
                                    <TableHead className="w-[120px]">Action</TableHead>
                                    <TableHead>Détails</TableHead>
                                    <TableHead className="w-[100px] text-right">Admin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Chargement...</TableCell></TableRow>
                                ) : filteredAuditLogs.length > 0 ? (
                                    filteredAuditLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium text-xs">
                                                {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getActionColor(log.action_type)} variant="outline">
                                                    {log.action_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.details}
                                                {log.old_data && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[300px]" title={JSON.stringify(log.old_data)}>
                                                        Ancien: {JSON.stringify(log.old_data).slice(0, 50)}...
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                {getUserIdLastChars(log.performed_by)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                            Aucun historique trouvé. <br/>
                                            <span className="text-xs opacity-70">Assurez-vous d'avoir créé la table `appointment_logs` dans Supabase.</span>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="debug">
                <Card>
                    <CardHeader>
                        <CardTitle>Logs Techniques</CardTitle>
                        <CardDescription>
                            Résultats des vérifications de permissions et erreurs système.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Quand</TableHead>
                                <TableHead>ID Utilisateur</TableHead>
                                <TableHead>Résultat</TableHead>
                                <TableHead>Métadonnées</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Chargement...</TableCell></TableRow>
                                ) : debugLogs.length > 0 ? (
                                debugLogs.map((log) => (
                                    <TableRow key={log.id}>
                                    <TableCell className="font-medium">{format(new Date(log.created_at), "HH:mm:ss dd/MM", { locale: fr })}</TableCell>
                                    <TableCell title={log.user_id}>{getUserIdLastChars(log.user_id)}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.is_admin_result ? 'default' : 'destructive'}>
                                        {log.is_admin_result ? 'ADMIN' : 'NON ADMIN'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <pre className="text-[10px] bg-muted p-1 rounded max-w-[200px] overflow-hidden truncate">
                                            {JSON.stringify(log.metadata)}
                                        </pre>
                                    </TableCell>
                                    </TableRow>
                                ))
                                ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                    Aucun log de débogage trouvé.
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}