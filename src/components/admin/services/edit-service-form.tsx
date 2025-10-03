
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updateService } from "@/lib/services-db"
import type { Service } from "@/lib/services"
import { Loader2 } from "lucide-react"

// Schema for client-side validation
const formSchema = z.object({
  id: z.string(),
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  imageId: z.string().optional(),
  durations: z.string().refine((val) => {
    if (val === "") return true; // Allow empty string
    return val.split(',').every(item => !isNaN(parseInt(item.trim(), 10)));
  }, {
    message: "As durações devem ser uma lista de números separados por vírgula (ex: 15, 30, 45)."
  }),
})

type EditServiceFormProps = {
  service: Service
  onSuccess: () => void
}

export function EditServiceForm({ service, onSuccess }: EditServiceFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...service,
      durations: service.durations ? service.durations.join(", ") : "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value as string)
    })

    const result = await updateService(formData)
    
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Serviço Atualizado!",
        description: `O serviço "${values.name}" foi guardado com sucesso.`,
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Serviço" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Curta</FormLabel>
              <FormControl>
                <Textarea placeholder="Uma descrição breve para listas e cartões." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Longa</FormLabel>
              <FormControl>
                <Textarea placeholder="Uma descrição detalhada para a página do serviço." rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durações</FormLabel>
              <FormControl>
                <Input placeholder="15, 20, 30" {...field} />
              </FormControl>
              <FormDescription>
                Insira as durações possíveis em minutos, separadas por vírgula.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sun, Dna, Waves" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome do ícone de <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID da Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: solarium, collagen-boost" {...field} />
                  </FormControl>
                  <FormDescription>
                    ID correspondente no ficheiro de imagens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "A Guardar..." : "Guardar Alterações"}
        </Button>
      </form>
    </Form>
  )
}

