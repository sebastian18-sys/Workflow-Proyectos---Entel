
import { useMemo, useState, useEffect, useRef } from "react"
import { useBulkCompletion } from "@/hooks/projects/wf/useBulkCompletion"
import { useAuth } from "@/hooks/useAuth"
import { useDebounce } from "@/hooks/useDebounce"
import {
    ArrowLeft,
    Check,
    ChevronDown,
    Eye,
    FileSpreadsheet,
    Layers3,
    ListChecks,
    Loader2,
    MessageSquare,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    Workflow,
    X
} from "lucide-react"
import { DataGrid } from "react-data-grid"
import "react-data-grid/lib/styles.css"
import { toast } from "wc-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import Pagination from "@/components/Tables/Pagination"
import { useNavigate } from "react-router"
import SiteChat from "@/components/SiteDetailsSidebar/SiteChat"
import { useAuthz } from "@/hooks/useAuthz"
import { PERMS } from "@/constants/perm"


const PAGE_SIZE_OPTIONS = [
    50,
    100,
    200
]

const TASK_HEADER_STYLES = [
    {
        task: "!bg-blue-50 !text-blue-800",
        subtask: "!bg-blue-50/70 !text-blue-700",
        field: "!bg-blue-50/30"
    },
    {
        task: "!bg-violet-50 !text-violet-800",
        subtask: "!bg-violet-50/70 !text-violet-700",
        field: "!bg-violet-50/30"
    },
    {
        task: "!bg-emerald-50 !text-emerald-800",
        subtask: "!bg-emerald-50/70 !text-emerald-700",
        field: "!bg-emerald-50/30"
    },
    {
        task: "!bg-orange-50 !text-orange-800",
        subtask: "!bg-orange-50/70 !text-orange-700",
        field: "!bg-orange-50/30"
    },
    {
        task: "!bg-cyan-50 !text-cyan-800",
        subtask: "!bg-cyan-50/70 !text-cyan-700",
        field: "!bg-cyan-50/30"
    }
]


/*
 * =========================================================
 * OPTIONS
 * =========================================================
 */

function optionValue(option) {
    if (option && typeof option === "object") {
        return String(
            option.value ??
            option.id ??
            option.key ??
            option.label ??
            ""
        )
    }

    return String(
        option ?? ""
    )
}


function optionLabel(option) {
    if (option && typeof option === "object") {
        return String(
            option.label ??
            option.name ??
            option.value ??
            option.id ??
            ""
        )
    }

    return String(
        option ?? ""
    )
}


function normalizeOptions(
    values = []
) {
    return values
        .map(option => ({
            value: optionValue(option),
            label: optionLabel(option)
        }))
        .filter(
            option => option.value
        )
}



function activityKey(taskCode, subtaskKey) {
    return `${taskCode}::${subtaskKey}`
}

function stateCellKey(taskCode, subtaskKey) {
    return `BULK::${taskCode}::${subtaskKey}::STATE`
}

function commentCellKey(taskCode, subtaskKey) {
    return `BULK::${taskCode}::${subtaskKey}::COMMENT`
}

function fieldCellKey(taskCode, subtaskKey, fieldKey) {
    return `BULK::${taskCode}::${subtaskKey}::FIELD::${fieldKey}`
}

function stateFilterKey(taskCode, subtaskKey) {
    return `STATE::${taskCode}::${subtaskKey}`
}

function fieldFilterKey(taskCode, subtaskKey, fieldKey) {
    return `FIELD::${taskCode}::${subtaskKey}::${fieldKey}`
}


function getChatTasksForRow({
    row,
    userId,
    canViewAll = false
}) {
    const activities = Object.values(row?.__activities || {})

    const taskMap = new Map()

    for (const activity of activities) {
        const taskCode = activity.task_code
        if (!taskCode) continue

        const assigned = (activity.assigned_user_ids || [])
            .map(String)
            .includes(String(userId))

        if (!canViewAll && !assigned) {
            continue
        }

        if (!taskMap.has(taskCode)) {
            taskMap.set(
                taskCode,
                {
                    task_code: taskCode,
                    task_name: activity.task_name || taskCode
                }
            )
        }
    }

    return [
        ...taskMap.values()
    ]
}


