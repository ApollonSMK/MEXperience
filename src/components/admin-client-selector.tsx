'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    Search, 
    User, 
    Mail, 
    Phone, 
    Calendar, 
    Clock, 
    CreditCard, 
    Star,
    Check,
    X,
    Users,
    Crown,
    Wallet,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from './admin-appointment-form';
import type { Plan } from './admin-appointment-form';

interface AdminClientSelectorProps {
    users: UserProfile[];
    plans: Plan[];
    onSelect: (user: UserProfile) => void;
    onClose: () => void;
    selectedUserId?: string;
}

export function AdminClientSelector({ users, plans, onSelect, onClose, selectedUserId }: AdminClientSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            user.display_name?.toLowerCase().includes(term) ||
            user.first_name?.toLowerCase().includes(term) ||
            user.last_name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.phone?.toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    const getUserPlan = (userId: string) => {
        return plans.find(p => p.id === users.find(u => u.id === userId)?.plan_id);
    };

    const handleUserSelect = (user: UserProfile) => {
        setSelectedUser(user);
    };

    const handleConfirm = () => {
        if (selectedUser) {
            onSelect(selectedUser);
        }
    };

    const handleBackToList = () => {
        setSelectedUser(null);
    };

    // Helper para obter o melhor nome possível para exibição
    const getUserDisplayName = (user: UserProfile) => {
        if (user.display_name) return user.display_name;
        if (user.first_name || user.last_name) {
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        return user.email || 'Nom inconnu';
    };

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex h-full w-full overflow-hidden relative bg-background">
            {/* Lista de Clientes */}
            <div className={cn(
                "absolute inset-0 flex flex-col h-full transition-transform duration-300 ease-in-out bg-background z-10",
                selectedUser ? "-translate-x-full pointer-events-none invisible" : "translate-x-0 pointer-events-auto visible"
            )}>
                <div className="p-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Sélectionner un client
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Rechercher par nom, email ou téléphone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                        />
                    </div>
                </div>
                
                {/* Scroll Nativo - Infalível */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-2 space-y-1 pb-20">
                        {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <Search className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Aucun client trouvé</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const plan = getUserPlan(user.id);
                                const isSelected = selectedUser?.id === user.id;
                                const displayName = getUserDisplayName(user);
                                
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent",
                                            isSelected 
                                                ? "bg-primary/5 border-primary/20 shadow-sm" 
                                                : "hover:bg-muted hover:border-border"
                                        )}
                                    >
                                        <Avatar className={cn("h-10 w-10 border transition-all", isSelected ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-border")}>
                                            <AvatarImage src={user.photo_url || undefined} alt={displayName} />
                                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                {getInitials(displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={cn("font-medium truncate text-sm", isSelected && "text-primary font-bold")}>
                                                    {displayName}
                                                </p>
                                                {plan && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20">
                                                        {plan.title}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="truncate max-w-[180px]">{user.email}</span>
                                                {user.minutes_balance !== undefined && user.minutes_balance > 0 && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-border" />
                                                        <span className="font-medium text-emerald-600 flex items-center gap-0.5">
                                                            <Clock className="h-3 w-3" />
                                                            {user.minutes_balance} min
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground/30">
                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Detalhes do Cliente */}
            <div className={cn(
                "absolute inset-0 flex flex-col h-full overflow-hidden bg-background transition-transform duration-300 ease-in-out z-20",
                selectedUser ? "translate-x-0 pointer-events-auto visible" : "translate-x-full pointer-events-none invisible"
            )}>
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-2 shrink-0 bg-background/95 backdrop-blur z-10">
                            <Button variant="ghost" size="icon" onClick={handleBackToList} className="h-8 w-8 -ml-2 rounded-full hover:bg-muted">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="font-semibold text-base">Détails du client</h3>
                        </div>

                        {/* Scroll Nativo nos Detalhes também */}
                        <div className="flex-1 overflow-y-auto min-h-0 bg-muted/10">
                             <div className="bg-background p-6 border-b pb-8">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <Avatar className="h-20 w-20 border-4 border-muted shadow-lg">
                                        <AvatarImage src={selectedUser.photo_url || undefined} alt={getUserDisplayName(selectedUser)} />
                                        <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                                            {getInitials(getUserDisplayName(selectedUser))}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight">{getUserDisplayName(selectedUser)}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        {selectedUser.is_admin && (
                                            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Admin</Badge>
                                        )}
                                        {getUserPlan(selectedUser.id) && (
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground">{getUserPlan(selectedUser.id)?.title}</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 space-y-4 max-w-sm mx-auto">
                                {/* Informações Pessoais */}
                                <Card className="shadow-sm border-muted/60">
                                    <CardHeader className="pb-3 pt-4 px-4">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                            <User className="h-3.5 w-3.5" />
                                            Infos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4 space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Prénom</p>
                                                <p className="font-medium">{selectedUser.first_name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Nom</p>
                                                <p className="font-medium">{selectedUser.last_name || '-'}</p>
                                            </div>
                                        </div>
                                        <Separator className="bg-border/50" />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Téléphone</p>
                                            <p className="font-medium flex items-center gap-2">
                                                <Phone className="h-3 w-3 opacity-50" />
                                                {selectedUser.phone || '-'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Abonnement & Minutos */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="shadow-sm border-muted/60">
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                                            <Wallet className="h-5 w-5 text-primary mb-2 opacity-80" />
                                            <div className="text-2xl font-bold text-primary leading-none mb-1">
                                                {selectedUser.minutes_balance || 0}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">Minutes</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-sm border-muted/60">
                                         <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                                            <Crown className="h-5 w-5 text-amber-500 mb-2 opacity-80" />
                                            {getUserPlan(selectedUser.id) ? (
                                                <>
                                                    <div className="font-bold text-sm leading-tight mb-1">
                                                        {getUserPlan(selectedUser.id)?.title}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">{getUserPlan(selectedUser.id)?.price}</p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Aucun plan</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-background shrink-0 pb-8 sm:pb-4">
                            <Button 
                                onClick={handleConfirm}
                                className="w-full font-semibold shadow-lg shadow-primary/20"
                                size="lg"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Sélectionner ce client
                            </Button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}