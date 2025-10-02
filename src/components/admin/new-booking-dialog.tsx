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
import { services } from "@/lib/services"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, Calendar, Clock, Save } from "lucide-react"
import { createBooking } from "@/app/admin/actions"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Separator } from "../ui/separator"

const FormSchema = z.object({
  userId: z.string({ required_error: "Deve selecionar um cliente." }),
  serviceId: z.string({ required_error: "Deve selecionar um serviço." }),
  duration: z.string({ required_error: "Deve selecionar uma duração." }),
  notes: z.string().optional(),
})

interface NewBookingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bookingData: { start: Date; end: Date } | null
  profiles: Profile[]
  onSuccess: () => void
}

export function NewBookingDialog({
  isOpen,
  onOpenChange,
  bookingData,
  profiles,
  onSuccess,
}: NewBookingDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const { watch, setValue, reset } = form;
  const selectedServiceId = watch("serviceId");
  const selectedService = services.find(s => s.id === selectedServiceId);

  React.useEffect(() => {
    if (selectedService && selectedService.durations.length === 1) {
        setValue('duration', String(selectedService.durations[0]));
    } else {
        setValue('duration', '');
    }
  }, [selectedService, setValue]);
  
  React.useEffect(() => {
      if (!isOpen) {
          reset();
          setIsSubmitting(false);
      }
  }, [isOpen, reset]);


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!bookingData) return;
    setIsSubmitting(true)

    const selectedProfile = profiles.find(p => p.id === data.userId);
    if (!selectedProfile) {
        toast({ title: "Erro", description: "Cliente inválido.", variant: "destructive"})
        setIsSubmitting(false);
        return;
    }

    const bookingPayload = {
      user_id: data.userId,
      service_id: data.serviceId,
      date: format(bookingData.start, "yyyy-MM-dd"),
      time: format(bookingData.start, "HH:mm:ss"),
      status: "Confirmado" as const,
      name: selectedProfile.full_name,
      email: selectedProfile.email,
      duration: Number(data.duration),
    }

    const result = await createBooking(bookingPayload);

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
        </SheetHeader>
        <Separator/>

        <div className="flex-grow overflow-y-auto px-6 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
             <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm font-medium">{bookingData ? format(bookingData.start, "dd 'de' MMM, yyyy", {locale: ptBR}) : 'N/A'}</span>
                </div>
                 <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Clock className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm font-medium">{bookingData ? `às ${format(bookingData.start, 'HH:mm')}` : 'N/A'}</span>
                </div>
            </div>

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
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

            {selectedService && selectedService.durations.length > 1 && (
                 <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma duração" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedService.durations.map(duration => (
                            <SelectItem key={duration} value={String(duration)}>{duration} min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
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

            <div className="mt-auto">
                <Separator className="my-4"/>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Sub Total</span>
                    <span className="font-bold">€0.00</span>
                </div>
            </div>

            <SheetFooter className="p-6 pt-4 bg-background sticky bottom-0">
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