function MultiSelectPicker({
    label,
    icon: Icon,
    options = [],
    selected = [],
    onChange,
    placeholder = "Seleccionar",
    disabled = false
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const selectedSet =
        useMemo(
            () =>
                new Set(
                    selected.map(String)
                ),
            [selected]
        )

    const selectedOptions =
        useMemo(
            () =>
                options.filter(option =>
                    selectedSet.has(
                        String(
                            option.value
                        )
                    )
                ),
            [
                options,
                selectedSet
            ]
        )

    const filteredOptions =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase()

            if (!query) {
                return options
            }

            return options.filter(option =>
                String(
                    option.label
                )
                    .toLowerCase()
                    .includes(
                        query
                    )
            )
        }, [
            options,
            search
        ])

    const toggle =
        value => {
            const stringValue = String(value)

            if (selectedSet.has(stringValue)) {
                onChange(
                    selected.filter(
                        item => String(item) !== stringValue
                    )
                )

                return
            }

            onChange([
                ...selected,
                stringValue
            ])
        }

    const selectAll =
        () => {
            onChange(
                options.map(
                    option =>
                        String(
                            option.value
                        )
                )
            )
        }

    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">
                {label}
            </Label>

            <Popover
                open={open}
                onOpenChange={setOpen}
            >
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className="h-10 w-full justify-between bg-white px-3 font-normal shadow-none"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            {Icon && (
                                <Icon className="h-4 w-4 flex-none text-slate-400" />
                            )}

                            {selectedOptions.length ? (
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="truncate text-sm text-slate-700">
                                        {selectedOptions[0]?.label}
                                    </span>

                                    {selectedOptions.length > 1 && (
                                        <Badge
                                            variant="secondary"
                                            className="h-5 flex-none rounded-full px-1.5 text-[10px]"
                                        >
                                            +{selectedOptions.length - 1}
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <span className="truncate text-sm text-slate-400">
                                    {placeholder}
                                </span>
                            )}
                        </div>

                        <ChevronDown className="h-4 w-4 flex-none text-slate-400" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className="w-[360px] p-0"
                >
                    <div className="border-b p-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <Input
                                value={search}
                                onChange={event =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Buscar..."
                                className="h-9 pl-8"
                            />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                                {selected.length} seleccionados
                            </span>

                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[11px]"
                                    onClick={selectAll}
                                >
                                    Todos
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[11px]"
                                    onClick={() =>
                                        onChange(
                                            []
                                        )
                                    }
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto p-1.5">
                        {!filteredOptions.length ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-400">
                                Sin opciones.
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const checked =
                                    selectedSet.has(
                                        String(
                                            option.value
                                        )
                                    )

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            toggle(
                                                option.value
                                            )
                                        }
                                        className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-slate-50"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            className="pointer-events-none"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm text-slate-700">
                                                {option.label}
                                            </div>
                                            {option.description && (
                                                <div className="truncate text-[10px] text-slate-400">
                                                    {option.description}
                                                </div>
                                            )}
                                        </div>
                                        {checked && (
                                            <Check className="h-4 w-4 text-blue-500" />
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}


/*
 * =========================================================
 * GRID HELPERS
 * =========================================================
 */

function getActivity(
    row,
    taskCode,
    subtaskKey
) {
    return row
        ?.__activities
        ?.[
            activityKey(
                taskCode,
                subtaskKey
            )
        ] ||
        null
}


function canEditActivity(
    row,
    taskCode,
    subtaskKey
) {
    return (
        getActivity(
            row,
            taskCode,
            subtaskKey
        )?.editable === true
    )
}


function fieldWidth(type) {
    switch (type) {
        case "NUMBER":
            return 130

        case "DATE":
            return 145

        case "DATETIME":
            return 185

        case "CHECKBOX":
            return 110

        case "SELECT":
            return 175

        case "MULTISELECT":
            return 210

        case "TEXTAREA":
            return 230

        case "FILE":
            return 200

        default:
            return 175
    }
}


function valuesEqual(left, right) {
    if (left === right) {
        return true
    }

    if (left === null || left === undefined) {
        left = ""
    }

    if (right === null || right === undefined) {
        right = ""
    }

    if (typeof left === "object" || typeof right === "object") {
        try {
            return (
                JSON.stringify(left) === JSON.stringify(right)
            )
        } catch {
            return false
        }
    }

    return (
        String(left) === String(right)
    )
}

function getBulkCellClass(editable) {
    return editable
        ? "bg-white text-slate-700 hover:bg-blue-50/30"
        : "bg-slate-100/80 text-slate-400 opacity-60 cursor-not-allowed"
}


function displayCellValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return ""
    }

    if (Array.isArray(value)) {
        return value.join(", ")
    }

    if (typeof value === "boolean") {
        return value
            ? "Sí"
            : "No"
    }

    if (typeof value === "object") {
        return (
            value.name ||
            value.filename ||
            value.label ||
            ""
        )
    }

    return String(value)
}


function normalizeFieldValue(value, field) {
    if (value === undefined) {
        return null
    }

    if (field?.type === "NUMBER") {
        if (value === "" || value === null) {
            return null
        }

        const number = Number(value)

        return Number.isNaN(number)
            ? value
            : number
    }

    if (field?.type === "CHECKBOX") {
        return (
            value === true ||
            value === "true" ||
            value === 1
        )
    }

    return value
}


/*
 * =========================================================
 * EDITORS
 * =========================================================
 */

function TextCellEditor({
    row,
    column,
    onRowChange,
    onClose,
    type = "text"
}) {
    return (
        <input
            autoFocus
            type={type}
            value={row[column.key] ?? ""}
            onChange={event => {
                let value = event.target.value

                if (type === "number") {
                    value = value === ""
                        ? ""
                        : Number(value)
                }

                onRowChange({
                    ...row,
                    [column.key]:
                        value
                })
            }}
            onBlur={() =>
                onClose(true)
            }
            onKeyDown={event => {
                if (event.key === "Enter") {
                    onClose(true)
                }

                if (event.key === "Escape") {
                    onClose(false)
                }
            }}
            className="h-full w-full border-0 bg-white px-2 text-xs outline-none"
        />
    )
}


function SelectCellEditor({
    row,
    column,
    onRowChange,
    options = []
}) {
    const value = row[column.key] ?? ""

    return (
        <select
            autoFocus
            value={String(value)}
            onChange={event => {
                onRowChange(
                    {
                        ...row,
                        [column.key]:
                            event.target.value
                    },
                    true
                )
            }}
            className="h-full w-full border-0 bg-white px-2 text-xs outline-none"
        >
            <option value="">
                Seleccionar
            </option>

            {options.map(option => (
                <option
                    key={optionValue(option)}
                    value={optionValue(option)}
                >
                    {optionLabel(option)}
                </option>
            ))}
        </select>
    )
}


function MultiSelectCellEditor({
    row,
    column,
    onRowChange,
    onClose,
    options = []
}) {
    const selected = Array.isArray(row[column.key])
        ? row[column.key].map(String)
        : []

    return (
        <select
            autoFocus
            multiple
            value={selected}
            onChange={event => {
                const values =
                    Array.from(event.target.selectedOptions).map(
                        option => option.value
                    )

                onRowChange({
                    ...row,
                    [column.key]:
                        values
                })
            }}
            onBlur={() =>
                onClose(true)
            }
            className="h-full min-h-[80px] w-full border-0 bg-white px-2 text-xs outline-none"
        >
            {options.map(option => (
                <option
                    key={optionValue(option)}
                    value={optionValue(option)}
                >
                    {optionLabel(option)}
                </option>
            ))}
        </select>
    )
}


function CheckboxCellEditor({
    row,
    column,
    onRowChange
}) {
    return (
        <div className="flex h-full items-center justify-center bg-white">
            <Checkbox
                autoFocus
                checked={row[column.key] === true}
                onCheckedChange={value =>
                    onRowChange(
                        {
                            ...row,
                            [column.key]: value === true
                        },
                        true
                    )
                }
            />
        </div>
    )
}

function StateCellEditor({
    row,
    column,
    onRowChange,
    states = []
}) {
    return (
        <select
            autoFocus
            value={row[column.key] ?? ""}
            onChange={event =>
                onRowChange(
                    {
                        ...row,
                        [column.key]: event.target.value
                    },
                    true
                )
            }
            className="h-full w-full border-0 bg-white px-2 text-xs font-medium text-slate-700 outline-none"
        >
            {states.map(state => (
                <option
                    key={state.state_key}
                    value={state.state_key}
                >
                    {state.label}
                </option>
            ))}
        </select>
    )
}


/*
 * =========================================================
 * DISPLAY CELL
 * =========================================================
 */

function BulkCellValue({
    row,
    column,
    field
}) {
    const value =
        row[column.key]

    if (
        field?.type ===
        "CHECKBOX"
    ) {
        return (
            <div className="flex h-full items-center justify-center">
                <Checkbox
                    checked={
                        value === true
                    }
                    disabled
                />
            </div>
        )
    }

    return (
        <div
            className="flex h-full items-center truncate px-1 text-xs"
            title={
                displayCellValue(
                    value
                )
            }
        >
            {displayCellValue(
                value
            )}
        </div>
    )
}


/*
 * =========================================================
 * FLATTEN BACK RESPONSE
 * =========================================================
 */

function flattenRows(
    items = [],
    configuration = []
) {
    return items.map(item => {
        const row = {
            instance_id: item.instance_id,
            site_id: item.site_id,
            identificador: item.identificador || "",

            site: item.site || "",
            macro_project: item.macro_project || "",
            sub_project: item.sub_project || "",

            tower: item.tower || "",
            workflow_code: item.workflow_code || "",

            __activities: item.activities || {}
        }

        for (const task of configuration) {
            for (const subtask of task.subtasks || []) {
                const pair =
                    activityKey(
                        task.task_code,
                        subtask.subtask_key
                    )

                const runtime =
                    item.activities
                        ?.[pair]

                row[
                    stateCellKey(
                        task.task_code,
                        subtask.subtask_key
                    )
                ] =
                    runtime?.state ||
                    ""

                row[
                    commentCellKey(
                        task.task_code,
                        subtask.subtask_key
                    )
                ] = ""

                for (
                    const field
                    of subtask.fields || []
                ) {
                    row[
                        fieldCellKey(
                            task.task_code,
                            subtask.subtask_key,
                            field.field_key
                        )
                    ] =
                        runtime
                            ?.form_data
                            ?.[
                                field.field_key
                            ] ??
                        ""
                }
            }
        }

        return row
    })
}


// CELDA DE ACCIONES
function ActionsCell({
    row,
    onOpenDetail,
    onOpenChat
}) {
    return (
        <TooltipProvider>
            <div className="flex h-full items-center justify-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                                onOpenDetail(row)
                            }
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>

                    <TooltipContent>
                        Detalle del sitio
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                                onOpenChat(row)
                            }
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>

                    <TooltipContent>
                        Comentarios
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}

function FilterHeader({
    label,
    filterKey,
    filterType = "TEXT",
    options = [],
    filters = {},
    onChange
}) {
    const [open, setOpen] = useState(false)
    const current = filters[filterKey] || {}

    const selectedValues = (current.values || []).map(String)

    const hasFilter =
        filterType === "VALUES"
            ? selectedValues.length > 0
            : !!String(current.value || "").trim()

    const toggleValue = value => {
        const stringValue = String(value)

        const next = selectedValues.includes(stringValue)
            ? selectedValues.filter(item => item !== stringValue)
            : [...selectedValues, stringValue]

        onChange(filterKey, {
            type: "VALUES",
            values: next
        })
    }

    return (
        <div className="flex min-w-0 items-center justify-between gap-1">
            <span className="truncate">
                {label}
            </span>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        onClick={event => event.stopPropagation()}
                        className={[
                            "flex h-6 w-6 flex-none items-center justify-center rounded hover:bg-black/5",
                            hasFilter ? "text-blue-600" : "text-slate-400"
                        ].join(" ")}
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className="w-64 p-3"
                    onClick={event => event.stopPropagation()}
                >
                    {filterType === "TEXT" ? (
                        <div className="space-y-3">
                            <div className="text-xs font-medium text-slate-600">
                                Filtrar {label}
                            </div>

                            <Input
                                value={current.value || ""}
                                onChange={event =>
                                    onChange(filterKey, {
                                        type: "TEXT",
                                        value: event.target.value
                                    })
                                }
                                placeholder="Contiene..."
                                className="h-9"
                            />

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        onChange(filterKey, null)
                                    }
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-600">
                                Filtrar {label}
                            </div>

                            <div className="max-h-60 space-y-1 overflow-y-auto">
                                {options.map(option => {
                                    const value = optionValue(option)
                                    const checked = selectedValues.includes(value)

                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => toggleValue(value)}
                                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-50"
                                        >
                                            <Checkbox
                                                checked={checked}
                                                className="pointer-events-none"
                                            />

                                            <span className="truncate text-xs text-slate-600">
                                                {optionLabel(option)}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex justify-end border-t pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        onChange(filterKey, null)
                                    }
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    )
}

// BUILD COLUMNS
function buildColumns(
    configuration = [],
    {
        onOpenDetail,
        onOpenChat,
        filters = {},
        onFilterChange
    } = {}
) {
    const metaByKey = new Map()

    const columns = [
        {
            key: "__actions",
            name: "",
            width: 80,
            minWidth: 80,
            frozen: "start",
            resizable: false,
            headerCellClass: "!bg-slate-100",
            cellClass: "bg-white",
            renderCell: ({ row }) => (
                <ActionsCell
                    row={row}
                    onOpenDetail={onOpenDetail}
                    onOpenChat={onOpenChat}
                />
            )
        },
        {
            key: "identificador",
            name: (
                <FilterHeader
                    label="Identificador"
                    filterKey="identificador"
                    filters={filters}
                    onChange={onFilterChange}
                />
            ),
            width: 180,
            minWidth: 150,
            frozen: "start",
            resizable: true,
            headerCellClass: "!bg-slate-100 !font-semibold !text-slate-600",
            cellClass: "bg-white font-medium text-slate-700"
        },
        {
            key: "site",
            name: (
                <FilterHeader
                    label="Sitio"
                    filterKey="site"
                    filters={filters}
                    onChange={onFilterChange}
                />
            ),
            width: 210,
            minWidth: 170,
            frozen: "start",
            resizable: true,
            headerCellClass: "!bg-slate-100 !font-semibold !text-slate-600",
            cellClass: "bg-white text-slate-600"
        },
        {
            key: "macro_project",
            name: (
                <FilterHeader
                    label="Proyecto"
                    filterKey="macro_project"
                    filters={filters}
                    onChange={onFilterChange}
                />
            ),
            width: 170,
            minWidth: 140,
            resizable: true,
            headerCellClass: "!bg-slate-100 !font-semibold !text-slate-600"
        },
        {
            key: "tower",
            name: (
                <FilterHeader
                    label="Torrera"
                    filterKey="tower"
                    filters={filters}
                    onChange={onFilterChange}
                />
            ),
            width: 125,
            minWidth: 110,
            resizable: true,
            headerCellClass: "!bg-slate-100 !font-semibold !text-slate-600"
        }
    ]

    configuration.forEach((task, taskIndex) => {
            const colors = TASK_HEADER_STYLES[taskIndex % TASK_HEADER_STYLES.length]
            const taskGroup = {
                name: task.task_name || task.task_code,
                headerCellClass: `${colors.task} !font-semibold`,
                children: []
            }

            for (const subtask of task.subtasks || []) {
                const pair = activityKey(
                    task.task_code,
                    subtask.subtask_key
                )

                const subtaskGroup = {
                    name: subtask.name || subtask.subtask_key,
                    headerCellClass: `${colors.subtask} !font-medium`,
                    children: []
                }

                /*
                 * =================================================
                 * STATE
                 * =================================================
                 */

                const stateKey = stateCellKey(
                    task.task_code,
                    subtask.subtask_key
                )

                metaByKey.set(
                    stateKey,
                    {
                        kind: "STATE",
                        pair,
                        taskCode: task.task_code,
                        subtaskKey: subtask.subtask_key,
                        states: subtask.states || []
                    }
                )

                subtaskGroup.children.push({
                    key: stateKey,
                    name: (
                        <FilterHeader
                            label="Estado"
                            filterKey={stateFilterKey(
                                task.task_code,
                                subtask.subtask_key
                            )}
                            filterType="VALUES"
                            options={(subtask.states || []).map(state => ({
                                value: state.state_key,
                                label: state.label
                            }))}
                            filters={filters}
                            onChange={onFilterChange}
                        />
                    ),
                    width: 165,
                    minWidth: 145,
                    resizable: true,
                    headerCellClass: "!bg-amber-100 !text-amber-800 !font-semibold",

                    editable:
                        row =>
                            canEditActivity(
                                row,
                                task.task_code,
                                subtask.subtask_key
                            ),

                    cellClass:
                        row =>
                            getBulkCellClass(
                                canEditActivity(
                                    row,
                                    task.task_code,
                                    subtask.subtask_key
                                )
                            ),

                    renderCell:
                        props => {
                            const state = (subtask.states || []).find(
                                item => item.state_key === props.row[stateKey]
                            )

                            return (
                                <div className="flex h-full items-center px-1 text-xs font-medium text-slate-600">
                                    {state?.label || props.row[stateKey] || "-"}
                                </div>
                            )
                        },

                    renderEditCell:
                        props => (
                            <StateCellEditor
                                {...props}
                                states={subtask.states || []}
                            />
                        )
                    })

                /*
                 * =================================================
                 * COMMENT
                 *
                 * Solo aparece si algún estado exige comentario.
                 * =================================================
                 */

                const requiresComments = (subtask.states || []).some(
                    state => state.transition?.requires_comment === true
                )

                if (requiresComments) {
                    const key = commentCellKey(task.task_code, subtask.subtask_key)

                    metaByKey.set(
                        key,
                        {
                            kind: "COMMENT",
                            pair,
                            taskCode: task.task_code,
                            subtaskKey: subtask.subtask_key
                        }
                    )

                    subtaskGroup
                        .children
                        .push({
                            key,
                            name: "Comentario Estado",
                            width: 190,
                            minWidth: 160,
                            resizable: true,
                            headerCellClass: `${colors.field}`,

                            editable:
                                row =>
                                    canEditActivity(
                                        row,
                                        task.task_code,
                                        subtask.subtask_key
                                    ),

                            cellClass:
                                row =>
                                    getBulkCellClass(
                                        canEditActivity(
                                            row,
                                            task.task_code,
                                            subtask.subtask_key
                                        )
                                    ),

                            renderEditCell:
                                props => (
                                    <TextCellEditor
                                        {...props}
                                    />
                                )
                        })
                }

                /*
                 * =================================================
                 * FIELDS
                 * =================================================
                 */

                for (const field of subtask.fields || []) {
                    const key = fieldCellKey(
                        task.task_code,
                        subtask.subtask_key,
                        field.field_key
                    )

                    metaByKey.set(
                        key,
                        {
                            kind: "FIELD",
                            pair,
                            taskCode: task.task_code,
                            subtaskKey: subtask.subtask_key,
                            field
                        }
                    )

                    const fieldName =
                        field.system_binding ===
                        "TASK_RESPONSIBLE_FORECAST"
                            ? `${field.label} · FCST`
                            : (
                                field.required
                                    ? `${field.label} *`
                                    : field.label
                            )

                    const filterType = ["SELECT", "MULTISELECT", "CHECKBOX"].includes(field.type)
                        ? "VALUES"
                        : "TEXT"

                    const filterOptions = field.type === "CHECKBOX"
                        ? [
                            { value: true, label: "Sí" },
                            { value: false, label: "No" }
                        ]
                        : field.options || []

                    const column = {
                        key,
                        name: (
                            <FilterHeader
                                label={fieldName}
                                filterKey={fieldFilterKey(
                                    task.task_code,
                                    subtask.subtask_key,
                                    field.field_key
                                )}
                                filterType={filterType}
                                options={filterOptions}
                                filters={filters}
                                onChange={onFilterChange}
                            />
                        ),
                        width: fieldWidth(field.type),
                        minWidth: 110,
                        resizable: true,
                        headerCellClass: `${colors.field}`,

                        editable:
                            row =>
                                field.editable !== false &&
                                field.type !== "FILE" &&
                                canEditActivity(
                                    row,
                                    task.task_code,
                                    subtask.subtask_key
                                ),

                        cellClass:
                            row => {
                                const editable =
                                    field.editable !== false &&
                                    field.type !== "FILE" &&
                                    canEditActivity(
                                        row,
                                        task.task_code,
                                        subtask.subtask_key
                                    )

                                return getBulkCellClass(editable)
                            },

                        renderCell:
                            props => (
                                <BulkCellValue
                                    {...props}
                                    field={field}
                                />
                            )
                    }

                    switch (
                        field.type
                    ) {
                        case "NUMBER":
                            column.renderEditCell =
                                props => (
                                    <TextCellEditor
                                        {...props}
                                        type="number"
                                    />
                                )
                            break

                        case "DATE":
                            column.renderEditCell =
                                props => (
                                    <TextCellEditor
                                        {...props}
                                        type="date"
                                    />
                                )
                            break

                        case "DATETIME":
                            column.renderEditCell =
                                props => (
                                    <TextCellEditor
                                        {...props}
                                        type="datetime-local"
                                    />
                                )
                            break

                        case "SELECT":
                            column.renderEditCell =
                                props => (
                                    <SelectCellEditor
                                        {...props}
                                        options={
                                            field.options ||
                                            []
                                        }
                                    />
                                )
                            break

                        case "MULTISELECT":
                            column.renderEditCell =
                                props => (
                                    <MultiSelectCellEditor
                                        {...props}
                                        options={
                                            field.options ||
                                            []
                                        }
                                    />
                                )
                            break

                        case "CHECKBOX":
                            column.renderEditCell =
                                props => (
                                    <CheckboxCellEditor
                                        {...props}
                                    />
                                )
                            break

                        case "FILE":
                            /*
                             * FILE no se edita desde esta grilla.
                             */
                            break

                        default:
                            column.renderEditCell =
                                props => (
                                    <TextCellEditor
                                        {...props}
                                    />
                                )
                    }

                    subtaskGroup.children.push(column)
                }

                taskGroup.children.push(subtaskGroup)
            }

            columns.push(taskGroup)
        }
    )

    return {
        columns,
        metaByKey
    }
}


/*
 * =========================================================
 * BUILD CHANGES
 * =========================================================
 */

function buildChanges({
    rows,
    baseRows,
    metaByKey
}) {
    const baseMap = new Map(
        baseRows.map(
            row => [
                String(row.instance_id),
                row
            ]
        )
    )

    const changes = new Map()

    let cellCount = 0

    for (const row of rows) {
        const original = baseMap.get(String(row.instance_id))

        if (!original) {
            continue
        }

        for (const [key, meta] of metaByKey.entries()) {
            const currentValue = row[key]
            const originalValue = original[key]

            if (valuesEqual(currentValue, originalValue)) {
                continue
            }

            /*
             * COMMENT solo se adjunta después,
             * no genera por sí mismo una operación.
             */
            if (meta.kind !== "COMMENT") {
                cellCount += 1
            }

            const itemKey = [
                row.instance_id,
                meta.taskCode,
                meta.subtaskKey
            ].join("::")

            if (!changes.has(itemKey)) {
                changes.set(
                    itemKey,
                    {
                        instance_id: String(row.instance_id),
                        task_code: meta.taskCode,
                        subtask_key: meta.subtaskKey,
                        form_data: {}
                    }
                )
            }

            const item = changes.get(itemKey)

            if (meta.kind === "STATE") {
                item.state = currentValue
            }

            if (meta.kind === "FIELD") {
                item.form_data[meta.field.field_key] = normalizeFieldValue(currentValue, meta.field)
            }

            if (meta.kind === "COMMENT") {
                item.__comment = currentValue
            }
        }
    }

    const items =
        [...changes.values()]
            .map(item => {
                const hasState = Object.prototype.hasOwnProperty.call(item, "state")

                const hasFields = Object.keys(item.form_data || {}).length > 0

                if (hasState && item.__comment?.trim()) {
                    item.comment = item.__comment.trim()
                }

                delete item.__comment

                if (!hasState && !hasFields) {
                    return null
                }

                return item
            })
            .filter(Boolean)

    return {
        items,
        cellCount
    }
}


/*
 * =========================================================
 * VALIDATE COMMENT
 * =========================================================
 */

function validateChanges(
    changes,
    configuration
) {
    const errors = []

    for (const change of changes) {
        if (!Object.prototype
            .hasOwnProperty
            .call(change, "state")
        ) {
            continue
        }

        const task = configuration.find(
            item => item.task_code === change.task_code
        )

        const subtask = task?.subtasks?.find(
            item => item.subtask_key === change.subtask_key
        )

        const state = subtask?.states?.find(item => item.state_key === change.state)

        if (
            state?.transition?.requires_comment === true &&
            !change.comment?.trim()
        ) {
            errors.push(
                `${task?.task_name || change.task_code} / ${subtask?.name || change.subtask_key}: ${state.label} requiere comentario.`
            )
        }
    }
    return errors
}

const getRowActivities = row =>
    Object.values(row?.__activities || {}).filter(activity =>
        taskCodes.includes(activity.task_code) &&
        subtaskKeys.includes(activity.subtask_key)
    )

const getDefaultActivity = row => {
    const activities = getRowActivities(row)
    return activities.find(item => item.editable) || activities[0] || null
}




export default function CompleteMassive() {

    const { can } = useAuthz()
    const { user } = useAuth()

    const navigate = useNavigate()

    // actions grid
    const [chatOpen, setChatOpen] = useState(false)
    const [chatRow, setChatRow] = useState(null)
    const [chatTasks, setChatTasks] = useState([])
    const [chatTaskCode, setChatTaskCode] = useState("")
    const [chatActivity, setChatActivity] = useState(null)
    

    // filters
    const [columnFilters, setColumnFilters] = useState({})

    const [workflowCode, setWorkflowCode] = useState("")
    const [taskCodes, setTaskCodes] = useState([])
    const [subtaskKeys, setSubtaskKeys] = useState([])
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(100)
    const [gridRows, setGridRows] = useState([])
    const [baseRows, setBaseRows] = useState([])

    const debouncedSearch = useDebounce(search, 300)
    const debouncedColumnFilters = useDebounce(columnFilters, 400)

    const bulkParams = useMemo(() => ({
        user_id: String(user?.id || ""),
        workflow_code: workflowCode || undefined,
        task_codes: taskCodes,
        subtask_keys: subtaskKeys,
        search: debouncedSearch,
        column_filters: debouncedColumnFilters,
        page,
        limit
    }), [
        user?.id,
        workflowCode,
        taskCodes,
        subtaskKeys,
        debouncedSearch,
        debouncedColumnFilters,
        page,
        limit
    ])

    const {
        items,
        configuration,
        filterOptions,
        loading,
        loadingOptions,
        saving,
        totalResults,
        totalPages,
        saveChanges,
        reload,
        setItems
    } = useBulkCompletion(
        bulkParams,
        {
            enabled: !!user?.id
        }
    )

    const workflowOptions = useMemo(() =>
        normalizeOptions(
            filterOptions?.workflow_code || []
        ),
        [filterOptions?.workflow_code]
    )

    const taskOptions = useMemo(() =>
        (filterOptions.tasks || []).map(task => ({
            value: task.task_code,
            label: task.task_name
        })),
    [filterOptions.tasks])

    const subtaskOptions = useMemo(() => {
        const selected = new Set(taskCodes)

        return (filterOptions.tasks || [])
            .filter(task =>
                selected.has(task.task_code)
            )
            .flatMap(task =>
                (task.subtasks || []).map(subtask => ({
                    value: subtask.subtask_key,
                    label: subtask.subtask_name,
                    task_code: task.task_code,
                    task_name: task.task_name
                }))
            )
    }, [
        filterOptions.tasks,
        taskCodes
    ])



    
    /*
     * =====================================================
     * GRID READY
     * =====================================================
     */

    const gridReady = !!workflowCode && 
        taskCodes.length > 0 &&
        subtaskKeys.length > 0

    /*
     * =====================================================
     * BACK -> FLATTEN GRID
     * =====================================================
     */

    useEffect(() => {
        if (!gridReady) {
            setGridRows([])
            setBaseRows([])
            return
        }

        const nextRows = flattenRows(
            items,
            configuration
        )

        setGridRows(nextRows)
        setBaseRows(nextRows)
    }, [
        items,
        configuration,
        gridReady
    ])


    /*
     * =====================================================
     * COLUMNS
     * =====================================================
     */
            
    const handleOpenDetail = row => {
        navigate(`/projects/sites/${row.instance_id}`, {
            state: { instanceId: row.instance_id }
        })
    }

    const getRowActivities = row =>
        Object.values(row?.__activities || {}).filter(activity =>
            taskCodes.includes(activity.task_code) &&
            subtaskKeys.includes(activity.subtask_key)
        )

    const getDefaultActivity = row => {
        const activities = getRowActivities(row)

        return (
            activities.find(item => item.editable) ||
            activities[0] ||
            null
        )
    }

    const handleOpenChat = row => {
        const tasks = getChatTasksForRow({
            row,
            userId: user?.id,
            canViewAll: can(PERMS.PROJECTS.PROJECT_WORKFLOW_PM_ADMIN_FUNCTIONS)
        })

        if (!tasks.length) {
            toast.error("No tienes una Tarea disponible para este chat")
            return
        }

        setChatRow(row)
        setChatTasks(tasks)
        setChatTaskCode(tasks[0].task_code)

        setChatOpen(true)
    }

    const handleColumnFilter = (key, value) => {
        setColumnFilters(prev => {
            const next = { ...prev }

            const empty =
                !value ||
                (value.type === "TEXT" && !String(value.value || "").trim()) ||
                (value.type === "VALUES" && !(value.values || []).length)

            if (empty) {
                delete next[key]
            } else {
                next[key] = value
            }

            return next
        })
    }

    const { columns, metaByKey } = useMemo(
        () =>
            buildColumns(configuration,
                {
                    onOpenDetail: handleOpenDetail,
                    onOpenChat: handleOpenChat,
                    filters: columnFilters,
                    onFilterChange: handleColumnFilter
                }
            ),
        [configuration, columnFilters, taskCodes, subtaskKeys]
    )

    // const { columns, metaByKey} = useMemo(() =>
    //     buildColumns(configuration)
    //     , [configuration])
    

    /*
     * =====================================================
     * CHANGES
     * =====================================================
     */

    const changeInfo = useMemo(() =>
        buildChanges({
            rows: gridRows,
            baseRows,
            metaByKey
        }),
        [
            gridRows,
            baseRows,
            metaByKey
        ]
    )

    const dirtyItems = changeInfo.items
    const dirtyCount = dirtyItems.length
    const changedCells = changeInfo.cellCount

    /*
     * =====================================================
     * RESET PAGE
     * =====================================================
     */

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, debouncedColumnFilters])

    /*
     * =====================================================
     * WORKFLOW
     * =====================================================
     */

    const handleWorkflowChange =
        value => {
            if (dirtyCount > 0 &&
                !window.confirm(
                    "Hay cambios sin guardar. ¿Deseas cambiar de Workflow y descartarlos?"
                )
            ) {
                return
            }

            setWorkflowCode(value)

            setTaskCodes([])
            setSubtaskKeys([])
            setGridRows([])
            setBaseRows([])
            setPage(1)
        }

    /*
     * =====================================================
     * TASK MULTISELECT
     *
     * Al agregar una TASK seleccionamos sus SUBTASK
     * automáticamente.
     *
     * Luego el usuario puede quitar las que no necesite.
     * =====================================================
     */
    const handleTaskChange = values => {
        const previous = new Set(taskCodes)
        const nextTaskSet = new Set(values)

        const newlyAdded =
            values.filter(
                value => !previous.has(value)
            )

        const availableTasks = filterOptions?.tasks || []

        const allowedSubtasks =
            new Set(
                availableTasks
                    .filter(task =>
                        nextTaskSet.has(task.task_code)
                    )
                    .flatMap(task =>
                        (task.subtasks || []).map(
                            subtask => subtask.subtask_key
                        )
                    )
            )

        const autoAddSubtasks =
            availableTasks
                .filter(task =>
                    newlyAdded.includes(
                        task.task_code
                    )
                )
                .flatMap(task =>
                    (task.subtasks || []).map(
                        subtask => subtask.subtask_key
                    )
                )

        const nextSubtasks = [
            ...new Set([
                ...subtaskKeys
                    .filter(key =>
                        allowedSubtasks.has(
                            key
                        )
                    ),

                ...autoAddSubtasks
            ])
        ]

        setTaskCodes(values)
        setSubtaskKeys(nextSubtasks)
        setPage(1)
    }

    const handleSubtaskChange = values => {
        setSubtaskKeys(values)
        setPage(1)
    }

    /*
     * =====================================================
     * FILL HANDLE
     * =====================================================
     */

    const handleFill = ({ columnKey, sourceRow, targetRow }) => {
        const meta = metaByKey.get(columnKey)

        if (!meta) return targetRow

        if (meta.kind === "FIELD" && meta.field?.type === "FILE") {
            return targetRow
        }

        if (!canEditActivity(
            targetRow,
            meta.taskCode,
            meta.subtaskKey
        )) {
            return targetRow
        }

        return {
            ...targetRow,
            [columnKey]: sourceRow[columnKey]
        }
    }

    /*
     * =====================================================
     * SAVE
     * =====================================================
     */

    const handleSave = async() => {
        if (!dirtyItems.length) {
            toast.error("No existen cambios para guardar")
            return
        }

        const errors = validateChanges(dirtyItems, configuration)

        if (errors.length) {
            toast.error(errors.slice(0, 3).join(" | "))
            return
        }

        try {
            const response = await saveChanges(dirtyItems)
            const payload = response?.data || response || {}
            const content = payload.content || {}

            if (content.failed > 0) {
                const firstErrors =
                    (content.items || [])
                        .filter(item => item.result === "ERROR")
                        .slice(0, 3)
                        .map(item => `${item.task_code}/${item.subtask_key}: ${item.message}`)

                toast.error(
                    `${content.success || 0} actualizados y ${content.failed} con error. ${firstErrors.join(" | ")}`
                )
                return
            }
            toast.success(`${content.success || dirtyItems.length} actividades actualizadas`)
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo guardar"
            )
        }
    }

    // DISCARD
    const handleDiscard = () => {
        if (!dirtyCount) {
            return
        }

        setGridRows(
            baseRows.map(
                row => ({
                    ...row
                })
            )
        )
    }

    // REFRESH
    const handleReload = async() => {
        if (dirtyCount && !window.confirm("Hay cambios sin guardar. ¿Deseas descartarlos y recargar?")) {
            return
        }
        await reload()
    }

    


    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* BREADCRUMB */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-semibold text-[#2b7fff]">
                                Completado Masivo
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Actualiza campos y estados de múltiples sitios.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {dirtyCount > 0 && (
                            <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700"
                            >
                                {changedCells} celdas modificadas
                            </Badge>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !dirtyCount ||
                                saving
                            }
                            onClick={
                                handleDiscard
                            }
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Descartar
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                !dirtyCount ||
                                saving
                            }
                            onClick={
                                handleSave
                            }
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}

                            Guardar cambios

                            {dirtyCount > 0 && (
                                <Badge className="ml-2 bg-white/20 text-white hover:bg-white/20">
                                    {dirtyCount}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>


                {/* =================================================
                    CARD
                ================================================= */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {/* =============================================
                        FILTERS
                    ============================================= */}
                    <div className="border-b border-slate-200 bg-slate-50/30 p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[230px_1fr_1.2fr_280px]">
                            {/* WORKFLOW */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">
                                    Workflow
                                </Label>
                                <Select
                                    value={workflowCode}
                                    onValueChange={handleWorkflowChange}
                                    disabled={loadingOptions}
                                >
                                    <SelectTrigger className="h-10 bg-white">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Workflow className="h-4 w-4 flex-none text-slate-400" />
                                            <SelectValue placeholder="Seleccionar workflow" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workflowOptions.map(option => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* TASK */}
                            <MultiSelectPicker
                                label="Tareas"
                                icon={Layers3}
                                options={taskOptions}
                                selected={taskCodes}
                                onChange={handleTaskChange}
                                placeholder="Seleccionar tareas"
                                disabled={
                                    !workflowCode ||
                                    loadingOptions
                                }
                            />

                            {/* SUBTASK */}
                            <MultiSelectPicker
                                label="Subtareas"
                                icon={ListChecks}
                                options={subtaskOptions}
                                selected={subtaskKeys}
                                onChange={handleSubtaskChange}
                                placeholder="Seleccionar subtareas"
                                disabled={
                                    !taskCodes.length ||
                                    loadingOptions
                                }
                            />

                            {/* SEARCH */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">
                                    Buscar sitio
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={search}
                                        onChange={
                                            event => setSearch(event.target.value)
                                        }
                                        placeholder="Identificador, sitio, proyecto..."
                                        className="h-10 bg-white pl-9 pr-9"
                                    />

                                    {!!search && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSearch(
                                                    ""
                                                )
                                            }
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* =========================================
                            FILTER INFO / ACTIONS
                        ========================================= */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                {gridReady ? (
                                    <>
                                        <span>
                                            {totalResults} sitios
                                        </span>
                                        <span>
                                            ·
                                        </span>
                                        <span>
                                            {taskCodes.length} tarea(s)
                                        </span>
                                        <span>
                                            ·
                                        </span>
                                        <span>
                                            {subtaskKeys.length} subtarea(s)
                                        </span>
                                    </>
                                ) : (
                                    <span>
                                        Selecciona Workflow, Tarea y Subtarea para construir la grilla.
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Select
                                    value={String(limit)}
                                    onValueChange={
                                        value => {
                                            setLimit(Number(value))
                                            setPage(1)
                                        }
                                    }
                                >
                                    <SelectTrigger className="h-8 w-[115px] bg-white text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZE_OPTIONS.map(value => (
                                            <SelectItem
                                                key={value}
                                                value={String(value)}
                                            >
                                                {value} filas
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                    onClick={handleReload}
                                    className="h-8"
                                >
                                    <RefreshCw
                                        className={[
                                            "mr-2 h-3.5 w-3.5",
                                            loading
                                                ? "animate-spin"
                                                : ""
                                        ].join(" ")}
                                    />
                                    Actualizar
                                </Button>
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
                            </div>
                        </div>
                    </div>

                    {/* =============================================
                        GRID
                    ============================================= */}
                    {!gridReady ? (
                        <div className="flex min-h-[430px] items-center justify-center">
                            <div className="max-w-sm text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                    <FileSpreadsheet className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="mt-4 text-sm font-semibold text-slate-600">
                                    Configura la vista masiva
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-400">
                                    Selecciona un Workflow y las Tareas/Subtareas que deseas visualizar y completar.
                                </p>
                            </div>
                        </div>
                    ) : loading && !gridRows.length ? (
                        <div className="flex min-h-[430px] items-center justify-center">
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                Construyendo grilla...
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            {loading && (
                                <div className="absolute right-4 top-3 z-20 flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[11px] text-slate-500 shadow-sm">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                    Actualizando
                                </div>
                            )}

                            <DataGrid
                                aria-label="Completado masivo"
                                columns={columns}
                                rows={gridRows}
                                rowKeyGetter={
                                    row => row.instance_id
                                }
                                onRowsChange={setGridRows}
                                onFill={handleFill}
                                defaultColumnOptions={{
                                    resizable: true
                                }}
                                rowHeight={40}
                                headerRowHeight={36}
                                style={{
                                    height: "calc(100vh - 365px)",
                                    minHeight: 430
                                }}
                                noRowsFallback={
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                        No se encontraron sitios para los filtros seleccionados.
                                    </div>
                                }
                                className="border-0"
                            />
                        </div>
                    )}

                    {/* =============================================
                        FOOTER
                    ============================================= */}
                    {gridReady && (
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-xs text-slate-400">
                                {dirtyCount > 0 ? (
                                    <>
                                        <span className="font-medium text-amber-600">
                                            {dirtyCount}
                                        </span>
                                        {" "}actividad(es) con cambios ·{" "}
                                        <span className="font-medium text-amber-600">
                                            {changedCells}
                                        </span>
                                        {" "}celda(s)
                                    </>
                                ) : (
                                    "Sin cambios pendientes"
                                )}
                            </div>

                            <Pagination
                                totalResults={totalResults}
                                totalPages={totalPages}
                                currentPage={page}
                                setCurrentPage={
                                    nextPage => {
                                        if (
                                            dirtyCount &&
                                            !window.confirm(
                                                "Hay cambios sin guardar. ¿Deseas cambiar de página y descartarlos?"
                                            )
                                        ) {
                                            return
                                        }
                                        setPage(nextPage)
                                    }
                                }
                            />
                        </div>
                    )}
                </div>
                <Sheet
                    open={chatOpen}
                    onOpenChange={open => {
                        setChatOpen(open)
                        if (!open) {
                            setChatRow(null)
                            setChatActivity(null)
                        }
                    }}
                >
                    <SheetContent
                        side="right"
                        className="w-full p-0 sm:max-w-[520px]"
                    >
                        <SheetHeader className="border-b px-5 py-4">
                            <SheetTitle>
                                Comentarios
                            </SheetTitle>
                            <div className="text-xs text-slate-400">
                                {chatRow?.identificador || "-"}
                            </div>
                            {chatTasks.length > 1 && (
                                <Select
                                    value={chatTaskCode}
                                    onValueChange={setChatTaskCode}
                                >
                                    <SelectTrigger className="mt-3">
                                        <SelectValue
                                            placeholder="Seleccionar Tarea"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {chatTasks.map(
                                            task => (
                                                <SelectItem
                                                    key={task.task_code}
                                                    value={task.task_code}
                                                >
                                                    {task.task_name}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </SheetHeader>
                        {chatRow &&
                            chatActivity && (
                                <SiteChat
                                    instanceId={chatRow.instance_id}
                                    // instance={chatRow}
                                    // taskCode={chatActivity.task_code}
                                    taskCode={chatTaskCode}
                                    currentUser={user}
                                    compact
                                    // can={can}
                                />
                            )}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}