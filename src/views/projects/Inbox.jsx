import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"

import {
    Search,
    RefreshCw,
    MoreVertical,
    Eye,
    ClipboardList,
    Users,
    Clock3,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Workflow,
    Layers3,
    CircleDot,
    ArrowLeft,
    X,
    InboxIcon,
    HistoryIcon,
    ProjectorIcon,
    CalendarDays
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/useAuth"
import useTableTool from "@/hooks/useTableTool"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { getInboxOptions } from "@/services/getOptionsFilters"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
import { activeFiltersToParams } from "@/lib/filterUtils"
import { useDebounce } from "@/hooks/useDebounce"
import { useInbox } from "@/hooks/projects/wf/useInbox"
import { useUsers } from "@/hooks/admin/useUsers"
import { buildTicketRowForTemplate, exportTicketToXlsx } from "@/lib/exportExcel"
import MoreOptions from "@/components/Tables/MoreOptions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import Pagination from "@/components/Tables/Pagination"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import { Link, useOutletContext } from "react-router"

const TABLE_ID = "workflow-inbox"

const columns = [
    { id: "identificador", label: "Identificador", visible: true },
    { id: "site", label: "Sitio", visible: true },
    { id: "sub_project", label: "Proyecto", visible: true },
    { id: "task_name", label: "Tarea", visible: true },
    { id: "activity", label: "Subtarea", visible: true },
    { id: "forecast", label: "Forecast", visible: true }
]


const RELATION = {
    MY_COURT: "MY_COURT",
    TRACKING: "TRACKING"
}

const SUBTASK_STATUS_LABEL = {
    PENDING: "Pendiente",
    ACTIVE: "Activa",
    OBSERVED: "Observada",
    WAITING: "Esperando validación",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada"
}


function InboxTab({
    active,
    children,
    onClick
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                relative
                pb-3
                pt-1
                text-sm
                font-medium
                transition-colors
                ${active
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }
            `}
        >
            {children}
            {active && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-blue-500" />
            )}
        </button>
    )
}


function InboxTableRow({
    item,
    subtasks,
    relation,
    visibleColumns,
    onOpen
}) {

    return (
        <tr className="border-b border-slate-100 align-top text-xs transition-colors last:border-b-0 hover:bg-slate-50/60">
            {/* IDENTIFICADOR */}
            {/* {visibleColumns.identificador && (
                <td className="px-4 py-4">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="text-left font-semibold text-blue-600 hover:underline"
                    >
                        {item.identificador}
                    </button>
                </td>
            )} */}

            {visibleColumns.identificador && (
                <td className="px-4 py-4 font-medium text-blue-600 ">
                    <Link to={`/projects/sites/${item.instance_id}`} className="truncate hover:underline">
                        {item.identificador}
                    </Link>
                    {/* <div className="mt-1.5">
                        <RelationBadge
                            relation={item.relation}
                        />
                    </div> */}
                </td>
            )}

            {/* <TableCell className="font-medium text-blue-600">
                <Link to={`/budget/analytics/tickets/${row.ticket_code}`} className="truncate hover:underline">
                    {row.ticket_code}
                </Link>
            </TableCell> */}

            {/* SITIO */}
            {visibleColumns.site && (
                <td className="px-4 py-4">
                    <div className="max-w-[230px] font-medium text-slate-700">
                        {item.site || "-"}
                    </div>
                    {item.tower && (
                        <div className="mt-1 text-[11px] text-slate-400">
                            {item.tower}
                        </div>
                    )}
                </td>
            )}

            {/* COD PROYECTO */}
            {visibleColumns.sub_project && (
                <td className="px-4 py-4">
                    <div className="font-medium text-slate-600">
                        {item.sub_project || "-"}
                    </div>
                    {item.macro_project && (
                        <div className="mt-1 max-w-[220px] truncate text-[11px] text-slate-400">
                            {item.macro_project}
                        </div>
                    )}
                </td>
            )}

            {/* TASK */}
            {visibleColumns.task_name && (
                <td className="px-4 py-4">
                    <div className="font-semibold text-slate-700">
                        {item.task_name || item.task_code}
                    </div>
                    {/* {item.task_name && (
                        <div className="mt-1 text-[11px] text-slate-400">
                            {item.task_code}
                        </div>
                    )} */}
                </td>
            )}

            {/* ACTIVITY */}
            {visibleColumns.activity && (
                <td className="px-4 py-3">
                    <InboxSubtasks
                        subtasks={subtasks}
                        relation={relation}
                    />
                </td>
            )}

            {/* FORECAST */}
            {visibleColumns.forecast && (
                <td className="px-4 py-4">
                    <InboxForecast
                        forecast={item.forecast}
                    />
                </td>
            )}

            {/* OPTIONS */}
            <td className="px-3 py-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={onOpen}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver actividad
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}

function RelationBadge({
    relation
}) {
    if (relation === "MY_COURT") {
        return (
            <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-[10px] font-medium text-blue-700"
            >
                En bandeja
            </Badge>
        )
    }

    return (
        <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600"
        >
            En seguimiento
        </Badge>
    )
}

function InboxForecast({
    forecast
}) {
    if (!forecast) {
        return (
            <span className="text-slate-400">-</span>
        )
    }

    const value =
        forecast.responsible_date ||
        forecast.pm_date ||
        forecast.sla_date ||
        forecast.forecast_date

    if (!value) {
        return (
            <span className="text-slate-400">-</span>
        )
    }

    return (
        <div className="flex items-center gap-2 whitespace-nowrap text-slate-600">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            {formatInboxDate(value)}
        </div>
    )
}

function formatInboxDate(value) {
    if (!value) return "-"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date)
}

function InboxSubtasks({
    subtasks = [],
    relation
}) {

    console.log("subtasks", subtasks)

    if (!subtasks.length) {
        return (
            <span className="text-slate-400">-</span>
        )
    }

    return (
        <div className="space-y-1.5">
            {subtasks.map(subtask => (
                <div
                    key={subtask.subtask_key}
                    className="
                        flex
                        min-w-[290px]
                        items-center
                        justify-between
                        gap-3
                        rounded-lg
                        border
                        border-slate-100
                        bg-slate-50/60
                        px-3
                        py-2
                    "
                >
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-700">
                                {subtask.name}
                            </span>
                            {subtask.blocking === false && (
                                <Badge
                                    variant="outline"
                                    className="border-slate-200 bg-white text-[9px] font-normal text-slate-400"
                                >
                                    No bloqueante
                                </Badge>
                            )}
                        </div>
                        {/* <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {subtask.state_label || subtask.state || "-"}
                        </div> */}
                    </div>
                    <SubtaskStatusBadge
                        status={subtask.state}
                    />
                </div>
            ))}
        </div>
    )
}

function SubtaskStatusBadge({
    status
}) {
    const config = {
        ACTIVE: {
            label: "Activa",
            className: "border-blue-200 bg-blue-50 text-blue-700"
        },

        OBSERVED: {
            label: "Observada",
            className: "border-amber-200 bg-amber-50 text-amber-700"
        },

        WAITING: {
            label: "Esperando",
            className: "border-violet-200 bg-violet-50 text-violet-700"
        },

        COMPLETED: {
            label: "Completada",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700"
        }
    }

    const current = config[status] || {
        label: status || "-",
        className: "border-slate-200 bg-slate-50 text-slate-500"
    }

    return (
        <Badge
            variant="outline"
            className={`whitespace-nowrap text-[10px] ${current.className}`}
        >
            {current.label}
        </Badge>
    )
}


export default function Inbox() {

    const { isCollapsed = false } = useOutletContext() || {}
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
    } = useTableTool({
        columns,
        defaultSortBy: "updatedAt"
    })

    const [filters, setFilters] = useState({
        search: ""
    })

    const [relation, setRelation] = useState("MY_COURT")

    const { filterOptions } = useOptionsFilter({
        request: getInboxOptions,
        debugName: "getInboxOptions"
    })

    const availableFilters = useMemo(() => [
        {
            id: "workflow_code",
            label: "Workflow",
            type: "select",
            icon: Workflow,
            options: filterOptions.workflow_code || []
        },
        {
            id: "task_code",
            label: "Tarea",
            type: "select",
            icon: Layers3,
            options: filterOptions.task_code || []
        },
        {
            id: "subtask_status",
            label: "Estado actividad",
            type: "select",
            icon: CircleDot,
            options: filterOptions.subtask_status || []
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
        relation,
        itemsPerPage,
        sortBy,
        sortDirection,
        setCurrentPage
    ])

    const queryParams = useMemo(() => ({
        user_id: String(user?.id || ""),

        relation,

        page: currentPage,
        limit: itemsPerPage,

        search: debouncedSearch,

        sortBy,
        sortDirection,

        ...advancedFilters
    }), [
        user?.id,
        relation,
        currentPage,
        itemsPerPage,
        debouncedSearch,
        sortBy,
        sortDirection,
        advancedFilters
    ])

    const {
        inboxs,
        loading,
        totalResults,
        totalPages,
        reload
    } = useInbox(queryParams)

    const openActivity = item => {
        navigate(`/projects/sites/${item.instance_id}`)
    }

    return (
        // <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
        // NEW
        <div className="flex flex-col px-4 mt-14 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            {/* <div className="flex min-h-full w-full max-w-[1600px] flex-col"> */}
            {/* NEW */}
            <div className="flex min-h-full w-full min-w-0 flex-col">

                {/* NAV TABS */}
                {/* <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72"> */}
                <div className={`fixed top-18 right-0 left-0 z-10 -mt-px flex h-14 flex-col items-center border-b bg-white px-4 md:px-6 lg:px-8 2xl:top-20 xl:px-10 2xl:px-14
                    ${
                        isCollapsed
                            ? "xl:left-16 2xl:left-16"
                            : "xl:left-60 2xl:left-72"
                    }`}
                >
                    {/* <div className="flex min-h-full w-full max-w-[1400px] flex-col"> */}
                    {/* NEW */}
                    <div className="flex min-h-full w-full flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    <Link aria-current="page" to="/projects/inbox" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <InboxIcon /> Mi bandeja
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/inbox/history" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <HistoryIcon /> Historial
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/inbox/monthly" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <ProjectorIcon /> Plan Mensual
                                        </div>
                                    </Link>
                                </div>
                            </div>  
                        </div>
                    </div>
                </div>

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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Mi Bandeja</h2>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={reload}
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${
                                loading
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />
                        Actualizar
                    </Button>
                    {/* <CreateWorkflowDialog addWorkflow={addWorkflow} addVersion={addVersion} user={user} /> */}
                </div>

                <div>
                    <div className="relative">
                        {/* <div className="rounded-2xl bg-white p-8 relative"> */}
                        {/* NEW */}
                        <div className="relative rounded-2xl bg-white p-4 md:p-5 lg:p-6">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        {/* Toolbar */}
                                        <div className="flex  pb-6  flex-col">
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                                                <FilterAdvanced
                                                    columns={columns}
                                                    availableFilters={availableFilters}
                                                    data={inboxs}
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
                                                        fileName="Reporte Inbox"
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

                                        {/* <div className="max-h-[580px] overflow-auto"> */}
                                        {/* NEW */}
                                        <div className="w-full max-h-[calc(100vh-360px)] overflow-auto">
                                            {/* <Table> */}
                                            {/* NEW */}
                                            <Table className="w-full min-w-[1050px]">
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
                                                    ) : inboxs.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={columns.length + 1}
                                                                className="h-32 text-center text-sm text-slate-500"
                                                            >
                                                                Bandeja vacía
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        inboxs.map(row => {

                                                            const visibleSubtasks = relation === "MY_COURT"
                                                                ? row.my_subtasks || []
                                                                : row.tracking_subtasks || []

                                                            return (
                                                                <InboxTableRow
                                                                    key={`${row.instance_id}_${row.task_code}`}
                                                                    item={row}
                                                                    subtasks={visibleSubtasks}
                                                                    relation={relation}
                                                                    visibleColumns={visibleColumns}
                                                                    onOpen={() =>
                                                                        openActivity(row)
                                                                    }
                                                                />
                                                            )
                                                        })
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