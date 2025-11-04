'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Image as ImageIcon, Info, Loader2 } from 'lucide-react';
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

interface HeroImage {
    id: string;
    image_url: string;
    alt_text: string;
    display_order: number;
    file_path: string;
}

const BUCKET_NAME = 'hero_images';

export default function AdminHeroLayoutPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
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
      // Reset file input
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

  return (
    <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Imagens do Hero</CardTitle>
                        <CardDescription>
                            Faça o upload e gira as imagens que aparecem no carrossel da página principal.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map(image => (
                            <Card key={image.id} className="group relative overflow-hidden aspect-video">
                                <Image 
                                    src={image.image_url}
                                    alt={image.alt_text}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                    <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog(image)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remover
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        <Card 
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative overflow-hidden aspect-video border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-colors flex items-center justify-center cursor-pointer"
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
                        Esta ação não pode ser desfeita. Isto irá remover permanentemente a imagem do armazenamento e da base de dados.
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
