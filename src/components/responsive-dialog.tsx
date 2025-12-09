'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from './ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'

interface ResponsiveDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  title: string
  description: string
  children: React.ReactNode
}

export function ResponsiveDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* We don't use DrawerHeader here to have more control over the layout, but we include Title for accessibility */}
        <div className="sr-only">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
        </div>
        <div className="p-4 pt-6">{children}</div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Annuler</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}