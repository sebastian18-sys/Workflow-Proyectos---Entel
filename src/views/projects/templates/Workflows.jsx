// import {
//     ReactFlow,
//     Background,
//     Controls,
//     MiniMap
// } from "@xyflow/react"

// import "@xyflow/react/dist/style.css"

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
import { getWorkflowsOptions } from "@/services/getOptionsFilters"
import { buildTicketRowForTemplate, exportTicketToXlsx } from "@/lib/exportExcel"
import { useResponsibleUsers } from "@/hooks/admin/useResponsibleUsers"
// import { getWorkflowsOptions } from "@/services/projects/wf/getOptionsFilters"

const TABLE_ID = "wf_workflows"

const columns = [
    { id: "workflow_code", label: "Código", visible: true },
    { id: "name", label: "Nombre", visible: true },
    { id: "version", label: "Versión", visible: true },
    { id: "status", label: "Estado", visible: true },
    { id: "project_type_name", label: "Tipo Proyecto", visible: true },
    { id: "updatedAt", label: "Actualizado", visible: true }
]

const STATUS = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    DRAFT: "bg-blue-50 text-blue-700 border-blue-100",
    ARCHIVED: "bg-slate-100 text-slate-600 border-slate-200"
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

// FORM CREATE WORKFLOW
function CreateWorkflowDialog({ addWorkflow, addVersion, user }) {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        // workflow_code: "",
        name: "",
        description: "",
        project_type_id: "",
        project_type_name: "",
        created_by: ""
    })

    const reset = () => {
        setForm({
            workflow_code: "",
            name: "",
            description: "",
            project_type_id: "",
            project_type_name: ""
        })
    }

    const onSubmit = async(e) => {
        e.preventDefault()

        try {
            setLoading(true)

            const response = await addWorkflow({
                // workflow_code: form.workflow_code || undefined,
                name: form.name,
                description: form.description,
                project_type_id: "1",
                project_type_name: "EXPANSIONES",
                created_by: 7
            })

            console.log("response", response)

            if (response?.result !== "OK") {
                // throw new Error(response?.message || "No se pudo crear el Workflow")
                toast.error(response?.message || "No se pudo crear el Workflow")
            }

            const workflow = response.content.workflow

            // const versionResponse = await addVersion(workflow._id, {
            //     nodes: [],
            //     edges: []
            // })

            // // const versionResponse = await addVersion(workflow._id, initialVersion)on
            // console.log("versionResponse", versionResponse)

            // if (versionResponse?.result !== "OK") {
            //     throw new Error(versionResponse?.message || "No se pudo crear la versión inicial")
            // }

            toast.success("Workflow creado")
            reset()
            setOpen(false)
            navigate(`/projects/templates/workflows/${workflow._id}`)
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.message || error.message || "No se pudo crear")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-500 hover:bg-blue-600 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Crear workflow
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-[#31577e]">
                        Crear Workflow
                    </DialogTitle>

                    <DialogDescription>
                        Crea la plantilla base. Luego podrás diseñar el flujo y configurar sus tareas.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Código</Label>
                            <Input
                                placeholder="Ej. WF-0102"
                                value={form.workflow_code}
                                onChange={e =>
                                    setForm(p => ({
                                        ...p,
                                        workflow_code: e.target.value
                                    }))
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input
                                required
                                placeholder="Nombre del Workflow"
                                value={form.name}
                                onChange={e =>
                                    setForm(p => ({
                                        ...p,
                                        name: e.target.value
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de proyecto</Label>
                        <Input
                            placeholder="ID tipo proyecto"
                            value={form.project_type_id}
                            onChange={e =>
                                setForm(p => ({
                                    ...p,
                                    project_type_id: e.target.value
                                }))
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                            rows={4}
                            value={form.description}
                            onChange={e =>
                                setForm(p => ({
                                    ...p,
                                    description: e.target.value
                                }))
                            }
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {loading ? "Creando..." : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function Workflows() {
 
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
        request: getWorkflowsOptions,
        debugName: "getWorkflowsOptions"
    })

    const availableFilters = useMemo(() => [
        {
            id: "status",
            label: "Estado",
            type: "select",
            icon: FileText,
            options: filterOptions.status || []
        },
        {
            id: "project_type_name",
            label: "Tipo proyecto",
            type: "select",
            icon: Layers3,
            options: filterOptions.project_type_name || []
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
        workflows,
        loading,
        totalResults,
        totalPages,
        addWorkflow,
        addVersion
    } = useWorkflows(queryParams)


    const { groupUsers } = useResponsibleUsers()

    console.log("groupUsers", groupUsers)

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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Workflows</h2>
                    </div>
                    <CreateWorkflowDialog addWorkflow={addWorkflow} addVersion={addVersion} user={user} />
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
                                                    data={workflows}
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
                                                    ) : workflows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={columns.length + 1}
                                                                className="h-32 text-center text-sm text-slate-500"
                                                            >
                                                                No hay Workflows registrados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        workflows.map(row => (
                                                            <TableRow
                                                                key={row._id}
                                                                className="hover:bg-slate-50/70"
                                                            >
                                                                {visibleColumns.workflow_code && (
                                                                    <TableCell>
                                                                        <Link
                                                                            to={`/projects/templates/workflows/${row._id}`}
                                                                            className="font-semibold text-blue-600 hover:underline"
                                                                        >
                                                                            {row.code}
                                                                        </Link>
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.name && (
                                                                    <TableCell className="font-medium text-slate-700">
                                                                        {row.name}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.version && (
                                                                    <TableCell>
                                                                        {row.active_version ?? "-"}
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

                                                                {visibleColumns.project_type_name && (
                                                                    <TableCell>
                                                                        {row.project_type_name ||
                                                                            row.project_type ||
                                                                            row.project_type_id ||
                                                                            "-"}
                                                                    </TableCell>
                                                                )}

                                                                {visibleColumns.updatedAt && (
                                                                    <TableCell>
                                                                        {formatDate(row.updatedAt)}
                                                                    </TableCell>
                                                                )}

                                                                <TableCell>
                                                                    <Link
                                                                        to={`/projects/templates/workflows/${row._id}`}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100"
                                                                    >
                                                                        ›
                                                                    </Link>
                                                                </TableCell>
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