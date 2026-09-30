import { useMemo, useState } from "react";
import { AlignCenter, ArrowLeft, ChartBar, ChartNoAxesCombined, Check, File, FileChartColumn, Info, MoreVertical, Plus, Search } from "lucide-react";
import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import MoreOptions from "@/components/Tables/MoreOptions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useTableTool from "@/hooks/useTableTool";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"
import Pagination from "@/components/Tables/Pagination";
import { FormNewProject } from "@/components/FormNewProject/FormNewProject";
import { Link } from "react-router";
import { useProjects } from "@/hooks/projects/useProjects";
import { buildProjectRowForTemplate, exportProjectsToXlsx } from "@/lib/exportExcel";
import { useIdentifers } from "@/hooks/projects/useIdentifers";
import { Skeleton } from "@/components/ui/skeleton";
import { rowPassesAdvancedFilters, toNumber } from "@/lib/helpers";

const columns = [
	{ id: "codigo", label: "Código", visible: true },
	{ id: "sponsor", label: "Sponsor", visible: true },
	{ id: "anio", label: "Año", visible: true },
	{ id: "proyecto", label: "Proyecto", visible: true },
	{ id: "avance", label: "Avance", visible: true },
	{ id: "etapas", label: "Etapas", visible: true },
]

const STAGES = [
    { key: "INICIATIVA", label: "INICIATIVA" },
    { key: "PLANIFICACION", label: "PLANIFICACIÓN" },
    { key: "EJECUCION", label: "EJECUCIÓN" },
    { key: "CIERRE", label: "CIERRE" },
]

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatStageDate(dateStr) {
    if (!dateStr) return ""

    const [year, month, day] = String(dateStr).split("-").map(Number)
    if (!year || !month || !day) return ""

    return `${String(day).padStart(2, "0")}${MONTHS_ES[month - 1]}`
}

function getStageVisualStatus(stage) {
    if (!stage) return "planned"

    if (stage.ui_status === "risk") return "risk"
    if (stage.ui_status === "actual") return "actual"
    if (stage.ui_status === "done") return "done"
    return "planned"
}

function normalizeStage(stage) {
    if (!stage) {
        return {
            stage_id: null,
            code: "",
            name: "",
            stage_order: 0,
            planned_start_date: null,
            planned_end_date: null,
            actual_start_date: null,
            actual_end_date: null,
            status: "PENDING",
            ui_status: "planned",
            date: "",
            visualStatus: "planned",
        }
    }

    return {
        ...stage,
        date: formatStageDate(
            stage.actual_end_date ||
                stage.planned_end_date ||
                stage.actual_start_date ||
                stage.planned_start_date
        ),
        visualStatus: getStageVisualStatus(stage),
    }
}

// function buildSegments(orderedStages) {
//     return orderedStages.slice(0, -1).map((stage, index) => {
//         const nextStage = orderedStages[index + 1]

//         const currDoneLike =
//             stage.visualStatus === "actual" || stage.visualStatus === "risk"
//         const nextDoneLike =
//             nextStage.visualStatus === "actual" || nextStage.visualStatus === "risk"

//         return currDoneLike && nextDoneLike ? "actual" : "planned"
//     })
// }

function buildSegments(orderedStages) {
    const isReached = (stage) =>
        ["done", "actual", "risk"].includes(stage?.visualStatus)

    return orderedStages.slice(0, -1).map((stage, index) => {
        const nextStage = orderedStages[index + 1]

        const currReached = isReached(stage)
        const nextReached = isReached(nextStage)

        return currReached && nextReached
            ? "actual"
            : "planned"
    })
}

function mapProjectToRow(project) {
    const stageMap = Object.fromEntries(
        (project.stages || []).map((stage) => [stage.code, stage])
    )

    console.log(stageMap)

    const orderedStages = STAGES.map((stageDef) =>
        normalizeStage(stageMap[stageDef.key])
    )

    console.log(orderedStages)

    return {
        ...project,
        sponsor: project.sponsors,
        standby: Boolean(project.is_standby),
        avance: Number(project.progress_pct || 0),
        milestones: {
            iniciativa: orderedStages[0],
            planificacion: orderedStages[1],
            ejecucion: orderedStages[2],
            cierre: orderedStages[3],
        },
        segments: buildSegments(orderedStages),
    }
}

