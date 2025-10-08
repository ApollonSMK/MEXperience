
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShineBorder from "@/components/ui/shine-border";
import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { cn } from '@/lib/utils';

type UsageData = {
  date: string;
  minutes: number;
};

type Subscription = {
  plan: string;
  totalMinutes: number;
  refundedMinutes: number;
};

type UserProfileCardProps = {
  user: SupabaseUser;
  isAdmin: boolean;
  subscription: Subscription;
  usageData: UsageData[];
};

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

export default function UserProfileCard({
  user,
  isAdmin,
  subscription,
  usageData,
}: UserProfileCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const totalUsedMinutes = usageData.reduce(
    (acc, item) => acc + item.minutes,
    0
  );
  
  const totalAvailableMinutes = Math.max(0, (subscription.totalMinutes + subscription.refundedMinutes) - totalUsedMinutes);

  const progressPercentage =
    subscription.totalMinutes > 0
      ? Math.min(100, (totalUsedMinutes / subscription.totalMinutes) * 100)
      : 0;

  const fullName = user.user_metadata?.full_name || '';

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (listError) {
      console.error('Error listing files:', listError);
    } else if (files && files.length > 0) {
      const filesToRemove = files.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from('avatars').remove(filesToRemove);
    }
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      toast({
        title: 'Erro no Upload',
        description: `Não foi possível carregar a sua nova foto de perfil: ${uploadError.message}. Verifique as políticas do bucket.`,
        variant: 'destructive',
      });
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { picture: publicUrl },
    });
    
    setIsUploading(false);

    if (updateUserError) {
      console.error('Error updating user metadata:', updateUserError);
      toast({
        title: 'Erro ao Atualizar',
        description: 'Não foi possível guardar a sua nova foto de perfil.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso!',
        description: 'A sua foto de perfil foi atualizada.',
      });
       router.refresh();
    }
  };


  return (
    <ShineBorder
        className="w-full"
        color={["#A07CFE", "#FE8A71", "#FED7AA"]}
      >
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Avatar className="h-16 w-16 border-2 border-accent/50">
                <AvatarImage
                  src={user.user_metadata?.picture}
                  alt={fullName}
                  key={user.user_metadata?.picture} 
                />
                <AvatarFallback className="text-xl font-semibold bg-muted">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {isUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                    <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </label>
            <input 
              type="file" 
              id="avatar-upload" 
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          </div>
          <div>
            <CardTitle className="font-headline text-xl text-primary">
              {fullName}
            </CardTitle>
             <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {subscription.plan !== 'Sem Plano' ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Minutos Disponíveis</span>
                <div className={cn(
                        "z-10 flex items-center justify-center",
                    )}>
                    <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                        <span className="font-semibold text-lg">{totalAvailableMinutes} min</span>
                    </AnimatedShinyText>
                </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
                {totalUsedMinutes} de {subscription.totalMinutes} min do plano usados.
            </p>
          </div>
        ) : (
            <div className="text-center py-4">
                <p className="text-muted-foreground">Sem subscrição ativa.</p>
            </div>
        )}
      </CardContent>
    </Card>
    </ShineBorder>
  );
}
