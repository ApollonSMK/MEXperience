
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, orderBy, query, doc } from 'firebase/firestore';
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
    dayName: string;
    timeSlots: string[];
    order: number;
}

const initialSchedules: Omit<Schedule, 'id'>[] = [
    { dayName: 'Segunda-feira', timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'], order: 1 },
    { dayName: 'Terça-feira', timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'], order: 2 },
    { dayName: 'Quarta-feira', timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'], order: 3 },
    { dayName: 'Quinta-feira', timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'], order: 4 },
    { dayName: 'Sexta-feira', timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'], order: 5 },
    { dayName: 'Sábado', timeSlots: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'], order: 6 },
    { dayName: 'Domingo', timeSlots: [], order: 7 },
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
    onCopy(sourceDay.timeSlots, targetDays);
    setTargetDays([]); // Reset after copy
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
                <p className="text-sm font-medium">Copiar horários de {sourceDay.dayName}</p>
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
                        <Label htmlFor={`copy-to-${day.id}`} className="font-normal">{day.dayName}</Label>
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
    const firestore = useFirestore();
    const { toast } = useToast();
    const [newTime, setNewTime] = useState<{ [key: string]: string }>({});

    const schedulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'schedules'), orderBy('order'));
    }, [firestore]);

    const { data: schedules, isLoading, error, mutate } = useCollection<Schedule>(schedulesQuery);

    const handleSeedSchedules = async () => {
        if (!firestore) return;
        try {
            for (const schedule of initialSchedules) {
                const id = schedule.dayName.toLowerCase().replace('-feira', '');
                const scheduleRef = doc(firestore, 'schedules', id);
                await setDocumentNonBlocking(scheduleRef, { ...schedule, id }, {});
            }
            toast({ title: "Horários Criados!", description: "O horário semanal inicial foi adicionado." });
            mutate();
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
        if (!firestore || !daySchedule) return;

        if (daySchedule.timeSlots.includes(timeToAdd)) {
            toast({ variant: "destructive", title: "Horário Duplicado", description: "Este horário já existe para este dia." });
            return;
        }

        const updatedSlots = [...daySchedule.timeSlots, timeToAdd].sort();

        try {
            const scheduleRef = doc(firestore, 'schedules', dayId);
            await setDocumentNonBlocking(scheduleRef, { timeSlots: updatedSlots }, { merge: true });
            toast({ title: "Horário Adicionado!" });
            mutate();
            setNewTime(prev => ({...prev, [dayId]: ''}));
        } catch(e: any) {
            toast({ variant: "destructive", title: "Erro ao adicionar horário", description: e.message });
        }
    };
    
    const handleRemoveTimeSlot = async (dayId: string, timeToRemove: string) => {
        const daySchedule = schedules?.find(s => s.id === dayId);
        if (!firestore || !daySchedule) return;

        const updatedSlots = daySchedule.timeSlots.filter(slot => slot !== timeToRemove);

         try {
            const scheduleRef = doc(firestore, 'schedules', dayId);
            await setDocumentNonBlocking(scheduleRef, { timeSlots: updatedSlots }, { merge: true });
            toast({ title: "Horário Removido!" });
            mutate();
        } catch(e: any) {
            toast({ variant: "destructive", title: "Erro ao remover horário", description: e.message });
        }
    }
    
    const handleCopySlots = async (sourceSlots: string[], targetDayIds: string[]) => {
        if (!firestore) return;
        if (targetDayIds.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhum dia selecionado', description: 'Selecione pelo menos um dia para copiar os horários.' });
            return;
        }
        
        try {
            for (const dayId of targetDayIds) {
                const scheduleRef = doc(firestore, 'schedules', dayId);
                await setDocumentNonBlocking(scheduleRef, { timeSlots: sourceSlots.sort() }, { merge: true });
            }
            toast({ title: 'Horários Copiados!', description: `Os horários foram copiados para ${targetDayIds.length} dia(s).` });
            mutate();
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
                            <CardTitle>{day.dayName}</CardTitle>
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
                                {day.timeSlots.length > 0 ? day.timeSlots.map(slot => (
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

    