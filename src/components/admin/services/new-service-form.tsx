
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
import { createService } from "@/lib/services-db"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, X, PlusCircle, Save } from "lucide-react"
import { IconPicker } from "@/components/icon-picker"

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -

const subscriptionPlans = [
  { id: 'Plano Bronze', label: 'Plano Bronze' },
  { id: 'Plano Prata', label: 'Plano Prata' },
  { id: 'Plano Gold', label: 'Plano Gold' },
] as const;


const formSchema = z.object({
  id: z.string().min(3, "O ID deve ter pelo menos 3 caracteres."),
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  imageId: z.string().optional(),
  durations: z.array(z.number()),
  allowed_plans: z.array(z.string()).optional(),
})

type NewServiceFormProps = {
  onSuccess: () => void
}

export function NewServiceForm({ onSuccess }: NewServiceFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [durationInput, setDurationInput] = React.useState("")
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      longDescription: "",
      icon: "",
      imageId: "",
      durations: [],
      allowed_plans: [],
    },
  })

  const currentDurations = form.watch("durations")
  const currentName = form.watch("name");

  React.useEffect(() => {
    const slug = slugify(currentName);
    if (slug !== form.getValues("id")) {
        form.setValue("id", slug, { shouldValidate: true });
    }
  }, [currentName, form]);

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
    
    const formData = new FormData();
    formData.append('id', values.id);
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('longDescription', values.longDescription || '');
    formData.append('icon', values.icon || '');
    formData.append('imageId', values.imageId || '');
    formData.append('durations', values.durations.join(','));
    formData.append('allowed_plans', (values.allowed_plans || []).join(','));

    const result = await createService(formData)
    
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Serviço Criado!",
        description: `O serviço "${values.name}" foi criado com sucesso.`,
      })
      onSuccess()
    } else {
       toast({
        title: "Erro ao Criar Serviço",
        description: result.error || "Não foi possível criar o serviço.",
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
            name="id"
            render={({ field }) => (
            <FormItem>
                <FormLabel>ID do Serviço</FormLabel>
                <FormControl>
                <Input placeholder="id-do-servico" {...field} />
                </FormControl>
                <FormDescription>
                    Este é o identificador único. É gerado automaticamente a partir do nome.
                </FormDescription>
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
              
               <div className="flex flex-wrap gap-2 pt-2 min-h-[34px]">
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
        
        <FormField
          control={form.control}
          name="allowed_plans"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Planos Permitidos</FormLabel>
                <FormDescription>
                  Selecione os planos de subscrição que dão acesso a este serviço.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {subscriptionPlans.map((item) => (
                    <FormField
                    key={item.id}
                    control={form.control}
                    name="allowed_plans"
                    render={({ field }) => {
                        return (
                        <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                        >
                            <FormControl>
                            <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                        (value) => value !== item.id
                                        )
                                    )
                                }}
                            />
                            </FormControl>
                            <FormLabel className="font-normal">
                            {item.label}
                            </FormLabel>
                        </FormItem>
                        )
                    }}
                    />
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
                    <IconPicker
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Selecione um ícone para representar o serviço.
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
                  <FormLabel>Código SVG do Ícone</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Cole o código SVG aqui" {...field} />
                  </FormControl>
                  <FormDescription>
                    O SVG terá prioridade sobre o nome do ícone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSubmitting ? "A Guardar..." : "Guardar Serviço"}
        </Button>
      </form>
    </Form>
  )
}
