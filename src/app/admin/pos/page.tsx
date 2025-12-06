import { AdminPOSView } from '@/components/admin-pos-view';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  // Inicializa variáveis com arrays vazios
  let users: any[] = [];
  let services: any[] = [];
  let plans: any[] = [];
  let minutePacks: any[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Função auxiliar para buscar dados
  const fetchData = async (client: any) => {
    return Promise.all([
        // REMOVED .order('created_at') because it causes errors if column doesn't exist
        client.from('profiles').select('*'), 
        client.from('services').select('*').eq('is_under_maintenance', false).order('order', { ascending: true }),
        client.from('plans').select('*').order('price', { ascending: true }),
        client.from('minute_packs').select('*').order('price', { ascending: true })
    ]);
  };

  try {
    let results;
    let usedFallback = false;

    // TENTATIVA 1: Service Role (Bypass RLS)
    if (supabaseUrl && serviceRoleKey) {
        try {
            const adminClient = createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            });
            results = await fetchData(adminClient);
            
            // Verifica se houve erro crítico no fetch de usuários
            if (results[0].error) {
                console.warn("Service Role fetch failed for users, trying fallback...", results[0].error);
                throw new Error("Service Role error");
            }
        } catch (e) {
            usedFallback = true;
        }
    } else {
        usedFallback = true;
    }

    // TENTATIVA 2: Fallback para Standard Client (Session Based)
    if (usedFallback) {
        console.log("Using standard Supabase client for POS...");
        const standardClient = await createSupabaseRouteClient();
        results = await fetchData(standardClient);
    }

    // Processar Resultados
    if (results) {
        const [usersRes, servicesRes, plansRes, minutePacksRes] = results;

        if (usersRes.error) console.error("Final Error fetching users:", JSON.stringify(usersRes.error, null, 2));
        if (servicesRes.error) console.error("Final Error fetching services:", JSON.stringify(servicesRes.error, null, 2));

        users = usersRes.data || [];
        services = servicesRes.data || [];
        plans = plansRes.data || [];
        minutePacks = minutePacksRes.data || [];
    }

  } catch (error) {
    console.error("Critical error in POSPage:", error);
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Point of Sale (POS)</h1>
      </div>
      
      <AdminPOSView 
        users={users} 
        services={services} 
        plans={plans} 
        minutePacks={minutePacks}
      />
    </div>
  );
}