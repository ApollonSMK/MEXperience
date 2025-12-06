'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Database, Key } from 'lucide-react';

// --- DEFINIÇÃO DO ESQUEMA (FONTE DE VERDADE) ---
// Usaremos esta constante para guiar futuras alterações no banco de dados.

interface SchemaColumn {
  name: string;
  type: string;
  default?: string;
  pk?: boolean;
  fk?: string;
  nullable?: boolean;
  notes?: string;
}

interface SchemaTable {
  name: string;
  description: string;
  columns: SchemaColumn[];
  policies: { name: string; role: string; perm: string }[];
}

export const CURRENT_SCHEMA: { tables: SchemaTable[] } = {
  tables: [
    {
      name: 'appointments',
      description: 'Armazena os agendamentos dos usuários.',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'user_id', type: 'uuid', fk: 'profiles(id)' },
        { name: 'user_name', type: 'text' },
        { name: 'user_email', type: 'text' },
        { name: 'service_name', type: 'text' },
        { name: 'date', type: 'timestamp with time zone', nullable: false },
        { name: 'duration', type: 'numeric', nullable: false },
        { name: 'status', type: 'USER-DEFINED', notes: "Enum: 'Pendente', 'Confirmado', 'Concluído', 'Cancelado'" },
        { name: 'payment_method', type: 'USER-DEFINED', notes: "Enum: 'card', 'minutes', 'reception', 'gift', 'gift_card', 'cash'" },
      ],
      policies: [
        { name: 'Admins podem gerir todos os agendamentos', role: 'public', perm: 'ALL' },
        { name: 'Agendamentos são visíveis publicamente (verificação)', role: 'public', perm: 'SELECT' },
        { name: 'Allow insert appointments', role: 'anon/authenticated', perm: 'INSERT' },
        { name: 'Allow read appointments', role: 'anon/authenticated', perm: 'SELECT' },
        { name: 'Utilizadores podem gerir seus próprios agendamentos', role: 'authenticated', perm: 'ALL' },
      ]
    },
    {
      name: 'profiles',
      description: 'Perfil estendido do usuário (vinculado ao auth.users).',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'email', type: 'text' },
        { name: 'display_name', type: 'text' },
        { name: 'first_name', type: 'text' },
        { name: 'last_name', type: 'text' },
        { name: 'photo_url', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'dob', type: 'date' },
        { name: 'plan_id', type: 'text', fk: 'plans(id)' },
        { name: 'is_admin', type: 'boolean', default: 'false' },
        { name: 'minutes_balance', type: 'numeric', default: '0' },
        { name: 'stripe_customer_id', type: 'text' },
        { name: 'stripe_subscription_id', type: 'text' },
        { name: 'stripe_subscription_status', type: 'text' },
        { name: 'stripe_cancel_at_period_end', type: 'boolean', default: 'false' },
        { name: 'creation_time', type: 'timestamp', default: 'now()' },
      ],
      policies: [
        { name: 'Allow individual access to own profile', role: 'public', perm: 'ALL' },
        { name: 'Admins have full access (implícito via lógica de app ou policy futura)', role: 'admin', perm: 'ALL' }
      ]
    },
    {
      name: 'plans',
      description: 'Planos de assinatura disponíveis.',
      columns: [
        { name: 'id', type: 'text', pk: true },
        { name: 'title', type: 'text', nullable: false },
        { name: 'price', type: 'text' },
        { name: 'period', type: 'text' },
        { name: 'minutes', type: 'numeric', nullable: false },
        { name: 'price_per_minute', type: 'numeric' },
        { name: 'features', type: 'jsonb' },
        { name: 'benefits', type: 'jsonb' },
        { name: 'stripe_price_id', type: 'text' },
        { name: 'popular', type: 'boolean', default: 'false' },
        { name: 'order', type: 'integer' }
      ],
      policies: [
        { name: 'Admins podem gerir planos', role: 'public', perm: 'ALL' },
        { name: 'Planos são visíveis publicamente', role: 'public', perm: 'SELECT' }
      ]
    },
    {
      name: 'services',
      description: 'Serviços oferecidos.',
      columns: [
        { name: 'id', type: 'text', pk: true },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text' },
        { name: 'pricing_tiers', type: 'jsonb' },
        { name: 'color', type: 'text' },
        { name: 'order', type: 'integer' },
        { name: 'is_under_maintenance', type: 'boolean', default: 'false' }
      ],
      policies: [
        { name: 'Admins podem gerir serviços', role: 'public', perm: 'ALL' },
        { name: 'Serviços são visíveis publicamente', role: 'public', perm: 'SELECT' }
      ]
    },
    {
      name: 'schedules',
      description: 'Horários de funcionamento.',
      columns: [
        { name: 'id', type: 'text', pk: true },
        { name: 'day_name', type: 'text', nullable: false },
        { name: 'time_slots', type: 'jsonb' },
        { name: 'order', type: 'integer' }
      ],
      policies: [
        { name: 'Admins podem gerir horários', role: 'public', perm: 'ALL' },
        { name: 'Horários são visíveis publicamente', role: 'public', perm: 'SELECT' }
      ]
    },
    {
      name: 'invoices',
      description: 'Faturas e histórico de pagamentos.',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'user_id', type: 'uuid', fk: 'profiles(id)' },
        { name: 'plan_id', type: 'text' },
        { name: 'plan_title', type: 'text' },
        { name: 'amount', type: 'numeric', nullable: false },
        { name: 'status', type: 'USER-DEFINED' },
        { name: 'pdf_url', type: 'text' },
        { name: 'date', type: 'timestamp', default: 'now()' }
      ],
      policies: [
        { name: 'Allow admins to read all invoices', role: 'authenticated', perm: 'SELECT' },
        { name: 'Allow users to read their own invoices', role: 'authenticated', perm: 'SELECT' }
      ]
    },
    {
      name: 'guest_passes',
      description: 'Passes de convidados gerados por usuários.',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'host_user_id', type: 'uuid', fk: 'profiles(id)', nullable: false },
        { name: 'guest_user_id', type: 'uuid', fk: 'profiles(id)', nullable: false },
        { name: 'appointment_id', type: 'uuid', fk: 'appointments(id)', nullable: false },
        { name: 'created_at', type: 'timestamp', default: 'now()' }
      ],
      policies: [
        { name: 'Allow authenticated users to insert guest passes', role: 'authenticated', perm: 'INSERT' },
        { name: 'Allow access to host and guest', role: 'authenticated', perm: 'SELECT' }
      ]
    },
    {
      name: 'hero_images',
      description: 'Imagens do carrossel da Hero Section.',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'image_url', type: 'text', nullable: false },
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'text' },
        { name: 'button_text', type: 'text' },
        { name: 'button_link', type: 'text' },
        { name: 'display_order', type: 'integer' }
      ],
      policies: [
        { name: 'Imagens são visíveis publicamente', role: 'public', perm: 'SELECT' },
        { name: 'Admins gestão total', role: 'public', perm: 'ALL' }
      ]
    },
    {
      name: 'gateway_settings',
      description: 'Configurações de pagamento (Stripe).',
      columns: [
        { name: 'id', type: 'text', default: "'stripe'", pk: true },
        { name: 'public_key', type: 'text' },
        { name: 'secret_key', type: 'text' },
        { name: 'test_mode', type: 'boolean', default: 'true' }
      ],
      policies: [
        { name: 'Admin read/write access', role: 'public', perm: 'ALL' }
      ]
    },
    {
      name: 'smtp_settings',
      description: 'Configurações de envio de email.',
      columns: [
        { name: 'id', type: 'smallint', default: '1', pk: true },
        { name: 'host', type: 'text', nullable: false },
        { name: 'user', type: 'text', nullable: false },
        { name: 'password', type: 'text', nullable: false }
      ],
      policies: [
        { name: 'Allow full access to admins', role: 'public', perm: 'ALL' }
      ]
    },
    {
      name: 'time_slot_locks',
      description: 'Bloqueios temporários de horário para evitar conflitos.',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'service_id', type: 'text', nullable: false },
        { name: 'date', type: 'date', nullable: false },
        { name: 'time', type: 'text', nullable: false },
        { name: 'expires_at', type: 'timestamp', nullable: false }
      ],
      policies: [
        { name: 'Utilizadores veem locks', role: 'public', perm: 'SELECT' },
        { name: 'Utilizadores criam/deletam seus locks', role: 'public', perm: 'INSERT/DELETE' }
      ]
    },
    {
      name: 'email_templates',
      description: 'Templates de email editáveis pelo admin.',
      columns: [
        { name: 'id', type: 'text', pk: true, notes: "Tipos: 'confirmation', 'cancellation', 'reschedule'" },
        { name: 'subject', type: 'text', nullable: false },
        { name: 'body_html', type: 'text', nullable: false },
        { name: 'updated_at', type: 'timestamp', default: 'now()' }
      ],
      policies: [
        { name: 'Admins full access', role: 'public', perm: 'ALL' },
        { name: 'Public read (apenas API server-side usa, mas ok)', role: 'public', perm: 'SELECT' }
      ]
    },
    {
      name: 'debug_logs',
      description: 'Logs de sistema para debug.',
      columns: [
        { name: 'id', type: 'bigint', pk: true },
        { name: 'log_message', type: 'text' },
        { name: 'created_at', type: 'timestamp', default: 'now()' }
      ],
      policies: [
        { name: 'RLS Disabled (Public Read/Write Warning)', role: 'none', perm: 'ALL' }
      ]
    },
    {
      name: 'gift_cards',
      description: 'Passes de convidados gerados por usuários.',
      columns: [
        { name: 'id', type: 'uuid', default: 'gen_random_uuid()', pk: true },
        { name: 'code', type: 'text', nullable: false },
        { name: 'initial_balance', type: 'numeric', nullable: false },
        { name: 'current_balance', type: 'numeric', nullable: false },
        { name: 'status', type: 'text' },
        { name: 'type', type: 'text', notes: "'gift_card' ou 'promo_code'" },
        { name: 'metadata', type: 'jsonb', notes: "Ex: { discount_type: 'percentage' }" },
        { name: 'created_at', type: 'timestamp', default: 'now()' }
      ],
      policies: [
        { name: 'Allow authenticated users to insert gift cards', role: 'authenticated', perm: 'INSERT' },
        { name: 'Allow access to gift cards', role: 'authenticated', perm: 'SELECT' }
      ]
    }
  ]
};

