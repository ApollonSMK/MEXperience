
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/types/profile"
import { useServices } from "@/contexts/services-context"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, Calendar as CalendarIcon, Clock, Save, User, Mail, Phone, Fingerprint } from "lucide-react"
import { createBooking } from "@/app/admin/actions"
import { Textarea } from "../ui/textarea"
import { Separator } from "../ui/separator"
import { Calendar } from "../ui/calendar"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

const timeSlots = Array.from({ length: (21 - 7) * 4 }, (_, i) => {
    const totalMinutes = 7 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
});

const getInitials = (name: string | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};


const FormSchema = z.object({
  userId: z.string({ required_error: "Deve selecionar um cliente." }),
  serviceId: z.string({ required_error: "Deve selecionar um serviço." }),
  time: z.string({ required_error: "Deve selecionar uma hora." }),
  duration: z.string({ required_error: "Deve selecionar uma duração." }).refine(val => parseInt(val) > 0, { message: "A duração deve ser positiva."}),
  notes: z.string().optional(),
})

interface NewBookingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bookingDate: Date | null
  profiles: Profile[]
  onSuccess: () => void
}

export function NewBookingDialog({
  isOpen,
  onOpenChange,
  bookingDate,
  profiles,
  onSuccess,
}: NewBookingDialogProps) {
  const { toast } = useToast()
  const services = useServices();
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(null);
  
  const [date, setDate] = React.useState<Date | null>(bookingDate);

  React.useEffect(() => {
    if (isOpen && bookingDate) {
      if (!date || format(date, 'yyyy-MM-dd') !== format(bookingDate, 'yyyy-MM-dd')) {
        setDate(bookingDate);
      }
    }
  }, [isOpen, bookingDate, date]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
     defaultValues: {
      userId: '',
      serviceId: '',
      time: '',
      duration: '',
      notes: ''
    }
  })

  const { watch, setValue, reset, handleSubmit, getValues } = form;
  const selectedServiceId = watch("serviceId");
  const selectedService = services.find(s => s.id === selectedServiceId);
  
  React.useEffect(() => {
    if (selectedService && selectedService.durations.length === 1) {
        setValue('duration', String(selectedService.durations[0]));
    } else if (!getValues('duration')) {
        setValue('duration', '');
    }
  }, [selectedService, setValue, getValues]);
  
  React.useEffect(() => {
      if (!isOpen) {
          reset();
          setIsSubmitting(false);
          setSelectedProfile(null);
          setDate(bookingDate);
      }
  }, [isOpen, reset, bookingDate]);


  const handleFormSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!date) {
        toast({ title: "Erro", description: "Por favor, selecione uma data.", variant: "destructive"})
        return;
    };
    if (!selectedProfile) {
        toast({ title: "Erro", description: "Por favor, selecione um cliente válido.", variant: "destructive"})
        return;
    }
    setIsSubmitting(true)

    const formData = new FormData();
    formData.append('user_id', data.userId);
    formData.append('service_id', data.serviceId);
    formData.append('date', format(date, "yyyy-MM-dd"));
    formData.append('time', data.time);
    formData.append('status', 'Confirmado');
    formData.append('duration', data.duration);
    formData.append('name', selectedProfile.full_name || "");
    formData.append('email', selectedProfile.email || "");
    
    const result = await createBooking(formData);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "O agendamento foi criado com sucesso.",
      })
      onSuccess()
    } else {
      toast({
        title: "Erro ao criar agendamento",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="font-headline text-2xl text-primary">Novo Agendamento</SheetTitle>
          <SheetDescription>
            Preencha os detalhes abaixo para criar um novo agendamento.
          </SheetDescription>
        </SheetHeader>
        <Separator/>

        <div className="flex-grow overflow-y-auto px-6 py-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 h-full flex flex-col">
             <div className="grid gap-2">
                <FormLabel>Data</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={date || undefined}
                        onSelect={(newDate) => setDate(newDate || null)}
                        initialFocus
                        locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? profiles.find(
                                (profile) => profile.id === field.value
                              )?.full_name
                            : "Selecione um cliente"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command>
                        <CommandInput placeholder="Procurar cliente..." />
                        <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                            {profiles.map((profile) => (
                                <CommandItem
                                value={profile.full_name || profile.id}
                                key={profile.id}
                                onSelect={() => {
                                    form.setValue("userId", profile.id)
                                    setSelectedProfile(profile)
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
                                {profile.full_name}
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
            
            {selectedProfile && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                     <Avatar className="h-12 w-12 border">
                        <AvatarImage src={selectedProfile.avatar_url || ''} />
                        <AvatarFallback>{getInitials(selectedProfile.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-base text-foreground">{selectedProfile.full_name}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Fingerprint className="h-4 w-4"/>
                            <span className="font-mono text-xs">{selectedProfile.id}</span>
                        </div>
                      </div>
                  </div>
                  <Separator/>
                   <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="h-4 w-4 text-accent" />
                      <span>{selectedProfile.email || 'Não fornecido'}</span>
                  </div>
                   <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-4 w-4 text-accent" />
                      <span>{selectedProfile.phone || 'Não fornecido'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="HH:MM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time.substring(0,5)}</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedService || selectedService.durations.length <= 1}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Minutos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedService?.durations.map(duration => (
                          <SelectItem key={duration} value={String(duration)}>{duration} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma nota sobre o agendamento..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="p-6 pt-4 bg-background sticky bottom-0 mt-auto">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 <Save className="mr-2 h-4 w-4" />
                Criar Agendamento
              </Button>
            </SheetFooter>
          </form>
        </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

    