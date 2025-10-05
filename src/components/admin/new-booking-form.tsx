
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, getDay, parse as parseDate } from 'date-fns'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createBooking } from "@/app/admin/actions"
import type { Service } from "@/lib/services"
import type { Profile } from "@/types/profile"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const bookingSchema = z.object({
  isGuest: z.boolean(),
  userId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  serviceId: z.string({ required_error: "Deve selecionar um serviço." }),
  duration: z.string({ required_error: "Deve selecionar uma duração." }),
  date: z.date({ required_error: "Deve selecionar uma data." }),
  time: z.string({ required_error: "Deve selecionar uma hora." }),
}).refine(data => {
  if (data.isGuest) {
    return !!data.guestName && !!data.guestEmail;
  }
  return !!data.userId;
}, {
  message: "Selecione um utilizador registado ou forneça nome e email para o convidado.",
  path: ["userId"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface NewBookingFormProps {
  services: Service[];
  profiles: Profile[];
  onSuccess: () => void;
}

export function NewBookingForm({ services, profiles, onSuccess }: NewBookingFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isGuest, setIsGuest] = React.useState(false)
  const [isUserPopoverOpen, setIsUserPopoverOpen] = React.useState(false)
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = React.useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      isGuest: false,
    },
  })

  const selectedServiceId = form.watch("serviceId");
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedDate = form.watch("date");

  React.useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    const fetchOperatingHours = async () => {
      setIsLoadingTimes(true);
      const supabase = createClient();
      const dayOfWeek = getDay(selectedDate);
      
      const { data: operatingHours, error } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .single();
      
      if (error || !operatingHours || !operatingHours.is_active) {
        toast({ title: "Erro", description: "Não foi possível carregar os horários para este dia ou o dia está inativo.", variant: 'destructive' });
        setTimeSlots([]);
      } else {
        const { start_time, end_time, interval_minutes } = operatingHours;
        const slots = [];
        let currentTime = parseDate(start_time, 'HH:mm:ss', new Date());
        const endTime = parseDate(end_time, 'HH:mm:ss', new Date());

        while(currentTime < endTime) {
            slots.push(format(currentTime, 'HH:mm'));
            currentTime.setMinutes(currentTime.getMinutes() + interval_minutes);
        }
        setTimeSlots(slots);
      }
      setIsLoadingTimes(false);
    }
    fetchOperatingHours();
  }, [selectedDate, toast]);


  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true)

    const formData = new FormData();
    formData.append('date', format(data.date, 'yyyy-MM-dd'));
    formData.append('time', `${data.time}:00`);
    formData.append('service_id', data.serviceId);
    formData.append('duration', data.duration);
    formData.append('status', 'Confirmado');

    if (data.isGuest) {
        formData.append('user_id', ''); // Empty string for guest
        formData.append('name', data.guestName!);
        formData.append('email', data.guestEmail!);
    } else {
        formData.append('user_id', data.userId!);
        formData.append('name', '');
        formData.append('email', '');
    }

    const result = await createBooking(formData)

    if (result.success) {
      toast({
        title: "Agendamento Criado!",
        description: "O novo agendamento foi adicionado com sucesso.",
      })
      onSuccess()
    } else {
      toast({
        title: "Erro ao Criar Agendamento",
        description: result.error || "Não foi possível criar o agendamento.",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="isGuest"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Agendamento de Convidado</FormLabel>
                <FormDescription>
                  Ative para agendar para um cliente não registado.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                      field.onChange(checked)
                      setIsGuest(checked)
                      form.setValue("userId", undefined)
                      form.setValue("guestName", "")
                      form.setValue("guestEmail", "")
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isGuest ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Convidado</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guestEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Convidado</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Utilizador</FormLabel>
                     <Popover open={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value
                                ? profiles.find(
                                    (profile) => profile.id === field.value
                                )?.full_name
                                : "Selecione um utilizador"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Procurar utilizador..." />
                            <CommandEmpty>Nenhum utilizador encontrado.</CommandEmpty>
                            <CommandList>
                                <CommandGroup>
                                    {profiles.map((profile) => (
                                    <CommandItem
                                        value={profile.full_name || profile.id}
                                        key={profile.id}
                                        onSelect={() => {
                                            form.setValue("userId", profile.id)
                                            setIsUserPopoverOpen(false)
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            profile.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {profile.full_name} ({profile.email})
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                            {service.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedService}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {selectedService?.durations.map(d => (
                            <SelectItem key={d} value={String(d)}>
                            {d} minutos
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date.getDay() === 0 || date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTimes || timeSlots.length === 0}>
                        <FormControl>
                        <SelectTrigger>
                             <SelectValue placeholder={isLoadingTimes ? "A carregar..." : "Selecione a hora"} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {timeSlots.map(time => (
                            <SelectItem key={time} value={time}>
                            {time}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "A criar..." : "Criar Agendamento"}
        </Button>
      </form>
    </Form>
  )
}

    