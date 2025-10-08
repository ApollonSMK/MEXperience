"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Service } from "@/lib/services"
import {
  format,
  parse,
  isPast,
  differenceInHours,
  parseISO,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  CalendarOff,
  Clock,
  CalendarCheck,
  CalendarX,
  CalendarDays,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { getIcon } from "@/lib/icon-map"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "../ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet"
import { Calendar } from "../ui/calendar"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Progress } from "../ui/progress"

export type UserBooking = {
  id: number
  date: string
  time: string
  service_id: string
  status: "Pendente" | "Confirmado" | "Cancelado"
  duration: number | null
}

type UserBookingsProps = {
  bookings: UserBooking[]
  services: Service[]
}

const getStatusClasses = (status: UserBooking["status"]) => {
  switch (status) {
    case "Confirmado":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800"
    case "Pendente":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800"
    case "Cancelado":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
  }
}

const StatusIcon = ({ status }: { status: UserBooking["status"] }) => {
  switch (status) {
    case "Confirmado":
      return <CalendarCheck className="w-4 h-4" />
    case "Cancelado":
      return <CalendarX className="w-4 h-4" />
    case "Pendente":
    default:
      return <Clock className="w-4 h-4" />
  }
}

const timeSlotsForReschedule = Array.from(
  { length: (21 - 7) * 4 },
  (_, i) => {
    const totalMinutes = 7 * 60 + i * 15
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`
  }
)

function RescheduleSheet({
  booking,
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  booking: UserBooking | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    booking ? parse(booking.date, "yyyy-MM-dd", new Date()) : new Date()
  )
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    booking ? booking.time.substring(0, 5) : undefined
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (booking) {
      const bookingDate = parse(booking.date, "yyyy-MM-dd", new Date())
      if (!isNaN(bookingDate.getTime())) {
        setSelectedDate(bookingDate)
      } else {
        setSelectedDate(new Date())
      }
      setSelectedTime(booking.time.substring(0, 5))
    }
  }, [booking])

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedTime) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data e hora.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("bookings")
      .update({
        date: format(selectedDate, "yyyy-MM-dd"),
        time: `${selectedTime}:00`,
      })
      .eq("id", booking.id)

    setIsSubmitting(false)

    if (error) {
      toast({
        title: "Erro ao Reagendar",
        description: `Não foi possível alterar o agendamento. ${error.message}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Agendamento Reagendado",
        description: "A sua sessão foi movida com sucesso.",
      })
      onSuccess()
    }
  }

  if (!booking) return null

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reagendar Sessão</SheetTitle>
          <SheetDescription>
            Escolha uma nova data e hora para a sua sessão.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center">
            <Label className="mb-2">Data</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              disabled={date =>
                date.getDay() === 0 || date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-select">Hora</Label>
            <Select onValueChange={setSelectedTime} defaultValue={selectedTime}>
              <SelectTrigger id="time-select">
                <SelectValue placeholder="Selecione a hora" />
              </SelectTrigger>
              <SelectContent>
                {timeSlotsForReschedule.map(time => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleReschedule} disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "A Guardar..." : "Confirmar Nova Data"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const BookingItem = ({
  booking,
  service,
  onCancel,
  onReschedule,
}: {
  booking: UserBooking
  service: Service | undefined
  onCancel: (booking: UserBooking) => void
  onReschedule: (booking: UserBooking) => void
}) => {
  const ServiceIcon = getIcon(service?.icon)

  const bookingDate = parse(booking.date, "yyyy-MM-dd", new Date())
  const [hours, minutes, seconds] = booking.time.split(":").map(Number)
  const bookingDateTime = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    bookingDate.getDate(),
    hours,
    minutes,
    seconds
  )

  const canManage = booking.status !== "Cancelado" && !isPast(bookingDateTime)

  return (
    <div className="p-4 border rounded-lg bg-background flex flex-col sm:flex-row items-start gap-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-4 flex-grow w-full">
        <div className="flex flex-col items-center justify-center p-3 rounded-md bg-muted text-muted-foreground w-20 h-20 flex-shrink-0">
          <span className="text-sm font-semibold uppercase tracking-wide">
            {format(bookingDate, "MMM", { locale: ptBR })}
          </span>
          <span className="text-3xl font-bold text-primary">
            {format(bookingDate, "dd")}
          </span>
          <span className="text-xs">{format(bookingDate, "yyyy")}</span>
        </div>
        <div className="flex-grow">
          <p className="font-bold text-lg flex items-center gap-2">
            <ServiceIcon className="w-5 h-5 text-accent" />
            {service?.name || "Serviço"}
          </p>
          <p className="text-sm text-muted-foreground">
            às {booking.time.substring(0, 5)} • {booking.duration} min
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge
              className={cn(
                "capitalize text-xs font-medium flex items-center gap-1.5 shrink-0",
                getStatusClasses(booking.status)
              )}
            >
              <StatusIcon status={booking.status} />
              {booking.status}
            </Badge>

            {canManage && (
              <>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/20 flex items-center gap-1.5"
                  onClick={() => onReschedule(booking)}
                >
                  <Edit className="w-3 h-3" /> Reagendar
                </Badge>
                <Badge
                  variant="destructive"
                  className="cursor-pointer hover:bg-red-500/80 flex items-center gap-1.5"
                  onClick={() => onCancel(booking)}
                >
                  <Trash2 className="w-3 h-3" /> Cancelar
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const EmptyState = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className="text-center py-16 bg-muted rounded-lg flex flex-col items-center justify-center">
    <CalendarOff className="w-12 h-12 text-muted-foreground mb-4" />
    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
    <p className="text-muted-foreground mt-2 max-w-xs">{description}</p>
  </div>
)

export function UserBookings({ bookings: initialBookings, services }: UserBookingsProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const serviceMap = new Map(services.map(s => [s.id, s]))
  const router = useRouter()
  const { toast } = useToast()

  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<UserBooking | null>(
    null
  )
  const [cancellationPenalty, setCancellationPenalty] = useState({
    minutes: 0,
    percentage: 0,
  })

  const [isRescheduleSheetOpen, setIsRescheduleSheetOpen] = useState(false)
  const [bookingToReschedule, setBookingToReschedule] =
    useState<UserBooking | null>(null)

  useEffect(() => {
    setBookings(initialBookings)
  }, [initialBookings])

  useEffect(() => {
    const supabase = createClient()

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel("realtime-user-bookings")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `user_id=eq.${user.id}`,
          },
          payload => {
            router.refresh()
            toast({
              title: "Lista Atualizada!",
              description: "Os seus agendamentos foram atualizados.",
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const subscriptionCleanupPromise = setupSubscription()

    return () => {
      subscriptionCleanupPromise.then(cleanup => {
        if (cleanup) cleanup()
      })
    }
  }, [router, toast])

  const handleCancelRequest = (booking: UserBooking) => {
    const bookingDate = parse(booking.date, "yyyy-MM-dd", new Date())
    const [hours, minutes] = booking.time.split(":").map(Number)
    const bookingDateTime = new Date(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate(),
      hours,
      minutes
    )

    const now = new Date()
    const hoursRemaining = differenceInHours(bookingDateTime, now)

    if (hoursRemaining >= 24) {
      setCancellationPenalty({ minutes: 0, percentage: 0 })
    } else {
      // Linear penalty: 0% at 24h, 100% at 0h.
      const percentage = Math.min(
        100,
        Math.max(0, (1 - hoursRemaining / 24) * 100)
      )
      const penaltyMinutes = Math.round(
        (booking.duration || 0) * (percentage / 100)
      )
      setCancellationPenalty({ minutes: penaltyMinutes, percentage })
    }

    setBookingToCancel(booking)
    setIsCancelAlertOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return

    const supabase = createClient()
    // For now, user cancellation just updates the status.
    // The admin will handle the refund logic based on the cancellation time.
    const { error } = await supabase
      .from("bookings")
      .update({ status: "Cancelado" })
      .eq("id", bookingToCancel.id)

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sucesso",
        description: "O seu agendamento foi cancelado.",
      })
      router.refresh()
    }
    setIsCancelAlertOpen(false)
    setBookingToCancel(null)
  }

  const handleRescheduleRequest = (booking: UserBooking) => {
    setBookingToReschedule(booking)
    setIsRescheduleSheetOpen(true)
  }

  const handleRescheduleSuccess = () => {
    setIsRescheduleSheetOpen(false)
    setBookingToReschedule(null)
    router.refresh()
  }

  const today = new Date().toISOString().split("T")[0]

  const upcomingBookings = bookings
    .filter(b => b.date >= today && b.status !== "Cancelado")
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime() ||
        a.time.localeCompare(b.time)
    )

  const pastBookings = bookings
    .filter(b => b.date < today || b.status === "Cancelado")
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        b.time.localeCompare(a.time)
    )

  return (
    <>
      <CardContent className="pt-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              <CalendarDays className="mr-2 h-4 w-4" />
              Próximos
            </TabsTrigger>
            <TabsTrigger value="past">
              <Clock className="mr-2 h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map(booking => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    service={serviceMap.get(booking.service_id)}
                    onCancel={handleCancelRequest}
                    onReschedule={handleRescheduleRequest}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem Agendamentos Futuros"
                description="Parece que não tem nenhuma sessão marcada. Agende um novo serviço para começar."
              />
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            {pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map(booking => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    service={serviceMap.get(booking.service_id)}
                    onCancel={() => {}}
                    onReschedule={() => {}}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem Histórico de Agendamentos"
                description="As suas sessões passadas aparecerão aqui após a sua primeira visita."
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Cancellation Dialogs */}
      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cancellationPenalty.percentage > 0
                ? "Atenção: Cancelamento com Penalização"
                : "Tem a certeza que quer cancelar?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                {cancellationPenalty.percentage > 0 ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                      <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
                      <p>
                        Como está a cancelar com menos de 24 horas de antecedência,
                        não será elegível para um reembolso total dos minutos.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">
                        Penalização de Cancelamento:
                      </p>
                      <Progress
                        value={cancellationPenalty.percentage}
                        className="h-3 [&>div]:bg-destructive"
                      />
                      <p className="text-sm text-center">
                        Você perderá{" "}
                        <span className="font-bold">
                          {cancellationPenalty.minutes}
                        </span>{" "}
                        de{" "}
                        <span className="font-bold">
                          {bookingToCancel?.duration}
                        </span>{" "}
                        minutos.
                      </p>
                    </div>
                    <p>Deseja continuar com o cancelamento?</p>
                  </>
                ) : (
                  <p>
                    Esta ação não pode ser desfeita. O agendamento será marcado como
                    cancelado. Como ainda faltam mais de 24 horas, os seus minutos
                    serão reembolsados se aplicável.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleSheet
        booking={bookingToReschedule}
        isOpen={isRescheduleSheetOpen}
        onOpenChange={setIsRescheduleSheetOpen}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  )
}
