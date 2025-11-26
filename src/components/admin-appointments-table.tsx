'use client';

import { useState, useMemo } from 'react';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MoreVertical, 
  CreditCard, 
  Clock, 
  Calendar as CalendarIcon, 
  Wallet,
  Home,
  Gift,
  Filter,
  CheckCircle2,
  XCircle,
  Coins,
  ChevronRight,
  User,
  MoreHorizontal
} from "lucide-react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // --- Lógica de Filtragem e Agrupamento ---
  const filteredData = useMemo(() => {
    return appointments
      .filter(app => {
        const matchesSearch = 
          app.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user_email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        
        // Mapeamento simples para o filtro de pagamento
        let matchesPayment = true;
        if (paymentFilter !== "all") {
             if (paymentFilter === 'paid') matchesPayment = app.status === 'Concluído';
             else matchesPayment = app.payment_method === paymentFilter;
        }

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, searchTerm, statusFilter, paymentFilter]);

  // Agrupa por data (YYYY-MM-DD)
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    filteredData.forEach(app => {
      const dateKey = format(new Date(app.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(app);
    });
    return groups;
  }, [filteredData]);

  // --- Helpers de UI ---

  const getStatusBadge = (status: string, paymentMethod: string) => {
    if (status === 'Concluído') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" /> Payé
        </div>
      );
    }
    if (status === 'Cancelado') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100/50 text-red-700 border border-red-200 text-xs font-medium">
          <XCircle className="w-3 h-3" /> Annulé
        </div>
      );
    }
    // Pendente / Confirmado
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
          <Clock className="w-3 h-3" /> En attente
        </div>
    );
  };

  const getPaymentIconConfig = (method: string) => {
    switch (method) {
      case 'card': return { icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" };
      case 'online': return { icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" };
      case 'minutes': return { icon: Clock, color: "text-blue-600", bg: "bg-blue-50" };
      case 'cash': return { icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" };
      case 'gift': return { icon: Gift, color: "text-pink-600", bg: "bg-pink-50" };
      default: return { icon: Home, color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const formatGroupDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    if (isYesterday(date)) return "Hier";
    return format(date, "EEEE d MMMM", { locale: fr });
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* --- Toolbar de Filtros --- */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-1 rounded-lg">
        <div className="relative w-full sm:max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs border-dashed">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Tous les status</SelectItem>
              <SelectItem value="Confirmado">En attente</SelectItem>
              <SelectItem value="Concluído">Payé / Terminé</SelectItem>
              <SelectItem value="Cancelado">Annulé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs border-dashed">
              <div className="flex items-center gap-2">
                <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Paiement" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Tous paiements</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="card">Carte</SelectItem>
              <SelectItem value="cash">Espèce</SelectItem>
              <SelectItem value="gift">Cadeau</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- Tabela --- */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-100 bg-white shadow-sm custom-scrollbar relative">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[40%] pl-6">Client & Service</TableHead>
              <TableHead>Horaire</TableHead>
              <TableHead>Status & Paiement</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(groupedAppointments).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p>Aucun rendez-vous trouvé.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedAppointments).map(([dateStr, groupApps]) => (
                <>
                  {/* Row de Cabeçalho de Grupo */}
                  <TableRow key={dateStr} className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                    <TableCell colSpan={4} className="py-2 pl-6">
                      <div className="flex items-center gap-2 font-semibold text-sm text-gray-700">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="capitalize">{formatGroupDate(dateStr)}</span>
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground bg-white border border-gray-200">
                          {groupApps.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Rows de Agendamento */}
                  {groupApps.map((app) => {
                    const PaymentConfig = getPaymentIconConfig(app.payment_method);
                    const PaymentIcon = PaymentConfig.icon;

                    return (
                      <TableRow 
                        key={app.id} 
                        className="group hover:bg-slate-50 border-gray-50 transition-all cursor-pointer"
                        onClick={() => onPay(app)}
                      >
                        {/* Client & Service */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                              <AvatarImage src="" /> {/* Se tiver foto, coloque aqui */}
                              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-xs">
                                {getInitials(app.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{app.user_name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-medium text-gray-600">{app.service_name}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{app.duration} min</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Horaire */}
                        <TableCell>
                           <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center min-w-[3rem] px-2 py-1 rounded-md bg-gray-50 border border-gray-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
                                    <span className="text-sm font-bold text-gray-900">
                                        {format(new Date(app.date), 'HH:mm')}
                                    </span>
                                </div>
                                {app.status !== 'Cancelado' && isToday(new Date(app.date)) && new Date(app.date) > new Date() && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded text-blue-600 bg-blue-50 border border-blue-100 font-medium">
                                        Bientôt
                                    </span>
                                )}
                           </div>
                        </TableCell>

                        {/* Status & Paiement */}
                        <TableCell>
                          <div className="flex flex-col gap-2 items-start">
                            {getStatusBadge(app.status, app.payment_method)}
                            
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
                                <div className={cn("p-1 rounded-full", PaymentConfig.bg)}>
                                    <PaymentIcon className={cn("h-3 w-3", PaymentConfig.color)} />
                                </div>
                                <span className="capitalize">{app.payment_method === 'card' ? 'Carte Bancaire' : app.payment_method}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {app.status !== 'Concluído' && (
                                     <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary"
                                        onClick={(e) => { e.stopPropagation(); onPay(app); }}
                                    >
                                        Encaisser
                                    </Button>
                                )}
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPay(app); }}>
                                            <CreditCard className="mr-2 h-4 w-4" /> Détails / Paiement
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50" 
                                            onClick={(e) => { e.stopPropagation(); onDelete(app); }}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
         <span>{appointments.length} rendez-vous au total</span>
         <span>Affichage par date</span>
      </div>
    </div>
  );
}