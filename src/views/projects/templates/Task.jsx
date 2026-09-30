import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Search, Plus, Workflow, FileText, Layers3, X, ArrowLeft } from "lucide-react"
import { toast } from "wc-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import MoreOptions from "@/components/Tables/MoreOptions"
import Pagination from "@/components/Tables/Pagination"

import useTableTool from "@/hooks/useTableTool"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/hooks/useAuth"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
import { useWorkflows } from "@/hooks/projects/wf/useWorkflows"

import { activeFiltersToParams } from "@/lib/filterUtils"
import { getWorkflows } from "@/services/projects/wf/workflows/getWorkflows"
import { getTasksOptions, getWorkflowsOptions } from "@/services/getOptionsFilters"
import { buildTicketRowForTemplate, exportTicketToXlsx } from "@/lib/exportExcel"
import { useTasks } from "@/hooks/projects/wf/useTasks"


const TABLE_ID = "wf_tasks"

const columns = [
    { id: "task_code", label: "Código", visible: true },
    { id: "name", label: "Nombre", visible: true },
    { id: "sla", label: "SLA", visible: true },
    { id: "subtasks", label: "Subtareas", visible: true },
    { id: "status", label: "Estado", visible: true },
    { id: "createdAt", label: "Fecha Creación", visible: true },
    { id: "updatedAt", label: "Fecha Actualización", visible: true }
]

const STATUS = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
    INACTIVE: "bg-blue-50 text-blue-700 border-blue-100",
}

function formatDate(value) {
    if (!value) return "-"
    const date = new Date(value)

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date)
}

