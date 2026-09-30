import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    ArrowLeft,
    Calendar,
    CalendarDays,
    CheckCircle2,
    CircleDot,
    Clock3,
    ListChecks,
    MonitorCheck,
    RefreshCw,
    Search,
    StopCircle,
    UsersRound,
    Workflow as WorkflowIcon,
    X
} from "lucide-react"

import {
    Link
} from "react-router-dom"

import {
    Badge
} from "@/components/ui/badge"

import {
    Button
} from "@/components/ui/button"

import {
    Input
} from "@/components/ui/input"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import {
    Skeleton
} from "@/components/ui/skeleton"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"


import {
    useAuth
} from "@/hooks/useAuth"


import { useTrackingMonthly } from "@/hooks/projects/wf/useTrackingMonthly"
import { activeFiltersToParams } from "@/lib/filterUtils"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
// import { useOptionsFilter } from "@/hooks/useOptionsFilter"
// import { getTrackingMonthlyOptions } from "@/services/getOptionsFilters"
import useTableTool from "@/hooks/useTableTool"
import { useDebounce } from "@/hooks/useDebounce"
import Pagination from "@/components/Tables/Pagination"
import MoreOptions from "@/components/Tables/MoreOptions"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import { getTrackingMonthlyOptions } from "@/services/getOptionsFilters"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"


const TABLE_ID = "workflow-tracking-monthly"

const columns = [
    {
        id: "identificador",
        label: "Identificador",
        visible: true
    },
    {
        id: "sitio",
        label: "Sitio",
        visible: true
    },
    {
        id: "proyecto",
        label: "Proyecto",
        visible: true
    },
    {
        id: "task_name",
        label: "Tarea",
        visible: true
    },
    {
        id: "availability",
        label: "Disponibilidad",
        visible: true
    },
    {
        id: "activity",
        label: "Actividad",
        visible: true
    },
    {
        id: "forecast_date",
        label: "Forecast",
        visible: true
    }
]

const AVAILABILITY_CONFIG = {
    AVAILABLE: {
        label: "Disponible",
        className: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500 outline-emerald-100"
    },
    TRACKING: {
        label: "Seguimiento",
        className: "bg-blue-50 text-blue-700",
        dot: "bg-blue-500 outline-blue-100"
    },
    PENDING_PREVIOUS: {
        label: "Pendiente previo",
        className: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500 outline-amber-100"
    },
    COMPLETED: {
        label: "Completado",
        className: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400 outline-slate-200"
    }
}

