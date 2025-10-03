
import { getServices } from '@/lib/services-db';
import { ServicesTable } from '@/components/admin/services/services-table';
import { columns } from '@/components/admin/services/columns';
import type { Service } from "@/lib/services";

// This page is now a Server Component. It fetches data on the server and passes it down.
export default async function AdminServicesPage() {
    // Fetch data on the server.
    const initialServices: Service[] = await getServices();

    return (
        <div className="container mx-auto py-10">
             <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
                    <p className="text-muted-foreground">
                        Gira todos os serviços oferecidos na plataforma.
                    </p>
                </div>
                {/* The "Add Service" button is now part of the ServicesTable component */}
            </div>
            {/* Pass the initial data to the client component */}
            <ServicesTable columns={columns} initialData={initialServices} />
        </div>
    );
}
