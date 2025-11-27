"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function PwaInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in browser (not standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Check if User Agent is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    // Show prompt only if on iOS and NOT in standalone mode
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Small delay to not annoy user immediately
      const timer = setTimeout(() => {
        // Check if user has already dismissed it in this session (optional, kept simple here)
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isIOS) return null;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-center text-xl font-bold">Installer l'application</DrawerTitle>
            <DrawerDescription className="text-center text-balance">
              Pour une expérience optimale en plein écran, ajoutez M.E Experience à votre écran d'accueil.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <Share className="h-6 w-6" />
                </div>
                <div className="text-sm">
                    <span className="font-semibold text-foreground">1.</span> Appuyez sur l'icône <span className="font-semibold">Partager</span> dans la barre de navigation.
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-xl text-gray-600">
                    <PlusSquare className="h-6 w-6" />
                </div>
                <div className="text-sm">
                    <span className="font-semibold text-foreground">2.</span> Faites défiler vers le bas et sélectionnez <span className="font-semibold">Sur l'écran d'accueil</span>.
                </div>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Je le ferai plus tard</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}