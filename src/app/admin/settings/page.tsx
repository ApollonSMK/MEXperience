'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres</CardTitle>
        <CardDescription>Gérez les paramètres généraux de l'application.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Contenu de la page des paramètres à venir...</p>
      </CardContent>
    </Card>
  );
}
