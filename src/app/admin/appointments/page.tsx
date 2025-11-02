'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminAppointmentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Agendamentos</CardTitle>
        <CardDescription>Visualize e gerencie os agendamentos dos clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
            <TabsTrigger value="past">Passados</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-4">
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                <p>Conteúdo para agendamentos de hoje em breve...</p>
            </div>
          </TabsContent>
          <TabsContent value="week" className="mt-4">
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                <p>Conteúdo para agendamentos da semana em breve...</p>
            </div>
          </TabsContent>
          <TabsContent value="month" className="mt-4">
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                <p>Conteúdo para agendamentos do mês em breve...</p>
            </div>
          </TabsContent>
          <TabsContent value="year" className="mt-4">
             <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                <p>Conteúdo para agendamentos do ano em breve...</p>
             </div>
          </TabsContent>
          <TabsContent value="past" className="mt-4">
             <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                <p>Conteúdo para agendamentos passados em breve...</p>
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
