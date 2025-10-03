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
import { Badge } from "@/components/ui/badge"
import { Loader2, X, PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  imageId: z.string().optional(),
  durations: z.array(z.number()),
})

type EditServiceFormProps = {
  service: Service
  onSuccess: () => void
}

export function EditServiceForm({ service, onSuccess }: EditServiceFormProps) {
  const { toast } = useToast()
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [durationInput, setDurationInput] = React.useState("")
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...service,
      durations: service.durations || [],
    },
  })

  const currentDurations = form.watch("durations")

  const handleAddDuration = () => {
    const newDuration = parseInt(durationInput.trim(), 10)
    if (!isNaN(newDuration) && newDuration > 0 && !currentDurations.includes(newDuration)) {
      const newDurationsArray = [...currentDurations, newDuration].sort((a, b) => a - b)
      form.setValue("durations", newDurationsArray, { shouldValidate: true })
      setDurationInput("")
    }
  }

  const handleRemoveDuration = (durationToRemove: number) => {
    const newDurationsArray = currentDurations.filter(d => d !== durationToRemove)
    form.setValue("durations", newDurationsArray, { shouldValidate: true })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("id", values.id)
    formData.append("name", values.name)
    formData.append("description", values.description || "")
    formData.append("longDescription", values.longDescription || "")
    formData.append("icon", values.icon || "")
    formData.append("imageId", values.imageId || "")
    formData.append("durations", values.durations.join(","))

    const result = await updateService(formData)
    
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Serviço Atualizado!",
        description: `O serviço "${values.name}" foi guardado com sucesso.`,
      })
      onSuccess()
      router.refresh();
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
              <FormLabel>Durações (em minutos)</FormLabel>
              <div className="flex items-center gap-2">
                 <Input 
                  type="number"
                  placeholder="Ex: 25" 
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddDuration()
                    }
                  }}
                 />
                 <Button type="button" variant="outline" onClick={handleAddDuration}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                 </Button>
              </div>
              <FormDescription>
                Adicione as durações possíveis para este serviço.
              </FormDescription>
              
               <div className="flex flex-wrap gap-2 pt-2">
                {currentDurations.map((d) => (
                  <Badge key={d} variant="secondary" className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-sm">
                    {d} min
                    <button 
                      type="button" 
                      onClick={() => handleRemoveDuration(d)}
                      className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remover {d}</span>
                    </button>
                  </Badge>
                ))}
              </div>
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
                    Nome de <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a>.
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
                    ID do `placeholder-images.json`.
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
