"use client";

import { useState, useEffect } from "react";
import { Share, PlusSquare, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function PwaInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 0. Verificação de "Dismissed" (Se o utilizador fechou recentemente)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
    if (dismissedAt) {
      const lastDismissed = parseInt(dismissedAt, 10);
      const now = Date.now();
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
      
      // Se ainda não passou uma semana, não mostra nada
      if (now - lastDismissed < oneWeekInMs) {
        return;
      }
    }

    // 1. Verificação se já está instalado (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) return; // Se já estiver instalado, não faz nada.

    // 2. Verificação iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIosDevice) {
      setIsIOS(true);
      // Delay de 30 segundos
      const timer = setTimeout(() => setIsOpen(true), 30000);
      return () => clearTimeout(timer);
    }

    // 3. Verificação Android / Chrome (Captura o evento de instalação)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Impede o mini-banner padrão feio
      setDeferredPrompt(e); // Guarda o evento para usar no botão
      // Delay de 30 segundos
      setTimeout(() => setIsOpen(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    // Guarda a data atual para só voltar a mostrar daqui a 1 semana
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
    setIsOpen(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Dispara o prompt nativo do navegador (Android)
    deferredPrompt.prompt();

    // Espera pela escolha do utilizador
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsOpen(false);
    } else {
      // Se cancelou no nativo, também consideramos como dismiss
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => {
        if (!open) handleDismiss(); // Se fechar clicando fora, também conta
        setIsOpen(open);
    }}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Smartphone className="h-6 w-6" />
                </div>
            </div>
            <DrawerTitle className="text-center text-xl font-bold">
              Instalar Aplicação
            </DrawerTitle>
            <DrawerDescription className="text-center text-balance">
              Instale a nossa app para um acesso mais rápido e uma melhor experiência.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-6">
            {isIOS ? (
              /* INSTRUÇÕES PARA IOS (IPHONE) */
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0">
                        <Share className="h-6 w-6" />
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-foreground">1.</span> Toque no botão <span className="font-semibold">Partilhar</span> na barra inferior.
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 shrink-0">
                        <PlusSquare className="h-6 w-6" />
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-foreground">2.</span> Role para baixo e escolha <span className="font-semibold">Ecrã Principal</span>.
                    </div>
                </div>
              </div>
            ) : (
              /* BOTÃO PARA ANDROID */
              <Button 
                className="w-full h-12 text-lg gap-2" 
                onClick={handleInstallClick}
              >
                <Download className="h-5 w-5" />
                Instalar Agora
              </Button>
            )}
          </div>

          <DrawerFooter>
              <Button variant="ghost" className="text-muted-foreground" onClick={handleDismiss}>Agora não</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}