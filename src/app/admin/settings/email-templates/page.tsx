'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { getConfirmationTemplate, getCancellationTemplate, getRescheduleTemplate } from '@/lib/email-templates';

// Default templates content (fallback/initial)
const DEFAULT_TEMPLATES = {
  confirmation: {
    subject: 'Confirmation de votre rendez-vous - M.E Experience',
    body: getConfirmationTemplate({ userName: '{{userName}}', serviceName: '{{serviceName}}', date: '{{date}}', duration: 0 }).replace('{{duration}}', '{{duration}}') // Keep placeholder raw
  },
  cancellation: {
    subject: 'Annulation de votre rendez-vous - M.E Experience',
    body: getCancellationTemplate({ userName: '{{userName}}', serviceName: '{{serviceName}}', date: '{{date}}' })
  },
  reschedule: {
    subject: 'Modification de votre rendez-vous - M.E Experience',
    body: getRescheduleTemplate({ userName: '{{userName}}', serviceName: '{{serviceName}}', date: '{{date}}', duration: 0 }).replace('{{duration}}', '{{duration}}')
  }
};

type TemplateType = 'confirmation' | 'cancellation' | 'reschedule';

export default function EmailTemplatesPage() {
  const [activeTab, setActiveTab] = useState<TemplateType>('confirmation');
  const [templates, setTemplates] = useState<Record<TemplateType, { subject: string, body: string }>>({
    confirmation: { subject: '', body: '' },
    cancellation: { subject: '', body: '' },
    reschedule: { subject: '', body: '' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  // Load templates from DB
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('email_templates').select('*');
      
      const loadedTemplates = { ...templates };
      
      // If DB has data, use it. Otherwise, use defaults.
      (['confirmation', 'cancellation', 'reschedule'] as TemplateType[]).forEach(type => {
         const dbTemplate = data?.find(t => t.id === type);
         if (dbTemplate) {
             loadedTemplates[type] = { subject: dbTemplate.subject, body: dbTemplate.body_html };
         } else {
             loadedTemplates[type] = { 
                 subject: DEFAULT_TEMPLATES[type].subject, 
                 body: DEFAULT_TEMPLATES[type].body 
             };
         }
      });
      
      setTemplates(loadedTemplates);
      setIsLoading(false);
    };
    
    fetchTemplates();
  }, [supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    const currentTemplate = templates[activeTab];
    
    const { error } = await supabase.from('email_templates').upsert({
        id: activeTab,
        subject: currentTemplate.subject,
        body_html: currentTemplate.body,
        updated_at: new Date().toISOString()
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder le template.' });
    } else {
        toast({ title: 'Succès', description: 'Template mis à jour avec succès.' });
    }
    setIsSaving(false);
  };

  const handleReset = () => {
      if(confirm('Voulez-vous vraiment réinitialiser ce modèle à sa valeur par défaut ?')) {
          setTemplates(prev => ({
              ...prev,
              [activeTab]: { 
                  subject: DEFAULT_TEMPLATES[activeTab].subject, 
                  body: DEFAULT_TEMPLATES[activeTab].body 
              }
          }));
      }
  };

  const getPreviewHtml = (html: string) => {
    // Replace variables with fake data for preview
    return html
        .replace(/{{userName}}/g, 'Jean Dupont')
        .replace(/{{serviceName}}/g, 'Massage Relaxant')
        .replace(/{{date}}/g, 'Lundi 12 Octobre à 14:00')
        .replace(/{{duration}}/g, '60');
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-bold tracking-tight">Modèles d'Emails</h2>
                <p className="text-muted-foreground">Personnalisez les emails automatiques envoyés aux clients.</p>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={handleReset} title="Restaurer le défaut">
                    <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Sauvegarder
                </Button>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
                <TabsTrigger value="reschedule">Replanification</TabsTrigger>
                <TabsTrigger value="cancellation">Annulation</TabsTrigger>
            </TabsList>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Column */}
                <div className="space-y-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Éditeur</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Sujet de l'email</Label>
                                <Input 
                                    value={templates[activeTab].subject} 
                                    onChange={(e) => setTemplates(prev => ({...prev, [activeTab]: {...prev[activeTab], subject: e.target.value}}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contenu du message</Label>
                                <RichTextEditor 
                                    content={templates[activeTab].body} 
                                    onChange={(html) => setTemplates(prev => ({...prev, [activeTab]: {...prev[activeTab], body: html}}))}
                                />
                            </div>
                        </CardContent>
                     </Card>
                     
                     <Card className="bg-muted/50">
                         <CardHeader className="pb-2">
                             <CardTitle className="text-sm">Variables Disponibles</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <div className="flex flex-wrap gap-2 text-xs font-mono">
                                 <Badge variant="outline" className="bg-background">{'{{userName}}'}</Badge>
                                 <Badge variant="outline" className="bg-background">{'{{serviceName}}'}</Badge>
                                 <Badge variant="outline" className="bg-background">{'{{date}}'}</Badge>
                                 <Badge variant="outline" className="bg-background">{'{{duration}}'}</Badge>
                             </div>
                             <p className="text-xs text-muted-foreground mt-2">Copiez et collez ces codes dans le texte pour insérer les données dynamiques.</p>
                         </CardContent>
                     </Card>
                </div>

                {/* Preview Column */}
                <div className="space-y-4">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Prévisualisation</CardTitle>
                            <CardDescription>Aperçu tel que le client le verra.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 bg-gray-100 p-4 rounded-b-lg overflow-hidden">
                             <div className="bg-white shadow-sm rounded-md overflow-hidden max-w-[600px] mx-auto min-h-[500px] flex flex-col">
                                 {/* Fake Email Header */}
                                 <div className="border-b p-4 bg-gray-50">
                                     <div className="text-xs text-muted-foreground mb-1">Sujet:</div>
                                     <div className="font-semibold text-sm">{templates[activeTab].subject}</div>
                                 </div>
                                 {/* Email Body */}
                                 <div 
                                    className="p-4 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: getPreviewHtml(templates[activeTab].body) }}
                                 />
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Tabs>
    </div>
  );
}