const toolbarConfig = {
    filters: { visible: true },
    search: { placeholder: "Buscar por código o nombre" },
    selects: [],
    visibleKeys: ["search"]
};

// function SegmentLine({ status }) {
//     if (status === "none") return <div className="w-full" />

//     if (status === "actual") {
//         return <div className="w-full border-b-2 border-dashed border-blue-400" />
//     }

//     if (status === "risk") {
//         return <div className="w-full border-b-2 border-dashed border-red-400" />
//     }

//     return <div className="w-full border-b-2 border-dashed border-slate-300" />
// }

function SegmentLine({ status }) {
    const normalized = normalizeSegmentStatus(status)

    if (normalized === "completed") {
        return (
            <div className="h-[2px] w-full bg-blue-600" />
        )
    }

    return (
        <div className="w-full border-t border-dashed border-slate-300" />
    )
}


function Dot({ status }) {
    const dotClass =
        status === "actual"
            ? "bg-blue-600"
            : status === "risk"
                ? "bg-red-500"
                : "bg-slate-300"

    return (
        <span
            className={cn(
                "relative z-10 inline-flex h-3.5 w-3.5 rounded-full",
                dotClass
            )}
        />
    )
}

function DateLabel({ status, children }) {
    const cls =
        status === "actual"
            ? "text-blue-600"
            : status === "risk"
                ? "text-red-500"
                : "text-slate-400"

    return (
        <span className={cn("text-[12px] font-semibold", cls)}>
            {children}
        </span>
    )
}


// function StageCell({
//     index,
//     milestone,
//     left,
//     right,
// }) {
//     // Layout muy similar: etiqueta (fecha) y línea con punto centrado
//     return (
//         <TableCell className="relative h-12 w-[220px] px-2 align-middle">
//             <div className="relative flex h-12 items-center justify-center">
//                 {/* fecha (arriba del punto) */}
//                 <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
//                     <DateLabel status={milestone.visualStatus}>{milestone.date}</DateLabel>
//                 </div>

//                 {/* tramo izquierdo + derecho */}
//                 <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
//                     <div className="flex w-full items-center">
//                         <div className="w-1/2 pr-2">
//                             {/* no dibujar a la izquierda del primer hito */}
//                             {index === 0 ? <div className="w-full" /> : <SegmentLine status={left} />}
//                         </div>
//                         <div className="w-1/2 pl-2">
//                             {/* no dibujar a la derecha del último hito */}
//                             {index === STAGES.length - 1 ? <div className="w-full" /> : <SegmentLine status={right} />}
//                         </div>
//                     </div>
//                 </div>

//                 {/* punto */}
//                 <Dot status={milestone.visualStatus} />
//             </div>
//         </TableCell>
//     )
// }

function normalizeStageStatus(status) {

    // console.log("status", status)

    const value = String(status ?? "").toLowerCase()

    if (
        [
            "done",
            "completed",
            "complete",
            "completado",
        ].includes(value)
    ) {
        return "completed"
    }

    if (
        [
            "delayed",
            "late",
            "overdue",
            "alert",
            "retrasado",
        ].includes(value)
    ) {
        return "delayed"
    }

    if (
        [
            "actual",
            "current",
            "in_progress",
            "in-progress",
            "progress",
            "en_curso",
        ].includes(value)
    ) {
        return "current"
    }

    return "pending"
}


function normalizeSegmentStatus(status) {
    const value = String(status ?? "").toLowerCase()

    if (
        [
            "done",
            "completed",
            "complete",
            "actual",
            "active",
        ].includes(value)
    ) {
        return "completed"
    }

    return "pending"
}


