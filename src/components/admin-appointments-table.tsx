'use client';

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  CreditCard, 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Wallet,
  Home
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string;
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception' | 'online' | 'gift' | 'cash';
}

interface AdminAppointmentsTableProps {
  appointments: Appointment[];
  onPay: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

export function AdminAppointmentsTable({ appointments, onPay, onDelete }: AdminAppointmentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = appointments.filter(app => 
    app.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, paymentMethod: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Payé & Terminé</Badge>;
      case 'Cancelado':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        if (paymentMethod === 'minutes') return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Payé (Minutes)</Badge>;
        if (paymentMethod === 'card' || paymentMethod === 'online') return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Payé (En ligne/CB)</Badge>;
        if (paymentMethod === 'gift') return <Badge variant="secondary" className="bg-pink-100 text-pink-800">Payé (Cadeau)</Badge>;
        if (paymentMethod === 'cash') return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Payé (Espèce)</Badge>;
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">En attente</Badge>;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'minutes': return <Wallet className="h-4 w-4 text-blue-500" />;
      case 'reception': return <Home className="h-4 w-4 text-amber-500" />; // Legacy
      case 'cash': return <Wallet className="h-4 w-4 text-emerald-500" />;
      case 'gift': return <CreditCard className="h-4 w-4 text-pink-500" />;
      default: return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client, service..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[250px]">Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Heure</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Paiement</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow 
                  key={appointment.id} 
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => onPay(appointment)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(appointment.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{appointment.user_name}</span>
                        <span className="text-xs text-muted-foreground">{appointment.user_email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{appointment.service_name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {appointment.duration} min
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">
                        {format(new Date(appointment.date), 'EEE d MMM', { locale: fr })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(appointment.date), 'HH:mm')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status, appointment.payment_method)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center" title={appointment.payment_method}>
                        <div className="p-2 rounded-full bg-gray-100">
                            {getPaymentIcon(appointment.payment_method)}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appointment.id)}>
                          Copier ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPay(appointment); }}>
                            <CreditCard className="mr-2 h-4 w-4" /> Traiter Paiement / Détails
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(appointment); }}>
                            <XCircle className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Affichage de {filteredAppointments.length} rendez-vous
      </div>
    </div>
  );
}