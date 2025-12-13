import { Suspense } from 'react';
import ResponsibilityTermsView from '@/components/termos-de-responsabilidade-view';

export default function ResponsibilityTermsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ResponsibilityTermsView />
    </Suspense>
  );
}