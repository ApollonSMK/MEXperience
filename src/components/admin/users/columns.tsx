
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Profile } from "@/types/profile"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const getInitials = (name: string | null) => {
  if (!name) return "??"
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export const columns: ColumnDef<Profile>[] = [
  {
    accessorKey: "full_name",
    header: "Nome",
    cell: ({ row }) => {
      const profile = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
            <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{profile.full_name}</span>
            <span className="text-xs text-muted-foreground">{profile.email}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "subscription_plan",
    header: "Plano",
     cell: ({ row }) => {
      const plan = row.getValue("subscription_plan") as string | null
      return plan ? <Badge variant="secondary">{plan}</Badge> : <Badge variant="outline">Nenhum</Badge>
    },
  },
  {
    accessorKey: "created_at",
    header: "Membro Desde",
    cell: ({ row }) => {
      const createdAtValue = row.getValue("created_at")
      if (!createdAtValue || typeof createdAtValue !== 'string') {
        return 'N/A';
      }
      try {
        const date = new Date(createdAtValue)
        // Verifica se a data é válida antes de formatar
        if (isNaN(date.getTime())) {
            return "Data inválida";
        }
        return new Intl.DateTimeFormat("pt-PT").format(date)
      } catch (e) {
          return "Data inválida";
      }
    },
  },
   {
    id: "actions",
    cell: ({ row }) => {
      const profile = row.original
 
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
             <DropdownMenuItem asChild>
                <Link href={`/admin/users/${profile.id}`}>Ver detalhes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(profile.id)}
            >
              Copiar ID do utilizador
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                Eliminar utilizador
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
