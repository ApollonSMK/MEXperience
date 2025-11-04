'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface HeroImage {
    id: string;
    image_url: string;
    alt_text: string;
    display_order: number;
    file_path: string;
    title?: string;
    subtitle?: string;
}

const BUCKET_NAME = 'hero_images';

export default function AdminHeroLayoutPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HeroImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('hero_images').select('*').order('display_order');
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar imagens', description: error.message });
    } else {
      setImages(data as HeroImage[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `public/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      const maxOrder = images.reduce((max, img) => Math.max(max, img.display_order), 0);

      const { error: insertError } = await supabase.from('hero_images').insert({
        image_url: publicUrl,
        alt_text: `Hero image ${images.length + 1}`,
        file_path: filePath,
        display_order: maxOrder + 1,
        title: 'Título Padrão',
        subtitle: 'Subtítulo padrão para o novo slide.'
      });

      if (insertError) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw insertError;
      }

      toast({ title: 'Upload com Sucesso!', description: 'A nova imagem foi adicionada.' });
      fetchImages();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: error.message || 'Ocorreu um problema ao enviar a sua imagem.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleOpenDeleteDialog = (image: HeroImage) => {
    setSelectedImage(image);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteImage = async () => {
    if (!selectedImage) return;

    try {
        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([selectedImage.file_path]);
        if (storageError) throw storageError;

        const { error: dbError } = await supabase.from('hero_images').delete().eq('id', selectedImage.id);
        if (dbError) throw dbError;

        toast({ title: 'Imagem Removida!', description: 'A imagem foi removida com sucesso.' });
        fetchImages();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Remover Imagem',
            description: error.message || 'Ocorreu um problema ao remover a imagem.',
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedImage(null);
    }
  };

  const handleTextChange = (id: string, field: 'title' | 'subtitle', value: string) => {
    setImages(prevImages => prevImages.map(img => 
        img.id === id ? { ...img, [field]: value } : img
    ));
  };

  const handleSaveText = async (image: HeroImage) => {
    setEditingImageId(image.id);
    try {
      const { error } = await supabase
        .from('hero_images')
        .update({ title: image.title, subtitle: image.subtitle })
        .eq('id', image.id);
      
      if (error) throw error;
      
      toast({ title: 'Texto Guardado!', description: 'O texto do slide foi atualizado.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Guardar',
        description: error.message || 'Ocorreu um problema ao guardar o texto.',
      });
    } finally {
      setEditingImageId(null);
    }
  };

  return (
    <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Imagens do Hero</CardTitle>
                        <CardDescription>
                            Faça o upload e gira as imagens e os textos que aparecem no carrossel da página principal.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {images.map(image => (
                            <Card key={image.id} className="group relative flex flex-col">
                                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                                    <Image 
                                        src={image.image_url}
                                        alt={image.alt_text}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog(image)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-4 space-y-4">
                                     <div>
                                        <Label htmlFor={`title-${image.id}`} className="text-sm font-medium">Título</Label>
                                        <Input
                                            id={`title-${image.id}`}
                                            value={image.title || ''}
                                            onChange={(e) => handleTextChange(image.id, 'title', e.target.value)}
                                            placeholder="Título do Slide"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`subtitle-${image.id}`} className="text-sm font-medium">Subtítulo</Label>
                                        <Textarea
                                            id={`subtitle-${image.id}`}
                                            value={image.subtitle || ''}
                                            onChange={(e) => handleTextChange(image.id, 'subtitle', e.target.value)}
                                            placeholder="Subtítulo do slide."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleSaveText(image)} disabled={editingImageId === image.id}>
                                        {editingImageId === image.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Guardar Texto
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        <Card 
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative overflow-hidden aspect-video border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-colors flex items-center justify-center cursor-pointer min-h-[350px]"
                        >
                            <input
                                ref={fileInputRef}
                                id="image-upload"
                                type="file"
                                className="hidden"
                                accept="image/*,video/*,image/gif"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p>A enviar...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-8 w-8" />
                                    <p>Adicionar Imagem</p>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto irá remover permanentemente a imagem e o seu texto associado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive hover:bg-destructive/90">
                    Remover
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
