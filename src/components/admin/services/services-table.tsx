
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
import type { Service } from "@/lib/services"
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
import { EditServiceForm } from "./edit-service-form"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { NewServiceForm } from "./new-service-form"
import { PlusCircle } from "lucide-react"

interface DataTableProps<TData extends Service, TValue> {
  columns: ColumnDef<TData, TValue>[]
  initialData: TData[]
}

export function ServicesTable<TData extends Service, TValue>({
  columns,
  initialData,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData);
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
  const [selectedService, setSelectedService] = React.useState<TData | null>(null)
  const [isNewSheetOpen, setIsNewSheetOpen] = React.useState(false);

  // This effect updates the table data if the initialData prop changes (e.g., after router.refresh())
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleEdit = (service: TData) => {
    setSelectedService(service)
    setIsEditSheetOpen(true)
  }

  const handleSuccess = () => {
    setIsEditSheetOpen(false)
    setIsNewSheetOpen(false)
    // router.refresh() is the key to refetching server data for the current route
    router.refresh()
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
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      editService: handleEdit,
    },
  })


  return (
    <>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filtrar por nome..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={() => setIsNewSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Serviço
        </Button>
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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

       {/* Edit Service Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Editar Serviço</SheetTitle>
            <SheetDescription>
              Faça alterações nos detalhes do serviço aqui. Clique em guardar quando terminar.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {selectedService && (
              <EditServiceForm
                service={selectedService}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* New Service Sheet */}
      <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
          <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
              <SheetTitle>Adicionar Novo Serviço</SheetTitle>
              <SheetDescription>
                  Preencha os detalhes para criar um novo serviço. Clique em guardar quando terminar.
              </SheetDescription>
          </SheetHeader>
          <div className="py-4">
              <NewServiceForm onSuccess={handleSuccess} />
          </div>
          </SheetContent>
      </Sheet>
    </>
  )
}
