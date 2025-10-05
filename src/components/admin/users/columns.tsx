
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Profile } from "@/types/profile"
import { MoreHorizontal, Shield, ShieldOff, UserCog, Trash2, Edit, ExternalLink } from "lucide-react"
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

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends Profile> {
    updateRole: (userId: string, newRole: 'admin' | 'user') => void
    currentUserId?: string
  }
}

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
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => {
      const role = row.getValue("role") as string | null
      const isAdmin = role === 'admin';
      return (
         <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? 'bg-accent text-accent-foreground' : ''}>
          {isAdmin ? <UserCog className="mr-1.5 h-3.5 w-3.5" /> : null}
          {isAdmin ? 'Admin' : 'Utilizador'}
        </Badge>
      )
    }
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
    accessorKey: "refunded_minutes",
    header: "Min. Bónus",
    cell: ({ row }) => {
        const minutes = row.getValue("refunded_minutes") as number | null
        return minutes ? <Badge variant="outline">{minutes} min</Badge> : <span className="text-muted-foreground">-</span>
    }
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
    cell: ({ row, table }) => {
      const profile = row.original
      const isCurrentUserAdmin = profile.role === 'admin';
      const isSelf = profile.id === table.options.meta?.currentUserId;
 
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
                <Link href={`/admin/users/${profile.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver e Gerir Detalhes
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isCurrentUserAdmin ? (
               <DropdownMenuItem 
                onClick={() => table.options.meta?.updateRole(profile.id, 'user')}
                disabled={isSelf}
               >
                 <ShieldOff className="mr-2 h-4 w-4" />
                 Remover Admin
              </DropdownMenuItem>
            ) : (
               <DropdownMenuItem 
                onClick={() => table.options.meta?.updateRole(profile.id, 'admin')}
                disabled={isSelf}
               >
                <Shield className="mr-2 h-4 w-4" />
                Promover a Admin
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                disabled={isSelf}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar utilizador
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
