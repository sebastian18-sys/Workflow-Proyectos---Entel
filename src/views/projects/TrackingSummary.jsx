import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronDown,
    RefreshCw,
    Search,
    Workflow,
    X
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

import Pagination from "@/components/Tables/Pagination"

import { useDebounce } from "@/hooks/useDebounce"
// import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { getTrackingOptions } from "@/services/getOptionsFilters"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { useTrackingSummary } from "@/hooks/projects/wf/useTrackingSummary"


function formatFilterDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return value
    }

    const [year, month, day] = String(value).split("-")

    return `${day}/${month}/${year}`
}


function ExcelFilter({
    label,
    filterKey,
    options = [],
    filters = {},
    onChange
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const selected =
        (
            filters?.[filterKey]
                ?.values || []
        ).map(String)

    const normalizedOptions =
        options.map(option => {
            if (
                option &&
                typeof option === "object"
            ) {
                return {
                    value: String(
                        option.value
                    ),
                    label: String(
                        option.label ??
                        option.value
                    )
                }
            }

            const value =
                String(option)

            let labelValue =
                value

            if (value === "EMPTY") {
                labelValue =
                    "Sin fecha"
            } else if (
                value !== "OK"
            ) {
                labelValue =
                    formatFilterDate(
                        value
                    )
            }

            return {
                value,
                label: labelValue
            }
        })

    const filteredOptions =
        normalizedOptions.filter(
            option =>
                option.label
                    .toLowerCase()
                    .includes(
                        search
                            .trim()
                            .toLowerCase()
                    )
        )

    const toggleValue = value => {
        const next =
            selected.includes(value)
                ? selected.filter(
                    item =>
                        item !== value
                )
                : [
                    ...selected,
                    value
                ]

        onChange(
            filterKey,
            next
        )
    }

    const clear = () => {
        onChange(
            filterKey,
            []
        )
    }

    const selectAllVisible = () => {
        const visible =
            filteredOptions.map(
                option =>
                    option.value
            )

        const next =
            [
                ...new Set([
                    ...selected,
                    ...visible
                ])
            ]

        onChange(filterKey, next)
    }

    const hasFilter = selected.length > 0

    return (
        <div className="flex min-w-0 items-center justify-between gap-1">
            <span className="truncate">
                {label}
            </span>
            <Popover
                open={open}
                onOpenChange={value => {
                    setOpen(value)
                    if (!value) {
                        setSearch("")
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={[
                            "flex h-6 w-6 flex-none items-center justify-center rounded",
                            hasFilter
                                ? "bg-blue-50 text-blue-600"
                                : "text-slate-400 hover:bg-slate-100"
                        ].join(" ")}
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-64 p-0"
                >
                    <div className="border-b p-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={event =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar..."
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <button
                            type="button"
                            className="text-[11px] font-medium text-blue-600 hover:underline"
                            onClick={selectAllVisible}
                        >
                            Seleccionar visibles
                        </button>

                        {hasFilter && (
                            <button
                                type="button"
                                className="text-[11px] text-slate-400 hover:text-slate-600"
                                onClick={clear}
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1.5">
                        {!filteredOptions.length ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-400">
                                Sin opciones
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const checked = selected.includes(option.value)

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            toggleValue(option.value)
                                        }
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            className="pointer-events-none"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                                            {option.label}
                                        </span>
                                        {checked && (
                                            <Check className="h-3.5 w-3.5 flex-none text-blue-500" />
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                    {hasFilter && (
                        <div className="border-t p-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-full text-xs"
                                onClick={clear}
                            >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Limpiar filtro
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    )
}


export default function SiteSummary() {
    const navigate = useNavigate()

    const [workflowCode, setWorkflowCode] = useState("")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [columnFilters, setColumnFilters] = useState({})

    const handleColumnFilter = (key, values) => {
        setColumnFilters(prev => {
            const next = {
                ...prev
            }

            if (!values?.length) {
                delete next[key]
            } else {
                next[key] = {
                    values
                }
            }

            return next
        })
    }

    const debouncedColumnFilters = useDebounce(columnFilters, 400)
    const debouncedSearch = useDebounce(search, 300)

    const { filterOptions: trackingOptions } = useOptionsFilter({
        request: getTrackingOptions,
        debugName: "getTrackingOptions"
    })

    useEffect(() => {
        if (workflowCode || !trackingOptions.workflow_code?.length) return

        const first = trackingOptions.workflow_code[0]
        setWorkflowCode(
            String(first?.value ?? first?.label ?? first ?? "")
        )
    }, [trackingOptions.workflow_code, workflowCode])

    useEffect(() => {
        setPage(1)
    }, [workflowCode, debouncedSearch, debouncedColumnFilters, limit])

    const params = useMemo(() => ({
        workflow_code: workflowCode,
        search: debouncedSearch,
        column_filters: debouncedColumnFilters,
        page,
        limit
    }), [
        workflowCode,
        debouncedSearch,
        debouncedColumnFilters,
        page,
        limit
    ])

    const {
        items,
        tasks,
        filterOptions,
        loading,
        totalResults,
        totalPages,
        reload
    } = useTrackingSummary(params, {
        enabled: !!workflowCode
    })

    

    return (
        <div className="flex flex-col px-4 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">

                {/* CABECERA */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/workflow/tracking"
                            title="Atrás"
                            className="bg-white flex size-8 flex-none items-center justify-center rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>

                        <div>
                            <h2 className="text-2xl font-semibold text-[#2b7fff]">
                                Resumen de Sitios
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Avance y forecast de cada sitio por tarea.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={reload}
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>

                {/* CONTENIDO */}
                <div className="relative">
                    <div className="relative rounded-2xl bg-white p-4 md:p-5 lg:p-6">
                        <div className="relative min-h-44">

                            {/* TOOLBAR */}
                            <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end">
                                <div className="w-full md:w-[240px]">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                        Workflow
                                    </label>

                                    <Select 
                                        value={workflowCode} 
                                        onValueChange={value => {
                                            setWorkflowCode(value)
                                            setColumnFilters({})
                                            setPage(1)
                                        }
                                    }>
                                        <SelectTrigger>
                                            <div className="flex items-center gap-2">
                                                <Workflow className="h-4 w-4 text-slate-400" />
                                                <SelectValue placeholder="Seleccionar workflow" />
                                            </div>
                                        </SelectTrigger>

                                        <SelectContent>
                                            {(trackingOptions.workflow_code || []).map(option => {
                                                const value = String(option?.value ?? option?.label ?? option)

                                                return (
                                                    <SelectItem key={value} value={value}>
                                                        {option?.label ?? value}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="relative w-full md:max-w-[360px]">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                        Buscar sitio
                                    </label>

                                    <Search className="absolute bottom-2.5 left-3 h-4 w-4 text-slate-400" />

                                    <Input
                                        value={search}
                                        onChange={event => setSearch(event.target.value)}
                                        placeholder="Identificador, sitio, proyecto..."
                                        className="pl-9"
                                    />
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    {Object.keys(columnFilters).length > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() =>
                                                setColumnFilters({})
                                            }
                                        >
                                            <X className="mr-1 h-3.5 w-3.5" />
                                            Limpiar filtros
                                        </Button>
                                    )}

                                    <div className="text-xs text-slate-400">
                                        {totalResults} sitio(s)
                                    </div>
                                </div>
                            </div>

                            {/* TABLA */}
                            <div className="w-full max-h-[calc(100vh-360px)] overflow-auto">
                                <Table className="w-full min-w-[1050px]">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="sticky left-0 z-20 min-w-[180px] bg-slate-50">
                                                Identificador
                                            </TableHead>

                                            <TableHead className="sticky left-[180px] z-20 min-w-[220px] bg-slate-50">
                                                Sitio
                                            </TableHead>

                                            <TableHead className="min-w-[160px]">
                                                Proyecto
                                            </TableHead>

                                            <TableHead className="min-w-[120px]">
                                                Torrera
                                            </TableHead>

                                            {tasks.map(task => (
                                                <TableHead
                                                    key={task.task_code}
                                                    className="min-w-[175px]"
                                                >
                                                    <ExcelFilter
                                                        label={task.task_name}
                                                        filterKey={`TASK::${task.task_code}`}
                                                        options={filterOptions?.tasks?.[task.task_code] || []}
                                                        filters={columnFilters}
                                                        onChange={handleColumnFilter}
                                                    />
                                                </TableHead>
                                            ))}

                                            <TableHead className="min-w-[300px]">
                                                <ExcelFilter
                                                    label="Pendiente"
                                                    filterKey="PENDIENTE"
                                                    options={filterOptions?.pending || []}
                                                    filters={columnFilters}
                                                    onChange={handleColumnFilter}
                                                />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 6 }).map((_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell colSpan={tasks.length + 5}>
                                                        <Skeleton className="h-8 w-full" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : !items.length ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={tasks.length + 5}
                                                    className="h-40 text-center text-sm text-slate-400"
                                                >
                                                    No se encontraron sitios.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map(item => (
                                                <TableRow key={item.instance_id} className="text-xs">

                                                    <TableCell className="sticky left-0 z-10 bg-white">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(`/workflow/inbox/details/${item.instance_id}`)
                                                            }
                                                            className="font-semibold text-blue-600 hover:underline"
                                                        >
                                                            {item.identificador}
                                                        </button>
                                                    </TableCell>

                                                    <TableCell className="sticky left-[180px] z-10 max-w-[220px] bg-white">
                                                        <div className="truncate" title={item.site}>
                                                            {item.site || "-"}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        {item.macro_project || "-"}
                                                    </TableCell>

                                                    <TableCell>
                                                        {item.tower || "-"}
                                                    </TableCell>

                                                    {tasks.map(task => (
                                                        <TaskSummaryCell
                                                            key={task.task_code}
                                                            summary={item.task_summary?.[task.task_code]}
                                                        />
                                                    ))}

                                                    <TableCell>
                                                        {item.pendiente ? (
                                                            <div
                                                                className="max-w-[420px] whitespace-normal font-medium text-amber-700"
                                                                title={item.pendiente}
                                                            >
                                                                {item.pendiente}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* FOOTER */}
                            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Filas</span>

                                    <Select
                                        value={String(limit)}
                                        onValueChange={value => setLimit(Number(value))}
                                    >
                                        <SelectTrigger className="h-8 w-[90px]">
                                            <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {[20, 50, 100].map(value => (
                                                <SelectItem key={value} value={String(value)}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Pagination
                                    totalResults={totalResults}
                                    totalPages={totalPages}
                                    currentPage={page}
                                    setCurrentPage={setPage}
                                />
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}


function TaskSummaryCell({ summary }) {
    if (!summary) {
        return (
            <TableCell className="text-center text-slate-300">
                -
            </TableCell>
        )
    }

    if (summary.ok) {
        return (
            <TableCell className="text-center">
                <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    OK
                </Badge>
            </TableCell>
        )
    }

    return (
        <TableCell className="text-center">
            {summary.forecast_date ? (
                <div>
                    <div className="font-medium text-slate-700">
                        {formatDate(summary.forecast_date)}
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-400">
                        {summary.forecast_source === "RESPONSIBLE"
                            ? "FCST Responsable"
                            : "FCST PM"
                        }
                    </div>
                </div>
            ) : (
                <span className="text-slate-400">-</span>
            )}
        </TableCell>
    )
}


function formatDate(value) {
    if (!value) return "-"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "-"

    return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
}