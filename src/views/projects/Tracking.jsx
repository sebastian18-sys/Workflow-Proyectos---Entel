import {
    Fragment,
    useEffect,
    useMemo,
    useState
} from "react"

import {
    Activity,
    ArrowLeft,
    Calendar,
    CalendarDays,
    CircleDot,
    Download,
    ExternalLink,
    Flower,
    FolderKanban,
    GitBranch,
    Layers3,
    Loader2,
    LucideTrainTrack,
    MonitorCheck,
    PlaneTakeoffIcon,
    Route,
    RouterIcon,
    Search,
    StopCircle,
    Table2,
    Workflow,
    WorkflowIcon,
    Upload,
    FileSpreadsheet,
    X
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Dialog, 
    DialogContent, 
    DialogDescription,
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog"
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { useAuth } from "@/hooks/useAuth"
// import { useTableTool } from "@/hooks/useTableTool"
import { useDebounce } from "@/hooks/useDebounce"
import Dropzone from "@/components/drag_drop/drag_drop"
import { useTracking } from "@/hooks/projects/wf/useTracking"
import { getTrackingOptions } from "@/services/getOptionsFilters"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { activeFiltersToParams } from "@/lib/filterUtils"
import useTableTool from "@/hooks/useTableTool"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import Pagination from "@/components/Tables/Pagination"
import MoreOptions from "@/components/Tables/MoreOptions"
import { Skeleton } from "@/components/ui/skeleton"
import { useInstances } from "@/hooks/projects/wf/useInstances"
import { useForecasts } from "@/hooks/projects/wf/useForecasts"
import { useAuthz } from "@/hooks/useAuthz"
import { PERMS } from "@/constants/perm"
import { formatDDMMYYYY } from "@/lib/helpers"
import { toast } from "wc-toast"
import { useTrackingReport } from "@/hooks/projects/wf/useTrackingReport"
import { exportTrackingReportToXlsx } from "@/lib/trackingReport"
import * as XLSX from "xlsx"
import { useTrackingForecastBulk } from "@/hooks/projects/wf/useTrackingForecastBulk"

function toDateInputValue(value) {
    if (!value) return ""

    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]

    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? ""
        : date.toISOString().slice(0, 10)
}

function toExcelDate(value) {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}

