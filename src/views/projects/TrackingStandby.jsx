import {
    useMemo,
    useState
} from "react"

import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CalendarClock,
    CirclePause,
    Eye,
    Layers3,
    MonitorCheck,
    MoreVertical,
    RefreshCw,
    Search,
    StopCircle,
    Workflow,
    WorkflowIcon,
    X
} from "lucide-react"

import {
    Link,
    useNavigate,
    useOutletContext
} from "react-router"

import {
    Button
} from "@/components/ui/button"

import {
    Input
} from "@/components/ui/input"

import {
    Badge
} from "@/components/ui/badge"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

import {
    Skeleton
} from "@/components/ui/skeleton"



import {
    useAuth
} from "@/hooks/useAuth"

import useTableTool from "@/hooks/useTableTool"

import {
    usePersistentAdvancedFilters
} from "@/hooks/usePersistentFilters"

import {
    useDebounce
} from "@/hooks/useDebounce"

import {
    activeFiltersToParams
} from "@/lib/filterUtils"


import Pagination from "@/components/Tables/Pagination"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import MoreOptions from "@/components/Tables/MoreOptions"
import { getTrackingStandbyOptions } from "@/services/getOptionsFilters"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { useTrackingStandby } from "@/hooks/projects/wf/useTrackingStandby"
import { useResponsibleUsers } from "@/hooks/admin/useResponsibleUsers"


const TABLE_ID = "workflow-tracking-standby"

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
        id: "macro_project",
        label: "Proyecto",
        visible: true
    },
    {
        id: "task",
        label: "Tarea",
        visible: true
    },
    {
        id: "subtask",
        label: "Subtarea",
        visible: true
    },
    {
        id: "state",
        label: "Estado",
        visible: true
    },
    {
        id: "responsible",
        label: "Responsable",
        visible: true
    },
    {
        id: "standby_since",
        label: "En Stand By desde",
        visible: true
    },
    {
        id: "forecast",
        label: "Forecast",
        visible: true
    },
    {
        id: "actions",
        label: "",
        visible: true
    }
]


function StandbyBadge({ state }) {
    return (
        <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
        >
            <CirclePause className="mr-1 h-3 w-3" />

            {state || "Stand By"}
        </Badge>
    )
}


function formatDateTime(value) {

    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date)
}