export default function TrackingMonthly() {

    const {
        user
    } = useAuth()


    /*
     * =========================================================
     * TABLE TOOL
     * =========================================================
     */

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
        defaultSortBy:
            "forecast_date"
    })


    /*
     * =========================================================
     * OPTIONS
     * =========================================================
     */

    const {
        filterOptions
    } = useOptionsFilter({
        request: getTrackingMonthlyOptions,
        debugName: "getTrackingMonthlyOptions"
    })


    /*
     * =========================================================
     * PRINCIPAL FILTERS
     * =========================================================
     */

    const today = new Date()

    const currentMonth =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}`


    const [planFilters, setPlanFilters] = useState({
        task_code: "ALL",
        period: currentMonth,
        forecast_source: "RESPONSIBLE"
    })


    /*
     * =========================================================
     * SEARCH
     * =========================================================
     */

    const [filters, setFilters] = useState({
        search: ""
    })

    const debouncedSearch = useDebounce(filters.search, 300)
    /*
     * =========================================================
     * ADVANCED FILTERS
     * =========================================================
     */
    const availableFilters =
        useMemo(
            () => [
                {
                    id: "task_status",
                    label: "Estado tarea",
                    type: "select",
                    icon: CircleDot,
                    options: filterOptions.task_status || []
                },
                {
                    id: "availability",
                    label: "Disponibilidad",
                    type: "select",
                    icon: ListChecks,
                    options: filterOptions.availability ||
                        [
                            "AVAILABLE",
                            "TRACKING",
                            "PENDING_PREVIOUS",
                            "COMPLETED"
                        ]
                }
            ],
            [filterOptions]
        )


    const { 
        activeAdvancedFilters, 
        setActiveAdvancedFilters, 
        removeAdvancedFilter 
    } = usePersistentAdvancedFilters({
        tableId: TABLE_ID,
        userKey: user?.email
    })


    const advancedFilters = useMemo(() =>
        activeFiltersToParams(activeAdvancedFilters),
        [activeAdvancedFilters]
    )

    const advancedFiltersKey =
        useMemo(
            () => JSON.stringify(advancedFilters),
            [advancedFilters]
        )

    /*
     * =========================================================
     * YEAR / MONTH
     * =========================================================
     */
    const { year, month} = useMemo(() => {
        const [selectedYear, selectedMonth] = String(planFilters.period)
            .split("-")
            .map(Number)

        return {
            year: selectedYear,
            month: selectedMonth
        }

    }, [planFilters.period])

    /*
     * =========================================================
     * RESET PAGE
     * =========================================================
     */
    useEffect(() => {
        setCurrentPage(1)
    }, [
        planFilters.task_code,
        planFilters.period,
        planFilters.forecast_source,
        debouncedSearch,
        advancedFiltersKey,
        itemsPerPage,
        sortBy,
        sortDirection,
        setCurrentPage
    ])


    /*
     * =========================================================
     * QUERY PARAMS
     * =========================================================
     */
    const queryParams =
        useMemo(
            () => ({
                task_code: planFilters.task_code === "ALL"
                    ? ""
                    : planFilters.task_code,
                year,
                month,
                forecast_source: planFilters.forecast_source,
                search: debouncedSearch,
                page: currentPage,
                limit: itemsPerPage,
                sortBy,
                sortDirection,
                ...advancedFilters
            }),
            [
                planFilters.task_code,
                planFilters.forecast_source,
                year,
                month,
                debouncedSearch,
                currentPage,
                itemsPerPage,
                sortBy,
                sortDirection,
                advancedFilters
            ]
        )

    /*
     * =========================================================
     * DATA
     * =========================================================
     */
    const {
        items,
        summary,
        loading,
        totalResults,
        totalPages,
        reload
    } = useTrackingMonthly(queryParams)

    /*
     * =========================================================
     * SUMMARY
     * =========================================================
     *
     * Se dejan tolerantes a diferentes nombres del backend.
     */
    const summaryData =
        useMemo(
            () => ({
                planned: summary?.planned ?? summary?.forecasted ?? summary?.total ?? 0,
                available: summary?.available ?? summary?.disponibles ?? 0,
                tracking: summary?.tracking ?? summary?.seguimiento ?? 0,
                pendingPrevious: summary?.pending_previous ?? summary?.pendingPrevious ?? 0,
                completed: summary?.completed ?? summary?.completados ?? 0
            }),
            [summary]
        )

    /*
     * =========================================================
     * VISIBLE COLUMNS
     * =========================================================
     */
    const visibleCount =
        columns.filter(
            column => visibleColumns[column.id]
        ).length

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">

            <div className="flex min-h-full w-full max-w-[1400px] flex-col">


                {/* =================================================
                    NAV TABS
                ================================================= */}

                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">

                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">

                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">


                                {/* TRACKING */}

                                <div>

                                    <Link
                                        to="/projects/tracking"
                                        className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent"
                                    >

                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100">
                                            <MonitorCheck />
                                            Tracking
                                        </div>

                                    </Link>

                                </div>


                                {/* FLOW */}
                                <div>
                                    <Link
                                        to="/projects/tracking/flow"
                                        className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent"
                                    >
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100">
                                            <WorkflowIcon />
                                            Flujo
                                        </div>
                                    </Link>
                                </div>

                                {/* MONTHLY ACTIVE */}
                                <div>
                                    <Link
                                        aria-current="page"
                                        to="/projects/tracking/monthly"
                                        className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]"
                                    >
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100">
                                            <Calendar />
                                            Plan Mensual
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/tracking/standby" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <StopCircle /> Stand By
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* =================================================
                    TITLE
                ================================================= */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/projects"
                            title="Atrás"
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-semibold text-[#2b7fff]">
                                Plan Mensual
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Sitios previstos según el forecast seleccionado.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={reload}
                        disabled={loading}
                    >
                        <RefreshCw
                            className={
                                `mr-2 h-4 w-4 ${
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }`
                            }
                        />
                        Actualizar
                    </Button>
                </div>

                {/* =================================================
                    MAIN CARD
                ================================================= */}
                <div className="relative">
                    <div className="rounded-2xl bg-white p-8 relative">
                        <div className="relative min-h-44">
                            <div className="contain-inline-size">
                                {/* =================================================
                                    PRINCIPAL FILTERS
                                ================================================= */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                    {/* TASK */}
                                    <div className="md:col-span-4">
                                        <label className="mb-2 block text-xs font-medium text-slate-600">
                                            Tarea
                                        </label>
                                        <Select
                                            value={
                                                planFilters.task_code
                                            }
                                            onValueChange={
                                                value =>
                                                    setPlanFilters(
                                                        prev => ({
                                                            ...prev,

                                                            task_code:
                                                                value
                                                        })
                                                    )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Todas las tareas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">
                                                    Todas las tareas
                                                </SelectItem>
                                                {(filterOptions.task_code || [])
                                                    .map(option => {
                                                        const value = getOptionValue(option)
                                                        const label = getOptionLabel(option)

                                                        return (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        )
                                                    }
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* MONTH */}
                                    <div className="md:col-span-4">
                                        <label className="mb-2 block text-xs font-medium text-slate-600">
                                            Mes
                                        </label>
                                        <Input
                                            type="month"
                                            value={planFilters.period}
                                            onChange={
                                                event => setPlanFilters(
                                                    prev => ({
                                                        ...prev,
                                                        period: event.target.value
                                                    })
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>

                                    {/* FORECAST */}
                                    <div className="md:col-span-4">
                                        <label className="mb-2 block text-xs font-medium text-slate-600">
                                            Forecast a consultar
                                        </label>
                                        <Select
                                            value={planFilters.forecast_source}
                                            onValueChange={
                                                value => setPlanFilters(
                                                    prev => ({
                                                        ...prev,
                                                        forecast_source: value
                                                    })
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="RESPONSIBLE">
                                                    FCST Responsable
                                                </SelectItem>
                                                <SelectItem value="PM">
                                                    FCST PM
                                                </SelectItem>
                                                <SelectItem value="SLA">
                                                    FCST SLA
                                                </SelectItem>
                                                <SelectItem value="CURRENT">
                                                    FCST Actual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="my-6 border-t border-slate-100" />
                                {/* =================================================
                                    KPI CARDS
                                ================================================= */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                    <SummaryCard
                                        icon={CalendarDays}
                                        label="Previstos"
                                        value={summaryData.planned}
                                    />
                                    <SummaryCard
                                        icon={ListChecks}
                                        label="Disponibles"
                                        value={summaryData.available}
                                    />
                                    <SummaryCard
                                        icon={UsersRound}
                                        label="Seguimiento"
                                        value={summaryData.tracking}
                                    />
                                    <SummaryCard
                                        icon={Clock3}
                                        label="Pendiente previo"
                                        value={summaryData.pendingPrevious}
                                    />
                                    <SummaryCard
                                        icon={CheckCircle2}
                                        label="Completados"
                                        value={summaryData.completed}
                                    />
                                </div>

                                {/* =================================================
                                    TABLE TOOLBAR
                                ================================================= */}
                                <div className="flex pt-6 pb-6 flex-col">
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                                        <FilterAdvanced
                                            columns={columns}
                                            availableFilters={availableFilters}
                                            data={items}
                                            activeFilters={activeAdvancedFilters}
                                            onActiveFiltersChange={setActiveAdvancedFilters}
                                            showFiltersInsidePopover={false}
                                        />

                                        {/* SEARCH */}
                                        <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar sitio, identificador o proyecto"
                                                value={filters.search ?? ""}
                                                onChange={
                                                    event => setFilters({
                                                        ...filters,
                                                        search: event.target.value
                                                    })
                                                }
                                                className="pl-9 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            />
                                        </div>

                                        {/* RIGHT */}
                                        <div className="flex items-center justify-between sm:justify-start gap-6 sm:ml-auto">
                                            {/* RESULTS */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-[#364153] font-medium">
                                                    {totalResults}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    resultados
                                                </span>
                                            </div>
                                            {/* MORE */}
                                            <MoreOptions
                                                itemsPerPage={itemsPerPage}
                                                setItemsPerPage={setItemsPerPage}
                                                sortBy={sortBy}
                                                setSortBy={setSortBy}
                                                sortDirection={sortDirection}
                                                setSortDirection={setSortDirection}
                                            />
                                        </div>
                                    </div>


                                    {/* =================================================
                                        ACTIVE FILTERS
                                    ================================================= */}
                                    {activeAdvancedFilters.length > 0 && (
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <div className="text-lighttext mr-2 cursor-default border-r pr-4 leading-6">
                                                Filtros activos
                                            </div>
                                            {activeAdvancedFilters.map(
                                                filter => (
                                                    <div
                                                        key={filter.id}
                                                        className="relative"
                                                    >
                                                        <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3.5 leading-6 text-violet-600 pr-8 cursor-pointer">
                                                            {filter.label}:
                                                            <strong className="font-medium">
                                                                {filter.value}
                                                            </strong>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAdvancedFilter(filter.id)}
                                                                className="absolute right-px rounded-full p-1.25 opacity-75 transition-all hover:opacity-100 focus:bg-violet-200"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* =================================================
                                    TABLE
                                ================================================= */}
                                <div className="max-h-[520px] overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">
                                            <TableRow className="h-8 bg-slate-50/90 hover:bg-slate-50/90">
                                                {columns.map(
                                                    column => visibleColumns[column.id] && (
                                                        <TableHead
                                                            key={column.id}
                                                            className="whitespace-nowrap"
                                                        >
                                                            <button className="flex items-center uppercase text-[#64748B] text-center gap-3 hover:text-foreground transition-colors">
                                                                {column.label}
                                                            </button>
                                                        </TableHead>
                                                    )
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* LOADING */}
                                            {loading ? (
                                                Array.from({ length: 5 }).map(
                                                    (_, rowIdx) => (
                                                        <TableRow
                                                            key={`skeleton-${rowIdx}`}
                                                        >
                                                            {columns.map(
                                                                column =>
                                                                    visibleColumns[column.id] && (
                                                                        <TableCell
                                                                            key={column.id}
                                                                        >
                                                                            <Skeleton className="h-4 w-[90%]" />
                                                                        </TableCell>
                                                                    )
                                                            )}
                                                        </TableRow>
                                                    )
                                                )

                                            ) : items.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={visibleCount || 1}
                                                        className="h-32 text-center text-muted-foreground"
                                                    >
                                                        No hay sitios previstos para el periodo seleccionado
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                items.map(row => (
                                                    <TableRow
                                                        key={`${row.instance_id}-${row.task_code}`}
                                                    >
                                                        {/* IDENTIFICADOR */}
                                                        {visibleColumns.identificador && (
                                                            <TableCell className="font-medium text-blue-600">
                                                                <Link
                                                                    to={`/projects/sites/${row.instance_id}`}
                                                                    className="truncate hover:underline"
                                                                >
                                                                    {row.identificador || "-"}
                                                                </Link>
                                                            </TableCell>
                                                        )}

                                                        {/* SITE */}
                                                        {visibleColumns.sitio && (
                                                            <TableCell className="min-w-[180px] max-w-[280px]">
                                                                <div
                                                                    className="truncate font-medium text-slate-800"
                                                                    title={row.site}
                                                                >
                                                                    {row.site || "-"}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* PROJECT */}
                                                        {visibleColumns.proyecto && (
                                                            <TableCell className="min-w-[160px]">
                                                                <div
                                                                    className="truncate"
                                                                    title={row.macro_project}
                                                                >
                                                                    {row.macro_project || "-"}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* TASK */}
                                                        {visibleColumns.task_name && (
                                                            <TableCell className="min-w-[140px]">
                                                                <div className="font-medium text-slate-700">
                                                                    {
                                                                        row.task_name ||
                                                                        row.task_code ||
                                                                        "-"
                                                                    }
                                                                </div>
                                                                {row.task_code && (
                                                                    <div className="mt-1 text-[10px] text-muted-foreground">
                                                                        {row.task_code}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        )}

                                                        {/* AVAILABILITY */}
                                                        {visibleColumns.availability && (
                                                            <TableCell className="min-w-[135px]">
                                                                <AvailabilityBadge
                                                                    value={getAvailability(row)}
                                                                />
                                                            </TableCell>
                                                        )}

                                                        {/* ACTIVITY */}
                                                        {visibleColumns.activity && (
                                                            <TableCell className="min-w-[200px]">
                                                                <div
                                                                    className="truncate font-medium text-slate-700"
                                                                    title={row.current_subtask?.name || row.activity}
                                                                >
                                                                    {
                                                                        row.current_subtask?.name ||
                                                                        row.activity ||
                                                                        "-"
                                                                    }
                                                                </div>
                                                                {row.current_subtask?.state && (
                                                                    <div className="mt-1 text-[10px] text-muted-foreground">
                                                                        {
                                                                            formatState(row.current_subtask.state)
                                                                        }
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        )}

                                                        {/* FORECAST */}
                                                        {visibleColumns.forecast_date && (
                                                            <TableCell className="min-w-[130px]">
                                                                <div className="font-medium text-[#31577e]">
                                                                    {formatDate(row.forecast_date)}
                                                                </div>
                                                                <div className="mt-1 text-[10px] text-muted-foreground">
                                                                    {
                                                                        getForecastLabel(
                                                                            row.forecast_source ||
                                                                            planFilters.forecast_source
                                                                        )
                                                                    }
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                    )
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* =================================================
                                    PAGINATION
                                ================================================= */}
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
    )
}

/*
 * =========================================================
 * SUMMARY CARD
 * =========================================================
 */

function SummaryCard({
    icon: Icon,
    label,
    value
}) {

    return (

        <div className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-4">

            <div className="flex items-center gap-2 text-xs text-[#59749a]">

                <Icon className="h-4 w-4" />

                {
                    label
                }

            </div>


            <div className="mt-2 text-xl font-semibold text-[#31577e]">

                {
                    value ??
                    0
                }

            </div>

        </div>

    )
}


/*
 * =========================================================
 * AVAILABILITY
 * =========================================================
 */

function AvailabilityBadge({
    value
}) {

    const config =
        AVAILABILITY_CONFIG[
            value
        ] || {
            label:
                formatState(
                    value
                ),

            className:
                "bg-slate-100 text-slate-600",

            dot:
                "bg-slate-400 outline-slate-200"
        }


    return (

        <Badge
            className={
                "flex w-fit items-center gap-2 truncate rounded-xl p-1.5 " +
                config.className
            }
        >

            <div
                className={
                    "size-2 flex-none rounded-full outline-4 outline-solid " +
                    config.dot
                }
            />

            {
                config.label
            }

        </Badge>

    )
}


function getAvailability(
    row
) {

    /*
     * Si backend ya devuelve availability,
     * se respeta directamente.
     */

    if (
        row?.availability
    ) {
        return row.availability
    }


    /*
     * Fallback a partir del estado de TASK.
     */

    switch (
        row?.task_status
    ) {

        case "COMPLETED":
            return "COMPLETED"

        case "ACTIVE":
            return "TRACKING"

        case "NOT_REACHED":
            return "PENDING_PREVIOUS"

        default:
            return "AVAILABLE"
    }
}


/*
 * =========================================================
 * FORECAST
 * =========================================================
 */

function getForecastLabel(
    source
) {

    switch (
        String(
            source ||
            ""
        ).toUpperCase()
    ) {

        case "RESPONSIBLE":
            return "FCST Responsable"

        case "PM":
            return "FCST PM"

        case "SLA":
            return "FCST SLA"

        case "CURRENT":
            return "FCST Actual"

        default:
            return "-"
    }
}


/*
 * =========================================================
 * FILTER OPTIONS
 * =========================================================
 */

function getOptionValue(option) {

    if (option === null || option === undefined) {
        return ""
    }

    if (typeof option === "object") {
        return String(
            option.value ??
            option.id ??
            option.code ??
            ""
        )
    }

    return String(
        option
    )
}

function getOptionLabel(option) {

    if (option === null || option === undefined) {
        return ""
    }

    if (typeof option === "object") {
        return String(
            option.label ??
            option.name ??
            option.value ??
            option.code ??
            ""
        )
    }

    return String(option)
}


/*
 * =========================================================
 * FORMATS
 * =========================================================
 */
function formatDate(value) {
    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return "-"
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


function formatState(value) {

    if (!value) {
        return "-"
    }


    return String(
        value
    )
        .replaceAll(
            "_",
            " "
        )
        .toLowerCase()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        )
}