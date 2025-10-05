
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  getFilteredRowModel,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import type { Profile } from "@/types/profile"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { updateUserRole } from "@/app/admin/actions"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { EditUserForm } from "./edit-user-form"


interface DataTableProps<TData extends Profile, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function UsersTable<TData extends Profile, TValue>({
  columns,
  data: initialData,
}: DataTableProps<TData, TValue>) {
    const router = useRouter()
    const { toast } = useToast()
    const [data, setData] = React.useState(initialData);
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<TData | null>(null)

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    }
    fetchUser();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    const result = await updateUserRole(userId, newRole)
    if (result.success) {
      toast({
        title: "Função Atualizada",
        description: `O utilizador foi ${newRole === 'admin' ? 'promovido a administrador' : 'revertido para utilizador'}.`,
      })
      router.refresh()
    } else {
      toast({
        title: "Erro ao Atualizar",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: TData) => {
    setSelectedUser(user);
    setIsEditSheetOpen(true);
  }

  const handleSuccess = () => {
    setIsEditSheetOpen(false);
    router.refresh();
  }


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
        pagination: {
            pageSize: 8,
        }
    },
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      updateRole: handleUpdateRole,
      editUser: handleEditUser,
      currentUserId: currentUser?.id,
    }
  })

  // We need to re-render the table when the currentUser state is updated
  React.useEffect(() => {
    table.setOptions(prev => ({
        ...prev,
        meta: {
            ...prev.meta,
            currentUserId: currentUser?.id,
        }
    }))
  }, [currentUser, table]);

  return (
    <>
        <div className="flex items-center py-4">
            <Input
            placeholder="Filtrar por nome ou email..."
            value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("full_name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
        </div>
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    return (
                    <TableHead key={header.id}>
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                    </TableHead>
                    )
                })}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum resultado.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
            Anterior
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
            Seguinte
            </Button>
        </div>

        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Gerir Perfil do Utilizador</SheetTitle>
                    <SheetDescription>
                        Altere o plano de subscrição e os minutos de bónus do utilizador.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    {selectedUser && (
                        <EditUserForm 
                            userProfile={selectedUser}
                            onSuccess={handleSuccess}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    </>
  )
}