function excelDateToISO(value) {
    if (value === null || value === undefined || value === "") return ""

    if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value)
        if (!parsed) return ""
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`
    }

    const text = String(value).trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

    const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
    if (match) {
        const [, d, m, y] = match
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    }

    const date = new Date(text)
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

const TABLE_ID = "workflow-tracking"

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
        id: "workflow_start_date",
        label: "Inicio Workflow",
        visible: true
    },
    {
        id: "tasks",
        label: "Tareas",
        visible: true
    },
    {
        id: "action",
        label: "Acción",
        visible: true
    }
]

const TASK_STATUS = {
    NOT_REACHED: [
        "bg-slate-100 text-slate-600",
        "bg-slate-400 outline-slate-200"
    ],

    ACTIVE: [
        "bg-blue-50 text-blue-700",
        "bg-blue-500 outline-blue-100"
    ],

    COMPLETED: [
        "bg-emerald-50 text-emerald-700",
        "bg-emerald-500 outline-emerald-100"
    ],

    CANCELLED: [
        "bg-red-50 text-red-700",
        "bg-red-500 outline-red-100"
    ],

    ERROR: [
        "bg-red-50 text-red-700",
        "bg-red-500 outline-red-100"
    ]
}

const TASK_STATUS_LABEL = {
    NOT_REACHED: "Pendiente",
    ACTIVE: "En curso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    ERROR: "Error"
}

export default function Tracking() {

    const navigate = useNavigate()

    const { can } = useAuthz()
    const { user } = useAuth()

    const isPM = can(PERMS.PROJECTS.PROJECT_WORKFLOW_PM_ADMIN_FUNCTIONS)

    const [tab, setTab] = useState("flow")
    const [bulkOpen, setBulkOpen] = useState(false)
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
    const [bulkFiles, setBulkFiles] = useState([])
    const [bulkFileError, setBulkFileError] = useState("")
    const [bulkPayload, setBulkPayload] = useState(null)
    const [bulkResult, setBulkResult] = useState(null)

    const {
        downloading: downloadingBulkTemplate,
        importing: importingBulkForecast,
        getTemplate,
        importForecasts
    } = useTrackingForecastBulk()

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

    const [editPmForecast, setEditPmForecast] = useState(false)
    const [savingCell, setSavingCell] = useState(null)

    const [filters, setFilters] = useState({ search: "" })

    const {
        filterOptions
    } = useOptionsFilter({
        request: getTrackingOptions,
        debugName: "getTrackingOptions"
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
            id: "workflow_version",
            label: "Versión",
            type: "select",
            icon: GitBranch,
            options: filterOptions.workflow_version || []
        },
        {
            id: "task_code",
            label: "Tarea",
            type: "select",
            icon: Layers3,
            options: filterOptions.task_code || []
        },
        {
            id: "task_status",
            label: "Estado tarea",
            type: "select",
            icon: CircleDot,
            options:
                filterOptions.task_status || []
        },
        {
            id: "instance_status",
            label: "Estado workflow",
            type: "select",
            icon: Activity,
            options: filterOptions.instance_status || []
        },
        {
            id: "project_type_name",
            label: "Tipo proyecto",
            type: "select",
            icon: FolderKanban,
            options: filterOptions.project_type_name || []
        }],
        [
            filterOptions
        ]
    )

    const {
        activeAdvancedFilters,
        setActiveAdvancedFilters,
        removeAdvancedFilter
    } = usePersistentAdvancedFilters({
        tableId: TABLE_ID,
        userKey: user?.email
    })


    const advancedFilters =
        useMemo(() => activeFiltersToParams(activeAdvancedFilters),
        [activeAdvancedFilters]
    )


    const advancedFiltersKey =
        useMemo(() =>
            JSON.stringify(advancedFilters),
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

    const queryParams =
        useMemo(
            () => ({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                sortBy,
                sortDirection,
                ...advancedFilters,
                enabled: tab === "table"
            }),
            [
                currentPage,
                itemsPerPage,
                debouncedSearch,
                sortBy,
                sortDirection,
                advancedFilters,
                tab
            ]
        )

    const {
        items,
        tasks,
        loading,
        totalResults,
        totalPages,
        reload
    } = useTracking(queryParams)

    // TABLE HELPERS
    const taskColumns = useMemo(() => {
        const taskMap = new Map()

        for (const row of items || []) {
            for (const node of row.nodes || []) {
                if (!node.task_code) {
                    continue
                }

                if (!taskMap.has(node.task_code)) {
                    taskMap.set(
                        node.task_code,
                        {
                            task_code: node.task_code,
                            task_name: node.task_name || node.task_code
                        }
                    )
                }
            }
        }

        return Array.from(
            taskMap.values()
        )
    }, [items])

    const tableColspan =
        useMemo(() => {

            let total = 0
            if (visibleColumns.identificador) total++
            if (visibleColumns.sitio) total++
            if (visibleColumns.codigo_proyecto) total++
            if (visibleColumns.workflow_start_date) total++
            if (visibleColumns.action) total++

            total += taskColumns.length * 6
            return total || 1

        }, [visibleColumns, taskColumns])

    const openSite = instanceId => {
        navigate(`/projects/sites/${instanceId}`)
    }

    const {
        openTask,
        cancelInstance,
        updateStartDate
    } = useInstances()

    const {
        updateForecast
    } = useForecasts()


    const {
        downloading,
        downloadReport
    } = useTrackingReport()

    const handleDownloadReport = async() => {
        try {
            // const workflowCode = advancedFilters.workflow_code
            // const workflowVersion = advancedFilters.workflow_version
            const workflowCode = "WF-0002"
            const workflowVersion = 1

            if (!workflowCode) {
                toast.error("Selecciona un Workflow para descargar el reporte")
                return
            }

            const content = await downloadReport({
                search: debouncedSearch || undefined,
                sortBy,
                sortDirection,
                ...advancedFilters,
                workflow_code: workflowCode,
                workflow_version: workflowVersion || undefined
            })

            if (!content?.items?.length) {
                toast.error("No existen sitios para exportar")
                return
            }

            await exportTrackingReportToXlsx({
                configuration: content.configuration || [],
                items: content.items || [],
                fileName:
                    [
                        "Reporte Tracking",
                        workflowCode,
                        workflowVersion
                            ? `v${workflowVersion}`
                            : null
                    ]
                        .filter(Boolean)
                        .join(" ")
            })

            toast.success(`${content.items.length} sitios exportados`)
        } catch (error) {
            console.error("Error descargando reporte:", error)
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo generar el reporte"
            )
        }
    }


    const handleForecastChange = async({
        row,
        node,
        value,
        source
    }) => {

        if (!row?.instance_id || !node?.task_code || !value) {
            return
        }

        const key = `${row.instance_id}-${node.task_code}-${source}`

        try {
            setSavingCell(key)
            await updateForecast(
                row.instance_id,
                node.task_code,
                {
                    forecast_date: value,
                    forecast_source: source,
                    type: "CHANGE",
                    reason:
                        source === "PM"
                            ? "Actualización FCST PM desde Tracking"
                            : "Actualización FCST Responsable desde Tracking",

                    user_id: String(user?.id || "")
                }
            )

            reload?.()

        } catch (error) {
            console.error("Error actualizando forecast:", error)
        } finally {
            setSavingCell(null)
        }
    }


    const handleStartDateChange = async(
        row,
        value
    ) => {

        if (!row?.instance_id || !value) {
            return
        }

        const key = `${row.instance_id}-start`

        try {
            setSavingCell(key)
            await updateStartDate(
                row.instance_id,
                {
                    start_date: value,
                    user_id: String(user?.id || "")
                }
            )

            reload?.()

        } catch (error) {
            console.error("Error actualizando fecha inicio:", error)
        } finally {
            setSavingCell(null)
        }
    }

    const handleOpenTask = async(
        row,
        node
    ) => {

        if (!row?.instance_id || !node?.task_code) {
            return
        }

        const key = `${row.instance_id}-${node.task_code}-open`

        try {

            setSavingCell(key)
            await openTask(
                row.instance_id,
                node.task_code,
                {
                    user_id: String(user?.id || "")
                }
            )

            reload?.()

        } catch (error) {
            console.error("Error aperturando tarea:", error)
        } finally {
            setSavingCell(null)
        }
    }

    const handleCancelSite = async row => {
        if (!row?.instance_id) {
            return
        }

        const key = `${row.instance_id}-cancel`

        try {
            setSavingCell(key)
            await cancelInstance(
                row.instance_id,
                {
                    reason: "Cancelado desde Tracking",
                    user_id: String(user?.id || "")
                }
            )

            reload?.()

        } catch (error) {
            console.error("Error cancelando sitio:", error)
        } finally {
            setSavingCell(null)
        }
    }

    const handleDownloadBulkTemplate = async() => {

        const workflowCode = "WF-0002"
        const workflowVersion = 1

        try {
            // if (!selectedWorkflowCode) {
            if(!workflowCode) {
                toast.error("Selecciona un Workflow")
                return
            }

            const content = await getTemplate({
                workflow_code: workflowCode,
                workflow_version: workflowVersion
            })

            const tasks = content.tasks || []
            const rows = content.items || []

            if (!rows.length) {
                toast.error("No existen sitios para generar el formato")
                return
            }

            const header1 = ["_instance_id", "Identificador", "Sitio", "Proyecto"]
            const header2 = ["", "", "", ""]
            const header3 = ["", "", "", ""]

            tasks.forEach(task => {
                header1.push(task.task_name, "")
                header2.push("FCST Responsable", "FCST PM")
                header3.push(task.task_code, task.task_code)
            })

            const data = rows.map(row => {
                const values = [
                    row.instance_id,
                    row.identificador,
                    row.sitio,
                    row.macro_project
                ]

                tasks.forEach(task => {
                    const forecast = row.forecasts?.[task.task_code] || {}
                    values.push(
                        toExcelDate(forecast.responsible_date),
                        toExcelDate(forecast.pm_date)
                    )
                })

                return values
            })

            const ws = XLSX.utils.aoa_to_sheet([header1, header2, header3, ...data])
            ws["!rows"] = [{}, {}, { hidden: true }]

            ws["!merges"] = tasks.map((task, index) => {
                const start = 4 + index * 2
                return { s: { r: 0, c: start }, e: { r: 0, c: start + 1 } }
            })

            ws["!cols"] = [
                { hidden: true },
                { wch: 28 },
                { wch: 32 },
                { wch: 25 },
                ...tasks.flatMap(() => [{ wch: 18 }, { wch: 18 }])
            ]

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "FCST PM")
            XLSX.writeFile(wb, `FCST_PM_WF-0002.xlsx`)
        } catch (e) {
            console.error(e)
            toast.error(e?.response?.data?.message || e.message || "No se pudo descargar el formato")
        }
    }

    const parseBulkForecastFile = async file => {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: "array" })
        const ws = workbook.Sheets[workbook.SheetNames[0]]
        if (!ws) throw new Error("El Excel no contiene hojas")

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true })
        if (rows.length < 4) throw new Error("El archivo no contiene registros")

        const header2 = rows[1]
        const taskCodes = rows[2]
        const dataRows = rows.slice(3)
        const taskColumns = []

        for (let col = 4; col < taskCodes.length; col += 2) {
            const taskCode = String(taskCodes[col + 1] || taskCodes[col] || "").trim()
            if (!taskCode) continue
            if (String(header2[col + 1] || "").trim() !== "FCST PM") continue
            taskColumns.push({ task_code: taskCode, pm_col: col + 1 })
        }

        const items = dataRows
            .filter(row => String(row[0] || "").trim())
            .map(row => {
                const forecasts = {}

                taskColumns.forEach(task => {
                    const pmDate = excelDateToISO(row[task.pm_col])
                    if (!pmDate) return
                    forecasts[task.task_code] = { pm_date: pmDate }
                })

                return {
                    instance_id: String(row[0]).trim(),
                    forecasts
                }
            })
            .filter(item => Object.keys(item.forecasts).length)

        return items
    }

    const handlePrepareBulkImport = async() => {
        try {
            const file = Array.isArray(bulkFiles) ? bulkFiles[0] : bulkFiles

            if (!file) {
                toast.error("Selecciona un archivo Excel")
                return
            }

            // if (!selectedWorkflowCode) {
            //     toast.error("Selecciona un Workflow")
            //     return
            // }

            const items = await parseBulkForecastFile(file)

            if (!items.length) {
                toast.error("No existen valores FCST PM para importar")
                return
            }

            setBulkPayload({
                // workflow_code: selectedWorkflowCode,
                workflow_code: "WF-0002",
                user_id: String(user?.id || ""),
                items
            })

            setBulkConfirmOpen(true)
        } catch (e) {
            console.error(e)
            toast.error(e.message || "No se pudo leer el archivo")
        }
    }

    const handleConfirmBulkImport = async() => {
        try {
            if (!bulkPayload) return

            const result = await importForecasts(bulkPayload)

            setBulkResult(result)
            setBulkConfirmOpen(false)
            setBulkFiles([])
            reload?.()

            if (result.failed > 0) {
                toast.error(`${result.changed} actualizado(s), ${result.failed} error(es)`)
            } else {
                toast.success(`${result.changed} FCST PM actualizado(s)`)
            }
        } catch (e) {
            console.error(e)
            toast.error(e?.response?.data?.message || e.message || "No se pudo importar")
        }
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* NAV TABS */}
                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    <Link aria-current="page" to="/projects/tracking" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
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
                    BREADCRUMB / TITLE
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
                                Tracking
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0"
                        >
                            {downloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Descargar reporte
                        </Button>

                        {isPM && (
                            <Button
                                variant={editPmForecast
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                    setEditPmForecast(prev => !prev)
                                }
                            >
                                {editPmForecast
                                    ? "Finalizar edición"
                                    : "Editar FCST PM"
                                }
                            </Button>
                        )}

                        {isPM && (
                            <Button
                                variant="outline"
                                onClick={() => setBulkOpen(true)}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Actualizar FCST Masivo
                            </Button>
                        )}
                    </div>
                </div>

                {/* =================================================
                    MAIN
                ================================================= */}

                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        {/* =================================================
                                            TOOLBAR
                                        ================================================= */}
                                        <div className="flex pb-6 flex-col">
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
                                                        placeholder="Buscar sitio, proyecto..."
                                                        value={filters.search ?? ""}
                                                        onChange={e =>
                                                            setFilters({
                                                                ...filters,
                                                                search: e.target.value
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

                                                    {/* OPTIONS */}
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
                                                <div className="col-span-2 col-start-1 row-start-3 mt-4 flex flex-wrap items-center gap-2">
                                                    <div className="text-lighttext mr-2 cursor-default border-r pr-4 leading-6">
                                                        Filtros activos
                                                    </div>
                                                    {activeAdvancedFilters.map(
                                                        filter => (
                                                            <div
                                                                key={filter.id}
                                                                data-filtercontainer=""
                                                                className="relative"
                                                            >
                                                                <input
                                                                    type="hidden"
                                                                    value="0"
                                                                    readOnly
                                                                />
                                                                <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3.5 leading-6 text-violet-600 pr-8 cursor-pointer">

                                                                    {filter.label}:
                                                                    <strong className="font-medium">
                                                                        {filter.value}
                                                                    </strong>


                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeAdvancedFilter(
                                                                                filter.id
                                                                            )
                                                                        }
                                                                        className="absolute right-px rounded-full p-1.25 opacity-75 transition-all hover:opacity-100 focus:bg-violet-200"
                                                                        aria-label={`Quitar filtro ${filter.label}`}
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

                                        <div className="max-h-[560px] overflow-auto">

                                            <Table className="min-w-max">


                                                {/* =================================================
                                                    HEADER
                                                ================================================= */}

                                                <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">


                                                    {/* FIRST LEVEL */}

                                                    <TableRow className="h-8 bg-slate-50/90 hover:bg-slate-50/90">


                                                        {visibleColumns.identificador && (

                                                            <TableHead
                                                                rowSpan={2}
                                                                className="whitespace-nowrap align-middle"
                                                            >
                                                                <button className="flex items-center uppercase text-[#64748B] gap-3">
                                                                    Identificador
                                                                </button>
                                                            </TableHead>

                                                        )}


                                                        {visibleColumns.sitio && (

                                                            <TableHead
                                                                rowSpan={2}
                                                                className="whitespace-nowrap align-middle min-w-[200px]"
                                                            >
                                                                <button className="flex items-center uppercase text-[#64748B] gap-3">
                                                                    Sitio
                                                                </button>
                                                            </TableHead>

                                                        )}

                                                        {visibleColumns.macro_project && (
                                                            <TableHead
                                                                rowSpan={2}
                                                                className="whitespace-nowrap align-middle"
                                                            >
                                                                <button className="flex items-center uppercase text-[#64748B] gap-3">
                                                                    Proyecto
                                                                </button>
                                                            </TableHead>
                                                        )}

                                                        {visibleColumns.workflow_start_date && (
                                                            <TableHead
                                                                rowSpan={2}
                                                                className="whitespace-nowrap align-middle"
                                                            >
                                                                <button className="flex items-center uppercase text-[#64748B] gap-3">
                                                                    Inicio Workflow
                                                                </button>
                                                            </TableHead>
                                                        )}


                                                        {taskColumns.map(task => (
                                                            <TableHead
                                                                key={task.task_code}
                                                                colSpan={6}
                                                                className="border-l border-slate-200 bg-blue-50/40 text-center"
                                                            >
                                                                {task.task_name}
                                                            </TableHead>
                                                        ))}


                                                        {visibleColumns.action && (
                                                            <TableHead
                                                                rowSpan={2}
                                                                className="whitespace-nowrap text-center align-middle"
                                                            >
                                                                <span className="uppercase text-[#64748B]">
                                                                    Acción
                                                                </span>
                                                            </TableHead>
                                                        )}
                                                    </TableRow>

                                                    {/* SECOND LEVEL */}
                                                    {taskColumns.length >
                                                        0 && (
                                                        <TableRow className="h-8 bg-slate-50/90 hover:bg-slate-50/90">
                                                            {taskColumns.map(task => (
                                                            <Fragment key={task.task_code}>
                                                                <TableHead className="border-l">Estado</TableHead>
                                                                <TableHead>F. Inicio</TableHead>
                                                                <TableHead>F. Fin</TableHead>
                                                                <TableHead>FCST SLA</TableHead>
                                                                <TableHead>FCST Resp.</TableHead>
                                                                <TableHead
                                                                    className={
                                                                        editPmForecast
                                                                            ? "bg-violet-50 text-violet-700"
                                                                            : ""
                                                                    }
                                                                >
                                                                    FCST PM
                                                                </TableHead>
                                                            </Fragment>
                                                        ))}
                                                        </TableRow>
                                                    )}
                                                </TableHeader>

                                                {/* =================================================
                                                    BODY
                                                ================================================= */}
                                                <TableBody>
                                                    {/* LOADING */}
                                                    {loading ? (

                                                        Array.from({
                                                            length: 5
                                                        }).map(
                                                            (
                                                                _,
                                                                rowIdx
                                                            ) => (

                                                                <TableRow key={`skeleton-${rowIdx}`}>
                                                                    {Array.from({
                                                                        length:
                                                                            tableColspan
                                                                    }).map((_, colIdx ) => (
                                                                            <TableCell
                                                                                key={colIdx}
                                                                            >
                                                                                <Skeleton className="h-4 w-[90%]" />
                                                                            </TableCell>
                                                                        )
                                                                    )}
                                                                </TableRow>
                                                            )
                                                        )

                                                    ) : items.length === 0 ? (

                                                        /* EMPTY */
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={tableColspan}
                                                                className="h-24 text-center text-muted-foreground"
                                                            >
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>

                                                    ) : (


                                                        /* DATA */
                                                        items.map(
                                                            row => {

                                                                const nodeMap =
                                                                    new Map(
                                                                        (row.nodes || []).map(
                                                                            node => [
                                                                                node.task_code,
                                                                                node
                                                                            ]
                                                                        )
                                                                    )


                                                                return (

                                                                    <TableRow
                                                                        key={
                                                                            row.instance_id
                                                                        }
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
                                                                            <TableCell className="min-w-[200px] max-w-[260px]">
                                                                                <div
                                                                                    className="truncate font-medium text-slate-800"
                                                                                    title={row.site}
                                                                                >
                                                                                    {row.sitio || row.site || "-"}
                                                                                </div>
                                                                            </TableCell>
                                                                        )}

                                                                        {/* PROJECT */}
                                                                        {visibleColumns.macro_project && (
                                                                            <TableCell className="min-w-[120px]">
                                                                                <div
                                                                                    className="truncate"
                                                                                    title={row.macro_project}
                                                                                >
                                                                                    {row.macro_project || "-"}
                                                                                </div>
                                                                            </TableCell>
                                                                        )}

                                                                        {/* WORKFLOW START */}
                                                                        {visibleColumns.workflow_start_date && (
                                                                            <TableCell className="min-w-[120px]">
                                                                                {formatDate(row.workflow_start_date)}
                                                                            </TableCell>
                                                                        )}

                                                                        {/* TASKS */}
                                                                        {taskColumns.map(task => (
                                                                            <TaskRuntimeCells
                                                                                row={row}
                                                                                node={
                                                                                    nodeMap.get(
                                                                                        task.task_code
                                                                                    )
                                                                                }
                                                                                isPM={isPM}
                                                                                editPmForecast={editPmForecast}
                                                                                savingCell={savingCell}
                                                                                onForecastChange={handleForecastChange}
                                                                            />
                                                                        ))}

                                                                        {/* ACTION */}
                                                                        {visibleColumns.action && (
                                                                            <TableCell className="text-center">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    asChild
                                                                                >
                                                                                    <Link
                                                                                        to={`/projects/inbox/details/${row.instance_id}`}
                                                                                        title="Ver sitio"
                                                                                    >
                                                                                        <ExternalLink className="h-4 w-4" />
                                                                                    </Link>
                                                                                </Button>
                                                                            </TableCell>
                                                                        )}
                                                                    </TableRow>
                                                                )
                                                            }
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
            </div>
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle>Actualizar FCST PM Masivo</DialogTitle>
                        <DialogDescription>
                            Descarga el formato, modifica únicamente las columnas FCST PM y vuelve a cargar el archivo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-3">
                        <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
                            <div>
                                <div className="text-sm font-medium">Formato de actualización</div>
                                <div className="text-xs text-slate-500">Incluye los sitios y todas las tareas del Workflow seleccionado.</div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadBulkTemplate}
                                disabled={downloadingBulkTemplate}
                            >
                                {downloadingBulkTemplate
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                                Descargar formato
                            </Button>
                        </div>

                        <Dropzone
                            files={bulkFiles}
                            onFilesChange={setBulkFiles}
                            error={bulkFileError}
                            setError={setBulkFileError}
                            maxFiles={1}
                            onFile={setBulkFiles}
                        />

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            Solo se actualizarán las columnas FCST PM. Identificador, sitio, proyecto y FCST Responsable son informativos.
                        </div>

                        {bulkResult && (
                            <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                                <div>Filas: <strong>{bulkResult.rows}</strong></div>
                                <div>Solicitados: <strong>{bulkResult.requested}</strong></div>
                                <div>Actualizados: <strong className="text-emerald-600">{bulkResult.changed}</strong></div>
                                <div>Sin cambios: <strong>{bulkResult.skipped}</strong></div>
                                <div>Errores: <strong className="text-red-600">{bulkResult.failed}</strong></div>
                                <div>Instancias: <strong>{bulkResult.updated_instances}</strong></div>
                            </div>
                        )}

                        {!!bulkResult?.errors?.length && (
                            <div className="max-h-40 overflow-auto rounded-lg border">
                                {bulkResult.errors.map((error, index) => (
                                    <div key={`${error.instance_id}-${error.task_code}-${index}`} className="border-b px-3 py-2 text-xs last:border-0">
                                        <strong>{error.instance_id || "-"}</strong>
                                        {error.task_code ? ` · ${error.task_code}` : ""}
                                        <div className="text-red-500">{error.message}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePrepareBulkImport} disabled={!bulkFiles?.length || importingBulkForecast}>
                            Importar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar actualización masiva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se actualizarán únicamente los valores FCST PM encontrados en el archivo. Los valores iguales a los actuales serán ignorados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleConfirmBulkImport}
                            disabled={importingBulkForecast}
                        >
                            {importingBulkForecast && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, importar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

/*
 * =========================================================
 * TASK CELLS
 * =========================================================
 */
function TaskRuntimeCells({
    row,
    node,
    isPM,
    editPmForecast,
    savingCell,
    onForecastChange
}) {
    if (!node) {
        return (
            <>
                <TableCell className="border-l border-slate-100 text-center text-slate-300">-</TableCell>
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
            </>
        )
    }

    const pmSavingKey = `${row.instance_id}-${node.task_code}-PM`

    const canEditPm =
        isPM &&
        editPmForecast &&
        !["COMPLETED", "CANCELLED"].includes(node.status)

    return (
        <>
            <TableCell className="min-w-[120px] border-l border-slate-100">
                <TaskStatusBadge status={node.status} />
            </TableCell>

            <TableCell className="min-w-[105px] text-center">
                {formatDate(node.started_at)}
            </TableCell>

            <TableCell className="min-w-[105px] text-center">
                {formatDate(node.finished_at)}
            </TableCell>

            <TableCell className="min-w-[105px] text-center">
                {formatDate(node.forecast?.sla_date)}
            </TableCell>

            <TableCell className="min-w-[105px] text-center">
                <ForecastDate
                    value={node.forecast?.responsible_date}
                    type="responsible"
                />
            </TableCell>

            <TableCell className="min-w-[125px] p-1 text-center">
                {canEditPm ? (
                    <Input
                        type="date"
                        defaultValue={toDateInputValue(node.forecast?.pm_date)}
                        disabled={savingCell === pmSavingKey}
                        onChange={event => {
                            const value = event.target.value
                            if (!value) return

                            onForecastChange({
                                row,
                                node,
                                value,
                                source: "PM"
                            })
                        }}
                        className="h-8 min-w-[120px] border-violet-200 bg-violet-50/50 px-2 text-xs text-violet-700 focus-visible:border-violet-400 focus-visible:ring-0"
                    />
                ) : (
                    <ForecastDate
                        value={node.forecast?.pm_date}
                        type="pm"
                    />
                )}
            </TableCell>
        </>
    )
}


function EmptyCell() {
    return (
        <TableCell className="text-center text-slate-300">-</TableCell>
    )
}

function ForecastDate({
    value,
    type
}) {

    if (!value) {
        return (
            <span className="text-slate-300">-</span>
        )
    }

    return (
        <span
            className={
                type === "pm"
                    ? "font-medium text-violet-600"
                    : "font-medium text-blue-600"
            }
        >
            {formatDate(value)}
        </span>
    )
}

/*
 * =========================================================
 * STATUS
 * =========================================================
 */
function TaskStatusBadge({
    status
}) {

    const config = TASK_STATUS[status] || TASK_STATUS.NOT_REACHED

    return (
        <Badge
            className={"flex justify-center items-center gap-2 truncate p-1.5 rounded-xl " + config[0]}
            title={TASK_STATUS_LABEL[status] || status}
        >
            <div
                className={"size-2 flex-none rounded-full outline-4 outline-solid " + config[1]}
            />
            {TASK_STATUS_LABEL[status] || status || "-"}
        </Badge>
    )
}

function formatDate(
    value
) {

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