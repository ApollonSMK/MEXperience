'use client';

import { useState, useMemo, Fragment } from 'react';
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
  MoreHorizontal,
  Ban
} from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, startOfDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";

interface AdminAppointmentsTableProps {
  appointments: Appointment[];
  onPay: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

export function AdminAppointmentsTable({ appointments, onPay, onDelete, onCancel }: AdminAppointmentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // --- Lógica de Filtragem e Agrupamento ---
  const filteredData = useMemo(() => {
    const today = startOfDay(new Date());

    return appointments
      .filter(app => {
        const matchesSearch = 
          app.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (app.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        
        // Mapeamento simples para o filtro de pagamento
        let matchesPayment = true;
        if (paymentFilter !== "all") {
             if (paymentFilter === 'paid') matchesPayment = app.status === 'Concluído';
             else matchesPayment = app.payment_method === paymentFilter;
        }

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Lógica de Prioridade:
        // 1. Hoje e Futuro vêm primeiro (ordem crescente)
        // 2. Passado vem por último (ordem decrescente - mais recente primeiro)
        
        // Usamos startOfDay para garantir que qualquer hora de "hoje" seja considerada "hoje/futuro" neste contexto de separação de dias
        const dayA = startOfDay(dateA);
        const dayB = startOfDay(dateB);
        
        const isPastA = isBefore(dayA, today);
        const isPastB = isBefore(dayB, today);

        if (isPastA && !isPastB) return 1; // A é passado, B é futuro -> B vem antes
        if (!isPastA && isPastB) return -1; // A é futuro, B é passado -> A vem antes

        // Se ambos são futuro/hoje, ordena crescente (mais cedo primeiro)
        if (!isPastA && !isPastB) {
            return dateA.getTime() - dateB.getTime();
        }

        // Se ambos são passado, ordena decrescente (mais recente primeiro)
        return dateB.getTime() - dateA.getTime();
      });
  }, [appointments, searchTerm, statusFilter, paymentFilter]);

  // Agrupa por data (YYYY-MM-DD)
  // Como filteredData já está ordenado, o agrupamento respeitará essa ordem de chaves (na maioria dos browsers modernos/ES6+)
  const groupedAppointments = useMemo(() => {
    // Usando Map para garantir ordem de inserção
    const groups = new Map<string, Appointment[]>();
    
    filteredData.forEach(app => {
      const dateKey = format(new Date(app.date), 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
      }
      groups.get(dateKey)?.push(app);
    });
    return groups;
  }, [filteredData]);

  // --- Helpers de UI ---

  const getStatusBadge = (status: string, paymentMethod: string) => {
    // Lógica unificada: Se está Concluído OU tem um método de pagamento válido (exceto reception/blocked)
    const isPaid = status === 'Concluído' || ['card', 'minutes', 'cash', 'gift', 'online'].includes(paymentMethod);

    if (isPaid) {
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
            {groupedAppointments.size === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p>Aucun rendez-vous trouvé.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              Array.from(groupedAppointments.entries()).map(([dateStr, groupApps]) => (
                <Fragment key={dateStr}>
                  {/* Row de Cabeçalho de Grupo */}
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
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

                    const appDate = new Date(app.date);
                    const now = new Date();
                    const isPast = isBefore(appDate, now);
                    // Lógica unificada de pago
                    const isPaid = app.status === 'Concluído' || ['card', 'minutes', 'cash', 'gift', 'online'].includes(app.payment_method);
                    const isCancelled = app.status === 'Cancelado';

                    // Lógica de Estilo da Linha
                    let rowClasses = "group transition-all cursor-pointer border-b border-gray-50 ";
                    
                    if (isCancelled) {
                        rowClasses += "opacity-50 grayscale bg-gray-50/50 hover:bg-gray-100";
                    } else if (isPast) {
                        if (isPaid) {
                            // Passado e Pago: Visual discreto (resolvido)
                            rowClasses += "opacity-60 bg-gray-50/30 hover:opacity-100 hover:bg-gray-50";
                        } else {
                            // Passado e NÃO Pago: Atenção (Amarelo)
                            rowClasses += "bg-amber-50/70 border-amber-100 hover:bg-amber-100";
                        }
                    } else {
                        // Futuro / Presente: Padrão
                        rowClasses += "hover:bg-slate-50 bg-white";
                    }

                    return (
                      <TableRow 
                        key={app.id} 
                        className={rowClasses}
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
                                <div className={cn(
                                    "flex flex-col items-center justify-center min-w-[3rem] px-2 py-1 rounded-md border transition-colors",
                                    isPast && !isPaid && !isCancelled ? "bg-amber-100 border-amber-200 text-amber-900" : "bg-gray-50 border-gray-100 group-hover:border-primary/20 group-hover:bg-primary/5"
                                )}>
                                    <span className="text-sm font-bold text-gray-900">
                                        {format(new Date(app.date), 'HH:mm')}
                                    </span>
                                </div>
                                {app.status !== 'Cancelado' && isToday(new Date(app.date)) && new Date(app.date) > new Date() && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded text-blue-600 bg-blue-50 border border-blue-100 font-medium">
                                        Bientôt
                                    </span>
                                )}
                                {isPast && !isPaid && !isCancelled && (
                                     <span className="text-[10px] px-1.5 py-0.5 rounded text-amber-700 bg-amber-100/50 border border-amber-200 font-medium animate-pulse">
                                        À encaisser
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
                                        
                                        {app.status !== 'Cancelado' && app.status !== 'Concluído' && (
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCancel(app); }}>
                                                <Ban className="mr-2 h-4 w-4" /> Annuler
                                            </DropdownMenuItem>
                                        )}

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
                </Fragment>
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