import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    Info,
    ListTodo,
    UserRound,
    Lock,
    MessageSquare,
    Loader2,
    Save,
    Users,
    X
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"

import {
    Check,
    Search
} from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"

import { useInstanceActions } from "@/hooks/projects/wf/useInstanceActions"
import SiteChat from "./SiteChat"
import { useResponsibleUsers } from "@/hooks/admin/useResponsibleUsers"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
// import { useResponsibleUsers } from "@/hooks/admin/useResponsibleUsers"

function getSubtaskStatusLabel(status) {

    const labels = {
        PENDING: "Pendiente",
        ACTIVE: "Activa",
        WAITING: "Esperando",
        OBSERVED: "Observada",
        COMPLETED: "Completada",
        CANCELLED: "Cancelada"
    }

    return (
        labels[status] ||
        status ||
        "-"
    )
}

const getUserId = user =>
    String(
        user?.id ||
        user?.user_id ||
        user?._id ||
        ""
    )

const getUserName = user =>
    user?.name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    user?.email ||
    getUserId(user)

const getUserNameById = (users, userId) => {
    if (!userId) return "-"

    const user = (users || []).find(item =>
        String(item.user_id || item.id || item._id) === String(userId)
    )

    if (!user) return `Usuario ${userId}`

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim()

    return fullName || user.name || user.email || `Usuario ${userId}`
}

function toDateInputValue(
    value
) {

    if (!value) {
        return ""
    }


    /*
     * Ya viene como YYYY-MM-DD
     */
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {
        return value
    }


    const date =
        new Date(value)


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return ""
    }


    const year =
        date.getFullYear()

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        )

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )


    return `${year}-${month}-${day}`
}


function toDateTimeInputValue(value) {

    if (!value) {
        return ""
    }

    /*
     * Ya viene en formato datetime-local.
     */
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
            value
        )
    ) {
        return value
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hour = String(date.getHours()).padStart(2, "0")
    const minute = String(date.getMinutes()).padStart(2, "0")

    return (
        `${year}-${month}-${day}` + `T${hour}:${minute}`
    )
}


function getTaskStatusLabel(status) {
    const labels = {
        NOT_REACHED: "Pendiente",
        ACTIVE: "En curso",
        COMPLETED: "Completada",
        CANCELLED: "Cancelada",
        ERROR: "Error"
    }

    return labels[status] || status || "-"
}

function getTaskStatusClass(status) {
    const classes = {
        NOT_REACHED: "border-slate-200 bg-slate-50 text-slate-500",
        ACTIVE: "border-blue-200 bg-blue-50 text-blue-700",
        COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
        CANCELLED: "border-red-200 bg-red-50 text-red-600",
        ERROR: "border-red-200 bg-red-50 text-red-600"
    }

    return classes[status] ||
        "border-slate-200 bg-slate-50 text-slate-500"
}