// --- COMPONENTE VISUAL ---

export default function DatabaseSchemaGuide() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Guia do Esquema de Dados
        </h2>
        <p className="text-muted-foreground">
          Referência da estrutura atual do banco de dados e políticas de segurança (RLS).
          Use este guia para verificar nomes de colunas e permissões.
        </p>
      </div>

      <ScrollArea className="h-[600px] rounded-md border p-4">
        <Accordion type="single" collapsible className="w-full">
          {CURRENT_SCHEMA.tables.map((table) => (
            <AccordionItem key={table.name} value={table.name}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">{table.name}</span>
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    {table.columns.length} colunas
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 py-2">
                    <CardDescription>{table.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-6">
                    
                    {/* Columns Table */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4" /> Colunas
                      </h4>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[150px]">Nome</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Detalhes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {table.columns.map((col) => (
                              <TableRow key={col.name}>
                                <TableCell className="font-medium font-mono text-xs">
                                  {col.name}
                                  {col.pk && <Key className="h-3 w-3 inline ml-1 text-yellow-500" />}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{col.type}</TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex flex-col gap-1">
                                    {col.fk && <Badge variant="secondary" className="w-fit text-[10px]">FK: {col.fk}</Badge>}
                                    {col.default && <span className="text-muted-foreground">Default: {col.default}</span>}
                                    {col.notes && <span className="text-blue-500">{col.notes}</span>}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Policies List */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4" /> Políticas RLS (Segurança)
                      </h4>
                      <div className="grid gap-2">
                        {table.policies.map((policy, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded border bg-card text-xs">
                            <span className="font-medium">{policy.name}</span>
                            <div className="flex gap-2">
                                <Badge variant="outline">{policy.role}</Badge>
                                <Badge variant={policy.perm === 'ALL' ? 'destructive' : 'default'}>{policy.perm}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}