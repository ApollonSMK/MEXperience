'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from './admin-appointment-form';
import type { Plan } from '@/app/admin/services/page';

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

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex h-full">
            {/* Lista de Clientes */}
            <div className="w-96 border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Clients
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Aucun client trouvé
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const plan = getUserPlan(user.id);
                                const isSelected = selectedUser?.id === user.id;
                                
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                            isSelected 
                                                ? "bg-primary text-primary-foreground" 
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.photo_url || ''} alt={user.display_name || ''} />
                                            <AvatarFallback className={cn(
                                                "text-xs font-medium",
                                                isSelected && "bg-primary-foreground text-primary"
                                            )}>
                                                {getInitials(user.display_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={cn(
                                                    "font-medium truncate",
                                                    isSelected && "text-primary-foreground"
                                                )}>
                                                    {user.display_name || 'Nom inconnu'}
                                                </p>
                                                {plan && (
                                                    <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
                                                        {plan.title}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className={cn(
                                                "text-sm truncate",
                                                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                            )}>
                                                {user.email}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detalhes do Cliente */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        <div className="p-6 border-b">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedUser.photo_url || ''} alt={selectedUser.display_name || ''} />
                                    <AvatarFallback className="text-lg font-medium">
                                        {getInitials(selectedUser.display_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedUser.display_name}</h3>
                                    <p className="text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-6">
                                {/* Informações Pessoais */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Informations Personnelles
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Prénom</p>
                                                <p className="font-medium">{selectedUser.first_name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Nom</p>
                                                <p className="font-medium">{selectedUser.last_name || '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Téléphone</p>
                                            <p className="font-medium">{selectedUser.phone || '-'}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Abonnement */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Crown className="h-4 w-4" />
                                            Abonnement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const plan = getUserPlan(selectedUser.id);
                                            if (!plan) {
                                                return (
                                                    <div className="text-center py-4 text-muted-foreground">
                                                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p>Aucun abonnement actif</p>
                                                    </div>
                                                );
                                            }
                                            
                                            return (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline" className="text-sm">
                                                            {plan.title}
                                                        </Badge>
                                                        <span className="font-semibold">{plan.price}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Minutes inclus</p>
                                                            <p className="font-medium">{plan.minutes} min</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Sessions/mois</p>
                                                            <p className="font-medium">{plan.sessions || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>

                                {/* Minutes */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Wallet className="h-4 w-4" />
                                            Solde de Minutes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-primary">
                                                {selectedUser.minutes_balance || 0}
                                            </div>
                                            <p className="text-sm text-muted-foreground">minutes disponibles</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Status */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Star className="h-4 w-4" />
                                            Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                selectedUser.is_admin ? "bg-green-500" : "bg-gray-300"
                                            )} />
                                            <span className="text-sm">
                                                {selectedUser.is_admin ? 'Administrateur' : 'Client'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t">
                            <Button 
                                onClick={handleConfirm}
                                className="w-full"
                                size="lg"
                            >
                                Sélectionner ce client
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Sélectionnez un client pour voir ses détails</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}