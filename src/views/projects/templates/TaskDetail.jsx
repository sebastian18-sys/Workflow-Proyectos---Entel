import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import {
    ArrowLeft, Plus, Trash2, Pencil, Save, Loader2, Users, Settings2,
    ListChecks, FileText, ChevronDown, Search, X, UserRound, Database,
    CircleDot, CheckCircle2, LockKeyhole, GitBranch, MoreVertical,
    NotebookTabs,
    UsersRound
} from "lucide-react"
import { toast } from "wc-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import { useTasks } from "@/hooks/projects/wf/useTasks"
import { useUsers } from "@/hooks/admin/useUsers"
import { useResponsibleUsers } from "@/hooks/admin/useResponsibleUsers"
import { resolveResponsibleUserIds } from "@/lib/assignment"

const MENU = [
    { key: "GENERAL", label: "General", icon: FileText },
    { key: "SUBTASKS", label: "Subtareas y campos", icon: GitBranch },
    { key: "STATES", label: "Estados", icon: CircleDot }
]

const SUBTASK_TABS = [
    { key: "FIELDS", label: "Campos" },
    { key: "RESPONSIBLES", label: "Responsables" },
    { key: "STATES", label: "Estados y transiciones" },
    { key: "SLA", label: "SLA" },
    { key: "BEHAVIOR", label: "Comportamiento" }
]

const FIELD_TYPES = [
    "TEXT", "TEXTAREA", "NUMBER", "DATE", "DATETIME",
    "SELECT", "MULTISELECT", "CHECKBOX", "FILE"
]

const FIELD_SYSTEM_BINDINGS = [
    {
        value: "NONE",
        label: "Campo normal"
    },
    {
        value: "TASK_RESPONSIBLE_FORECAST",
        label: "Forecast Responsable de la TASK"
    }
]

const TRANSITION_TYPES = [
    {
        value: "STATE",
        label: "Mantener subtarea abierta"
    },
    {
        value: "OPEN_SUBTASK",
        label: "Aperturar subtarea"
    },
    {
        value: "WAIT_VALIDATION",
        label: "Enviar a validar"
    },
    {
        value: "REOPEN_SUBTASK",
        label: "Reaperturar subtarea"
    },
    {
        value: "CLOSE_SUBTASK",
        label: "Cerrar esta subtarea"
    },
    {
        value: "CLOSE_RELATED_SUBTASK",
        label: "Cerrar subtarea relacionada"
    },
    {
        value: "CLOSE_AND_OPEN_SUBTASK",
        label: "Cerrar y aperturar subtarea"
    },
    {
        value: "CLOSE_CURRENT_AND_SELECT_SUBTASKS",
        label: "Cerrar subtarea actual y otras"
    },
    {
        value: "CLOSE_TASK",
        label: "Cerrar TASK"
    },
    {
        value: "STANDBY",
        label: "Marcar como Stand By"
    }
]

const START_POLICIES = [
    { value: "ON_TASK_START", label: "Al iniciar la Tarea" },
    { value: "ON_TRANSITION", label: "Mediante transición" }
]

const ASSIGNMENT_MODES = [
    { value: "FIXED_USERS", label: "Usuarios fijos", description: "Uno o varios usuarios o grupos quedan configurados por defecto." },
    { value: "DYNAMIC_PROVIDER", label: "Proveedor dinámico", description: "Se resuelve según el proveedor seleccionado en un campo." },
    { value: "UNASSIGNED", label: "Sin asignación inicial", description: "La Subtarea inicia sin responsable." }
]

function makeKey(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase()
}

function getInitialSubtask() {
    return {
        name: "",
        blocking: true,
        start_policy: "ON_TRANSITION",
        assignment: {
            mode: "UNASSIGNED",
            user_ids: [],
            responsibles: [],
            provider_source_field: ""
        }
    }
}

function getInitialField() {
    return {
        label: "",
        type: "TEXT",
        required: false,
        editable: true,
        show_in_next_task: false,
        default_value: "",
        options: "",
        system_binding: "NONE"
    }
}

function getInitialState() {
    return {
        label: "",
        transition_type: "STATE",
        target_subtask_key: "",
        target_subtask_keys: [],
        set_non_blocking_subtask_keys: [],
        target_state_key: "",
        requires_comment: false,
        option_list_enabled: false,
        option_list_label: "Tipo de Issue",
        option_list_options: [""]
    }
}

function StatusBadge({ children, type = "default" }) {
    const cls = type === "blocking"
        ? "border-blue-100 bg-blue-50 text-blue-600"
        : type === "nonblocking"
            ? "border-amber-100 bg-amber-50 text-amber-600"
            : "border-slate-200 bg-slate-50 text-slate-500"

    return <Badge variant="outline" className={`rounded-full px-3 py-1 text-[10px] ${cls}`}>{children}</Badge>
}

