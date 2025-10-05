
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateUserProfile } from "@/app/admin/actions"
import type { Profile } from "@/types/profile"
import { Loader2, Save } from "lucide-react"

const subscriptionPlans = [
  'Sem Plano',
  'Plano Bronze',
  'Plano Prata',
  'Plano Gold',
]

const formSchema = z.object({
  userId: z.string().uuid(),
  subscription_plan: z.string(),
  refunded_minutes: z.coerce.number().int().min(0, "Os minutos devem ser um número positivo."),
})

type EditUserFormProps = {
  userProfile: Profile
  onSuccess: () => void
}

export function EditUserForm({ userProfile, onSuccess }: EditUserFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: userProfile.id,
      subscription_plan: userProfile.subscription_plan || "Sem Plano",
      refunded_minutes: userProfile.refunded_minutes || 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("userId", values.userId)
    formData.append("subscription_plan", values.subscription_plan)
    formData.append("refunded_minutes", String(values.refunded_minutes))
    
    const result = await updateUserProfile(formData)
    
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Perfil Atualizado!",
        description: `O perfil de ${userProfile.full_name} foi guardado com sucesso.`,
      })
      onSuccess()
    } else {
       toast({
        title: "Erro ao Atualizar",
        description: result.error || "Não foi possível guardar as alterações.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-medium">{userProfile.full_name}</h3>
            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
        </div>

        <FormField
          control={form.control}
          name="subscription_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano de Subscrição</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subscriptionPlans.map(plan => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
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
          name="refunded_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minutos de Bónus (Reembolsados)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormDescription>
                Este valor é adicionado aos minutos disponíveis do utilizador.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSubmitting ? "A Guardar..." : "Guardar Alterações"}
        </Button>
      </form>
    </Form>
  )
}