function ActivityTab({
    active,
    onClick,
    children
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className={`
                relative
                flex
                items-center
                gap-2
                pb-3
                text-sm
                font-medium
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

/*
 * =========================================================
 * INFORMATION
 * =========================================================
 */
// function ActivityInformation({
//     instance,
//     task
// }) {

//     return (
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//             <InformationItem
//                 label="Identificador"
//                 value={instance.identificador}
//             />
//             <InformationItem
//                 label="TASK"
//                 value={task.task_name || task.task_code}
//             />
//             <InformationItem
//                 label="Inicio"
//                 value={formatDateTime(task.started_at)}
//             />
//             <InformationItem
//                 label="FCST SLA"
//                 value={formatDate(task.forecast?.sla_date)}
//             />
//             <InformationItem
//                 label="FCST Responsable"
//                 value={formatDate(task.forecast?.responsible_date)}
//             />
//             <InformationItem
//                 label="FCST PM"
//                 value={formatDate(task.forecast?.pm_date)}
//             />

//         </div>

//     )
// }


function formatInformationValue(field) {
    const value = field?.value

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-"
    }

    switch (field?.type) {
        case "DATE":
            return formatDate(value)

        case "DATETIME":
            return formatDateTime(value)

        case "CHECKBOX":
            return value === true ? "Sí" : "No"

        case "MULTISELECT":
            return Array.isArray(value)
                ? value.join(", ")
                : String(value)

        case "FILE":
            if (typeof value === "object") {
                return (
                    value.originalName ||
                    value.originalname ||
                    value.name ||
                    value.filename ||
                    "Archivo adjunto"
                )
            }

            return String(value)

        default:
            if (Array.isArray(value)) {
                return value.join(", ")
            }

            return String(value)
    }
}


function ActivityInformation({ task }) {
    const information = task?.information || []

    if (!information.length) {
        return (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                <div className="max-w-sm text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="mt-3 text-sm font-medium text-slate-600">
                        Sin entregables previos
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-400">
                        Esta tarea no tiene información entregable proveniente de tareas anteriores.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {information.map(previousTask => (
                <div
                    key={previousTask.task_code}
                    className="overflow-hidden rounded-xl border border-slate-200"
                >
                    {/* TASK ORIGEN */}
                    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                        <div className="text-xs font-semibold text-slate-700">
                            {previousTask.task_name || previousTask.task_code}
                        </div>

                        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            Entregables recibidos
                        </div>
                    </div>

                    <div className="space-y-4 p-4">
                        {(previousTask.subtasks || []).map(subtask => (
                            <div key={subtask.subtask_key}>
                                {/* SUBTASK ORIGEN */}
                                <div className="mb-2 text-xs font-medium text-slate-500">
                                    {subtask.name || subtask.subtask_key}
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {(subtask.fields || []).map(field => (
                                        <InformationItem
                                            key={field.field_key}
                                            label={field.label || field.field_key}
                                            value={formatInformationValue(field)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}



function InformationItem({
    label,
    value
}) {

    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-700">
                {value || "-"}
            </div>
        </div>
    )
}


/*
 * =========================================================
 * SUBTASK CARD
 * =========================================================
 */

function SubtaskCard({
    taskCode,
    subtask,
    users,
    currentUser,
    saving,
    onSaveForm,
    onChangeState,
    onOpenResponsibles,
    onOpenChat
}) {

    /*
     * =========================================================
     * PERMISOS VISUALES
     * =========================================================
     *
     * Backend sigue siendo la autoridad.
     * Front simplemente evita presentar edición
     * a quien no tiene la subtarea asignada.
     */
    const currentUserId = String(currentUser?.id || "")
    const assignedToCurrentUser = (subtask.assigned_user_ids || []).map(String).includes(currentUserId)
    const editable = ["ACTIVE", "OBSERVED"].includes(subtask.status) && assignedToCurrentUser

    /*
     * =========================================================
     * FORM
     * =========================================================
     */

    const [formData, setFormData] = useState(subtask.form_data || {})
    const [pendingState, setPendingState] = useState(null)
    /*
     * Cuando SiteDetails hace reload después
     * de una transición, sincronizamos nuevamente
     * los datos retornados por backend.
     */
    useEffect(() => {
        setFormData(
            subtask.form_data || {}
        )
    }, [subtask.form_data])


    const handleSave = async() => {

        if (!currentUser?.id) {
            return
        }

        await onSaveForm(
            taskCode,
            subtask.subtask_key,
            {
                form_data: formData,
                user_id: String(currentUser.id)
            }
        )
    }

    const hasLastActivity =
        subtask.last_comment ||
        subtask.last_selected_option ||
        subtask.last_action_by ||
        subtask.last_action_at


    return (
        <div className="overflow-hidden rounded-b-xl border border-slate-300 bg-white">
            {/* =================================================
                HEADER
            ================================================= */}
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-blue-600">
                            {subtask.name}
                        </div>
                        {subtask.blocking === false && (
                            <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-[10px] text-slate-500"
                            >
                                No bloqueante
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SubtaskStatusBadge
                        status={subtask.status}
                    />
                    {editable && (
                        <Select
                            value={pendingState || subtask.state || ""}
                            disabled={saving}
                            onValueChange={value => {
                                if (value === subtask.state) return
                                setPendingState(value)
                            }}
                        >
                            <SelectTrigger className="h-9 w-[180px]">
                                <SelectValue placeholder="Cambiar estado" />
                            </SelectTrigger>

                            <SelectContent>
                                {(subtask.available_states || []).map(state => (
                                    <SelectItem
                                        key={state.state_key}
                                        value={state.state_key}
                                    >
                                        {state.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={onOpenResponsibles}
                                >
                                    <Users className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Responsables
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={onOpenChat}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Espacio de comentarios
                            </TooltipContent>
                        </Tooltip>
                        {editable && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        disabled={saving}
                                        onClick={handleSave}
                                    >
                                        {saving
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Save className="h-4 w-4" />
                                        }
                                    </Button>
                                </TooltipTrigger>

                                <TooltipContent>
                                    Guardar cambios
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            </div>
            {/* =================================================
                CONTENT
            ================================================= */}
            <div className="space-y-5 p-5">
                <SubtaskFormData
                    fields={subtask.fields || []}
                    data={formData}
                    editable={editable && !saving}
                    onChange={setFormData}
                />

                {/* =================================================
                    NO ASSIGNED
                ================================================= */}
                {["ACTIVE", "OBSERVED"].includes(subtask.status) &&
                !assignedToCurrentUser && (
                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <Lock className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                            <div className="text-xs font-medium text-slate-600">
                                Actividad asignada a otro responsable
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                                Puedes consultar la información, pero no modificarla.
                            </div>
                        </div>
                    </div>
                )}
                {/* =================================================
                    WAITING
                ================================================= */}
                {subtask.status === "WAITING" && (
                    <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/50 p-4">
                        <Lock className="mt-0.5 h-4 w-4 text-violet-500" />
                        <div>
                            <div className="text-xs font-medium text-violet-700">
                                Pendiente de validación
                            </div>
                            <div className="mt-1 text-xs text-violet-500">
                                La subtarea ya fue enviada y no puede editarse hasta que sea reabierta.
                            </div>
                        </div>
                    </div>
                )}

                {/* ULTIMO COMENTARIO */}
                {hasLastActivity && (
                    <div className="rounded-lg bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                            <MessageSquare className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[11px] font-medium uppercase text-slate-400">
                                        Última actualización
                                    </div>

                                    {subtask.last_action_at && (
                                        <div className="text-[11px] text-slate-400">
                                            {formatDateTime(subtask.last_action_at)}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                    <div>
                                        <span className="text-slate-400">Usuario:</span>{" "}
                                        <span className="font-medium text-slate-600">
                                            {getUserNameById(users, subtask.last_action_by)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Estado:</span>{" "}
                                        <span className="font-medium text-slate-600">
                                            {subtask.state || "-"}
                                        </span>
                                    </div>
                                    {subtask.last_selected_option && (
                                        <div>
                                            <span className="text-slate-400">Tipo:</span>{" "}
                                            <span className="font-medium text-slate-600">
                                                {subtask.last_selected_option}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {subtask.last_comment && (
                                    <div className="mt-3 border-t border-slate-200 pt-3">
                                        <div className="text-[11px] font-medium uppercase text-slate-400">
                                            Comentario
                                        </div>

                                        <div className="mt-1 text-sm text-slate-600">
                                            {subtask.last_comment}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    STATE SELECT
                ================================================= */}
                {/* {editable && (
                    <div className="max-w-[420px]">
                        <label className="mb-2 block text-xs font-medium text-slate-500">
                            Cambiar estado
                        </label>
                        <Select
                            value=""
                            disabled={saving}
                            onValueChange={value => setPendingState(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {(subtask.available_states || [])
                                    .map(state => (
                                        <SelectItem
                                            key={state.state_key}
                                            value={state.state_key}
                                        >
                                            {state.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                )} */}
            </div>

            {/* =================================================
                CONFIRMATION
            ================================================= */}
            <StateConfirmationDialog
                open={!!pendingState}
                stateKey={pendingState}
                taskCode={taskCode}
                subtask={subtask}
                formData={formData}
                saving={saving}
                currentUser={currentUser}
                onChangeState={onChangeState}
                onClose={() => setPendingState(null)}
                onSuccess={() => {
                    setPendingState(null)
                }}
            />
        </div>
    )
}


function SubtaskField({
    field,
    value,
    editable,
    onChange
}) {

    const type = field.type || "TEXT"

    /*
     * =========================================================
     * TEXT
     * =========================================================
     */
    if (type === "TEXT") {
        return (
            <Input
                type="text"
                value={value ?? ""}
                disabled={!editable}
                onChange={event => onChange(event.target.value)
                }
            />
        )
    }

    /*
     * =========================================================
     * NUMBER
     * =========================================================
     */
    if (type === "NUMBER") {
        return (
            <Input
                type="number"
                value={value ?? ""}
                disabled={!editable}
                onChange={event => {
                    const raw = event.target.value
                    onChange(raw === ""
                        ? ""
                        : Number(raw)
                    )
                }}
            />
        )
    }

    /*
     * =========================================================
     * DATE
     * =========================================================
     */
    if (type === "DATE") {
        return (
            <Input
                type="date"
                value={toDateInputValue(value)}
                disabled={!editable}
                onChange={event =>
                    onChange(event.target.value)
                }
            />
        )
    }

    /*
     * =========================================================
     * DATETIME
     * =========================================================
     */
    if (type === "DATETIME") {
        return (
            <Input
                type="datetime-local"
                value={toDateTimeInputValue(value)}
                disabled={!editable}
                onChange={event => onChange(event.target.value)
                }
            />
        )
    }

    /*
     * =========================================================
     * TEXTAREA
     * =========================================================
     */
    if (type === "TEXTAREA") {
        return (
            <Textarea
                rows={4}
                value={value ?? ""}
                disabled={!editable}
                onChange={event =>
                    onChange(
                        event.target.value
                    )
                }
            />
        )
    }

    /*
     * =========================================================
     * SELECT
     * =========================================================
     */
    if (type === "SELECT") {
        return (
            <Select
                value={value
                    ? String(value)
                    : undefined
                }
                disabled={!editable}
                onValueChange={onChange}
            >
                <SelectTrigger
                    className="w-full"
                >
                    <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                    {(field.options || [])
                        .map(option => (
                            <SelectItem
                                key={String(option)}
                                value={String(option)}
                            >
                                {String(option)}
                            </SelectItem>
                        ))
                    }
                </SelectContent>
            </Select>
        )
    }

    /*
     * =========================================================
     * MULTISELECT
     * =========================================================
     */
    if (type === "MULTISELECT") {

        const selectedValues = Array.isArray(value)
            ? value.map(String)
            : []

        return (
            <select
                multiple
                value={selectedValues}
                disabled={!editable}
                className="
                    min-h-[105px]
                    w-full
                    rounded-md
                    border
                    border-input
                    bg-background
                    px-3
                    py-2
                    text-sm
                    outline-none
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
                onChange={event => {
                    const values =
                        Array.from(event.target.selectedOptions).map(
                            option => option.value
                        )
                    onChange(values)
                }}
            >
                {(field.options || [])
                    .map(option => (
                        <option
                            key={String(option)}
                            value={String(option)}
                        >
                            {String(option)}
                        </option>
                    ))
                }
            </select>
        )
    }

    // CHECKBOX
    if (type === "CHECKBOX") {
        return (
            <label className="
                flex
                h-10
                items-center
                gap-3
                rounded-md
                border
                border-slate-200
                px-3
            ">
                <input
                    type="checkbox"
                    checked={value === true}
                    disabled={!editable}
                    onChange={event =>
                        onChange(event.target.checked)
                    }
                />
                <span className="text-sm text-slate-600">
                    {value === true
                        ? "Sí"
                        : "No"
                    }
                </span>
            </label>
        )
    }

    /*
     * =========================================================
     * FILE
     * =========================================================
     */
    if (type === "FILE") {
        return (
            <div className="
                rounded-lg
                border
                border-dashed
                border-slate-200
                bg-slate-50/50
                px-4
                py-3
            ">
                {value
                    ? (
                        <div className="text-sm text-slate-600">
                            {typeof value === "string"
                                ? value
                                : value?.name ||
                                  value?.filename ||
                                  "Archivo registrado"
                            }
                        </div>
                    )
                    : (
                        <div className="text-xs text-slate-400">
                            Sin archivo registrado
                        </div>
                    )
                }
                <div className="mt-1 text-[11px] text-slate-400">
                    La carga de archivos requiere el endpoint de adjuntos.
                </div>
            </div>
        )
    }

    // FALLBACK
    return (
        <Input
            value={value ?? ""}
            disabled={!editable}
            onChange={event => onChange(event.target.value)}
        />
    )
}

function SubtaskFormData({
    fields = [],
    data = {},
    editable,
    onChange
}) {

    if (!fields.length) {
        return (
            <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                Esta subtarea no tiene campos configurados.
            </div>
        )
    }

    const updateValue = (fieldKey, value) => {
        onChange?.({
            ...data,
            [fieldKey]: value
        })
    }

    return (
        <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Campos
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.map(field => {
                    const value =
                        data[field.field_key] ??
                        field.default_value ??
                        ""
                    return (
                        <div
                            key={field.field_key}
                            className={
                                field.type === "TEXTAREA"
                                    ? "md:col-span-2"
                                    : ""
                            }
                        >
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                {field.label}
                                {field.required && (
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                )}
                                 {field.system_binding ==="TASK_RESPONSIBLE_FORECAST" && (
                                    <Badge
                                        variant="outline"
                                        className="border-violet-200 ml-2 bg-violet-50 text-[9px] font-medium text-violet-700"
                                    >
                                        FCST Responsable
                                    </Badge>
                                )}
                            </label>

                           

                            <SubtaskField
                                field={field}
                                value={value}
                                editable={editable && field.editable !== false}
                                onChange={value =>
                                    updateValue(
                                        field.field_key,
                                        value
                                    )
                                }
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// CONFIRM DIALOG
function StateConfirmationDialog({
    open,
    stateKey,
    taskCode,
    subtask,
    formData,
    onClose,
    onSuccess,
    saving,
    currentUser,
    onChangeState
}) {

    const [comment, setComment] = useState("")
    const [selectedOption, setSelectedOption] = useState("")

    const state = (subtask.available_states || []).find(
        current => current.state_key === stateKey
    )

    const requiresComment = state?.transition?.requires_comment === true
    const optionList = state?.option_list
    const hasOptionList = optionList?.enabled === true

    // CONFIRM
    const handleConfirm =
        async() => {

            if (requiresComment && !comment.trim()) return
            if (hasOptionList && !selectedOption) return

            if (!currentUser?.id) {
                return
            }

            await onChangeState(
                taskCode,
                subtask.subtask_key,
                {
                    state: stateKey,
                    form_data: formData,
                    comment: comment.trim() || null,
                    selected_option: hasOptionList ? selectedOption : null,
                    user_id: String(currentUser.id)
                }
            )

            setComment("")
            setSelectedOption("")
            onSuccess?.()
        }

    // CLOSE
    const handleClose =
        () => {
            if (saving) {
                return
            }
            setComment("")
            onClose?.()
        }

    return (
        <Dialog
            open={open}
            onOpenChange={
                value => {
                    if (!value) {
                        handleClose()
                    }
                }
            }
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Confirmar cambio de estado
                    </DialogTitle>
                    <DialogDescription>
                        La subtarea
                        {" "}
                        <strong>
                            {subtask.name}
                        </strong>
                        {" "}
                        cambiará al estado
                        {" "}
                        <strong>
                            {state?.label ||stateKey}
                        </strong>
                        .
                    </DialogDescription>
                </DialogHeader>
                {/* =================================================
                    TRANSITION
                ================================================= */}
                {state?.transition?.transition_type && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
                        <div className="text-[11px] font-medium uppercase text-blue-400">
                            Acción del workflow
                        </div>
                        <div className="mt-1 text-xs text-blue-700">
                            {getTransitionLabel(state.transition.transition_type)}
                        </div>
                    </div>
                )}
                {/* =================================================
                    COMMENT
                ================================================= */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                        Comentario
                        {requiresComment && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>
                    <Textarea
                        value={comment}
                        disabled={saving}
                        onChange={event => setComment(event.target.value)}
                        placeholder={requiresComment
                            ? "Ingrese el motivo del cambio"
                            : "Agregar comentario (opcional)"
                        }
                        rows={4}
                    />
                    {hasOptionList && (
                        <div className="space-y-2">
                            <Label>
                                {optionList.label || "Issue"} *
                            </Label>

                            <Select
                                value={selectedOption}
                                onValueChange={setSelectedOption}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={`Seleccionar ${optionList.label || "opción"}`} />
                                </SelectTrigger>

                                <SelectContent>
                                    {(optionList.options || []).map(option => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                {/* =================================================
                    ACTIONS
                ================================================= */}
                <DialogFooter>
                    <Button
                        variant="outline"
                        disabled={saving}
                        onClick={handleClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={
                            saving ||
                            !currentUser?.id ||
                            (
                                requiresComment &&
                                !comment.trim()
                            )
                        }
                        onClick={handleConfirm}
                    >
                        {saving && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


/*
 * =========================================================
 * BADGES / HELPERS
 * =========================================================
 */

function SubtaskStatusBadge({
    status
}) {

    const config = {
        PENDING: [
            "Pendiente",
            "border-slate-200 bg-slate-50 text-slate-500"
        ],
        ACTIVE: [
            "Activa",
            "border-blue-200 bg-blue-50 text-blue-700"
        ],
        WAITING: [
            "Esperando validación",
            "border-violet-200 bg-violet-50 text-violet-700"
        ],
        OBSERVED: [
            "Observada",
            "border-amber-200 bg-amber-50 text-amber-700"
        ],
        COMPLETED: [
            "Completada",
            "border-emerald-200 bg-emerald-50 text-emerald-700"
        ],
        CANCELLED: [
            "Cancelada",
            "border-red-200 bg-red-50 text-red-600"
        ]
    }

    const [label, className] =
        config[status] ||
        [
            status || "-",
            "border-slate-200 bg-slate-50 text-slate-500"
        ]


    return (
        <Badge
            variant="outline"
            className={className}
        >
            {label}
        </Badge>
    )
}


function getTransitionLabel(type) {
    const labels = {
        STATE: "Mantener subtarea abierta",
        OPEN_SUBTASK: "Aperturar subtarea",
        WAIT_VALIDATION: "Enviar a validar",
        REOPEN_SUBTASK: "Reaperturar subtarea",
        CLOSE_SUBTASK: "Cerrar esta subtarea",
        CLOSE_RELATED_SUBTASK: "Cerrar subtarea relacionada",
        CLOSE_AND_OPEN_SUBTASK: "Cerrar y aperturar subtarea",
        CLOSE_TASK: "Cerrar TASK",
        MOVE_SUBTASK: "Mover subtarea"
    }
    return (
        labels[type] || type
    )
}


function formatDate(value) {

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


const formatDateTime = value => {
    if (!value) return "-"

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value))
}


function SubtaskTimeline({
    subtasks = [],
    selectedSubtaskKey,
    onSelect
}) {
    return (
        <div className="space-y-1">
            {subtasks.map((subtask, index) => {
                const selected = subtask.subtask_key === selectedSubtaskKey
                const completed = subtask.status === "COMPLETED"
                const active = ["ACTIVE", "OBSERVED", "WAITING"].includes(subtask.status)

                return (
                    <button
                        key={subtask.subtask_key}
                        type="button"
                        onClick={() => onSelect(subtask.subtask_key)}
                        className={[
                            "relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition",
                            selected
                                ? "bg-blue-50 ring-1 ring-blue-200"
                                : "hover:bg-slate-50"
                        ].join(" ")}
                    >
                        <div className="relative flex flex-col items-center">
                            <div
                                className={[
                                    "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                                    selected
                                        ? "border-blue-500 bg-blue-500 text-white"
                                        : completed
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                            : active
                                                ? "border-blue-400 bg-blue-50 text-blue-600"
                                                : "border-slate-200 bg-white text-slate-400"
                                ].join(" ")}
                            >
                                {completed ? "✓" : index + 1}
                            </div>

                            {index < subtasks.length - 1 && (
                                <div
                                    className={[
                                        "absolute top-8 h-[44px] w-px",
                                        completed ? "bg-emerald-300" : "bg-slate-200"
                                    ].join(" ")}
                                />
                            )}
                        </div>

                        <div className="min-w-0 flex-1 pb-2">
                            <div
                                className={[
                                    "truncate text-sm",
                                    selected
                                        ? "font-semibold text-blue-600"
                                        : "font-medium text-slate-700"
                                ].join(" ")}
                            >
                                {subtask.name}
                            </div>

                            <div className="mt-1 text-[11px] text-slate-400">
                                {getSubtaskStatusLabel(subtask.status)}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

function getTaskVisualStatus(task) {
    const subtasks = task?.subtasks || []

    if (!subtasks.length) {
        if (task?.status === "COMPLETED") return "COMPLETED"
        if (task?.status === "ACTIVE") return "ACTIVE"
        return "NOT_REACHED"
    }

    const allFinished =
        subtasks.every(subtask =>
            ["COMPLETED", "CANCELLED"].includes(subtask.status)
        )

    if (allFinished) {
        return "COMPLETED"
    }

    const hasInProgress =
        subtasks.some(subtask =>
            ["ACTIVE", "OBSERVED", "WAITING"].includes(subtask.status)
        )

    if (hasInProgress) {
        return "ACTIVE"
    }

    if (task?.status === "CANCELLED") {
        return "CANCELLED"
    }

    return "NOT_REACHED"
}


export default function CurrentActivity({
    instance,
    tasks = [],
    currentUser,
    onUpdated,
    can
}) {

    // console.log("activeTasks", activeTasks)
    /*
     * =========================================================
     * INSTANCE ACTIONS
     * =========================================================
     */
    const {
        saving,
        changeSubtaskState,
        saveSubtaskForm,
        changeSubtaskAssignees
    } = useInstanceActions({
        instanceId: instance?._id,
        onUpdated
    })

    const { groupUsers } = useResponsibleUsers()

    /*
     * =========================================================
     * STATE
     * =========================================================
     */

    const [selectedTaskCode, setSelectedTaskCode] = useState("")
    const [tab, setTab] = useState("subtasks")
    const [selectedSubtaskKey, setSelectedSubtaskKey] = useState("")

    const [responsiblesOpen, setResponsiblesOpen] = useState(false)
    const [responsibleUserIds, setResponsibleUserIds] = useState([])
    const [savingResponsibles, setSavingResponsibles] = useState(false)
    const [responsibleSearchOpen, setResponsibleSearchOpen] = useState(false)

    const [chatOpen, setChatOpen] = useState(false)


    const currentUserId = String(currentUser?.id || "")

    const getPreferredTaskCode = () => {
        if (!tasks.length) {
            return ""
        }

        /*
        * 1. Buscar TASK donde el usuario tenga
        *    una Subtask actualmente operativa.
        */
        const assignedActiveTask =
            tasks.find(task =>
                (task.subtasks || []).some(subtask =>
                    ["ACTIVE", "OBSERVED", "WAITING"].includes(
                        subtask.status
                    ) &&
                    (subtask.assigned_user_ids || [])
                        .map(String)
                        .includes(currentUserId)
                )
            )

        if (assignedActiveTask) {
            return assignedActiveTask.task_code
        }

        /*
        * 2. Si no tiene asignación activa,
        *    primera TASK en curso.
        */
        const activeTask =
            tasks.find(task =>
                getTaskVisualStatus(task) === "ACTIVE"
            )

        if (activeTask) {
            return activeTask.task_code
        }

        /*
        * 3. Fallback: primera TASK del workflow.
        */
        return tasks[0]?.task_code || ""
    }

    /*
     * =========================================================
     * SELECTED TASK
     * =========================================================
     */

    const selectedTask = useMemo(() =>
        tasks.find(task => task.task_code === selectedTaskCode) || null,
        [tasks, selectedTaskCode]
    )


    const selectedSubtask =
        useMemo(() => {

            return (
                (selectedTask?.subtasks || [])
                    .find(
                        subtask =>
                            subtask.subtask_key ===
                            selectedSubtaskKey
                    ) ||
                null
            )

        }, [
            selectedTask,
            selectedSubtaskKey
        ])


    const toggleResponsible = userId => {

        const id = String(userId)

        setResponsibleUserIds(
            current => {

                if (
                    current
                        .map(String)
                        .includes(id)
                ) {
                    return current.filter(
                        value =>
                            String(value) !== id
                    )
                }

                return [
                    ...current,
                    id
                ]
            }
        )
    }

    

    const handleSaveResponsibles = async () => {
        if (!selectedTask || !selectedSubtask) return
        try {
            setSavingResponsibles(true)
            await changeSubtaskAssignees(
                selectedTask.task_code,
                selectedSubtask.subtask_key,
                {
                    user_ids: responsibleUserIds,
                    user_id: String(currentUser?.id || "")
                }
            )
            setResponsiblesOpen(false)
        } catch (error) {
            console.error("Error actualizando responsables:",error)
        } finally {
            setSavingResponsibles(false)
        }
    }



    useEffect(() => {

        if (!responsiblesOpen) return
        setResponsibleUserIds(
            (selectedSubtask?.assigned_user_ids || []).map(String)
        )

    }, [responsiblesOpen, selectedSubtask])

    // const responsiblePoolUsers =
    //     useMemo(() => {

    //         const poolIds =
    //             new Set(
    //                 (selectedSubtask?.assignment_pool_user_ids || []).map(String)
    //             )

    //         return (
    //             groupUsers?.users ||
    //             []
    //         ).filter(user => {

    //             const id = String(
    //                 user.id ||
    //                 user.user_id ||
    //                 user._id
    //             )

    //             return poolIds.has(id)
    //         })

    //     }, [
    //         groupUsers?.users,
    //         selectedSubtask
    //     ])

    const availableResponsibleUsers =
        useMemo(
            () => groupUsers?.users || [],
            [groupUsers?.users]
        )

    const selectedResponsibleUsers =
        useMemo(() => {

            const selected = new Set(responsibleUserIds.map(String))
            return availableResponsibleUsers.filter(
                user => selected.has(getUserId(user))
            )

        }, [
            availableResponsibleUsers,
            responsibleUserIds
        ])
 
    // const availableResponsibleUsers =
    //     groupUsers?.users || []

    // const selectedIds =
    //     new Set(
    //         responsibleUserIds.map(String)
    //     )

    // const selectedResponsibleUsers =
    //     availableResponsibleUsers.filter(
    //         user =>
    //             selectedIds.has(
    //                 String(getUserId(user))
    //             )
    //     )

    useEffect(() => {

        const subtasks = selectedTask?.subtasks || []

        if (!subtasks.length) {
            setSelectedSubtaskKey("")
            return
        }

        /*
        * Mantener la selección actual
        * si sigue existiendo.
        */
        const stillExists =
            subtasks.some(
                subtask => subtask.subtask_key === selectedSubtaskKey
            )

        if (stillExists) {
            return
        }

        /*
        * Prioridad:
        *
        * ACTIVE
        * OBSERVED
        * WAITING
        *
        * Si ninguna está activa,
        * usar la primera.
        */
        const assignedCurrent = subtasks.find(subtask =>
            ["ACTIVE", "OBSERVED", "WAITING"].includes(subtask.status) &&
            (subtask.assigned_user_ids || [])
                .map(String)
                .includes(currentUserId)
        )

        const current = assignedCurrent ||
            subtasks.find(subtask =>
                ["ACTIVE", "OBSERVED", "WAITING"].includes(subtask.status)
            )


        setSelectedSubtaskKey(
            current?.subtask_key ||
            subtasks[0]?.subtask_key ||
            ""
        )

    }, [
        selectedTask,
        selectedSubtaskKey
    ])

    /*
     * Cuando una transición completa una TASK
     * puede desaparecer de activeTasks.
     *
     * En ese caso seleccionamos automáticamente
     * la siguiente TASK activa.
     */
    useEffect(() => {
        if (!tasks.length) {
            setSelectedTaskCode("")
            return
        }

        /*
        * Si ya hay una TASK seleccionada y todavía
        * existe después del reload, NO cambiarla.
        */
        const selectedStillExists = tasks.some(task =>
            task.task_code === selectedTaskCode
        )

        if (selectedTaskCode && selectedStillExists) {
            return
        }

        /*
        * Primera carga o TASK inexistente.
        */
        setSelectedTaskCode(getPreferredTaskCode())

    }, [tasks, selectedTaskCode, currentUserId])

    /*
     * =========================================================
     * EMPTY
     * =========================================================
     */
    if (!tasks.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <div className="text-sm font-medium text-slate-500">
                    No existen tareas
                </div>

                <div className="mt-1 text-xs text-slate-400">
                    El sitio no tiene tareas configuradas.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[215px_minmax(0,1fr)]">
                {/* =========================================================
                    COLUMNA IZQUIERDA
                    TASK + TIMELINE
                ========================================================= */}
                <div className="self-start overflow-hidden rounded-xl bg-white">
                    <div className="border-b border-slate-100 px-3 py-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                                Tarea
                            </span>
                            {selectedTask && (() => {
                                const status = getTaskVisualStatus(selectedTask)
                                return (
                                    <Badge
                                        variant="outline"
                                        className={[
                                            "text-[10px] font-medium",
                                            getTaskStatusClass(status)
                                        ].join(" ")}
                                    >
                                        {getTaskStatusLabel(status)}
                                    </Badge>
                                )
                            })()}
                        </div>
                        <Select
                            value={selectedTask?.task_code || ""}
                            onValueChange={setSelectedTaskCode}
                        >
                            <SelectTrigger className="h-9 w-full">
                                <SelectValue placeholder="Seleccionar tarea" />
                            </SelectTrigger>
                            <SelectContent>
                                {tasks.map(task => {
                                    const status = getTaskVisualStatus(task)
                                    return (
                                        <SelectItem
                                            key={task.node_key || task.task_code}
                                            value={task.task_code}
                                        >
                                            <div className="flex min-w-[250px] items-center justify-between gap-4">
                                                <span className="truncate">
                                                    {task.task_name || task.task_code}
                                                </span>
                                                <span
                                                    className={[
                                                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                                        getTaskStatusClass(status)
                                                    ].join(" ")}
                                                >
                                                    {getTaskStatusLabel(status)}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-2">
                        <SubtaskTimeline
                            subtasks={selectedTask?.subtasks || []}
                            selectedSubtaskKey={selectedSubtaskKey}
                            onSelect={setSelectedSubtaskKey}
                        />
                    </div>
                </div>

                {/* =========================================================
                    COLUMNA DERECHA
                    TABS + CONTENIDO
                ========================================================= */}
                <div className="min-w-0">
                    <div className="mb-0 border-b border-slate-200">
                        <div className="flex gap-6">
                            <ActivityTab
                                active={tab === "information"}
                                onClick={() => setTab("information")}
                            >
                                <Info className="h-4 w-4" />
                                Entregable
                            </ActivityTab>

                            <ActivityTab
                                active={tab === "subtasks"}
                                onClick={() => setTab("subtasks")}
                            >
                                <ListTodo className="h-4 w-4" />
                                Subtarea
                            </ActivityTab>
                        </div>
                    </div>

                    {tab === "information" && (
                        <ActivityInformation
                            instance={instance}
                            task={selectedTask}
                        />
                    )}

                    {tab === "subtasks" && (
                        <>
                            {selectedSubtask ? (
                                <SubtaskCard
                                    key={selectedSubtask.subtask_key}
                                    taskCode={selectedTask.task_code}
                                    subtask={selectedSubtask}
                                    users={groupUsers.users || []}
                                    currentUser={currentUser}
                                    saving={saving}
                                    onSaveForm={saveSubtaskForm}
                                    onChangeState={changeSubtaskState}
                                    onOpenResponsibles={() => setResponsiblesOpen(true)}
                                    onOpenChat={() => setChatOpen(true)}
                                />
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                                    No existen Subtareas configuradas.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <Sheet
                open={responsiblesOpen}
                onOpenChange={setResponsiblesOpen}
            >
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-[480px]"
                >
                    <SheetHeader>
                        <SheetTitle>
                            Responsables
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">

                        {/* SUBTASK */}
                        <div>
                            <div className="text-xs text-slate-400">
                                Subtarea
                            </div>

                            <div className="mt-1 font-medium text-slate-700">
                                {selectedSubtask?.name || "-"}
                            </div>
                        </div>


                        {/* DESCRIPTION */}
                        <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
                            <div className="text-xs leading-5 text-blue-700">
                                Selecciona qué usuarios serán responsables
                                de esta Subtarea para este sitio.
                            </div>
                        </div>


                        {/* USERS */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-xs font-medium text-slate-600">
                                    Responsables seleccionados
                                </div>

                                <div className="text-[11px] text-slate-400">
                                    {responsibleUserIds.length} seleccionado(s)
                                </div>
                            </div>

                            {selectedResponsibleUsers.length > 0 ? (
                                <div className="mb-4 space-y-2">
                                    {selectedResponsibleUsers.map(user => {
                                        const userId = getUserId(user)
                                        const userName = getUserName(user)

                                        return (
                                            <div
                                                key={userId}
                                                className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                        <UserRound className="h-4 w-4" />
                                                    </div>

                                                    <div>
                                                        <div className="text-sm font-medium text-slate-700">
                                                            {userName}
                                                        </div>

                                                        {(user.email || user.username) && (
                                                            <div className="mt-0.5 text-xs text-slate-400">
                                                                {user.email || user.username}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        toggleResponsible(userId)
                                                    }
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="mb-4 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-400">
                                    Sin responsables seleccionados
                                </div>
                            )}

                            <Popover
                                open={responsibleSearchOpen}
                                onOpenChange={setResponsibleSearchOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start font-normal"
                                    >
                                        <Search className="mr-2 h-4 w-4 text-slate-400" />
                                        Buscar y añadir usuario...
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-[400px] p-0"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Buscar usuario..." />

                                        <CommandList>
                                            <CommandEmpty>
                                                No se encontraron usuarios.
                                            </CommandEmpty>

                                            <CommandGroup>
                                                {availableResponsibleUsers.map(user => {
                                                    const userId =
                                                        getUserId(user)

                                                    const userName =
                                                        getUserName(user)

                                                    const selected =
                                                        responsibleUserIds
                                                            .map(String)
                                                            .includes(userId)

                                                    return (
                                                        <CommandItem
                                                            key={userId}
                                                            value={`${userName} ${user.email || ""} ${user.username || ""}`}
                                                            onSelect={() =>
                                                                toggleResponsible(
                                                                    userId
                                                                )
                                                            }
                                                        >
                                                            <Checkbox
                                                                checked={selected}
                                                                className="mr-3"
                                                            />

                                                            <div className="flex min-w-0 flex-1 flex-col">
                                                                <div className="text-xs font-medium text-slate-700">
                                                                    {userName}
                                                                </div>

                                                                <div className="truncate text-xs text-slate-400">
                                                                    {user.email ||
                                                                        user.username ||
                                                                        userId}
                                                                </div>
                                                            </div>

                                                            {selected && (
                                                                <Check className="ml-2 h-4 w-4 text-blue-500" />
                                                            )}
                                                        </CommandItem>
                                                    )
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* ACTION */}
                        <div className="flex justify-end border-t pt-4">

                            <Button
                                type="button"
                                onClick={handleSaveResponsibles}
                                disabled={savingResponsibles}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                {savingResponsibles && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Guardar responsables
                            </Button>

                        </div>

                    </div>
                </SheetContent>
            </Sheet>
            <Sheet
                open={chatOpen}
                onOpenChange={setChatOpen}
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
                            Tarea: {selectedTask?.task_name || selectedTask?.task_code || "-"}
                        </div>
                    </SheetHeader>
                    {selectedTask && selectedSubtask && (
                        <SiteChat
                            instanceId={instance?._id}
                            instance={instance}
                            taskCode={selectedTask.task_code}
                            currentUser={currentUser}
                            compact
                            can={can}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}

