import MoreOptions from "@/components/Tables/MoreOptions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, Search } from "lucide-react";
import { Link } from "react-router";

const SUB_STAGES = [
    { key: "INICIATIVA", label: "Iniciativa" },
    { key: "PRE_COMITE", label: "Pre Comité" },
    { key: "COMITE_INV", label: "Comité Inv" },
    { key: "ORACLE", label: "Oracle" },
]

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatStageDate(dateStr) {
    if (!dateStr) return ""

    const [year, month, day] = String(dateStr).split("-").map(Number)
    if (!year || !month || !day) return ""

    return `${String(day).padStart(2, "0")}${MONTHS_ES[month - 1]}`
}

function getVisualStage(status) {
    // const normalized = normalizeStageStatus(status)

    switch (status) {
        case "done":
            return {
                label: "Completado",
                dateClass: "text-blue-600",
                badgeClass: "bg-blue-600 text-white shadow-sm",
            }

        case "actual":
            return {
                label: "En curso",
                dateClass: "text-blue-600",
                badgeClass: "bg-blue-600 text-white shadow-sm",
            }

        case "delayed":
            return {
                label: "En curso",
                dateClass: "text-red-500",
                badgeClass: "bg-red-500 text-white shadow-sm",
            }

        default:
            return {
                label: "Pendiente",
                dateClass: "text-slate-400",
                badgeClass: "bg-slate-100 text-slate-500",
            }
    }
}

function SegmentLine({ status }) {
    // const normalized = normalizeSegmentStatus(status)

    if (status === "done") {
        return (
            <div className="h-[2px] w-full bg-blue-600" />
        )
    }

    return (
        <div className="w-full border-t border-dashed border-slate-300" />
    )
}

