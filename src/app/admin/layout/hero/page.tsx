'use client';

import { useState, useEffect, useCallback } from 'react';
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
        // Tenta remover o ficheiro do storage se a inserção na tabela falhar
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
                    <label htmlFor="image-upload" className="relative">
                        <Button asChild disabled={isUploading}>
                            <span>
                                {isUploading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Enviar...</>
                                ) : (
                                    <><Upload className="mr-2 h-4 w-4" /> Enviar Imagem</>
                                )}
                            </span>
                        </Button>
                        <input
                            id="image-upload"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*,video/*,image/gif"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                ) : images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map(image => (
                            <Card key={image.id} className="group relative overflow-hidden">
                                <Image 
                                    src={image.image_url}
                                    alt={image.alt_text}
                                    width={400}
                                    height={300}
                                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog(image)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remover Imagem</span>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Nenhuma imagem encontrada</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Comece por fazer o upload da sua primeira imagem para o hero.</p>
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
