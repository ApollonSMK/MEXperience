'use client';

import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, User, Plus, X, Loader2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { processPOSSale, type POSItem } from '@/app/actions/pos';
import { AdminClientSelector } from './admin-client-selector';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface POSViewProps {
  users: any[];
  services: any[];
  plans: any[];
  minutePacks: any[];
}

export function AdminPOSView({ users, services, plans, minutePacks }: POSViewProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<POSItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  // Filtragem básica para a grid de produtos
  const filterItems = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const addToCart = (item: any, type: POSItem['type']) => {
    const newItem: POSItem = {
      id: item.id,
      title: item.name || item.title,
      price: Number(item.price || item.amount || 0), // Normalizar preço
      type,
      originalData: item
    };
    setCart([...cart, newItem]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async (method: 'cash' | 'card') => {
    if (cart.length === 0) return;
    if (!selectedUser) {
      toast({ variant: "destructive", title: "Cliente obrigatório", description: "Por favor, selecione um cliente para a venda." });
      setIsClientSelectorOpen(true);
      return;
    }

    setIsProcessing(true);
    const result = await processPOSSale({
      userId: selectedUser.id,
      items: cart,
      total: cartTotal,
      paymentMethod: method
    });

    if (result.success) {
      toast({ title: "Venda realizada!", description: `Fatura #${result.invoiceId} criada com sucesso.` });
      setCart([]);
      setSelectedUser(null);
    } else {
      toast({ variant: "destructive", title: "Erro", description: result.error });
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar item..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <Tabs defaultValue="services" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="plans">Abonnements</TabsTrigger>
            <TabsTrigger value="packs">Packs Minutes</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 bg-muted/20 rounded-lg border p-4">
            {/* Services Tab */}
            <TabsContent value="services" className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterItems(services).map(service => (
                  <button
                    key={service.id}
                    onClick={() => addToCart({ ...service, price: service.pricing_tiers?.[0]?.price || 0 }, 'service')}
                    className="flex flex-col items-center justify-center p-4 bg-background hover:bg-accent border rounded-xl shadow-sm transition-all aspect-square text-center gap-2 group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm line-clamp-2">{service.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {service.pricing_tiers?.[0]?.price ? `${service.pricing_tiers[0].price}€` : 'Var.'}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Plans Tab */}
            <TabsContent value="plans" className="mt-0">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filterItems(plans).map(plan => (
                   <button
                   key={plan.id}
                   onClick={() => addToCart(plan, 'plan')}
                   className="flex flex-col items-start p-4 bg-background hover:bg-accent border rounded-xl shadow-sm transition-all text-left space-y-2"
                 >
                   <Badge variant="secondary" className="mb-1">{plan.minutes} min</Badge>
                   <span className="font-bold text-sm">{plan.title}</span>
                   <span className="text-lg font-semibold text-primary">{plan.price}</span>
                 </button>
                ))}
              </div>
            </TabsContent>

             {/* Packs Tab */}
             <TabsContent value="packs" className="mt-0">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filterItems(minutePacks).map(pack => (
                   <button
                   key={pack.id}
                   onClick={() => addToCart({ ...pack, title: `${pack.minutes} Minutes`, price: pack.price }, 'pack')}
                   className="flex flex-col items-start p-4 bg-background hover:bg-accent border rounded-xl shadow-sm transition-all text-left space-y-2"
                 >
                   <div className="p-2 bg-yellow-500/10 rounded-md text-yellow-600 mb-1">
                        <Plus className="h-4 w-4" />
                   </div>
                   <span className="font-bold text-sm">{pack.minutes} Minutes</span>
                   <span className="text-lg font-semibold text-primary">{pack.price}€</span>
                 </button>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-[380px] flex flex-col bg-background border rounded-xl shadow-sm overflow-hidden h-full">
        {/* User Selection */}
        <div className="p-4 border-b bg-muted/30">
            {selectedUser ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10 border">
                            <AvatarImage src={selectedUser.photo_url} />
                            <AvatarFallback>{selectedUser.email?.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                             <span className="font-semibold text-sm truncate w-[180px]">{selectedUser.display_name || selectedUser.email}</span>
                             <span className="text-xs text-muted-foreground">{selectedUser.minutes_balance || 0} min disponíveis</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Sheet open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-12 border-dashed">
                            <User className="mr-2 h-4 w-4" />
                            Selecionar Cliente...
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                         <SheetHeader className="px-6 py-4 border-b">
                            <SheetTitle>Selecionar Cliente</SheetTitle>
                            <SheetDescription>
                                {users.length} clientes encontrados. Busque por nome ou email.
                            </SheetDescription>
                         </SheetHeader>
                         <div className="flex-1 overflow-y-auto min-h-0 relative">
                            <AdminClientSelector 
                                users={users} 
                                plans={plans} 
                                onSelect={(u) => {
                                    setSelectedUser(u);
                                    setIsClientSelectorOpen(false);
                                }}
                                onClose={() => setIsClientSelectorOpen(false)}
                                selectedUserId=""
                            />
                         </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                    <ShoppingCart className="h-12 w-12" />
                    <p>Carrinho vazio</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start group">
                            <div className="space-y-1">
                                <p className="font-medium text-sm">{item.title}</p>
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal uppercase">{item.type}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm">{item.price.toFixed(2)}€</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeFromCart(idx)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>

        {/* Totals & Actions */}
        <div className="p-4 bg-muted/30 border-t space-y-4">
            <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{cartTotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (17%)</span>
                    <span>{(cartTotal * 0.17).toFixed(2)}€</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">{cartTotal.toFixed(2)}€</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Button 
                    className="h-12 bg-green-600 hover:bg-green-700" 
                    onClick={() => handleCheckout('cash')}
                    disabled={isProcessing || cart.length === 0}
                >
                     {isProcessing ? <Loader2 className="animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
                     Dinheiro
                </Button>
                <Button 
                    className="h-12" 
                    onClick={() => handleCheckout('card')}
                    disabled={isProcessing || cart.length === 0}
                >
                     {isProcessing ? <Loader2 className="animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                     Cartão
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}