function getVisualStage(status) {
    const normalized = normalizeStageStatus(status)

    switch (normalized) {
        case "completed":
            return {
                label: "Completado",
                dateClass: "text-blue-600",
                badgeClass:
                    "bg-blue-600 text-white shadow-sm",
            }

        case "current":
            return {
                label: "En curso",
                dateClass: "text-blue-600",
                badgeClass:
                    "bg-blue-600 text-white shadow-sm",
            }

        case "delayed":
            return {
                label: "En curso",
                dateClass: "text-red-500",
                badgeClass:
                    "bg-red-500 text-white shadow-sm",
            }

        default:
            return {
                label: "Pendiente",
                dateClass: "text-slate-400",
                badgeClass:
                    "bg-slate-100 text-slate-500",
            }
    }
}


// function SegmentLine({ status }) {
//     const normalized = normalizeSegmentStatus(status)

//     if (normalized === "completed") {
//         return (
//             <div className="h-[2px] w-full bg-blue-600" />
//         )
//     }

//     return (
//         <div className="w-full border-t border-dashed border-slate-300" />
//     )
// }


function StageDot({ status }) {
    const normalized = normalizeStageStatus(status)

    if (normalized === "completed") {
        return (
            <div
                className="
                    flex h-[16px] w-[16px] items-center justify-center
                    rounded-full bg-blue-600
                    ring-2 ring-white
                "
            >
                <Check
                    className="h-[10px] w-[10px] text-white"
                    strokeWidth={3}
                />
            </div>
        )
    }

    if (normalized === "delayed") {
        return (
            <div
                className="
                    h-[10px] w-[10px]
                    rounded-full
                    border-2 border-red-500
                    bg-white
                    ring-2 ring-white
                "
            />
        )
    }

    if (normalized === "current") {
        return (
            <div
                className="
                    h-[10px] w-[10px]
                    rounded-full
                    border-2 border-blue-600
                    bg-white
                    ring-2 ring-white
                "
            />
        )
    }

    return (
        <div
            className="
                h-[10px] w-[10px]
                rounded-full
                border-2 border-slate-400
                bg-white
                ring-2 ring-white
            "
        />
    )
}

function StageCell({
    index,
    milestone,
    left,
    right,
}) {
    const visual = getVisualStage(milestone?.visualStatus)

    return (
        <TableCell className="relative h-[76px] min-w-[180px] px-0 align-middle">
            <div className="relative flex h-full items-end justify-center pb-2">
                {/* FECHA + ESTADO */}
                <div className="absolute top-1 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-0.5">
                    
                    <span
                        className={`
                            whitespace-nowrap text-[11px] font-medium leading-none
                            ${visual.dateClass}
                        `}
                    >
                        {milestone?.date ?? "-"}
                    </span>

                    {/* <span
                        className={`
                            whitespace-nowrap rounded-md px-2 py-[2px]
                            text-[9px] font-medium leading-none
                            ${visual.badgeClass}
                        `}
                    >
                        {visual.label}
                    </span> */}
                </div>
                {/* LÍNEA */}
                <div className="absolute bottom-[13px] left-0 right-0">
                    <div className="flex w-full items-center">
                        {/* tramo izquierdo */}
                        <div className="w-1/2">
                            {index !== 0 && (
                                <SegmentLine status={left} />
                            )}
                        </div>
                        {/* tramo derecho */}
                        <div className="w-1/2">
                            {index !== STAGES.length - 1 && (
                                <SegmentLine status={right} />
                            )}
                        </div>
                    </div>
                </div>
                {/* PUNTO */}
                <div className="relative z-20">
                    <StageDot status={milestone?.visualStatus} />
                </div>
            </div>
        </TableCell>
    )
}

