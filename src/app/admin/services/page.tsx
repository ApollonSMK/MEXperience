
import { getServices } from '@/lib/services-db';
import { ServicesTable } from '@/components/admin/services/services-table';
import { columns } from '@/components/admin/services/columns';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default async function AdminServicesPage() {
    const services = await getServices();

    return (
        <div className="container mx-auto py-10">
             <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
                    <p className="text-muted-foreground">
                        Gira todos os serviços oferecidos na plataforma.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Serviço
                </Button>
            </div>
            <ServicesTable columns={columns} data={services} />
        </div>
    );
}
