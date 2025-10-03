
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Service } from "@/lib/services"
import { MoreHorizontal, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { iconMap } from "@/lib/icon-map"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends Service> {
    editService: (service: TData) => void
  }
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const service = row.original
      const ServiceIcon = iconMap[service.icon as keyof typeof iconMap] || iconMap.default
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-sm">
            <ServiceIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="font-medium">{service.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <p className="text-muted-foreground max-w-xs truncate">{row.getValue("description")}</p>
  },
  {
    accessorKey: "durations",
    header: "Durações",
    cell: ({ row }) => {
      const durations = row.getValue("durations") as number[]
      if (!durations || durations.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {durations.map((d) => (
            <Badge key={d} variant="secondary">{d} min</Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return (
            <div className="flex items-center gap-2 font-mono text-xs">
                <Tag className="w-3 h-3 text-muted-foreground"/>
                {id}
            </div>
        )
    }
  },
   {
    id: "actions",
    cell: ({ row, table }) => {
      const service = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => table.options.meta?.editService(service)}>
              Editar Serviço
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                Eliminar Serviço
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
