'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}

export function ForgotPasswordDialog({ open, onOpenChange, email }: ForgotPasswordDialogProps) {
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const [localEmail, setLocalEmail] = useState(email ?? '');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalEmail(email ?? '');
    }
  }, [open, email]);

  const handlePasswordReset = async () => {
    if (!supabase || !localEmail.trim()) return;
    setIsResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(localEmail.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
      flowType: 'implicit',
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Impossible d\'envoyer l\'e-mail',
        description: error.message,
      });
    } else {
      toast({
        title: 'E-mail envoyé',
        description: 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.',
      });
      onOpenChange(false);
    }

    setIsResetLoading(false);
  };

  const handleMagicLink = async () => {
    if (!supabase || !localEmail.trim()) return;
    setIsMagicLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: localEmail.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/magic-link`,
        flowType: 'implicit',
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Impossible d\'envoyer le lien magique',
        description: error.message,
      });
    } else {
      toast({
        title: 'Lien magique envoyé',
        description: 'Consultez vos e-mails pour vous connecter instantanément.',
      });
      onOpenChange(false);
    }

    setIsMagicLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Besoin d'aide ?</DialogTitle>
          <DialogDescription>
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation ou de connexion instantanée.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Adresse e-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="nom@exemple.com"
              value={localEmail}
              onChange={(event) => setLocalEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handlePasswordReset}
              disabled={!localEmail.trim() || isResetLoading}
            >
              {isResetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Envoyer un e-mail de réinitialisation
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleMagicLink}
              disabled={!localEmail.trim() || isMagicLoading}
            >
              {isMagicLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Recevoir un lien magique
            </Button>
          </div>
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground">
            Les liens expirent après quelques minutes. Pensez à vérifier vos courriers indésirables.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}