function ProjectStageSummaryCard({
    title,
    count,
    icon: Icon,
    accent = "amber",
    redirect = "#",
    }) {
    const stylesByAccent = {
        amber: {
            bar: "bg-amber-400",
            iconWrap: "bg-amber-50 border-amber-100",
            icon: "text-amber-500",
            count: "text-amber-500",
        },
        blue: {
            bar: "bg-blue-500",
            iconWrap: "bg-blue-50 border-blue-100",
            icon: "text-blue-500",
            count: "text-blue-500",
        },
        green: {
            bar: "bg-green-500",
            iconWrap: "bg-green-50 border-green-100",
            icon: "text-green-500",
            count: "text-green-500",
        },
        slate: {
            bar: "bg-slate-900",
            iconWrap: "bg-slate-50 border-slate-200",
            icon: "text-slate-700",
            count: "text-slate-900",
        },
    }

    const palette = stylesByAccent[accent] ?? stylesByAccent.blue

    return (
        <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
            {/* barra lateral */}
            <div className={`absolute inset-y-0 left-0 w-1 ${palette.bar}`} />
            <Link to={redirect} className="flex items-center justify-between gap-4 px-5 py-5">
            {/* <div className="flex items-center justify-between gap-4 px-5 py-5"> */}
                <div className="min-w-0 pl-2">
                    <div className={`text-2xl font-semibold leading-none ${palette.count}`}>
                        {count}
                    </div>
                    <div className="mt-2 text-base text-slate-800">
                        {title}
                    </div>
                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${palette.iconWrap}`}
                >
                    <Icon className={`h-6 w-6 ${palette.icon}`} />
                </div>
            {/* </div> */}
            </Link>
        </div>
    )
}

function ProjectsSummarySection({
    totalProjects = 0,
    inInit = [],
    inPlan = [],
    inExec = [],
    inEnd = [],
    }) {
    const summaryCards = [
        {
            key: "init",
            title: "En Iniciativa",
            count: inInit.length,
            icon: ChartBar,
            accent: "amber",
            redirect: "/projects/initiative",
        },
        {
            key: "plan",
            title: "En Planificación",
            count: inPlan.length,
            icon: File,
            accent: "blue",
        },
        {
            key: "exec",
            title: "En Ejecución",
            count: inExec.length,
            icon: ChartNoAxesCombined,
            accent: "green",
        },
        {
            key: "end",
            title: "En Cierre",
            count: inEnd.length,
            icon: FileChartColumn,
            accent: "slate",
        },
    ]

    return (
        // rounded-2xl bg-white p-6 shadow-sm
        <div className=" relative flex min-h-full flex-col">
            <div className="mb-6 flex items-center gap-4">
                <Badge className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-500">
                    {totalProjects}
                </Badge>
                <div className="self-center">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Proyectos
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((item) => (
                    <ProjectStageSummaryCard
                        key={item.key}
                        title={item.title}
                        count={item.count}
                        icon={item.icon}
                        accent={item.accent}
                        redirect={item.redirect}
                    />
                ))}
            </div>
        </div>
    )
}


export default function Projects() {

    const { projects, loading } = useProjects()
    const { identifiers } = useIdentifers()

    // console.log("identifiers", identifiers)
    // console.log("projects", projects)

    const {
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        sortDirection,
        setSortDirection,
        itemsPerPage,
        setItemsPerPage,
        visibleColumns,
        toggleColumn,
    } = useTableTool({ columns })

    const isVisible = (key) => !toolbarConfig.visibleKeys || toolbarConfig.visibleKeys.includes(key)

    const [filters, setFilters] = useState({
        search: ""
    })

    const [advancedFilters , setAdvancedFilters] = useState([])

    const filteredData = useMemo(() => {
        const q = filters.search.toLowerCase();

        return projects.filter(project => {
            const matchesText = 
                !q || 
                project.proyecto.toLowerCase().includes(q)

            const matchesAdvanced = rowPassesAdvancedFilters(project, advancedFilters)

            return matchesText && matchesAdvanced
        })
    }, [filters, projects, advancedFilters])


    console.log(filteredData)

    const totalResults = filteredData.length
    const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

    const inInit = filteredData.filter(p => p.current_stage_code === "INICIATIVA")
    const inPlan = filteredData.filter(p => p.current_stage_code === "PLANIFICACION")
    const inExec = filteredData.filter(p => p.current_stage_code === "EJECUCION")
    const inEnd = filteredData.filter(p => p.current_stage_code === "CIERRE")

    const rows = projects.map(mapProjectToRow)

    // console.log("rows", rows)

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Historial Proyectos</h2>
                    </div>
                    {/* <button type="button" class="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                        <div className="hidden 2xl:inline-block">Nuevo</div>
                        <Plus className="h-5 w-5 text-white" />
                    </button> */}
                    <FormNewProject />
                </div>

                {/* Main */}
                <div>
                    <div className="relative">

                        <div className="bg-white relative rounded-lg p-6 mb-6">
                            <ProjectsSummarySection
                                totalProjects={projects.length}
                                inInit={inInit}
                                inPlan={inPlan}
                                inExec={inExec}
                                inEnd={inEnd}
                            />
                            {/* <div className="relative flex min-h-full flex-col">
                                <header className="mb-6 flex gap-4">
                                    <Badge variant="secondary" className="rounded-md px-3 py-1.5 text-sm bg-blue-400 text-white">
                                        4
                                    </Badge>
                                    <div className="self-center text-center">
                                        <h2 className="flex items-center gap-2">
                                            <span>Proyectos</span>
                                        </h2>
                                    </div>
                                </header>
                                <div className="flex flex-wrap items-center gap-6 sm:flex-nowrap">
                                    <div className="@container w-full flex-1">
                                        <div className="grid grid-cols-2 gap-2 @md:grid-cols-4">
                                            <div className="@container/summaryitem">
                                                <button className="bg-background-2 flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border p-4 text-left shadow-xs outline-gray-300 hover:bg-gray-50 focus:outline-offset-2 focus:outline-solid @[9rem]/summaryitem:flex-row @[9rem]/summaryitem:items-center dark:hover:bg-gray-900/10">
                                                    <div className="flex size-8 flex-none items-center justify-center rounded-full text-white-a bg-amber-400 dark:bg-gray-400">
                                                        <ChartBar className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 @[9rem]/summaryitem:order-first">
                                                        <div className="text-heading-4 text-darktext">{inInit.length}</div>
                                                        <div className="text-lighttext truncate @[9rem]/summaryitem:text-xs @[10rem]/summaryitem:text-sm">En Iniciativa</div>
                                                    </div>
                                                </button>
                                            </div>
                                            <div className="@container/summaryitem">
                                                <button className="bg-background-2 flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border p-4 text-left shadow-xs outline-gray-300 hover:bg-gray-50 focus:outline-offset-2 focus:outline-solid @[9rem]/summaryitem:flex-row @[9rem]/summaryitem:items-center dark:hover:bg-gray-900/10">
                                                    <div className="flex size-8 flex-none items-center justify-center rounded-full text-white-a bg-blue-300 dark:bg-red-100">
                                                        <File className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 @[9rem]/summaryitem:order-first">
                                                        <div className="text-heading-4 text-darktext">{inPlan.length}</div>
                                                        <div className="text-lighttext truncate @[9rem]/summaryitem:text-xs @[10rem]/summaryitem:text-sm">En Planificación</div>
                                                    </div>
                                                </button>
                                            </div>
                                            <div className="@container/summaryitem">
                                                <button className="bg-background-2 flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border p-4 text-left shadow-xs outline-gray-300 hover:bg-gray-50 focus:outline-offset-2 focus:outline-solid @[9rem]/summaryitem:flex-row @[9rem]/summaryitem:items-center dark:hover:bg-gray-900/10">
                                                    <div className="flex size-8 flex-none items-center justify-center rounded-full text-white-a bg-green-500/60 dark:bg-green-200">
                                                        <ChartNoAxesCombined className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 @[9rem]/summaryitem:order-first">
                                                        <div className="text-heading-4 text-darktext">{inExec.length}</div>
                                                        <div className="text-lighttext truncate @[9rem]/summaryitem:text-xs @[10rem]/summaryitem:text-sm">En Ejecución</div>
                                                    </div>
                                                </button>
                                            </div>
                                            <div className="@container/summaryitem">
                                                <button className="bg-background-2 flex h-full w-full flex-col gap-3 overflow-hidden rounded-xl border p-4 text-left shadow-xs outline-gray-300 hover:bg-gray-50 focus:outline-offset-2 focus:outline-solid @[9rem]/summaryitem:flex-row @[9rem]/summaryitem:items-center dark:hover:bg-gray-900/10">
                                                    <div className="flex size-8 flex-none items-center justify-center rounded-full text-white bg-black/100 dark:bg-green-200">
                                                        <FileChartColumn className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 @[9rem]/summaryitem:order-first">
                                                        <div className="text-heading-4 text-darktext">{inEnd.length}</div>
                                                        <div className="text-lighttext truncate @[9rem]/summaryitem:text-xs @[10rem]/summaryitem:text-sm">En Cierre</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                                <button type="button" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-darktext hover:text-darktext ring-inset ring-1 ring-gray-300 shadow-xs dark:shadow-none bg-background-1 hover:bg-gray-100 focus:outline-offset-2 outline-gray-300 dark:hover:bg-gray-900/10 dark:ring-gray-600/40 text-sm leading-6 px-3 py-2 gap-2 inline-flex mt-4 w-full sm:hidden">
                                </button>
                            </div> */}
                        </div>


                        <div className="rounded-2xl bg-white p-8 relative">

                            <div className="relative">

                                <div className="relative min-h-44">

                                    <div className="contain-inline-size">

                                        {/* Filters, search, selects, pagination */}
                                        {/* Toolbar */}
                                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center pb-6 gap-3">
                                            
                                            {/* Filtros avanzados */}
                                        

                                            {/* Búsqueda */}
                                            {toolbarConfig.search && isVisible("search") && ( 
                                                <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Buscar"
                                                        value={filters.search ?? ""}
                                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                        className="pl-9 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                                    />
                                                </div>
                                            )}

                                            {/* Selects Opcionales */}
                                            {toolbarConfig.selects?.map(select =>
                                                isVisible(select.key) ? (
                                                    <Select
                                                        // defaultValue={select.defaultValue}
                                                        key={select.key}
                                                        // value={select.defaultValue}
                                                        value={filters[select.key] ?? ""} 
                                                        onValueChange={v => setFilters({ ...filters, [select.key]: v })}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-[140px]">
                                                            <SelectValue placeholder={select.label} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {select.options.map(option => (
                                                                <SelectItem value={option} key={option}>
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : null
                                            )}

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
                                                    template=""
                                                    fileName="Report Proyectos"
                                                    data={filteredData}
                                                    transformData={buildProjectRowForTemplate}
                                                    exportData={exportProjectsToXlsx}    
                                                />

                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="overflow-x-auto border-t-1">
                                            <Table>
                                                <TableHeader className="sticky top-0 z-20 bg-white">
                                                    <TableRow className="bg-slate-50/90 hover:bg-slate-50/9">
                                                        <TableHead
                                                            rowSpan={2}
                                                            className="w-[90px] align-middle text-xs font-medium text-slate-600"
                                                        >
                                                            Código
                                                        </TableHead>
                                                        <TableHead
                                                            rowSpan={2}
                                                            className="w-[100px] align-middle text-xs font-medium text-slate-600"
                                                        >
                                                            Sponsor
                                                        </TableHead>
                                                        <TableHead
                                                            rowSpan={2}
                                                            className="w-[70px] align-middle text-xs font-medium text-slate-600"
                                                        >
                                                            Año
                                                        </TableHead>
                                                        <TableHead
                                                            rowSpan={2}
                                                            className="min-w-[260px] align-middle text-xs font-medium text-slate-600"
                                                        >
                                                            Proyecto
                                                        </TableHead>
                                                        <TableHead
                                                            rowSpan={2}
                                                            className="w-[100px] align-middle text-center text-xs font-medium text-slate-600"
                                                        >
                                                            Avance
                                                        </TableHead>
                                                        <TableHead
                                                            colSpan={4}
                                                            className="
                                                                h-8 border-b
                                                                text-center text-xs font-medium text-slate-600
                                                            "
                                                        >
                                                            Etapas
                                                        </TableHead>
                                                        <TableHead
                                                            rowSpan={2}
                                                            className="w-[70px] align-middle text-center text-xs font-medium text-slate-600"
                                                        >
                                                            Acción
                                                        </TableHead>
                                                    </TableRow>
                                                    {/* CABECERA DE ETAPAS */}
                                                    <TableRow className="border-b bg-white hover:bg-white">
                                                        {STAGES.map((stage) => (
                                                            <TableHead
                                                                key={stage.key}
                                                                className="
                                                                    h-9 min-w-[180px]
                                                                    text-center
                                                                    text-[11px] font-semibold
                                                                    text-blue-600
                                                                "
                                                            >
                                                                {stage.label}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>

                                                    {loading ? (
                                                        // SKELETON
                                                        Array.from({ length: 5 }).map((_, rowIdx) => (
                                                        <TableRow key={`skeleton-${rowIdx}`}>
                                                            {columns.map(
                                                                (col) =>
                                                                visibleColumns[col.id] && (
                                                                <TableCell key={col.id}>
                                                                    <Skeleton className="h-4 w-[90%]" />
                                                                </TableCell>
                                                                )
                                                            )}
                                                        </TableRow>
                                                        ))
                                                    ) : projects.length === 0 ? (
                                                        // SIN RESULTADOS
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        rows.map((r) => {
                                                            const ms = [
                                                                r.milestones.iniciativa,
                                                                r.milestones.planificacion,
                                                                r.milestones.ejecucion,
                                                                r.milestones.cierre,
                                                            ]

                                                            return (
                                                                <TableRow key={r.project_id} className="hover:bg-slate-50">
                                                                    <TableCell className="font-medium text-blue-600">
                                                                        <Link to={`/projects/history/${r.project_code}`} className="hover:underline">{r.project_code}</Link>
                                                                    </TableCell>
                                                                    <TableCell className="text-slate-700">
                                                                        {r.sponsor}
                                                                    </TableCell>

                                                                    <TableCell className="text-slate-700">
                                                                        {r.year}
                                                                    </TableCell>

                                                                    <TableCell className="font-semibold text-slate-800">
                                                                        {r.project_name}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-blue-600">{r.avance}%</span>
                                                                        {r.standby ? (
                                                                            <Badge variant="destructive" className="h-5 px-2 text-[10px]">
                                                                                Stand By
                                                                            </Badge>
                                                                        ) : null}
                                                                        </div>
                                                                    </TableCell>

                                                                    <StageCell
                                                                        index={0}
                                                                        milestone={ms[0]}
                                                                        left="none"
                                                                        right={r.segments[0] ?? "planned"}
                                                                    />

                                                                    <StageCell
                                                                        index={1}
                                                                        milestone={ms[1]}
                                                                        left={r.segments[0] ?? "planned"}
                                                                        right={r.segments[1] ?? "planned"}
                                                                    />

                                                                    <StageCell
                                                                        index={2}
                                                                        milestone={ms[2]}
                                                                        left={r.segments[1] ?? "planned"}
                                                                        right={r.segments[2] ?? "planned"}
                                                                    />

                                                                    <StageCell
                                                                        index={3}
                                                                        milestone={ms[3]}
                                                                        left={r.segments[2] ?? "planned"}
                                                                        right="none"
                                                                    />

                                                                    <TableCell className="text-right">
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
                                                                                <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                                                                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                                                                <DropdownMenuItem className="text-red-600">
                                                                                    Eliminar
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </TableCell>
                                                                    
                                                                </TableRow>
                                                            )
                                                        }
                                                    ))}
  
                                                </TableBody>
                                            </Table>
                                        </div>

                        
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
    )
}