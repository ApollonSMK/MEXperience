
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, PlusCircle, Rocket, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Schedule {
    id: string;
    day_name: string;
    time_slots: string[];
    order: number;
}

const initialSchedules: Omit<Schedule, 'id'>[] = [
    { day_name: 'Segunda-feira', time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'], order: 1 },
    { day_name: 'Terça-feira', time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'], order: 2 },
    { day_name: 'Quarta-feira', time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'], order: 3 },
    { day_name: 'Quinta-feira', time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'], order: 4 },
    { day_name: 'Sexta-feira', time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'], order: 5 },
    { day_name: 'Sábado', time_slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'], order: 6 },
    { day_name: 'Domingo', time_slots: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'], order: 7 },
];

const CopySchedulePopover = ({
  sourceDay,
  allDays,
  onCopy,
}: {
  sourceDay: Schedule;
  allDays: Schedule[];
  onCopy: (sourceSlots: string[], targetDayIds: string[]) => void;
}) => {
  const [targetDays, setTargetDays] = useState<string[]>([]);

  const handleCheckboxChange = (dayId: string, checked: boolean | 'indeterminate') => {
    setTargetDays(prev =>
      checked ? [...prev, dayId] : prev.filter(id => id !== dayId)
    );
  };

  const handleCopy = () => {
    onCopy(sourceDay.time_slots, targetDays);
    setTargetDays([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copiar horários</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
            <div className="space-y-1">
                <p className="text-sm font-medium">Copiar horários de {sourceDay.day_name}</p>
                <p className="text-sm text-muted-foreground">Selecione os dias de destino.</p>
            </div>
            <div className="space-y-2">
                {allDays
                .filter(day => day.id !== sourceDay.id)
                .map(day => (
                    <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`copy-to-${day.id}`}
                            onCheckedChange={(checked) => handleCheckboxChange(day.id, checked)}
                            checked={targetDays.includes(day.id)}
                        />
                        <Label htmlFor={`copy-to-${day.id}`} className="font-normal">{day.day_name}</Label>
                    </div>
                ))}
            </div>
            <Button className="w-full" size="sm" onClick={handleCopy} disabled={targetDays.length === 0}>
                Confirmar Cópia
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};


export default function AdminSchedulesPage() {
    const { toast } = useToast();
    const supabase = getSupabaseBrowserClient();
    const [newTime, setNewTime] = useState<{ [key: string]: string }>({});
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase.from('schedules').select('*').order('order');
        if (error) {
            setError(error);
            toast({ variant: "destructive", title: "Erro ao carregar horários", description: error.message });
        } else {
            setSchedules(data as Schedule[] || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);


    const handleSeedSchedules = async () => {
        try {
            const schedulesToInsert = initialSchedules.map(schedule => ({
                ...schedule,
                id: schedule.day_name.toLowerCase().replace('-feira', ''),
            }));

            const { error } = await supabase.from('schedules').upsert(schedulesToInsert);
            if (error) throw error;
            toast({ title: "Horários Criados!", description: "O horário semanal inicial foi adicionado." });
            fetchData();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Erro ao criar horários", description: e.message });
        }
    };
    
    const handleAddTimeSlot = async (dayId: string) => {
        const timeToAdd = newTime[dayId];
        if (!timeToAdd || !/^\d{2}:\d{2}$/.test(timeToAdd)) {
            toast({ variant: "destructive", title: "Formato Inválido", description: "Use o formato HH:MM (ex: 14:30)." });
            return;
        }
        
        const daySchedule = schedules?.find(s => s.id === dayId);
        if (!daySchedule) return;

        if (daySchedule.time_slots.includes(timeToAdd)) {
            toast({ variant: "destructive", title: "Horário Duplicado", description: "Este horário já existe para este dia." });
            return;
        }

        const updatedSlots = [...daySchedule.time_slots, timeToAdd].sort();

        try {
            const { error } = await supabase.from('schedules').update({ time_slots: updatedSlots }).eq('id', dayId);
            if (error) throw error;
            toast({ title: "Horário Adicionado!" });
            fetchData();
            setNewTime(prev => ({...prev, [dayId]: ''}));
        } catch(e: any) {
            toast({ variant: "destructive", title: "Erro ao adicionar horário", description: e.message });
        }
    };
    
    const handleRemoveTimeSlot = async (dayId: string, timeToRemove: string) => {
        const daySchedule = schedules?.find(s => s.id === dayId);
        if (!daySchedule) return;

        const updatedSlots = daySchedule.time_slots.filter(slot => slot !== timeToRemove);

         try {
            const { error } = await supabase.from('schedules').update({ time_slots: updatedSlots }).eq('id', dayId);
            if (error) throw error;
            toast({ title: "Horário Removido!" });
            fetchData();
        } catch(e: any) {
            toast({ variant: "destructive", title: "Erro ao remover horário", description: e.message });
        }
    }
    
    const handleCopySlots = async (sourceSlots: string[], targetDayIds: string[]) => {
        if (targetDayIds.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhum dia selecionado', description: 'Selecione pelo menos um dia para copiar os horários.' });
            return;
        }
        
        try {
            const updates = targetDayIds.map(dayId => 
                supabase.from('schedules').update({ time_slots: sourceSlots.sort() }).eq('id', dayId)
            );
            await Promise.all(updates);

            toast({ title: 'Horários Copiados!', description: `Os horários foram copiados para ${targetDayIds.length} dia(s).` });
            fetchData();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Erro ao Copiar', description: e.message });
        }
    };

    if (error) {
        return <div className="text-red-500">Erro: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gerir Horários</CardTitle>
                    <CardDescription>Defina os horários disponíveis para agendamento para cada dia da semana.</CardDescription>
                </CardHeader>
            </Card>

            {isLoading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            )}

            {!isLoading && schedules && schedules.length === 0 && (
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">Nenhum horário encontrado</h3>
                        <p className="text-sm text-muted-foreground">Comece por alimentar os horários iniciais.</p>
                        <Button className="mt-4" onClick={handleSeedSchedules}>
                            <Rocket className="mr-2 h-4 w-4" />
                            Alimentar Horários Iniciais
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {schedules?.map(day => (
                    <Card key={day.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{day.day_name}</CardTitle>
                            {schedules && (
                                <CopySchedulePopover
                                    sourceDay={day}
                                    allDays={schedules}
                                    onCopy={handleCopySlots}
                                />
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    type="time"
                                    value={newTime[day.id] || ''}
                                    onChange={(e) => setNewTime(prev => ({...prev, [day.id]: e.target.value}))}
                                    placeholder="HH:MM"
                                />
                                <Button onClick={() => handleAddTimeSlot(day.id)} size="icon">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[50px]">
                                {day.time_slots.length > 0 ? day.time_slots.map(slot => (
                                    <Badge key={slot} variant="secondary" className="relative pr-6 group">
                                        {slot}
                                        <button onClick={() => handleRemoveTimeSlot(day.id, slot)} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )) : (
                                    <p className="text-sm text-muted-foreground self-center">Fechado</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