function formatDate(value) {

    if (!value) {
        return "-"
    }

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


function getStandbyDays(value) {

    if (!value) {
        return null
    }

    const start = new Date(value)
    const now = new Date()

    if (Number.isNaN(start.getTime())) {
        return null
    }

    const diff = now.getTime() - start.getTime()

    return Math.max(
        0,
        Math.floor(
            diff /
            86400000
        )
    )
}


export default function TrackingStandby() {

    const { isCollapsed = false } = useOutletContext() || {}
    const navigate = useNavigate()

    const { user } = useAuth()

    const { groupUsers } = useResponsibleUsers()

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
        defaultSortBy: "standby_since"
    })

    const [
        filters,
        setFilters
    ] = useState({
        search: ""
    })

    const debouncedSearch = useDebounce(filters.search, 400)

    /*
     * =========================================================
     * FILTER OPTIONS
     * =========================================================
     */

    const {
        filterOptions
    } = useOptionsFilter({
        request: getTrackingStandbyOptions,
        debugName: "getTrackingStandbyOptions"
    })


    const availableFilters =
        useMemo(
            () => [
                {
                    id: "workflow_code",
                    label: "Workflow",
                    type: "select",
                    icon: Workflow,
                    options:
                        filterOptions
                            .workflow_code ||
                        []
                },
                {
                    id: "task_code",
                    label: "Tarea",
                    type: "select",
                    icon: Layers3,
                    options:
                        filterOptions
                            .task_code ||
                        []
                },
                {
                    id: "subtask_key",
                    label: "Subtarea",
                    type: "select",
                    icon: CirclePause,
                    options:
                        filterOptions
                            .subtask_key ||
                        []
                },
                {
                    id: "state",
                    label: "Estado",
                    type: "select",
                    icon: AlertTriangle,
                    options:
                        filterOptions
                            .state ||
                        []
                }
            ],
            [
                filterOptions
            ]
        )


    const {
        activeAdvancedFilters,
        setActiveAdvancedFilters,
        removeAdvancedFilter
    } =
        usePersistentAdvancedFilters({
            tableId:
                TABLE_ID,

            userKey:
                user?.email
        })


    const advancedFilters =
        useMemo(
            () =>
                activeFiltersToParams(
                    activeAdvancedFilters
                ),
            [
                activeAdvancedFilters
            ]
        )


    /*
     * Cuando cambia filtro avanzado
     * volvemos a primera página.
     */
    const advancedFiltersKey =
        useMemo(
            () =>
                JSON.stringify(
                    advancedFilters
                ),
            [
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
        loading,
        error,
        totalResults,
        totalPages,
        reload
    } =
        useTrackingStandby({

            workflow_code:
                advancedFilters
                    .workflow_code ||
                "",

            task_code:
                advancedFilters
                    .task_code ||
                "",

            subtask_key:
                advancedFilters
                    .subtask_key ||
                "",

            project_type_name:
                advancedFilters
                    .project_type_name ||
                "",

            search:
                debouncedSearch ||
                "",

            page:
                currentPage,

            limit:
                itemsPerPage,

            sortBy,

            sortDirection
        })


    /*
     * =========================================================
     * ACTIONS
     * =========================================================
     */

    const openSite =
        item => {

            if (
                !item?.instance_id
            ) {
                return
            }

            navigate(
                `/projects/sites/${item.instance_id}`
            )
        }


    const usersById = useMemo(() => {
        return new Map(
            groupUsers?.users?.map(user => [
                String(
                    user.id ||
                    user.user_id ||
                    user._id
                ),
                user
            ])
        )

    }, [groupUsers?.users])

    const getUserLabel = userId => {
        if (!userId) return "-"
        const user = usersById.get(String(userId))
        if (!user) {
            return String(userId)
        }

        return (
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email ||
            user.username ||
            String(userId)
        )
    }
    

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <div className="flex flex-col px-4 mt-14 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">

                {/* =================================================
                    NAV
                ================================================= */}
                {/* NAV TABS */}
                <div className={`fixed top-18 right-0 left-0 z-10 -mt-px flex h-14 flex-col items-center border-b bg-white px-4 md:px-6 lg:px-8 2xl:top-20 xl:px-10 2xl:px-14
                    ${
                        isCollapsed
                            ? "xl:left-16 2xl:left-16"
                            : "xl:left-60 2xl:left-72"
                    }`}
                >
                    <div className="flex min-h-full w-full flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    <Link aria-current="page" to="/projects/tracking" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <MonitorCheck /> Tracking
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/tracking/flow" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <WorkflowIcon /> Flujo
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/tracking/monthly" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Calendar /> Plan Mensual
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/tracking/standby" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
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
                    BREADCRUMB
                ================================================= */}
                <div className="mb-5 flex items-center justify-between gap-4 md:mb-6 lg:mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/projects/tracking"
                            title="Atrás"
                            className="flex size-8 flex-none items-center justify-center rounded-full bg-white text-gray-400 hover:text-[#2b7fff] lg:size-10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-semibold text-[#2b7fff]">
                                Stand By
                            </h2>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    CONTENT CARD
                ================================================= */}
                <div className="relative mb-6 rounded-lg bg-white p-6">
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <CirclePause className="h-5 w-5 text-amber-500" />
                            <h3 className="font-semibold text-[#31577e]">
                                Sitios en Stand By
                            </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            Se muestran las Subtareas que actualmente tienen una condición semántica de Stand By.
                        </p>
                    </div>

                    {/* =================================================
                        TOOLBAR
                    ================================================= */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <FilterAdvanced
                                availableFilters={availableFilters}
                                activeFilters={activeAdvancedFilters}
                                onChange={
                                    value => {
                                        setActiveAdvancedFilters(value)
                                        setCurrentPage(1)
                                    }
                                }
                            />

                            <div className="relative min-w-[250px] flex-1 lg:max-w-[380px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={filters.search}
                                    onChange={
                                        event => {
                                            setFilters(
                                                previous => ({
                                                    ...previous,
                                                    search: event.target.value
                                                })
                                            )
                                            setCurrentPage(1)
                                        }
                                    }
                                    placeholder="Buscar site, workflow, tarea..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <div className="text-sm text-slate-400">
                                <span className="font-semibold text-slate-700">
                                    {totalResults}
                                </span>
                                {" "}
                                resultado
                                {totalResults === 1
                                    ? ""
                                    : "s"
                                }
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                title="Actualizar"
                                onClick={reload}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <MoreOptions
                                itemsPerPage={itemsPerPage}
                                setItemsPerPage={setItemsPerPage}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                sortDirection={sortDirection}
                                setSortDirection={setSortDirection}
                            />
                        </div>

                        {/* ACTIVE FILTERS */}
                        {activeAdvancedFilters.length > 0 && (
                            <div className="col-span-1 flex flex-wrap items-center gap-2 lg:col-span-2">
                                <div className="mr-2 cursor-default border-r pr-4 text-sm leading-6 text-slate-400">
                                    Filtros activos
                                </div>
                                {activeAdvancedFilters.map(filter => (
                                    <div
                                        key={filter.id}
                                        className="relative"
                                    >
                                        <div className="flex cursor-pointer items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3.5 pr-8 text-sm leading-6 text-violet-600">
                                            {filter.label}:
                                            <strong className="font-medium">
                                                {filter.value}
                                            </strong>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    removeAdvancedFilter(filter.id)
                                                    setCurrentPage(1)
                                                }}
                                                className="absolute right-px rounded-full p-1.5 opacity-75 transition-all hover:opacity-100 focus:bg-violet-200"
                                                aria-label={`Quitar filtro ${filter.label}`}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        ERROR
                    ================================================= */}
                    {error && (
                        <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            No se pudo cargar el Tracking de Stand By.
                        </div>
                    )}

                    {/* =================================================
                        TABLE
                    ================================================= */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                        <div className="w-full max-h-[calc(100vh-360px)] overflow-auto">
                            <Table className="w-full min-w-[1050px]">
                                <TableHeader className="sticky top-0 z-10 bg-slate-50">
                                    <TableRow>
                                        {visibleColumns.identificador && (
                                            <TableHead>
                                                Identificador
                                            </TableHead>
                                        )}

                                        {visibleColumns.sitio && (
                                            <TableHead>
                                                Sitio
                                            </TableHead>
                                        )}

                                        {visibleColumns.macro_project && (
                                            <TableHead>
                                                Proyecto
                                            </TableHead>
                                        )}

                                        {visibleColumns.task && (
                                            <TableHead>
                                                Tarea
                                            </TableHead>
                                        )}

                                        {visibleColumns.subtask && (
                                            <TableHead>
                                                Subtarea
                                            </TableHead>
                                        )}

                                        {visibleColumns.state && (
                                            <TableHead>
                                                Estado
                                            </TableHead>
                                        )}

                                        {visibleColumns.responsible && (
                                            <TableHead>
                                                Responsable
                                            </TableHead>
                                        )}

                                        {visibleColumns.standby_since && (
                                            <TableHead>
                                                En Stand By desde
                                            </TableHead>
                                        )}

                                        {visibleColumns.forecast && (
                                            <TableHead>
                                                Forecast
                                            </TableHead>
                                        )}

                                        {visibleColumns.actions && (
                                            <TableHead className="w-[60px]" />
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && (
                                        <>
                                            {Array.from({length: 5}).map(
                                                (_, index) => (
                                                    <TableRow
                                                        key={index}
                                                    >
                                                        {columns
                                                            .filter(
                                                                column => visibleColumns[column.id]
                                                            )
                                                            .map(column => (
                                                                <TableCell
                                                                    key={column.id}
                                                                >
                                                                    <Skeleton className="h-5 w-full" />
                                                                </TableCell>
                                                            ))
                                                        }
                                                    </TableRow>
                                                )
                                            )}
                                        </>

                                    )}

                                    {!loading && !items.length && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    columns.filter(
                                                        column => visibleColumns[column.id]
                                                    ).length
                                                }
                                                className="h-36 text-center text-sm text-slate-400"
                                            >
                                                No existen sitios en Stand By con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading &&
                                        items.map(
                                            item => {
                                                const standbyDays = getStandbyDays(item.standby_since)

                                                return (

                                                    <TableRow
                                                        key={[
                                                            item.instance_id,
                                                            item.task_code,
                                                            item.subtask_key
                                                        ].join("-")}
                                                        className="text-xs hover:bg-slate-50/60"
                                                    >

                                                        {/* IDENTIFICADOR */}
                                                        {visibleColumns.identificador && (
                                                            <TableCell>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openSite(
                                                                            item
                                                                        )
                                                                    }
                                                                    className="font-semibold text-blue-600 hover:underline"
                                                                >
                                                                    {item.identificador}
                                                                </button>
                                                            </TableCell>
                                                        )}

                                                        {/* SITIO */}
                                                        {visibleColumns.sitio && (
                                                            <TableCell>
                                                                <div className="max-w-[220px] font-medium text-slate-700">
                                                                    {item.site || "-"}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* PROYECTO */}
                                                        {visibleColumns.macro_project && (
                                                            <TableCell>
                                                                <div className="font-medium text-slate-600">
                                                                    {item.macro_project || "-"}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* TASK */}
                                                        {visibleColumns.task && (
                                                            <TableCell>
                                                                <div className="font-medium text-slate-700">
                                                                    {item.task_name || "-"}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* SUBTASK */}
                                                        {visibleColumns.subtask && (
                                                            <TableCell>
                                                                <div className="max-w-[190px] font-medium text-slate-700">
                                                                    {item.subtask_name || "-"}
                                                                </div>
                                                            </TableCell>

                                                        )}

                                                        {/* STATE */}
                                                        {visibleColumns.state && (
                                                            <TableCell>
                                                                <StandbyBadge
                                                                    state={
                                                                        item.state ||
                                                                        item.standby_state_key
                                                                    }
                                                                />
                                                            </TableCell>
                                                        )}

                                                        {/* RESPONSABLE */}
                                                        {visibleColumns.responsible && (
                                                            <TableCell>
                                                                <div className="font-medium text-slate-700">
                                                                    {getUserLabel(
                                                                        item.standby_by_user_id
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* STANDBY SINCE */}
                                                        {visibleColumns.standby_since && (
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <CalendarClock className="h-4 w-4 text-amber-500" />
                                                                    <div>
                                                                        <div className="font-medium text-slate-600">
                                                                            {formatDateTime(
                                                                                item.standby_since
                                                                            )}
                                                                        </div>
                                                                        {standbyDays !== null && (
                                                                            <div className="mt-1 text-[11px] text-amber-600">
                                                                                {standbyDays} día
                                                                                {standbyDays === 1
                                                                                    ? ""
                                                                                    : "s"
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* FORECAST */}
                                                        {visibleColumns.forecast && (
                                                            <TableCell>
                                                                <div className="font-medium text-slate-600">
                                                                    {formatDate(item.forecast?.responsible_date)}
                                                                </div>
                                                            </TableCell>
                                                        )}

                                                        {/* ACTION */}
                                                        {visibleColumns.actions && (
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                openSite(
                                                                                    item
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            Ver sitio
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )
                                            }
                                        )
                                    }
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* =================================================
                        PAGINATION
                    ================================================= */}
                    <div className="mt-5">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            setCurrentPage={setCurrentPage}
                            setItemsPerPage={
                                value => {
                                    setItemsPerPage(value)
                                    setCurrentPage(1)
                                }
                            }
                            totalResults={totalResults}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}