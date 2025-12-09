'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Star, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MinutePack {
  id: string;
  name: string;
  minutes: number;
  price: number;
  popular: boolean;
  display_order: number;
}

export default function AdminMinutePacksPage() {
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const [packs, setPacks] = useState<MinutePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [editingPack, setEditingPack] = useState<MinutePack | null>(null);
  const [formData, setFormData] = useState<Partial<MinutePack>>({
    name: '',
    minutes: 0,
    price: 0,
    popular: false,
    display_order: 0
  });

  const fetchPacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('minute_packs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les packs.' });
    } else {
      setPacks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const handleOpenDialog = (pack?: MinutePack) => {
    if (pack) {
      setEditingPack(pack);
      setFormData(pack);
    } else {
      setEditingPack(null);
      setFormData({
        name: '',
        minutes: 60,
        price: 0,
        popular: false,
        display_order: packs.length + 1
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.minutes || !formData.price) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.' });
        return;
    }

    setIsSaving(true);
    try {
        if (editingPack) {
            // Update
            const { error } = await supabase
                .from('minute_packs')
                .update(formData)
                .eq('id', editingPack.id);
            if (error) throw error;
            toast({ title: 'Succès', description: 'Pack mis à jour.' });
        } else {
            // Create
            const { error } = await supabase
                .from('minute_packs')
                .insert([formData]);
            if (error) throw error;
            toast({ title: 'Succès', description: 'Pack créé.' });
        }
        setIsDialogOpen(false);
        fetchPacks();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pack ?')) return;

    const { error } = await supabase.from('minute_packs').delete().eq('id', id);
    if (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
        toast({ title: 'Succès', description: 'Pack supprimé.' });
        fetchPacks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packs de Minutes</h1>
          <p className="text-muted-foreground">Gérez les offres d'achat de minutes ponctuelles.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau Pack
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Liste des Packs</CardTitle>
            <CardDescription>Les packs visibles par les clients sur la page d'achat.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ordre</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Minutes</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Populaire</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {packs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun pack configuré.</TableCell>
                            </TableRow>
                        )}
                        {packs.map((pack) => (
                            <TableRow key={pack.id}>
                                <TableCell>{pack.display_order}</TableCell>
                                <TableCell className="font-medium">{pack.name}</TableCell>
                                <TableCell>{pack.minutes} min</TableCell>
                                <TableCell>€{pack.price}</TableCell>
                                <TableCell>
                                    {pack.popular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pack)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(pack.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingPack ? 'Modifier le Pack' : 'Créer un Pack'}</DialogTitle>
                <DialogDescription>Configurez les détails de l'offre.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nom</Label>
                    <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="col-span-3" 
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="minutes" className="text-right">Minutes</Label>
                    <Input 
                        id="minutes" 
                        type="number" 
                        value={formData.minutes} 
                        onChange={(e) => setFormData({...formData, minutes: Number(e.target.value)})} 
                        className="col-span-3" 
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Prix (€)</Label>
                    <Input 
                        id="price" 
                        type="number" 
                        value={formData.price} 
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                        className="col-span-3" 
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order" className="text-right">Ordre</Label>
                    <Input 
                        id="order" 
                        type="number" 
                        value={formData.display_order} 
                        onChange={(e) => setFormData({...formData, display_order: Number(e.target.value)})} 
                        className="col-span-3" 
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="popular" className="text-right">Populaire</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                        <Switch 
                            id="popular" 
                            checked={formData.popular} 
                            onCheckedChange={(c) => setFormData({...formData, popular: c})} 
                        />
                        <span className="text-sm text-muted-foreground">Mettre en avant ce pack</span>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}