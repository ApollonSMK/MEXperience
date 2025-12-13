import { Suspense } from 'react';
import LoginView from '@/components/login-view';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <LoginView />
    </Suspense>
  );
}