export default function Task() {

    const { user } = useAuth()

    const {
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        sortDirection,
        setSortDirection,
        itemsPerPage,
        setItemsPerPage,
        visibleColumns
    } = useTableTool({ columns })

    const [filters, setFilters] = useState({
        search: ""
    })

    const { filterOptions } = useOptionsFilter({
        request: getTasksOptions,
        debugName: "getTasksOptions"
    })

    const availableFilters = useMemo(() => [
        {
            id: "task_code",
            label: "Codigo",
            type: "select",
            icon: FileText,
            options: filterOptions.task_code || []
        },
        {
            id: "name",
            label: "Nombre",
            type: "select",
            icon: Layers3,
            options: filterOptions.name || []
        },
        {
            id: "status",
            label: "Estado",
            type: "select",
            icon: Layers3,
            options: filterOptions.status || []
        }
    ], [filterOptions])

    const {
        activeAdvancedFilters,
        setActiveAdvancedFilters,
        removeAdvancedFilter
    } = usePersistentAdvancedFilters({
        tableId: TABLE_ID,
        userKey: user?.email
    })

    const advancedFilters = useMemo(
        () => activeFiltersToParams(activeAdvancedFilters),
        [activeAdvancedFilters]
    )

    const advancedFiltersKey = useMemo(
        () => JSON.stringify(advancedFilters),
        [advancedFilters]
    )

    const debouncedSearch = useDebounce(filters.search, 300)

    useEffect(() => {
        setCurrentPage(1)
    }, [
        debouncedSearch,
        advancedFiltersKey,
        itemsPerPage,
        sortBy,
        sortDirection,
        setCurrentPage
    ])

    const queryParams = useMemo(() => ({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        sortBy,
        sortDirection,
        ...advancedFilters
    }), [
        currentPage,
        itemsPerPage,
        debouncedSearch,
        sortBy,
        sortDirection,
        advancedFilters
    ])

    const {
        tasks,
        loading,
        totalResults,
        totalPages,
        // addWorkflow,
        // addVersion
    } = useTasks(queryParams)


    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-6 lg:py-8">
            <div className="flex min-h-full w-full max-w-[1600px] flex-col">

                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <a 
                            href="#" 
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Tareas</h2>
                    </div>
                    {/* <CreateWorkflowDialog addWorkflow={addWorkflow} addVersion={addVersion} user={user} /> */}
                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        {/* Toolbar */}
                                        <div className="flex  pb-6  flex-col">
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                                                <FilterAdvanced
                                                    columns={columns}
                                                    availableFilters={availableFilters}
                                                    data={tasks}
                                                    activeFilters={activeAdvancedFilters}
                                                    onActiveFiltersChange={setActiveAdvancedFilters}
                                                    showFiltersInsidePopover={false}
                                                />
                                                {/* Búsqueda */}
                                                <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Buscar por código o nombre"
                                                        value={filters.search ?? ""}
                                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                        className="pl-9 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                                    />
                                                </div>
        
                                                <div className="flex items-center justify-between sm:justify-start gap-6 sm:ml-auto">
                                                    {/* Resultados */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-[#364153] font-medium">{totalResults}</span>
                                                        <span className="text-sm text-muted-foreground">resultados</span>
                                                    </div>
                                                    {/* Mas Opciones */}
                                                    <MoreOptions
                                                        itemsPerPage={itemsPerPage}
                                                        setItemsPerPage={setItemsPerPage}
                                                        sortBy={sortBy}
                                                        setSortBy={setSortBy}
                                                        sortDirection={sortDirection}
                                                        setSortDirection={setSortDirection}	
                                                        template="/plantillas/template_download_ticket.xlsx"
                                                        fileName="Reporte Workflows"
                                                        // data={tickets}
                                                        // queryParams={ticketParams}
                                                        totalResults={totalResults}
                                                        // service={getAllTickets}
                                                        transformData={buildTicketRowForTemplate}
                                                        exportData={exportTicketToXlsx}     
                                                    />

                                                </div>
                                            </div>

                                            {activeAdvancedFilters.length > 0 && (
                                                <div className="col-span-2 col-start-1 row-start-3 mt-4 flex flex-wrap items-center gap-2">
                                                    <div className="text-lighttext mr-2 cursor-default border-r pr-4 leading-6">
                                                        Filtros activos
                                                    </div>
                                                    {activeAdvancedFilters.map((filter) => (
                                                        <div key={filter.id} data-filtercontainer="" className="relative">
                                                        <input type="hidden" name="filterSuperStatus" value="0" />
                                                            <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3.5 leading-6 text-violet-600 pr-8 cursor-pointer">
                                                                {filter.label}: <strong className="font-medium">{filter.value}</strong>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeAdvancedFilter(filter.id)}
                                                                    className="absolute right-px rounded-full p-1.25 opacity-75 transition-all hover:opacity-100 focus:bg-violet-200"
                                                                    aria-label={`Quitar filtro ${filter.label}`}
                                                                >
                                                                        <X className="h-4 w-4 " />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="max-h-[580px] overflow-auto">
                                            <Table>
                                                <TableHeader className="sticky top-0 z-20 bg-slate-50">
                                                    <TableRow>
                                                        {columns.map(column =>
                                                            visibleColumns[column.id] ? (
                                                                <TableHead
                                                                    key={column.id}
                                                                    className="whitespace-nowrap text-xs uppercase text-slate-500"
                                                                >
                                                                    {column.label}
                                                                </TableHead>
                                                            ) : null
                                                        )}
                                                        <TableHead className="w-12" />
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {loading ? (
                                                        Array.from({ length: 5 }).map((_, index) => (
                                                            <TableRow key={index}>
                                                                {columns.map(column =>
                                                                    visibleColumns[column.id] ? (
                                                                        <TableCell key={column.id}>
                                                                            <Skeleton className="h-4 w-[80%]" />
                                                                        </TableCell>
                                                                    ) : null
                                                                )}
                                                                <TableCell />
                                                            </TableRow>
                                                        ))
                                                    ) : tasks.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={columns.length + 1}
                                                                className="h-32 text-center text-sm text-slate-500"
                                                            >
                                                                No hay Workflows registrados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        tasks.map(row => (
                                                            <TableRow
                                                                key={row._id}
                                                                className="hover:bg-slate-50/70"
                                                            >
                                                                {visibleColumns.task_code && (
                                                                    <TableCell>
                                                                        <Link
                                                                            to={`/projects/templates/tasks/${row._id}`}
                                                                            className="font-semibold text-blue-600 hover:underline"
                                                                        >
                                                                            {row.task_code}
                                                                        </Link>
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.name && (
                                                                    <TableCell className="font-medium text-slate-700">
                                                                        {row.name}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.sla && (
                                                                    <TableCell>
                                                                        {row.sla_days ?? "-"}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.subtasks && (
                                                                    <TableCell>
                                                                        {row.subtasks.length ?? "-"}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.status && (
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={
                                                                                STATUS[row.status] ||
                                                                                STATUS.ARCHIVED
                                                                            }
                                                                        >
                                                                            {row.status || "DRAFT"}
                                                                        </Badge>
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.createdAt && (
                                                                    <TableCell>
                                                                        {formatDate(row.createdAt)}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.updatedAt && (
                                                                    <TableCell>
                                                                        {formatDate(row.updatedAt)}
                                                                    </TableCell>
                                                                )}

                                                                {/* <TableCell>
                                                                    <Link
                                                                        to={`/projects/templates/workflows/${row._id}`}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
                                                                    >
                                                                        ›
                                                                    </Link>
                                                                </TableCell> */}
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="px-4 pb-4">
                                            <Pagination
                                                totalResults={totalResults}
                                                totalPages={totalPages}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                            />
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}