function UserMultiSelect({ users = [], selected = [], onChange }) {
    const [open, setOpen] = useState(false)

    const toggle = id => {
        const value = String(id)
        if (selected.map(String).includes(value)) onChange(selected.filter(x => String(x) !== value))
        else onChange([...selected, value])
    }

    const selectedUsers = users.filter(user => selected.map(String).includes(String(user.user_id || user._id)))

    return (
        <div className="space-y-3">
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => {
                        const id = String(user.user_id || user._id)
                        return (
                            <div key={id} className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-semibold">
                                    {(user.first_name + " " + user.last_name || user.label || "U").slice(0, 2).toUpperCase()}
                                </div>
                                <span>{user.first_name + " " + user.last_name || user.label || user.email || id}</span>
                                <button type="button" onClick={() => toggle(id)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                        <Search className="mr-2 h-4 w-4 text-slate-400" />
                        Buscar y añadir usuarios...
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[380px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Buscar usuario..." />
                        <CommandList>
                            <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                            <CommandGroup>
                                {users.map(user => {
                                    const id = String(user.user_id || user._id)
                                    const checked = selected.map(String).includes(id)

                                    return (
                                        <CommandItem key={id} value={`${user.name || ""} ${user.email || ""}`} onSelect={() => toggle(id)}>
                                            <Checkbox checked={checked} className="mr-3" />
                                            <div>
                                                <div className="text-xs font-medium">{(user.first_name + " " + user.last_name) || user.label}</div>
                                                <div className="text-xs text-slate-400">{user.email || user.role || id}</div>
                                            </div>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}


function ResponsibleMultiSelect({
    users = [],
    groups = [],
    selected = [],
    onChange
}) {
    const [open, setOpen] = useState(false)

    const isSelected = (type, id) => {
        return selected.some(
            item =>
                item.type === type &&
                String(item.id) === String(id)
        )
    }

    const toggle = (type, id) => {
        const value = String(id)

        const exists = isSelected(type, value)

        if (exists) {
            onChange(
                selected.filter(
                    item =>
                        !(
                            item.type === type &&
                            String(item.id) === value
                        )
                )
            )
        } else {
            onChange([
                ...selected,
                {
                    type,
                    id: value
                }
            ])
        }
    }

    /*
     * Normalizamos USER y GROUP para poder
     * trabajar con ambos de la misma forma.
     */
    const items = [
        ...users.map(user => ({
            type: "USER",
            id: String(user.id || user.user_id || user._id),
            name:
                user.name ||
                `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                user.username,

            secondary: user.email || user.username,
            original: user
        })),

        ...groups.map(group => ({
            type: "GROUP",
            id: String(group.id || group.group_id || group._id),
            name: group.name || group.group_name || group.code,
            secondary: `${group.member_count || 0} usuario(s)`,
            original: group
        }))
    ]

    const selectedItems = items.filter(item => isSelected(item.type, item.id))

    return (
        <div className="space-y-3">
            {/* RESPONSABLES SELECCIONADOS */}
            {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedItems.map(item => {
                        const key = `${item.type}:${item.id}`
                        const isGroup = item.type === "GROUP"

                        return (
                            <div
                                key={key}
                                className={`
                                    flex items-center gap-2 rounded-full border
                                    px-3 py-1.5 text-xs
                                    ${
                                        isGroup
                                            ? "border-violet-200 bg-violet-50 text-violet-700"
                                            : "border-blue-200 bg-blue-50 text-blue-700"
                                    }
                                `}
                            >
                                <div
                                    className={`
                                        flex h-5 w-5 items-center justify-center
                                        rounded-full text-[9px] font-semibold
                                        ${isGroup
                                            ? "bg-violet-100"
                                            : "bg-blue-100"
                                        }
                                    `}
                                >
                                    {isGroup
                                        ? <UsersRound className="h-3 w-3" />
                                        : item.name?.slice(0, 2).toUpperCase()
                                    }
                                </div>
                                <span>{item.name}</span>
                                {isGroup && (
                                    <span className="opacity-60">
                                        ({item.original.member_count || 0})
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => toggle(item.type, item.id)}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* SELECTOR */}
            <Popover
                open={open}
                onOpenChange={setOpen}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start font-normal"
                    >
                        <Search className="mr-2 h-4 w-4 text-slate-400" />
                        Buscar y añadir responsable...
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[400px] p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder="Buscar usuario o grupo..." />
                        <CommandList>
                            <CommandEmpty>
                                No se encontraron responsables.
                            </CommandEmpty>
                            {/* USUARIOS */}
                            {users.length > 0 && (
                                <CommandGroup heading="Usuarios">
                                    {users.map(user => {
                                        const id = String(user.id || user.user_id || user._id)
                                        const checked = isSelected("USER", id)
                                        const name = user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username

                                        return (
                                            <CommandItem
                                                key={`USER:${id}`}
                                                value={`
                                                    USER
                                                    ${name}
                                                    ${user.email || ""}
                                                    ${user.username || ""}
                                                `}
                                                onSelect={() => toggle("USER", id)}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    className="mr-3"
                                                />
                                                <div className="flex min-w-0 flex-col">
                                                    <div className="text-xs font-medium">
                                                        {name}
                                                    </div>
                                                    <div className="truncate text-xs text-slate-400">
                                                        {user.email || user.username || id}
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            )}

                            {/* GRUPOS */}
                            {groups.length > 0 && (
                                <CommandGroup heading="Grupos">
                                    {groups.map(group => {
                                        const id = String(group.id || group.group_id || group._id)
                                        const checked = isSelected("GROUP", id)
                                        const name = group.name || group.group_name || group.code

                                        return (
                                            <CommandItem
                                                key={`GROUP:${id}`}
                                                value={`
                                                    GROUP
                                                    ${name}
                                                    ${group.code || ""}
                                                `}
                                                onSelect={() => toggle("GROUP", id)}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    className="mr-3"
                                                />
                                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                                                    <UsersRound className="h-4 w-4 text-violet-600" />
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <div className="text-xs font-medium">
                                                        {name}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {group.member_count || 0} usuario(s)
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}


function TransitionHelp({ transitionType }) {
    const descriptions = {
        STATE: "Solo cambia el estado. La subtarea continúa abierta y editable.",
        OPEN_SUBTASK: "Apertura otra subtarea. La subtarea actual permanece abierta.",
        WAIT_VALIDATION: "Mantiene la subtarea abierta, pero queda a la espera de validación.",
        REOPEN_SUBTASK: "Vuelve a aperturar una subtarea relacionada para que pueda ser trabajada nuevamente.",
        CLOSE_SUBTASK: "Completa únicamente la subtarea actual.",
        CLOSE_RELATED_SUBTASK: "Completa la subtarea relacionada. La subtarea actual continúa abierta.",
        CLOSE_AND_OPEN_SUBTASK: "Completa la subtarea actual y apertura la subtarea relacionada.",
        CLOSE_TASK: "Completa la TASK y permite continuar el Workflow."
    }

    return (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-[#526b87]">
            {descriptions[transitionType]}
        </div>
    )
}


function normalizeAssignment(assignment = {}) {
    const userIds = (assignment.user_ids || []).map(String)

    const responsibles =
        assignment.responsibles?.length > 0
            ? assignment.responsibles.map(item => ({
                type: item.type,
                id: String(item.id)
            }))
            : userIds.map(id => ({
                type: "USER",
                id
            }))

    return {
        ...assignment,
        mode: assignment.mode || "UNASSIGNED",
        user_ids: userIds,
        responsibles,
        provider_source_field: assignment.provider_source_field || ""
    }
}


function SlaEditor({
    taskId,
    subtask,
    updateSubtask,
    reload
}) {

    const [form, setForm] = useState({
        days: Number(subtask.sla?.days || 0),
        business_days: subtask.sla?.business_days !== false
    })

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setForm({
            days: Number(subtask.sla?.days || 0),
            business_days: subtask.sla?.business_days !== false
        })
    }, [subtask])

    const save =
        async() => {
            try {
                const days = Number(form.days || 0)
                if (Number.isNaN(days) || days < 0) {
                    return toast.error("El SLA debe ser mayor o igual a 0")
                }

                setSaving(true)

                await updateSubtask(
                    taskId,
                    subtask.subtask_key,
                    {
                        sla: {
                            days,
                            business_days: form.business_days
                        }
                    }
                )
                await reload()
                toast.success("SLA actualizado")
            } catch (error) {
                toast.error(
                    error?.response?.data?.message ||
                    error.message ||
                    "No se pudo guardar"
                )
            } finally {
                setSaving(false)
            }
        }

    return (
        <div className="space-y-5">
            <div className="max-w-xl rounded-xl border border-slate-200 p-5">
                <div className="mb-5">
                    <div className="font-semibold text-[#31577e]">
                        SLA de la Subtarea
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                        Define el tiempo esperado para completar esta Subtarea.
                        El SLA general de la TASK se calcula automáticamente
                        considerando únicamente las Subtareas bloqueantes.
                    </p>
                </div>
                <div className="space-y-4">
                    {/* DAYS */}
                    <div className="space-y-2">
                        <Label>
                            Días
                        </Label>
                        <Input
                            type="number"
                            min="0"
                            step="1"
                            value={form.days}
                            onChange={
                                event => setForm(
                                    prev => ({
                                        ...prev,
                                        days: event.target.value
                                    })
                                )
                            }
                        />
                    </div>

                    {/* BUSINESS DAYS */}
                    <label className="flex items-start gap-3 rounded-lg border bg-slate-50/60 p-4">
                        <Checkbox
                            checked={form.business_days}
                            onCheckedChange={
                                value => setForm(
                                    prev => ({
                                        ...prev,
                                        business_days: !!value
                                    })
                                )
                            }
                            className="mt-0.5"
                        />
                        <div>
                            <div className="text-sm font-medium text-slate-700">
                                Considerar días hábiles
                            </div>
                            <div className="mt-1 text-xs leading-5 text-slate-400">
                                Si está activo, el cálculo excluye sábados y domingos.
                                Si está desactivado, se consideran días calendario.
                            </div>
                        </div>
                    </label>
                    {/* NON BLOCKING WARNING */}
                    {subtask.blocking === false && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            Esta Subtarea es no bloqueante. Su SLA se conserva
                            como referencia, pero no suma al SLA general de la TASK.
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end">
                <Button
                    onClick={save}
                    disabled={saving}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar SLA
                </Button>
            </div>
        </div>
    )
}


function AssignmentEditor({ subtask, task, users, groupUsers, onSave }) {
    const [assignment, setAssignment] = useState(
        normalizeAssignment(subtask.assignment)
    )

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setAssignment(
            normalizeAssignment(subtask.assignment)
        )
    }, [subtask])

    const allFields = useMemo(() => {
        const result = []
        for (const st of task?.subtasks || []) {
            for (const field of st.fields || []) {
                result.push({
                    value: field.field_key,
                    label: `${st.name} / ${field.label}`
                })
            }
        }
        return result
    }, [task])


    const save = async() => {
        try {
            setSaving(true)

            let payload = {
                ...assignment
            }

            if (assignment.mode === "FIXED_USERS") {
                const responsibles = assignment.responsibles || []
                const resolvedUserIds = resolveResponsibleUserIds(responsibles, groupUsers.groups || [])

                payload = {
                    ...assignment,
                    responsibles,
                    user_ids: resolvedUserIds,
                    provider_source_field: ""
                }
            }

            if (assignment.mode === "DYNAMIC_PROVIDER") {
                payload = {
                    ...assignment,
                    responsibles: [],
                    user_ids: []
                }
            }

            if (assignment.mode === "UNASSIGNED") {
                payload = {
                    ...assignment,
                    responsibles: [],
                    user_ids: [],
                    provider_source_field: ""
                }
            }

            await onSave(payload)
            toast.success("Responsables actualizados")
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo actualizar"
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                {ASSIGNMENT_MODES.map(mode => {
                    const active = assignment.mode === mode.value

                    return (
                        <button
                            key={mode.value}
                            type="button"
                            onClick={() => setAssignment(prev => ({ ...prev, mode: mode.value }))}
                            className={[
                                "rounded-xl border p-4 text-left transition",
                                active ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                {mode.value === "FIXED_USERS" && <Users className="h-4 w-4" />}
                                {mode.value === "DYNAMIC_PROVIDER" && <Database className="h-4 w-4" />}
                                {mode.value === "UNASSIGNED" && <UserRound className="h-4 w-4" />}
                                {mode.label}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-400">{mode.description}</p>
                        </button>
                    )
                })}
            </div>

            {assignment.mode === "FIXED_USERS" && (
                <div className="rounded-xl border p-4">
                    <Label className="mb-3 block">Usuarios responsables</Label>
                    {/* <UserMultiSelect
                        users={users}
                        selected={assignment.user_ids || []}
                        onChange={ids => setAssignment(prev => ({ ...prev, user_ids: ids }))}
                    /> */}
                    <ResponsibleMultiSelect
                        users={groupUsers.users || []}
                        groups={groupUsers.groups || []}
                        selected={assignment.responsibles || []}
                        onChange={responsibles => {
                            const resolvedUserIds =
                                resolveResponsibleUserIds(
                                    responsibles,
                                    groupUsers.groups || []
                                )

                            setAssignment(prev => ({
                                ...prev,
                                responsibles,
                                user_ids: resolvedUserIds
                            }))
                        }}
                    />
                </div>
            )}

            {assignment.mode === "DYNAMIC_PROVIDER" && (
                <div className="rounded-xl border p-4">
                    <Label>Campo origen del proveedor</Label>
                    <p className="mb-3 mt-1 text-xs text-slate-400">
                        Al ejecutar el flujo se toma el valor del campo, se resuelve el proveedor y luego sus usuarios SQL.
                    </p>

                    <Select
                        value={assignment.provider_source_field || ""}
                        onValueChange={value => setAssignment(prev => ({ ...prev, provider_source_field: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar campo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allFields.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {allFields.length === 0 && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            La Tarea todavía no tiene campos configurados. Puedes guardar la Subtarea sin proveedor dinámico y configurarlo posteriormente.
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={save} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar responsables
                </Button>
            </div>
        </div>
    )
}

function StatesEditor({ taskId, task, subtask, methods, reload }) {
    const [dialog, setDialog] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(getInitialState())
    const [saving, setSaving] = useState(false)

    const updateOption = (index, value) => {
        setForm(prev => ({
            ...prev,
            option_list_options: prev.option_list_options.map((item, i) => i === index ? value : item)
        }))
    }

    const addOption = () => {
        setForm(prev => ({
            ...prev,
            option_list_options: [...prev.option_list_options, ""]
        }))
    }

    const removeOption = index => {
        setForm(prev => ({
            ...prev,
            option_list_options: prev.option_list_options.filter((_, i) => i !== index)
        }))
    }

    const otherSubtasks = (task.subtasks || []).filter(x => x.subtask_key !== subtask.subtask_key)
    
    const blockingSubtasks = otherSubtasks.filter(
        item => item.blocking !== false
    )

    const selectedTargetSubtask = (task.subtasks || []).find(
        item => item.subtask_key === form.target_subtask_key
    )

    const targetStates = selectedTargetSubtask?.states || []

    const toggleTargetSubtask = subtaskKey => {
        setForm(prev => {
            const selected = prev.target_subtask_keys || []

            return {
                ...prev,
                target_subtask_keys: selected.includes(subtaskKey)
                    ? selected.filter(key => key !== subtaskKey)
                    : [...selected, subtaskKey]
            }
        })
    }

    const toggleNonBlockingSubtask = subtaskKey => {
        setForm(prev => {
            const selected = prev.set_non_blocking_subtask_keys || []

            return {
                ...prev,
                set_non_blocking_subtask_keys:
                    selected.includes(subtaskKey)
                        ? selected.filter(key => key !== subtaskKey)
                        : [...selected, subtaskKey]
            }
        })
    }

    const transitionNeedsSubtask = type => {
        return [
            "OPEN_SUBTASK",
            "REOPEN_SUBTASK",
            "CLOSE_RELATED_SUBTASK",
            "CLOSE_AND_OPEN_SUBTASK"
        ].includes(type)
    }

    const transitionNeedMultipleSubtasks = type => {
        return [
            "CLOSE_CURRENT_AND_SELECT_SUBTASKS"
        ].includes(type)
    }

    const transitionAllowsTargetState = type => {
        return [
            "OPEN_SUBTASK",
            "REOPEN_SUBTASK",
            "CLOSE_RELATED_SUBTASK",
            "CLOSE_AND_OPEN_SUBTASK"
        ].includes(type)
    }

    const getTransitionLabel = type => {
        return (
            TRANSITION_TYPES.find(
                item => item.value === type
            )?.label || "Mantener subtarea abierta"
        )
    }

    const getSubtaskName = subtaskKey => {
        if (!subtaskKey) return "-"

        const item = (task.subtasks || []).find(
            st => st.subtask_key === subtaskKey
        )

        return item?.name || subtaskKey
    }

    const getSubtaskNames = keys => {
        if (!keys?.length) return "-"

        return keys
            .map(key => getSubtaskName(key))
            .join(", ")
    }

    const getTargetStateName = (targetSubtaskKey, targetStateKey) => {
        if (!targetSubtaskKey || !targetStateKey) return "-"

        const targetSubtask = (task.subtasks || []).find(
            st => st.subtask_key === targetSubtaskKey
        )

        const state = (targetSubtask?.states || []).find(
            st => st.state_key === targetStateKey
        )

        return state?.label || targetStateKey
    }

    const transitionAllowsNonBlockingOverride = type => {
        return [
            "CLOSE_AND_OPEN_SUBTASK"
        ].includes(type)
    }


    const openNew = () => {
        setEditing(null)
        setForm(getInitialState())
        setDialog(true)
    }

    const openEdit = state => {
        setEditing(state)
        setForm({
            label: state.label || "",
            transition_type: state.transition?.transition_type || "STATE",
            target_subtask_key: state.transition?.target_subtask_key || "",
            target_subtask_keys: state.transition?.target_subtask_keys || [],
            target_state_key: state.transition?.target_state_key || "",
            set_non_blocking_subtask_keys: state.transition?.set_non_blocking_subtask_keys || [],
            requires_comment: !!state.transition?.requires_comment,
            option_list_enabled: state.option_list?.enabled === true,
            option_list_label: state.option_list?.label || "Tipo de Issue",
            option_list_options: state.option_list?.options?.length ? state.option_list.options : [""]
        })
        setDialog(true)
    }

    const handleTransitionChange = value => {
        setForm(prev => ({
            ...prev,
            transition_type: value,
            target_subtask_key:
                transitionNeedsSubtask(value)
                    ? prev.target_subtask_key
                    : "",
            target_subtask_keys:
                transitionNeedMultipleSubtasks(value)
                    ? prev.target_subtask_keys
                    : [],
            set_non_blocking_subtask_keys:
                transitionAllowsNonBlockingOverride(value)
                    ? prev.set_non_blocking_subtask_keys
                    : [],
            target_state_key:
                transitionAllowsTargetState(value)
                    ? prev.target_state_key
                    : ""
        }))
    }

    const handleTargetSubtaskChange = value => {
        setForm(prev => ({
            ...prev,
            target_subtask_key: value,
            target_state_key: ""
        }))
    }


    const save = async() => {
        try {
            if (!form.label.trim()) return toast.error("Ingresar nombre del estado")

            if (transitionNeedsSubtask(form.transition_type) && !form.target_subtask_key) {
                return toast.error("Seleccionar la subtarea relacionada")
            }

            if (
                transitionNeedMultipleSubtasks(form.transition_type) &&
                !form.target_subtask_keys.length
            ) {
                return toast.error("Seleccionar al menos una subtarea a cerrar")
            }

            setSaving(true)

            const payload = {
                label: form.label.trim(),
                option_list: {
                    enabled: form.option_list_enabled,
                    label: form.option_list_label.trim() || "Issue",
                    options: form.option_list_enabled
                        ? form.option_list_options.map(item => item.trim()).filter(Boolean)
                        : []
                },
                transition: {
                    transition_type: form.transition_type,
                    target_subtask_key: transitionNeedsSubtask(form.transition_type)
                        ? form.target_subtask_key
                        : null,
                    target_subtask_keys: transitionNeedMultipleSubtasks(form.transition_type)
                        ? form.target_subtask_keys
                        : null,
                    set_non_blocking_subtask_keys: transitionAllowsNonBlockingOverride(form.transition_type)
                        ? form.set_non_blocking_subtask_keys || []
                        : [],
                    target_state_key: transitionAllowsTargetState(form.transition_type)
                        ? form.target_state_key || null
                        : null,
                    requires_comment: form.requires_comment
                }
            }

            if (editing) await methods.updateState(taskId, subtask.subtask_key, editing.state_key, payload)
            else await methods.addState(taskId, subtask.subtask_key, { ...payload, state_key: makeKey(form.label) })

            setDialog(false)
            await reload()
            toast.success(editing ? "Estado actualizado" : "Estado creado")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo guardar")
        } finally {
            setSaving(false)
        }
    }

    const remove = async state => {
        if (!window.confirm(`¿Eliminar el estado "${state.label}"?`)) return
        try {
            await methods.removeState(taskId, subtask.subtask_key, state.state_key)
            await reload()
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo eliminar")
        }
    }

    return (
        <>
            <div className="overflow-hidden rounded-xl border">
                <div className="grid grid-cols-[55px_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_50px] bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    <div>#</div>
                    <div>Estado</div>
                    <div>Acción</div>
                    <div>Transición</div>
                    <div>Destino</div>
                    <div>Comentario</div>
                    <div />
                </div>

                {/* BODY */}
                {(subtask.states || []).length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">No hay estados configurados.</div>
                ) : (
                    [...(subtask.states || [])].sort((a, b) => (a.order || 0) - (b.order || 0)).map((state, index) => {

                        const transitionType = state.transition?.transition_type || "STATE"
                        const targetSubtaskKey = state.transition?.target_subtask_key
                        const targetStateKey = state.transition?.target_state_key

                        return (
                            <div key={state.state_key} className="grid grid-cols-[55px_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_50px] items-center border-t px-3 py-3 text-xs">
                                <div className="text-slate-400">
                                    {index + 1}
                                </div>
                                <div className="font-semibold text-[#31577e]">
                                    {state.label}
                                </div>
                                
                                {/* Transition */}
                                <div className="text-slate-600">
                                    {getTransitionLabel(transitionType)}
                                </div>

                                {/* Subtask */}
                                <div className="text-slate-600">
                                    {transitionType === "CLOSE_CURRENT_AND_SELECT_SUBTASKS"
                                        ? getSubtaskNames(state.transition?.target_subtask_keys)
                                        : getSubtaskName(targetSubtaskKey)}
                                </div>
                                {/* Estado destino */}
                                <div className="text-slate-600">
                                    {getTargetStateName(targetSubtaskKey, targetStateKey)}
                                </div>

                                {/* Requires comment */}
                                <div>
                                    {state.transition
                                        ?.requires_comment ? (
                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                            Sí
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-400">
                                            No
                                        </span>
                                    )}
                                </div>
     
                                {/* <div>{state.transition?.target_subtask_key || state.transition?.open_non_blocking_subtask_key || "-"}</div> */}
                                

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(state)}>
                                            <Pencil className="mr-2 h-4 w-4" />Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => remove(state)}>
                                            <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )
                    })
                )}
            </div>

            <Button variant="outline" className="mt-3" onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Estado
            </Button>

            <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar estado" : "Nuevo estado"}</DialogTitle>
                        <DialogDescription>
                            El estado define qué ocurre cuando el usuario ejecuta la acción desde esta Subtarea.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Estado *</Label>
                            <Input placeholder="Ej. En proceso" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
                        </div>

                        <div className="space-y-2">
                            <Label>Al seleccionar este estado</Label>
                            <Select
                                value={form.transition_type}
                                onValueChange={handleTransitionChange}
                            >
                                <SelectTrigger
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRANSITION_TYPES.map(
                                        item => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {transitionNeedMultipleSubtasks(form.transition_type) && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Subtareas a cerrar *</Label>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between font-normal">
                                            <span className="truncate">
                                                {form.target_subtask_keys.length
                                                    ? `${form.target_subtask_keys.length} subtarea(s) seleccionada(s)`
                                                    : "Seleccionar subtareas"}
                                            </span>

                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-[360px] p-2" align="start">
                                        <div className="max-h-64 space-y-1 overflow-y-auto">
                                            {otherSubtasks.map(item => {
                                                const checked = form.target_subtask_keys.includes(item.subtask_key)

                                                return (
                                                    <button
                                                        key={item.subtask_key}
                                                        type="button"
                                                        onClick={() => toggleTargetSubtask(item.subtask_key)}
                                                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-50"
                                                    >
                                                        <Checkbox checked={checked} className="pointer-events-none" />

                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm text-slate-700">
                                                                {item.name}
                                                            </div>

                                                            <div className="text-[10px] text-slate-400">
                                                                {item.blocking === false ? "No bloqueante" : "Bloqueante"}
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {transitionNeedsSubtask(form.transition_type) && (
                            // <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <>
                                <div className="space-y-2">
                                    <Label>
                                        Subtarea relacionada *
                                    </Label>
                                    <Select
                                        value={form.target_subtask_key}
                                        onValueChange={handleTargetSubtaskChange}
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Seleccionar subtarea..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {otherSubtasks.map(
                                                item => (
                                                    <SelectItem
                                                        key={item.subtask_key}
                                                        value={item.subtask_key}
                                                    >
                                                        {item.name}
                                                        {item.blocking === false && " · No bloqueante"}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>
                                        Estado que recibirá
                                    </Label>
                                    <Select
                                        value={form.target_state_key || "AUTO"}
                                        onValueChange={value =>
                                            setForm(
                                                prev => ({
                                                    ...prev,
                                                    target_state_key: value === "AUTO"
                                                        ? ""
                                                        : value
                                                })
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AUTO">
                                                Automático
                                            </SelectItem>
                                            {targetStates.map(
                                                state => (
                                                    <SelectItem
                                                        key={state.state_key}
                                                        value={state.state_key}
                                                    >
                                                        {state.label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                            // </div>
                            
                        )}

                        {transitionAllowsNonBlockingOverride(form.transition_type) && blockingSubtasks.length > 0 && (
                            <div className="space-y-2">
                                <Label>
                                    Convertir a no bloqueante
                                </Label>

                                <div className="rounded-lg border border-slate-200 p-3">
                                    <div className="mb-3 text-xs text-slate-400">
                                        Opcional. Las Subtareas seleccionadas dejarán de bloquear
                                        el avance únicamente para la instancia del sitio que ejecute
                                        este estado.
                                    </div>

                                    <div className="space-y-2">
                                        {blockingSubtasks.map(item => {
                                            const checked = (form.set_non_blocking_subtask_keys || [])
                                                    .includes(item.subtask_key)

                                            return (
                                                <label
                                                    key={item.subtask_key}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={() =>
                                                            toggleNonBlockingSubtask(
                                                                item.subtask_key
                                                            )
                                                        }
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-slate-700">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            Actualmente bloqueante
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {transitionAllowsNonBlockingOverride(
                            form.transition_type
                        ) && blockingSubtasks.length === 0 && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                Esta TASK no tiene otras Subtareas bloqueantes configuradas.
                            </div>
                        )}

                        {/* EXPLANATION */}
                        <TransitionHelp
                            transitionType={form.transition_type}
                        />

                        <div className="flex items-start gap-6">
                            <label className="flex cursor-pointer items-start gap-3">
                                <Checkbox
                                    checked={form.requires_comment}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            requires_comment: checked === true
                                        }))
                                    }
                                />
                                <div>
                                    <div className="text-sm font-medium">Comentario obligatorio</div>
                                    <div className="text-xs text-slate-400">
                                        Útil para observaciones, rechazos, devoluciones o excepciones.
                                    </div>
                                </div>
                            </label>

                            <label className="flex cursor-pointer items-start gap-3">
                                <Checkbox
                                    checked={form.option_list_enabled}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            option_list_enabled: checked === true
                                        }))
                                    }
                                />
                                <div>
                                    <div className="text-sm font-medium">Lista de opciones</div>
                                    <div className="text-xs text-slate-400">
                                        Solicita seleccionar una opción al ejecutar este estado.
                                    </div>
                                </div>
                            </label>
                        </div>

                        {form.option_list_enabled && (
                            <div className="rounded-lg border border-slate-200 p-4">
                                <div className="mb-3">
                                    <Label>Nombre del selector</Label>
                                    <Input
                                        className="mt-2"
                                        value={form.option_list_label}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                option_list_label: e.target.value
                                            }))
                                        }
                                        placeholder="Ej. Tipo de Issue"
                                    />
                                </div>

                                <Label>Opciones</Label>

                                <div className="mt-2 space-y-2">
                                    {form.option_list_options.map((option, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={option}
                                                onChange={e => updateOption(index, e.target.value)}
                                                placeholder={`Opción ${index + 1}`}
                                            />

                                            {form.option_list_options.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => removeOption(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-3"
                                    onClick={addOption}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Añadir opción
                                </Button>
                            </div>
                        )}
                                    
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
                        <Button onClick={save} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// Editor de CAMPOS
function FieldsEditor({ taskId, task, subtask, methods, reload }) {
    const [dialog, setDialog] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(getInitialField())
    const [saving, setSaving] = useState(false)

    const openNew = () => {
        setEditing(null)
        setForm(getInitialField())
        setDialog(true)
    }

    const openEdit = field => {
        setEditing(field)
        setForm({
            label: field.label || "",
            type: field.type || "TEXT",
            required: !!field.required,
            editable: field.editable !== false,
            show_in_next_task: field.show_in_next_task === true,
            default_value: field.default_value || "",
            options: (field.options || []).join("\n"),
            system_binding: field.system_binding || "NONE"
        })
        setDialog(true)
    }


    const findResponsibleForecastField = () => {

        for (const currentSubtask of task?.subtasks || []) {

            for (const field of currentSubtask.fields || []) {

                if (field.system_binding !== "TASK_RESPONSIBLE_FORECAST") continue

                /*
                 * Si estamos editando exactamente
                 * este mismo campo, no cuenta
                 * como duplicado.
                 */
                const isCurrentField =
                    editing &&
                    currentSubtask.subtask_key === subtask.subtask_key &&
                    field.field_key === editing.field_key


                if (isCurrentField) continue

                return {
                    subtask: currentSubtask,
                    field
                }
            }
        }
        return null
    }


    const save = async() => {
        try {
            if (!form.label.trim()) return toast.error("Ingresar nombre del campo")

            // validar system_binding
            if (form.system_binding === "TASK_RESPONSIBLE_FORECAST") {

                if (!["DATE", "DATETIME"].includes(form.type)) {
                    return toast.error(
                        "El Forecast Responsable debe ser un campo DATE o DATETIME"
                    )
                }

                const existing = findResponsibleForecastField()

                if (existing) {
                    return toast.error(
                        `La TASK ya tiene un Forecast Responsable configurado en "${existing.subtask.name}" → "${existing.field.label}"`
                    )
                }
            }

            setSaving(true)

            const payload = {
                label: form.label.trim(),
                type: form.type,
                required: form.required,
                editable: form.editable,
                show_in_next_task: form.show_in_next_task,
                default_value: form.default_value || null,
                options: ["SELECT", "MULTISELECT"].includes(form.type)
                    ? form.options.split("\n").map(x => x.trim()).filter(Boolean)
                    : [],
                system_binding: form.system_binding || "NONE"
            }

            if (editing) await methods.updateField(taskId, subtask.subtask_key, editing.field_key, payload)
            else await methods.addField(taskId, subtask.subtask_key, { ...payload, field_key: makeKey(form.label) })

            setDialog(false)
            await reload()
            toast.success(editing ? "Campo actualizado" : "Campo creado")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo guardar")
        } finally {
            setSaving(false)
        }
    }

    const remove = async field => {
        if (!window.confirm(`¿Eliminar el campo "${field.label}"?`)) return

        try {
            await methods.removeField(taskId, subtask.subtask_key, field.field_key)
            await reload()
            toast.success("Campo eliminado")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo eliminar")
        }
    }

    return (
        <>
            <div className="overflow-x-auto rounded-xl border">
                <div className="grid grid-cols-[minmax(250px,1fr)_130px_85px_85px_110px_140px_48px] bg-slate-50 px-3 py-3 text-xs font-medium text-slate-500">
                    <div>Campo</div>
                    <div>Tipo</div>
                    <div>Req.</div>
                    <div>Editable</div>
                    <div>Entregable</div>
                    <div>Uso</div>
                    <div />
                </div>

                {(subtask.fields || []).length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">No hay campos configurados.</div>
                ) : (
                    (subtask.fields || []).map(field => (
                        <div key={field.field_key} className="grid grid-cols-[minmax(250px,1fr)_130px_85px_85px_110px_140px_48px] items-center border-t px-3 py-3 text-xs">
                            <div className="font-semibold text-[#31577e]">{field.label}</div>
                            <div className="text-slate-500">{field.type}</div>
                            <div>{field.required ? "Sí" : "No"}</div>
                            <div>{field.editable !== false ? "Sí" : "No"}</div>
                            <div>{field.show_in_next_task ? (
                                    <Badge
                                        variant="outline"
                                        className="border-blue-200 bg-blue-50 text-blue-700"
                                    >
                                        Sí
                                    </Badge>
                                ) : (
                                    <span className="text-slate-400">
                                        No
                                    </span>
                                )}
                            </div>
                            <div>{field.system_binding === "TASK_RESPONSIBLE_FORECAST" ? (
                                    <Badge
                                        variant="outline"
                                        className="border-violet-200 bg-violet-50 text-[10px] text-violet-700"
                                    >
                                        FCST Responsable
                                    </Badge>
                                ) : (
                                    <span className="text-slate-400">
                                        Normal
                                    </span>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEdit(field)}>
                                        <Pencil className="mr-2 h-4 w-4" />Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => remove(field)}>
                                        <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </div>

            <Button variant="outline" className="mt-3" onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Campo personalizado
            </Button>

            <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar campo" : "Nuevo campo"}</DialogTitle>
                        <DialogDescription>Configura el campo que deberá completar el usuario durante la ejecución.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Nombre *</Label>
                            <Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select 
                                value={form.type} 
                                onValueChange={
                                    value =>
                                        setForm(
                                            previous => ({
                                                ...previous,
                                                type: value,
                                                system_binding: ["DATE", "DATETIME"].includes(value)
                                                    ? previous.system_binding
                                                    : "NONE"
                                            })
                                        )
                                }
                            >
                                <SelectTrigger
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            
                        </div>

                        <div className="space-y-2">
                            <Label>Valor por defecto</Label>
                            <Input value={form.default_value} onChange={e => setForm(p => ({ ...p, default_value: e.target.value }))} />
                        </div>

                        {["DATE", "DATETIME"].includes(form.type) && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Uso del campo</Label>
                                <Select
                                    value={form.system_binding || "NONE"}
                                    onValueChange={
                                        value =>
                                            setForm(
                                                previous => ({
                                                    ...previous,
                                                    system_binding: value
                                                })
                                            )
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_SYSTEM_BINDINGS.map(item => (
                                                <SelectItem
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>

                                {form.system_binding === "TASK_RESPONSIBLE_FORECAST" && (
                                    <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
                                        <div className="text-xs font-medium text-blue-700">
                                            Forecast Responsable
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-blue-600/80">
                                            El valor ingresado en este campo actualizará automáticamente la fecha Forecast Responsable de la TASK.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {["SELECT", "MULTISELECT"].includes(form.type) && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Opciones</Label>
                                <Textarea
                                    rows={5}
                                    placeholder={"Greenfield\nRooftop\nIndoor"}
                                    value={form.options}
                                    onChange={e => setForm(p => ({ ...p, options: e.target.value }))}
                                />
                                <p className="text-xs text-slate-400">Una opción por línea.</p>
                            </div>
                        )}

                        <label className="flex items-center gap-3">
                            <Checkbox checked={form.required} onCheckedChange={value => setForm(p => ({ ...p, required: !!value }))} />
                            <span className="text-sm">Obligatorio</span>
                        </label>

                        <label className="flex items-center gap-3">
                            <Checkbox checked={form.editable} onCheckedChange={value => setForm(p => ({ ...p, editable: !!value }))} />
                            <span className="text-sm">Editable</span>
                        </label>

                        <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 md:col-span-2">
                            <Checkbox
                                checked={form.show_in_next_task}
                                onCheckedChange={value =>
                                    setForm(prev => ({
                                        ...prev,
                                        show_in_next_task: !!value
                                    }))
                                }
                                className="mt-0.5"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-700">
                                    Mostrar como información en la siguiente TASK
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                    El valor completado en este campo podrá visualizarse
                                    en la sección Información de la siguiente tarea.
                                </div>
                            </div>
                        </label>



                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
                        <Button onClick={save} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function BehaviorEditor({ taskId, subtask, updateSubtask, reload }) {
    const [form, setForm] = useState({
        blocking: subtask.blocking !== false,
        start_policy: subtask.start_policy || "ON_TRANSITION"
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setForm({
            blocking: subtask.blocking !== false,
            start_policy: subtask.start_policy || "ON_TRANSITION"
        })
    }, [subtask])

    const save = async() => {
        try {
            setSaving(true)
            await updateSubtask(taskId, subtask.subtask_key, form)
            await reload()
            toast.success("Comportamiento actualizado")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo guardar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, blocking: true }))}
                    className={`rounded-xl border p-5 text-left ${form.blocking ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}
                >
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <LockKeyhole className="h-4 w-4" />
                        Bloqueante
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        La Tarea no puede finalizar mientras esta Subtarea no haya concluido.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, blocking: false }))}
                    className={`rounded-xl border p-5 text-left ${!form.blocking ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}
                >
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <GitBranch className="h-4 w-4" />
                        No bloqueante
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Puede continuar abierta aunque la Tarea avance. Ideal para Entregables.
                    </p>
                </button>
            </div>

            <div className="max-w-xl space-y-2">
                <Label>Política de apertura</Label>
                <Select value={form.start_policy} onValueChange={value => setForm(p => ({ ...p, start_policy: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {START_POLICIES.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end">
                <Button onClick={save} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar comportamiento
                </Button>
            </div>
        </div>
    )
}


function SubtaskCard({ task, subtask, taskId, users, groupUsers, methods, reload }) {
    const [tab, setTab] = useState("FIELDS")
    const [editingName, setEditingName] = useState(false)
    const [name, setName] = useState(subtask.name)

    const saveName = async() => {
        if (!name.trim()) return
        await methods.updateSubtask(taskId, subtask.subtask_key, { name: name.trim() })
        setEditingName(false)
        await reload()
    }

    return (
        <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="flex items-center justify-between border-b bg-slate-50/50 px-5 py-4">
                <div>
                    {editingName ? (
                        <div className="flex items-center gap-2">
                            <Input className="h-8 w-[280px]" value={name} onChange={e => setName(e.target.value)} />
                            <Button size="sm" onClick={saveName}>Guardar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancelar</Button>
                        </div>
                    ) : (
                        <button type="button" className="text-left" onClick={() => setEditingName(true)}>
                            <div className="font-semibold text-[#31577e]">{subtask.name}</div>
                            {/* <div className="mt-1 text-[10px] text-slate-400">clic para editar Subtarea</div> */}
                        </button>
                    )}

                    <div className="mt-1 text-xs text-slate-400">
                        {subtask.assignment?.mode === "FIXED_USERS" && `${(subtask.assignment.responsibles?.length || subtask.assignment.user_ids?.length || 0)} responsable(s) por defecto`}
                        {subtask.assignment?.mode === "DYNAMIC_PROVIDER" && "Responsable dinámico por proveedor"}
                        {(!subtask.assignment?.mode || subtask.assignment?.mode === "UNASSIGNED") && "Sin asignación inicial"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatusBadge type={subtask.blocking !== false ? "blocking" : "nonblocking"}>
                        {subtask.blocking !== false ? "BLOQUEANTE" : "NO BLOQUEANTE"}
                    </StatusBadge>

                    <Badge
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-500"
                    >
                        SLA {subtask.sla?.days || 0} días
                        {subtask.sla?.business_days !== false
                            ? " hábiles"
                            : " calendario"
                        }
                    </Badge>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingName(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar nombre
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={async() => {
                                    if (!window.confirm(`¿Eliminar "${subtask.name}"?`)) return
                                    await methods.removeSubtask(taskId, subtask.subtask_key)
                                    await reload()
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="p-4">
                <div className="mb-5 inline-flex rounded-lg border bg-slate-50 p-1">
                    {SUBTASK_TABS.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setTab(item.key)}
                            className={[
                                "rounded-md px-3 py-2 text-xs transition",
                                tab === item.key ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-500"
                            ].join(" ")}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === "FIELDS" && <FieldsEditor 
                    taskId={taskId} 
                    task={task}
                    subtask={subtask} 
                    methods={methods} 
                    reload={reload} 
                />}

                {tab === "RESPONSIBLES" && (
                    <AssignmentEditor
                        subtask={subtask}
                        task={task}
                        users={users}
                        groupUsers={groupUsers}
                        onSave={assignment => methods.updateSubtask(taskId, subtask.subtask_key, { assignment }).then(reload)}
                    />
                )}

                {tab === "STATES" && (
                    <StatesEditor taskId={taskId} task={task} subtask={subtask} methods={methods} reload={reload} />
                )}

                {tab === "SLA" && (
                    <SlaEditor taskId={taskId} subtask={subtask} updateSubtask={methods.updateSubtask} reload={reload} />
                )}

                {tab === "BEHAVIOR" && (
                    <BehaviorEditor taskId={taskId} subtask={subtask} updateSubtask={methods.updateSubtask} reload={reload} />
                )}
            </div>
        </div>
    )
}

export default function TaskDetail() {

    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const {
        getTask,
        updateTask,
        addSubtask,
        updateSubtask,
        removeSubtask,
        updateSubtasksOrder,
        addField,
        updateField,
        removeField,
        addState,
        updateState,
        removeState
    } = useTasks()

    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [tab, setTab] = useState("GENERAL")
    const [subtaskDialog, setSubtaskDialog] = useState(false)
    const [subtaskForm, setSubtaskForm] = useState(getInitialSubtask())

    /*
     * REEMPLAZAR ESTE ARRAY POR TU GET DE USUARIOS SQL.
     * La vista ya espera: { id, name, email, role }
     */
    // const [users] = useState([])
    const { users } = useUsers()
    const { groupUsers } = useResponsibleUsers()
    
    console.log("GU", groupUsers)

    const [form, setForm] = useState({
        name: "",
        description: "",
        // sla_days: 0,
        // business_days: true
    })

    const workflowLabel =
        location.state?.workflowCode ||
        location.state?.workflowName ||
        task?.workflow_code ||
        ""

    const backPath =
        location.state?.workflowId
            ? `/projects/templates/workflows/${location.state.workflowId}`
            : "/projects/templates/workflows"

    const methods = {
        addSubtask,
        updateSubtask,
        removeSubtask,
        updateSubtasksOrder,
        addField,
        updateField,
        removeField,
        addState,
        updateState,
        removeState
    }

    const loadTask = async() => {
        try {
            setLoading(true)
            const response = await getTask(id)
            const data = response?.content || null

            setTask(data)

            if (data) {
                setForm({
                    name: data.name || "",
                    description: data.description || "",
                    // sla_days: data.sla_days || 0,
                    // business_days: data.business_days !== false
                })
            }
        } catch (error) {
            console.error(error)
            toast.error("No se pudo cargar la Tarea")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadTask()
    }, [id])

    const saveGeneral = async() => {
        try {
            setSaving(true)

            const response = await updateTask(id, {
                name: form.name,
                description: form.description,
                // sla_days: Number(form.sla_days || 0),
                // business_days: form.business_days
            })

            if (response?.result !== "OK") throw new Error(response?.message || "No se pudo guardar")

            setTask(response.content)
            toast.success("Tarea actualizada")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo guardar")
        } finally {
            setSaving(false)
        }
    }

    const createSubtask = async() => {
        try {
            if (!subtaskForm.name.trim()) return toast.error("Ingresar nombre de Subtarea")

            await addSubtask(id, {
                name: subtaskForm.name.trim(),
                subtask_key: makeKey(subtaskForm.name),
                blocking: subtaskForm.blocking,
                start_policy: subtaskForm.start_policy,
                assignment: subtaskForm.assignment
            })

            setSubtaskForm(getInitialSubtask())
            setSubtaskDialog(false)
            await loadTask()
            toast.success("Subtarea creada")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "No se pudo crear")
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!task) {
        return <div className="p-8 text-sm text-slate-500">Tarea no encontrada.</div>
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/projects/templates/tasks"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/projects/templates/tasks" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Tareas
                            </Link>
                            <span className="text-gray-400"> / </span>
                            <span className="text-[#2b7fff]">{task?.task_code ?? id}</span>
                        </h2>
                    </div>
                </div>

                <div>
                    <div className="relative">

                        <div className="bg-white relative rounded-lg p-6 mb-6">
                            <div className="mx-auto flex max-w-7xl items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-[#cce5ff] rounded-full p-2">
                                                <NotebookTabs className="w-5 h-5 text-[#3b82f6]" />
                                            </div>
                                            <h1 className="text-lg font-medium text-gray-400">{task?.name}</h1>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                        {/* main */}
                        {/* MAIN */}
                        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border bg-white lg:grid-cols-[180px_minmax(0,1fr)]">

                            {/* SIDEBAR */}
                            <aside className="border-r border-slate-100 bg-blue-50/50 p-2">
                                {MENU.map(item => {
                                    const Icon = item.icon
                                    const active = tab === item.key

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setTab(item.key)}
                                            className={[
                                                "mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition",
                                                active ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-[#31577e] hover:bg-white/60"
                                            ].join(" ")}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </aside>

                            {/* CONTENT */}
                            <main className="min-w-0 p-5">

                                {/* GENERAL */}
                                {tab === "GENERAL" && (
                                    <div>
                                        <div className="mb-5">
                                            <h2 className="font-semibold text-[#31577e]">Información general</h2>
                                            <p className="mt-1 text-xs text-slate-400">Configuración principal y SLA de la Tarea.</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Nombre</Label>
                                                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>SLA Total</Label>
                                                {/* <Input type="number" min="0" value={form.sla_days} onChange={e => setForm(p => ({ ...p, sla_days: e.target.value }))} /> */}
                                                <span className="font-semibold text-[#31577e]">
                                                    {task?.sla_days || 0}
                                                </span>
                                                <span className="ml-1 text-sm text-slate-500">
                                                    días
                                                </span>
                                            </div>

                                            <div className="space-y-2 lg:col-span-2">
                                                <Label>Descripción</Label>
                                                <Textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                            </div>

                                            {/* <label className="flex items-center gap-3">
                                                <Checkbox checked={form.business_days} onCheckedChange={value => setForm(p => ({ ...p, business_days: !!value }))} />
                                                <div>
                                                    <div className="text-sm font-medium">Contabilizar solo días hábiles</div>
                                                    <div className="text-xs text-slate-400">Excluye sábados y domingos del cálculo automático.</div>
                                                </div>
                                            </label> */}
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <Button onClick={saveGeneral} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
                                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                Guardar cambios
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* SUBTASKS */}
                                {tab === "SUBTASKS" && (
                                    <div>
                                        <div className="mb-5 flex items-start justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold text-[#31577e]">Flujo interno de la Tarea</h2>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Cada Subtarea define responsables, campos, estados y transición. Las no bloqueantes pueden continuar aunque la Tarea avance.
                                                </p>
                                            </div>

                                            <Button onClick={() => setSubtaskDialog(true)} className="bg-blue-500 hover:bg-blue-600">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Subtarea
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(task.subtasks || []).length === 0 ? (
                                                <div className="rounded-2xl border border-dashed p-12 text-center">
                                                    <GitBranch className="mx-auto h-8 w-8 text-slate-300" />
                                                    <div className="mt-3 text-sm font-medium text-slate-600">Todavía no existen Subtareas</div>
                                                    <div className="mt-1 text-xs text-slate-400">Crea la primera para configurar el proceso interno.</div>
                                                </div>
                                            ) : (
                                                [...task.subtasks]
                                                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                    .map(subtask => (
                                                        <SubtaskCard
                                                            key={subtask.subtask_key}
                                                            task={task}
                                                            taskId={id}
                                                            subtask={subtask}
                                                            users={users}
                                                            groupUsers={groupUsers}
                                                            methods={methods}
                                                            reload={loadTask}
                                                        />
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* MACRO STATES */}
                                {tab === "STATES" && (
                                    <div>
                                        <h2 className="font-semibold text-[#31577e]">Estados de la Tarea</h2>

                                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                                            Los estados de negocio se configuran dentro de cada Subtarea. A nivel de Tarea el motor utiliza estados técnicos para determinar dónde se encuentra el sitio dentro del Workflow.
                                        </p>

                                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                                            {[
                                                ["NOT_REACHED", "No alcanzada", "La Tarea todavía no fue activada."],
                                                ["ACTIVE", "Activa", "Existe al menos una Subtarea en ejecución."],
                                                ["COMPLETED", "Completada", "Todas las Subtareas bloqueantes finalizaron."],
                                                ["CANCELLED", "Cancelada", "La ejecución fue detenida por cancelación."],
                                                ["ERROR", "Error", "La ejecución requiere revisión técnica."]
                                            ].map(([code, label, description]) => (
                                                <div key={code} className="rounded-xl border bg-slate-50 p-4">
                                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                                    <div className="mt-3 text-sm font-semibold text-[#31577e]">{label}</div>
                                                    <div className="mt-1 text-[10px] font-medium text-slate-400">{code}</div>
                                                    <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </main>
                        </div>

                    </div>

                    {/* NUEVA SUBTAREA */}
                    <Dialog open={subtaskDialog} onOpenChange={setSubtaskDialog}>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Nueva Subtarea</DialogTitle>
                                <DialogDescription>Configura la unidad de trabajo interna de esta Tarea.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nombre *</Label>
                                    <Input
                                        placeholder="Ej. Gestión OOCC"
                                        value={subtaskForm.name}
                                        onChange={e => setSubtaskForm(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Política de apertura</Label>
                                    <Select value={subtaskForm.start_policy} onValueChange={value => setSubtaskForm(p => ({ ...p, start_policy: value }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {START_POLICIES.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <label className="flex items-start gap-3 rounded-xl border p-4">
                                    <Checkbox
                                        checked={subtaskForm.blocking}
                                        onCheckedChange={value => setSubtaskForm(p => ({ ...p, blocking: !!value }))}
                                    />
                                    <div>
                                        <div className="text-sm font-medium">Subtarea bloqueante</div>
                                        <div className="mt-1 text-xs text-slate-400">Si está activa, la Tarea no podrá completarse hasta que esta Subtarea finalice.</div>
                                    </div>
                                </label>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSubtaskDialog(false)}>Cancelar</Button>
                                <Button onClick={createSubtask} className="bg-blue-500 hover:bg-blue-600">
                                    Crear Subtarea
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>

            </div>
        </div>
    )
}