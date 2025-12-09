'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, RotateCcw, Send } from 'lucide-react';
import { getEmailContent } from '@/lib/email-templates';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type TemplateId = 'confirmation' | 'cancellation' | 'reschedule' | 'welcome' | 'purchase';

interface Template {
  id: TemplateId;
  subject: string;
  body_html: string;
}

const MOCK_DATA = {
  userName: 'Marie Dubois',
  serviceName: 'Soin Visage "Éclat"',
  date: new Date().toISOString(),
  duration: 60,
  planName: 'Abonnement Premium',
  planPrice: '€69.90',
  planPeriod: 'mois',
};

export default function EmailTemplatesPage() {
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Record<TemplateId, Template>>({} as Record<TemplateId, Template>);
  const [activeTemplateId, setActiveTemplateId] = useState<TemplateId>('confirmation');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('email_templates').select('*');
      if (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les modèles d\'e-mails.' });
      } else {
        const templatesById = data.reduce((acc: Record<TemplateId, Template>, t: any) => {
          acc[t.id as TemplateId] = t;
          return acc;
        }, {} as Record<TemplateId, Template>);
        setTemplates(templatesById);
        const userEmail = (await supabase.auth.getUser()).data.user?.email;
        if (userEmail) setTestEmail(userEmail);
      }
      setIsLoading(false);
    };
    fetchTemplates();
  }, [supabase, toast]);

  const handleContentChange = (html: string) => {
    setTemplates(prev => ({
      ...prev,
      [activeTemplateId]: { ...prev[activeTemplateId], body_html: html }
    }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplates(prev => ({
        ...prev,
        [activeTemplateId]: { ...prev[activeTemplateId], subject: e.target.value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const activeTemplate = templates[activeTemplateId];
    const { error } = await supabase
      .from('email_templates')
      .update({ subject: activeTemplate.subject, body_html: activeTemplate.body_html, updated_at: new Date().toISOString() })
      .eq('id', activeTemplateId);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder le modèle.' });
    } else {
      toast({ title: 'Succès', description: 'Modèle sauvegardé avec succès.' });
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
      const { subject, body } = getEmailContent({ type: activeTemplateId, data: MOCK_DATA });
      setTemplates(prev => ({
        ...prev,
        [activeTemplateId]: { ...prev[activeTemplateId], subject, body_html: body }
      }));
      toast({ title: 'Réinitialisé', description: 'Le modèle a été réinitialisé à sa version par défaut.' });
  };

  const handleSendTest = async () => {
    if (!testEmail) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer une adresse e-mail de test.' });
        return;
    }
    setIsSending(true);
    try {
        const response = await fetch('/api/emails/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: activeTemplateId,
                to: testEmail,
                data: MOCK_DATA
            })
        });
        if (!response.ok) throw new Error('La réponse du serveur n\'est pas OK');
        toast({ title: 'E-mail de test envoyé', description: `Un e-mail de test a été envoyé à ${testEmail}.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer l\'e-mail de test.' });
    } finally {
        setIsSending(false);
    }
  };

  const renderPreview = () => {
    if (!activeTemplateId) return null;
    const { body } = getEmailContent({ type: activeTemplateId, data: MOCK_DATA });
    return <div dangerouslySetInnerHTML={{ __html: body }} />;
  };

  const activeTemplate = templates[activeTemplateId];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modèles d'e-mails</h1>
        <p className="text-muted-foreground">Personnalisez les e-mails transactionnels envoyés à vos clients.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTemplateId} onValueChange={(value) => setActiveTemplateId(value as TemplateId)}>
            <TabsList>
              <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
              <TabsTrigger value="cancellation">Annulation</TabsTrigger>
              <TabsTrigger value="reschedule">Replanification</TabsTrigger>
              <TabsTrigger value="welcome">Bienvenue</TabsTrigger>
              <TabsTrigger value="purchase">Achat Abonnement</TabsTrigger>
            </TabsList>
            
            {isLoading && <Skeleton className="h-96 w-full mt-4" />}

            {!isLoading && activeTemplate && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <CardHeader className="p-0 mb-4">
                            <CardTitle className="capitalize">{activeTemplateId}</CardTitle>
                            <CardDescription>Modifiez le contenu de cet e-mail.</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Sujet de l'e-mail</Label>
                                <Input id="subject" value={activeTemplate.subject} onChange={handleSubjectChange} />
                            </div>
                            <div>
                                <Label>Corps de l'e-mail</Label>
                                <RichTextEditor content={activeTemplate.body_html} onChange={handleContentChange} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Sauvegarder
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline">
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Réinitialiser
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action remplacera vos modifications par le modèle par défaut. Cette action est irréversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleReset}>Confirmer</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    <div>
                        <CardHeader className="p-0 mb-4">
                            <CardTitle>Aperçu</CardTitle>
                            <CardDescription>Voici à quoi ressemblera l'e-mail.</CardDescription>
                        </CardHeader>
                        <div className="border rounded-md p-4 min-h-[400px] bg-muted/20">
                            {renderPreview()}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Input 
                                placeholder="email@exemple.com" 
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                            <Button variant="secondary" onClick={handleSendTest} disabled={isSending}>
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Envoyer Test
                            </Button>
                        </div>
                    </div>
                </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}