function StageDot({ status }) {
    // const normalized = normalizeStageStatus(status)

    if (status === "done") {
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

    if (status === "delayed") {
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

    if (status === "actual") {
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
    const visual = getVisualStage(milestone?.ui_status)

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
                        {/* {milestone?.date ?? "-"} */}
                        {formatStageDate(milestone?.planned_end_date ?? "")}
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
                            {index !== SUB_STAGES.length - 1 && (
                                <SegmentLine status={right} />
                            )}
                        </div>
                    </div>
                </div>
                {/* PUNTO */}
                <div className="relative z-20">
                    <StageDot status={milestone?.ui_status} />
                </div>
            </div>
        </TableCell>
    )
}

export default function InitiativeProjects() {

    const pro = [ 
        {
            "project_id": 3,
            "project_seq": 3,
            "project_code": "P-001",
            "project_name": "ROLLOUT 2026",
            "year": 2026,
            "typology": "Capacidad",
            "scope_value": 325,
            "purpose": "Proyectos Transporte Q2",
            "jefatura": "GIRA",
            "sponsors": "GIRA",
            "progress_pct": "50",
            "is_standby": 0,
            "current_stage_code": "INICIATIVA",
            "current_stage": {
                "code": "INICIATIVA",
                "name": "INICIATIVA",
                "status": "IN_PROGRESS",
                "stage_id": 3,
                "ui_status": "actual",
                "stage_order": 3,
                "actual_end_date": null,
                "planned_end_date": "2026-11-25",
                "actual_start_date": "2026-02-20",
                "planned_start_date": "2026-02-19"
            },
            "sub_stages": [
                {
                    "code": "INICIATIVA",
                    "name": "Iniciativa",
                    "status": "IN PROGRESS",
                    "stage_id": 1,
                    "ui_status": "done",
                    "stage_order": 1,
                    "actual_end_date": "2026-02-06",
                    "planned_end_date": "2026-02-06",
                    "actual_start_date": "2026-01-01",
                    "planned_start_date": "2026-01-01"
                },
                {
                    "code": "PRE_COMITE",
                    "name": "Pre Comité",
                    "status": "PLANNED",
                    "stage_id": 1,
                    "ui_status": "actual",
                    "stage_order": 1,
                    "actual_end_date": "2026-02-06",
                    "planned_end_date": "2026-02-10",
                    "actual_start_date": "2026-01-01",
                    "planned_start_date": "2026-01-01"
                },
                {
                    "code": "COMITE_INV",
                    "name": "Comité Inv",
                    "status": "PLANNED",
                    "stage_id": 1,
                    "ui_status": "planned",
                    "stage_order": 1,
                    "actual_end_date": "2026-01-06",
                    "planned_end_date": "2026-02-20",
                    "actual_start_date": "2026-01-01",
                    "planned_start_date": "2026-01-01"
                },
                {
                    "code": "ORACLE",
                    "name": "Oracle",
                    "status": "PLANNED",
                    "stage_id": 1,
                    "ui_status": "planned",
                    "stage_order": 1,
                    "actual_end_date": "2026-01-06",
                    "planned_end_date": "2026-02-28",
                    "actual_start_date": "2026-01-01",
                    "planned_start_date": "2026-01-01"
                }
            ],
            "project_types": [
                {
                    "code": "MACROS",
                    "name": "MACROS",
                    "project_type_id": 3
                }
            ],
            "users": [
                {
                    "area": "PMO",
                    "email": "prueba.proyecto@entel.pe",
                    "user_id": 3,
                    "full_name": "TEST TEST",
                    "joined_at": "2026-04-07 23:56:37",
                    "project_role": "PM",
                    "project_type": "TRANSPORTE"
                }
            ],
            "stages": [
                {
                    "code": "INICIATIVA",
                    "name": "Iniciativa",
                    "status": "DONE",
                    "stage_id": 1,
                    "ui_status": "actual",
                    "stage_order": 1,
                    "actual_end_date": "2026-01-06",
                    "planned_end_date": "2026-01-06",
                    "actual_start_date": "2026-01-01",
                    "planned_start_date": "2026-01-01"
                },
                {
                    "code": "PLANIFICACION",
                    "name": "Planificacion",
                    "status": "DONE",
                    "stage_id": 2,
                    "ui_status": "actual",
                    "stage_order": 2,
                    "actual_end_date": "2026-02-18",
                    "planned_end_date": "2026-02-07",
                    "actual_start_date": "2026-02-07",
                    "planned_start_date": "2026-01-07"
                },
                {
                    "code": "EJECUCION",
                    "name": "Ejecucion",
                    "status": "IN_PROGRESS",
                    "stage_id": 3,
                    "ui_status": "actual",
                    "stage_order": 3,
                    "actual_end_date": null,
                    "planned_end_date": "2026-11-25",
                    "actual_start_date": "2026-02-20",
                    "planned_start_date": "2026-02-19"
                },
                {
                    "code": "CIERRE",
                    "name": "Cierre",
                    "status": "PENDING",
                    "stage_id": 4,
                    "ui_status": "planned",
                    "stage_order": 4,
                    "actual_end_date": null,
                    "planned_end_date": "2026-12-20",
                    "actual_start_date": null,
                    "planned_start_date": "2026-11-26"
                }
            ]
        }
    ]

    const loading = false

    // const rows = projects.map(mapProjectToRow)

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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Proyectos en Iniciativa</h2>
                    </div>
                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        {/* <div className="bg-white relative rounded-lg p-6 mb-6"> */}

                        {/* </div> */}
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        {/* Filters, search, selects, pagination */}
                                        {/* Toolbar */}
                                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center pb-6 gap-3">  
                                            {/* Filtros avanzados */}
                                            {/* Búsqueda */}
                                            {/* {toolbarConfig.search && isVisible("search") && ( 
                                                <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Buscar"
                                                        value={filters.search ?? ""}
                                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                        className="pl-9 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                                    />
                                                </div>
                                            )} */}

                                            {/* Selects Opcionales */}
                                            {/* {toolbarConfig.selects?.map(select =>
                                                isVisible(select.key) ? (
                                                    <Select
                                                        key={select.key}
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
                                            )} */}

                                            {/* <div className="flex items-center justify-between sm:justify-start gap-6 sm:ml-auto">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-[#364153] font-medium">{totalResults}</span>
                                                    <span className="text-sm text-muted-foreground">resultados</span>
                                                </div>
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
                                            </div> */}
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
                                                            colSpan={4}
                                                            className="
                                                                h-8 border-b
                                                                text-center text-xs font-medium text-slate-600
                                                            "
                                                        >
                                                            Sub Etapas
                                                        </TableHead>
                                                    </TableRow>
                                                    {/* CABECERA DE ETAPAS */}
                                                    <TableRow className="border-b bg-white hover:bg-white">
                                                        {SUB_STAGES.map((stage) => (
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
                                                    ) : pro.length === 0 ? (
                                                        // SIN RESULTADOS
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        pro.map((r) => {

                                                            const ms = [
                                                                r.sub_stages[0],
                                                                r.sub_stages[1],
                                                                r.sub_stages[2],
                                                                r.sub_stages[3],
                                                            ]

                                                            return (
                                                                <TableRow key={r.project_id} className="hover:bg-slate-50">
                                                                    <TableCell className="font-medium text-blue-600">
                                                                        <Link to={`/projects/history/${r.project_code}`} className="hover:underline">{r.project_code}</Link>
                                                                    </TableCell>
                                                                    <TableCell className="text-slate-700">
                                                                        {r.sponsors}
                                                                    </TableCell>

                                                                    <TableCell className="text-slate-700">
                                                                        {r.year}
                                                                    </TableCell>

                                                                    <TableCell className="font-semibold text-slate-800">
                                                                        {r.project_name}
                                                                    </TableCell>
                                                                    {/* <TableCell className="text-center">
                                                                        <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-blue-600">{r.avance}%</span>
                                                                        {r.standby ? (
                                                                            <Badge variant="destructive" className="h-5 px-2 text-[10px]">
                                                                                Stand By
                                                                            </Badge>
                                                                        ) : null}
                                                                        </div>
                                                                    </TableCell> */}

                                                                    <StageCell
                                                                        index={0}
                                                                        milestone={ms[0]}
                                                                        left="none"
                                                                        right={r.sub_stages[0].ui_status ?? "planned"}
                                                                    />

                                                                    <StageCell
                                                                        index={1}
                                                                        milestone={ms[1]}
                                                                        left={r.sub_stages[0].ui_status ?? "planned"}
                                                                        right={r.sub_stages[1].ui_status ?? "planned"}
                                                                    />

                                                                    <StageCell
                                                                        index={2}
                                                                        milestone={ms[2]}
                                                                        left={r.sub_stages[1].ui_status ?? "planned"}
                                                                        right={r.sub_stages[2].ui_status ?? "planned"}
                                                                    />

                                                                    <StageCell
                                                                        index={3}
                                                                        milestone={ms[3]}
                                                                        left={r.sub_stages[2].ui_status ?? "planned"}
                                                                        right="none"
                                                                    />

                                                                    {/* <TableCell className="text-right">
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
                                                                    </TableCell> */}
                                                                    
                                                                </TableRow>
                                                            )
                                                        }
                                                    ))}
    
                                                </TableBody>
                                            </Table>
                                        </div>

                        
                                        {/* <Pagination
                                            totalResults={totalResults} 
                                            totalPages={totalPages} 
                                            currentPage={currentPage} 
                                            setCurrentPage={setCurrentPage} 
                                        /> */}

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