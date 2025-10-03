
"use client"

import * as React from "react"
import { getServices } from '@/lib/services-db';
import { ServicesTable } from '@/components/admin/services/services-table';
import { columns } from '@/components/admin/services/columns';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { NewServiceForm } from "@/components/admin/services/new-service-form";
import type { Service } from "@/lib/services";


// This page needs to be a client component to manage the state of the "New Service" sheet.
export default function AdminServicesPage() {
    const [services, setServices] = React.useState<Service[]>([]);
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);

    // We fetch initial data on the client side to keep this a client component.
    // A more advanced pattern might use Suspense.
    React.useEffect(() => {
        async function loadServices() {
            const fetchedServices = await getServices();
            setServices(fetchedServices);
        }
        loadServices();
    }, []);

    const handleSuccess = () => {
        setIsSheetOpen(false);
        // Re-fetch services to update the table
        async function loadServices() {
            const fetchedServices = await getServices();
            setServices(fetchedServices);
        }
        loadServices();
    }

    return (
        <div className="container mx-auto py-10">
             <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
                    <p className="text-muted-foreground">
                        Gira todos os serviços oferecidos na plataforma.
                    </p>
                </div>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Serviço
                </Button>
            </div>
            <ServicesTable columns={columns} data={services} />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Adicionar Novo Serviço</SheetTitle>
                    <SheetDescription>
                        Preencha os detalhes para criar um novo serviço. Clique em guardar quando terminar.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <NewServiceForm onSuccess={handleSuccess} />
                </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

