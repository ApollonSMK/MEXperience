'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import Link from 'next/link';

export default function GatewaySettingsPage() {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page de Gateway Supprimée</CardTitle>
        <CardDescription>
            Cette page a été supprimée car les clés API sont désormais gérées de manière sécurisée dans les variables d'environnement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Action Requise</AlertTitle>
            <AlertDescription>
                Ce fichier (<code>src/app/admin/gateway/page.tsx</code>) n'est plus utilisé et peut être supprimé de votre projet en toute sécurité.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
