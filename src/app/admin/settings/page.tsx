
import { createClient } from '@/lib/supabase/server';
import { OperatingHoursClient } from '@/components/admin/settings/operating-hours-client';
import type { OperatingHours } from '@/types/operating-hours';

export const dynamic = "force-dynamic";

async function getOperatingHours(): Promise<OperatingHours[]> {
    const supabase = createClient({ admin: true });

    const { data, error } = await supabase
        .from('operating_hours')
        .select('*')
        .order('day_of_week', { ascending: true });

    if (error) {
        console.error("Error fetching operating hours: ", error);
        throw new Error(`Não foi possível carregar os horários. Verifique se a tabela 'operating_hours' existe. Detalhes: ${error.message}`);
    }

    // Preencher os dias que faltam para garantir que temos sempre os 7 dias da semana
    const days = Array.from({ length: 7 }, (_, i) => i);
    const completeHours = days.map(day => {
        const found = data.find(d => d.day_of_week === day);
        if (found) {
            return found;
        }
        // Retorna um valor padrão para dias não configurados
        return {
            id: day + 1, // temporary id for react key
            day_of_week: day,
            start_time: '09:00:00',
            end_time: '18:00:00',
            interval_minutes: 15,
            is_active: false
        };
    });

    return completeHours as OperatingHours[];
}


export default async function AdminSettingsPage() {
    try {
        const operatingHours = await getOperatingHours();
        
        return (
            <div className="container mx-auto py-10">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Definições</h1>
                    <p className="text-muted-foreground">
                        Gira as definições gerais da plataforma.
                    </p>
                </div>
                <OperatingHoursClient initialHours={operatingHours} />
            </div>
        );
    } catch (error: any) {
         return (
             <div className="container mx-auto py-10">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-destructive">Erro ao Carregar Definições</h1>
                    <p className="text-muted-foreground mt-2 bg-destructive/10 p-4 rounded-md">
                        {error.message}
                    </p>
                     <div className="mt-4 p-4 border rounded-md bg-muted/50">
                        <h3 className="font-semibold text-lg">Ação Necessária: Criar Tabela de Horários</h3>
                        <p className="mt-2 text-sm">Parece que a sua base de dados não tem a tabela para gerir os horários de funcionamento. Copie e cole o seguinte código SQL no seu <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent">Editor SQL do Supabase</a> e clique em "RUN" para criar a tabela e as políticas de segurança necessárias:</p>
                        <pre className="mt-4 bg-black text-white p-4 rounded-md text-xs overflow-x-auto">
{`-- Cria a tabela para guardar as configurações de horário
CREATE TABLE IF NOT EXISTS public.operating_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INT NOT NULL UNIQUE, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    interval_minutes INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Insere horários padrão para a semana (Segunda a Sábado, das 07:00 às 21:00)
INSERT INTO public.operating_hours (day_of_week, start_time, end_time, interval_minutes, is_active)
VALUES
    (1, '07:00:00', '21:00:00', 15, true), -- Segunda
    (2, '07:00:00', '21:00:00', 15, true), -- Terça
    (3, '07:00:00', '21:00:00', 15, true), -- Quarta
    (4, '07:00:00', '21:00:00', 15, true), -- Quinta
    (5, '07:00:00', '21:00:00', 15, true), -- Sexta
    (6, '09:00:00', '18:00:00', 15, true), -- Sábado
    (0, '09:00:00', '13:00:00', 15, false) -- Domingo (desativo por defeito)
ON CONFLICT (day_of_week) DO NOTHING;

-- Habilita a Row Level Security para a tabela de horários
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos (opcional mas recomendado)
DROP POLICY IF EXISTS "Admins can manage operating hours" ON public.operating_hours;
DROP POLICY IF EXISTS "Public can read operating hours" ON public.operating_hours;

-- Cria uma política para permitir que todos leiam os horários
CREATE POLICY "Public can read operating hours"
ON public.operating_hours FOR SELECT
USING (true);

-- Cria a política principal que permite a administradores gerir (inserir, atualizar, apagar) os horários
CREATE POLICY "Admins can manage operating hours"
ON public.operating_hours FOR ALL
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
`}
                        </pre>
                    </div>
                </div>
            </div>
        )
    }
}
