'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  FileText,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';

const mockBookings = [
  {
    id: 'BK001',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    service: 'Collagen Boost',
    duration: 30,
    date: '2024-08-05',
    time: '10:00',
    status: 'Confirmado',
  },
  {
    id: 'BK002',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@example.com',
    service: 'Hydromassage',
    duration: 15,
    date: '2024-08-06',
    time: '14:00',
    status: 'Pendente',
  },
  {
    id: 'BK003',
    name: 'Sofia Pereira',
    email: 'sofia.p@example.com',
    service: 'Solarium',
    duration: 10,
    date: '2024-08-05',
    time: '11:00',
    status: 'Confirmado',
  },
  {
    id: 'BK004',
    name: 'Rui Costa',
    email: 'rui.costa@example.com',
    service: 'Domo de Infravermelho',
    duration: 20,
    date: '2024-08-04',
    time: '16:00',
    status: 'Cancelado',
  },
  {
    id: 'BK005',
    name: 'Joana Martins',
    email: 'joana.m@example.com',
    service: 'Collagen Boost',
    duration: 20,
    date: '2024-08-07',
    time: '09:00',
    status: 'Pendente',
  },
  {
    id: 'BK006',
    name: 'Pedro Almeida',
    email: 'pedro.a@example.com',
    service: 'Solarium',
    duration: 15,
    date: '2024-08-08',
    time: '17:00',
    status: 'Confirmado',
  },
];

export default function AdminBookingsPage() {
    const [date, setDate] = React.useState<DateRange | undefined>();

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">
          Gerir Agendamentos
        </h1>
        <p className="mt-1 text-muted-foreground">
          Visualize, confirme e gira todos os agendamentos dos seus clientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Agendamentos</CardTitle>
          <CardDescription>
            Uma lista completa de agendamentos futuros e passados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className="w-full md:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} -{' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Escolher data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Serviço
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Data</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.name}</div>
                      <div className="text-sm text-muted-foreground hidden md:inline">
                        {booking.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {booking.service}
                      <span className="text-muted-foreground ml-2">({booking.duration}min)</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(booking.date), 'dd/MM/yyyy')} às {booking.time}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === 'Confirmado'
                            ? 'default'
                            : booking.status === 'Pendente'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          booking.status === 'Confirmado'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : booking.status === 'Pendente'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }
                      >
                        {booking.status}
                      </Badge>
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
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 focus:text-red-500">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}