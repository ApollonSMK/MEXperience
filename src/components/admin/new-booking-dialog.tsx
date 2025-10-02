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
  SheetDescription,
  SheetFooter,
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
} from "@/components/ui/command"

import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/types/profile"
import { services } from "@/lib/services"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { createBooking } from "@/app/admin/actions"

const FormSchema = z.object({
  userId: z.string({ required_error: "Deve selecionar um cliente." }),
  serviceId: z.string({ required_error: "Deve selecionar um serviço." }),
  duration: z.string({ required_error: "Deve selecionar uma duração." }),
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
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Novo Agendamento</SheetTitle>
          <SheetDescription>
            {bookingData ? `Agendando para ${format(bookingData.start, 'PPP', {locale: ptBR})} às ${format(bookingData.start, 'p', {locale: ptBR})}` : 'Preencha os detalhes do novo agendamento.'}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            "w-full justify-between",
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

            <SheetFooter className="pt-8">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
