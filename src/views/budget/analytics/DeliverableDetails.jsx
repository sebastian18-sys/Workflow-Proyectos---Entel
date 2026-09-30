import AttachmentsGrid from "@/components/AttachmentGrid/AttachmentGrid"
import Dropzone from "@/components/drag_drop/drag_drop"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PERMS } from "@/constants/perm"
import { useDeliverablesFields } from "@/hooks/budget/capex/useDeliverableFields"
import { useDeliverables } from "@/hooks/budget/capex/useDeliverables"
import { useDownloadFile } from "@/hooks/budget/capex/useDownloadFile"
import { useAuth } from "@/hooks/useAuth"
import { useAuthz } from "@/hooks/useAuthz"
import { formatDDMMYYYYHour } from "@/lib/helpers"
import { cn } from "@/lib/utils"
import { ArrowLeft, ChevronDown, Loader2, NotebookTabs } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router"
import { toast } from "wc-toast"

const STATUS_TICKET = {
    "Pendiente": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Aprobado": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"],
    "Observado": ["bg-red-100 text-red-700 hover:bg-red-200", "bg-red-500 outline-red-500/20"],
    "Cancelado": ["bg-gray-100 text-gray-700 hover:bg-gray-200", "bg-gray-500 outline-gray-500/20"]
}

const commentConfigByTransition = {
    "Pendiente__Aprobado": {
        title: "Cambiar estado a Aprobado",
        description: "Deja un comentario para aprobar la solicitud.",
        placeholder: "...",
        submitLabel: "Enviar",
    },
    "Pendiente__Observado": {
        title: "Cambiar estado a Observado",
        description: "Indica el motivo de la observación.",
        placeholder: "Ej: Información incompleta / archivo inválido...",
        submitLabel: "Observar",
    },
    "Observado__Pendiente": {
        title: "Cambiar estado a Pendiente",
        description: "Comentario",
        placeholder: "Ej: Se han revisado las observaciones",
        submitLabel: "Enviar",
    },
    "Cancelado" :{
        title: "Cambiar estado a Cancelado",
        description: "Deja un comentario para registrar la cancelación.",
        placeholder: "Ej: Cancelado...",
        submitLabel: "Confirmar"
    }
}

function getFileMeta(ticketFile) {
    const name = ticketFile?.originalName ?? ticketFile?.originalname ?? ""
    const size = ticketFile?.size ?? 0
    const mimetype = ticketFile?.mimetype ?? ""
    const uploadedAt = ticketFile?.uploadedAt ?? ""
    return { name, size, mimetype, uploadedAt }
}

function getArrayFilesMeta(ticketFiles) {
    if (!Array.isArray(ticketFiles)) return [];

    return ticketFiles.map((ticketFile) => ({
        name: ticketFile?.originalName ?? ticketFile?.originalname ?? "",
        size: ticketFile?.size ?? 0,
        mimetype: ticketFile?.mimetype ?? "",
        uploadedAt: ticketFile?.uploadedAt ?? "",
        filename: ticketFile?.filename ?? "",
        path: ticketFile?.path ?? "",
    }));
}

function Information({ 
    form, editing, selectedFile, onChangeField, onPickFile, 
    onClearFile, inputRef, download, loadingDownload, fileSustentos, setFileSustentos, error, setError
}) {

    const existingSustento = useMemo(
        () => getArrayFilesMeta(form?.sustentos),
        [form?.sustentos]
    );
    // const picked = selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null
    // const meta = picked ?? existingSustento

    return (
        <div className="p-6">
            <section className="space-y-4 mb-6">
                <h2 className="font-semibold text-blue-500">Información</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Proyecto</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Ingresa nombre de proyecto"
                            value={form?.nombre_proyecto ?? ""}
                            disabled
                            onChange={(e) => onChangeField("nombre_proyecto", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Identificador</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Ingresa identificador"
                            value={form?.identificador ?? ""}
                            disabled
                            onChange={(e) => onChangeField("identificador", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Proveedor</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Proveedor"
                            value={form?.proveedor ?? ""}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">OC</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="OC"
                            value={form?.oc ?? 0}
                            disabled
                            // onChange={(e) => onChangeField("requester", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Línea OC</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Línea OC"
                            value={form?.linea_oc ?? ""}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                    {/* <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">OC</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="OC"
                            value={formatCurrency(form?.oc ?? 0)}
                            disabled
                        />
                    </div> */}
                </div>

                <h2 className="font-semibold text-blue-500 pt-4">Detalles</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">RQ PEXT</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="RQ PEXT"
                            value={form?.rq_pext ?? ""}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">RQ PINT</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="RQ PINT"
                            value={form?.rq_pint ?? ""}
                            disabled
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">ID Planner NE</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="ID Planner NE"
                            value={form?.id_planner_ne ?? ""}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">ID Planner FE</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="ID Planner FE"
                            value={form?.id_planner_fe ?? ""}
                            disabled
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">ID Transferencia Sitio</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="ID Transferencia Sitio"
                            value={form?.id_ticket_transferencia ?? ""}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                </div>

                <h2 className="font-semibold text-blue-500 pt-4">Evidencias</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <AttachmentsGrid 
                            files={existingSustento ?? []} 
                            download={download} 
                            editing={editing} 
                            inputRef={inputRef} 
                        />

                        {editing && (
                            <Dropzone
                                files={fileSustentos}
                                onFilesChange={setFileSustentos}
                                error={error}
                                setError={setError}
                                maxFiles={30}
                                onFile={setFileSustentos} 
                            />
                        )}

                    </div>
                </div>

                {/* <h2 className="font-semibold text-blue-500">Seguimiento</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Etapa actual</div>
                                    <div className="mt-1 text-lg font-semibold text-[#2b7fff]">{getStageLabel(form.currentStage)}</div>
                                </div>
                             
                            </div>

                            <div className="mt-4 flex items-center overflow-x-auto pb-1">
                                <MiniStep
                                    title="Hito 1"
                                    status={form?.hito1?.status}
                                    active={form?.currentStage === "hito1"}
                                />
                                <MiniStep
                                    title="Hito 2"
                                    status={form?.hito2?.status}
                                    active={form?.currentStage === "hito2"}
                                    last
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <TimelineItem
                                title="Hito 1 · Validación inicial"
                                data={form?.hito1}
                                currentStage={"hito1"}
                                active={form?.currentStage === "hito1"}
                                done={form?.hito1?.status === "cerrado"}
                                startStateChange={startStateChange}
                            />
                            <TimelineItem
                                title="Hito 2 · Validación final"
                                data={form?.hito2}
                                currentStage={"hito2"}
                                active={form?.currentStage === "hito2"}
                                done={form?.hito2?.status === "cerrado"}
                                startStateChange={startStateChange}
                            />
                        </div>

                    </div>
                </div> */}

            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="font-semibold text-blue-500 mt-6">Comentarios</h2>

                <div className="space-y-2">
                    {form?.comments?.length > 0 ? (
                        <div className="overflow-x-auto border-t">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">Acción</TableHead>
                                        <TableHead className="text-xs">Autor</TableHead>
                                        <TableHead className="text-xs">Comentario</TableHead>
                                        <TableHead className="text-xs">Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form?.comments.map((comment) => (
                                        <TableRow key={comment.id}>
                                            <TableCell className="text-sm">{comment.type}</TableCell>
                                            <TableCell className="text-sm">{comment.author.name}</TableCell>
                                            <TableCell className="text-sm">{comment.text}</TableCell>
                                            <TableCell className="text-sm">{formatDDMMYYYYHour(comment.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">No hay comentarios</div>
                    )}
                </div>
            </section>
        </div>
    )
}

const APPROVAL_OPTIONS = ["Aprobado", "Rechazado", "N/A"];
const YES_NO_OPTIONS = ["Sí", "No"];

const OBSERVATION_OPTIONS = [
    "Archivos de carpeta", 
    "Fotos de reporte", 
    "Fotos borrosas", 
    "Salida de Inventario", 
    "Estandar de Instalación", 
    "Actualización ID", 
    "Información de sitio", 
    "Certificado de calibración", 
    "Reporte de seguridad", 
    "Planner", 
    "Pantallazos de configuración", 
    "Registro de Matriz", 
    "RQ Pext", 
    "RQ Pint", 
    "RDF"
];

function getFieldOptions(field) {
    if (Array.isArray(field.options) && field.options.length > 0) {
        return field.options;
    }

    if (field.field_type === "approval") {
        return APPROVAL_OPTIONS;
    }

    if (field.field_key === "aplica_penalidad") {
        return YES_NO_OPTIONS;
    }

    if (field.field_key === "tipo_observacion") {
        return OBSERVATION_OPTIONS;
    }

    return [];
}

function getValueClass(value) {
    if (value === "Aprobado") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (value === "Rechazado") {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (value === "N/A") {
        return "border-slate-200 bg-slate-50 text-slate-600";
    }

    if (value === "Sí") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (value === "No") {
        return "border-slate-200 bg-slate-50 text-slate-600";
    }

    return "border-slate-200 bg-white text-muted-foreground";
}

function toInputDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
}

const DetailsByDeliverable = ({
    fieldsData = [],
    disabled = false,
    fields = [],
    setFields,
    onChangeFields,
}) => {

    console.log("DETAILS BY DELIVERABLE", fieldsData)

    useEffect(() => {
        const sorted = [...fieldsData].sort(
            (a, b) => Number(a.order || 0) - Number(b.order || 0)
        );

        setFields(sorted);
    }, [fieldsData]);

    const updateField = (fieldId, value) => {
        setFields((prev) => {
            const next = prev.map((field) =>
                field._id === fieldId
                    ? {
                          ...field,
                          value,
                          estado:
                              value === null ||
                              value === "" ||
                              (Array.isArray(value) && value.length === 0)
                                  ? "Pendiente"
                                  : "Completado",
                      }
                    : field
            );

            onChangeFields?.(next);

            return next;
        });
    };

    const mainFields = useMemo(() => {
        return fields.filter((field) => field.required);
    }, [fields]);

    const extraFields = useMemo(() => {
        return fields.filter((field) => !field.required);
    }, [fields]);

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-blue-500">
                    Validación {fields?.[0]?.type_name ?? ""}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-1">
                    {mainFields.map((field) => (
                        <FieldRow
                            key={field._id}
                            field={field}
                            disabled={disabled}
                            onChange={(value) => updateField(field._id, value)}
                        />
                    ))}
                </div>

                {extraFields.length > 0 && (
                    <div className="space-y-3 rounded-lg border bg-slate-50/40 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-blue-500">
                                Campos adicionales
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Completar solo cuando aplique.
                            </p>
                        </div>

                        <div className="space-y-1">
                            {extraFields.map((field) => (
                                <FieldRow
                                    key={field._id}
                                    field={field}
                                    disabled={disabled}
                                    onChange={(value) =>
                                        updateField(field._id, value)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function FieldRow({ field, disabled, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-2 rounded-md px-2 py-2 transition hover:bg-muted/40 md:grid-cols-[1fr_220px] md:items-center">
            <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-700">
                    {field.field_label}

                    {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                    )}
                </Label>

                {field.estado === "Pendiente" && (
                    <p className="text-xs text-muted-foreground">
                        Pendiente de validación
                    </p>
                )}
            </div>

            <FieldControl
                field={field}
                disabled={disabled}
                onChange={onChange}
            />
        </div>
    );
}

function FieldControl({ field, disabled, onChange }) {
    const value = field.value;

    if (field.field_type === "approval" || field.field_type === "select") {
        return (
            <SingleSelectField
                field={field}
                value={value}
                disabled={disabled}
                onChange={onChange}
            />
        );
    }

    if (field.field_type === "date") {
        return (
            <Input
                type="date"
                disabled={disabled}
                value={toInputDate(value)}
                onChange={(e) => onChange(e.target.value || null)}
                className="h-8 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
            />
        );
    }

    if (field.field_type === "number") {
        return (
            <Input
                type="number"
                disabled={disabled}
                value={value ?? ""}
                placeholder="0"
                onChange={(e) => {
                    const nextValue = e.target.value;

                    onChange(nextValue === "" ? null : Number(nextValue));
                }}
                className="h-8 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
            />
        );
    }

    if (field.field_type === "multiSelect") {
        return (
            <MultiSelectField
                field={field}
                value={value}
                disabled={disabled}
                onChange={onChange}
            />
        );
    }

    return (
        <Input
            disabled={disabled}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
        />
    );
}

function SingleSelectField({ field, value, disabled, onChange }) {
    const options = getFieldOptions(field);

    return (
        <Select
            value={value ?? ""}
            disabled={disabled}
            onValueChange={onChange}
        >
            <SelectTrigger
                className={cn(
                    "h-8 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0",
                    getValueClass(value)
                )}
            >
                <SelectValue placeholder="Pendiente" />
            </SelectTrigger>

            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function MultiSelectField({ field, value, disabled, onChange }) {
    const options = getFieldOptions(field);
    const selected = Array.isArray(value) ? value : [];

    const toggleOption = (option) => {
        const exists = selected.includes(option);

        const next = exists
            ? selected.filter((item) => item !== option)
            : [...selected, option];

        onChange(next);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className="h-8 justify-start border-slate-200 bg-white text-left font-normal focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                >
                    {selected.length > 0 ? (
                        <span>{selected.length} seleccionado(s)</span>
                    ) : (
                        <span className="text-muted-foreground">
                            Seleccionar
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[280px] p-3" align="end">
                <div className="space-y-2">
                    {options.map((option) => (
                        <label
                            key={option}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                            <Checkbox
                                checked={selected.includes(option)}
                                onCheckedChange={() => toggleOption(option)}
                            />

                            <span>{option}</span>
                        </label>
                    ))}
                </div>

                {selected.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1 border-t pt-3">
                        {selected.map((item) => (
                            <Badge
                                key={item}
                                variant="outline"
                                className="bg-blue-50 text-blue-600"
                            >
                                {item}
                            </Badge>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}


export default function DeliverableDetails() {

    const { id } = useParams()
    const { 
        deliverable,
        loading,
        updateDeliverables,
        updateDeliverableStateApproved, updateDeliverableStateObserved, updateDeliverableStateReturn, updateDeliverableStateCancelled,
    } = useDeliverables({ code: id })

    const { deliverableFields } = useDeliverablesFields({ code: id })

    // console.log("deliverableFields", deliverableFields)

    const deliverabl = deliverable?.[0]

    const { downloadDeliverables, loadingDownload } = useDownloadFile({ code: id })

    const { user } = useAuth()
    const { can } = useAuthz()

    const [fileSustentos, setFileSustentos] = useState([]);
    const [error, setError] = useState(null);
    const inputRef = useRef(null)
    const [editing, setEditing] = useState(false)

    const [fields, setFields] = useState([]);

    const [form, setForm] = useState({
        id : id ?? "",
        name : "",
        requester : "",
        estado : "Pendiente"
    })

    //UI estados (dialogs)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [commentOpen, setCommentOpen] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [initValidate, setInitValidate] = useState(false)
    const [pendingNextState, setPendingNextState] = useState(null)
    const [saving, setSaving] = useState(false)

    const currentState = form?.estado ?? deliverabl?.estado ?? "Pendiente"

    const transitionKey = useMemo(() => {
        if (!currentState || !pendingNextState) return null
        if (pendingNextState === "Cancelado") return "Cancelado"
        return `${currentState}__${pendingNextState}`
    }, [pendingNextState])

    const [selectedFile, setSelectedFile] = useState(null)

    const requiresComment = Boolean(transitionKey && commentConfigByTransition[transitionKey])

    const onChangeField = (field, value) => setForm((p) => ({ ...(p ?? {}), [field]: value }))

    function onPickFile(file) {
        setSelectedFile(file)
    }

    function onClearFile() {
        setSelectedFile(null)
    }

    function startStateChange(nextState) {
        // 1) pedimos confirmación visual (moderno) -> AlertDialog
        setPendingNextState(nextState)
        setConfirmOpen(true)
    }

    useEffect(() => {
        if (deliverabl) {
            // importante: clon superficial para editar en UI sin mutar el objeto del hook
            // setForm({ ...ticket })
            setForm((prev) => ({ ...prev, ...deliverabl }))
            setSelectedFile(null)
            setEditing(false)
        }
    }, [deliverabl, id])

    function onConfirmProceed() {
        setConfirmOpen(false)

        // 2) si requiere comentario -> abrimos Dialog de comentario
        if (requiresComment) {
            setCommentText("")
            setCommentOpen(true)
            return
        }
        // 3) si no requiere -> enviamos de frente
        submitChangeState({ nextState: pendingNextState, comment: "" })
    }

    function onSubmitComment() {
        const nextState = pendingNextState
        const comment = commentText.trim()

        if (!nextState) return

        // comentario requerido -> validación simple
        if (!comment) {
            toast("Falta comentario", { description: "Por favor ingresa un comentario para continuar." })
            return
        }

        setCommentOpen(false)
        submitChangeState({ nextState, comment })
    }

    function changeEditing() {
        setEditing(!editing)
    }

    async function onSaveOnly() {
    
        const fd = new FormData();

        // console.log("DRAFTSITES", draftSites)
        fileSustentos.forEach((file) => {
            fd.append("fileEvidencias", file);
        });

        const payload = {
            code: id,
            general: {
                rq_pext: form?.rq_pext,
                rq_pint: form?.rq_pint,
                id_planner_ne: form?.id_planner_ne,
                id_planner_fe: form?.id_planner_fe,
                id_ticket_transferencia: form?.id_ticket_transferencia
            },
            fields: fields.map((field) => ({
                field_id: field._id,
                field_key: field.field_key,
                field_type: field.field_type,
                estado: field.estado,
                value: field.value,
            })),
            assigned_to: user?.firstName + " " + user?.lastName,
            assigned_to_email: user?.email,
            validator: user?.firstName + " " + user?.lastName,
            validator_email: user?.email,
        };

        console.log("payload", payload)
        console.log("fileEvidencias", fileSustentos)

        fd.append("payload", JSON.stringify(payload));
        const resp = await updateDeliverables(id, fd);

        if (resp.result !== "OK") {
            throw new Error(resp.msg || "No se pudo actualizar")
        }

        toast.success("Sitios actualizados correctamente")

    }

    async function submitChangeState({ nextState, comment }) {

        if (!form) return;

        try {

            const fd = new FormData();

            // const currentStage = form?.currentStage ?? "Pendiente";
            const current = form?.estado ?? currentState ?? "Pendiente";
            // const stageKey = currentStage === "hito1" ? "hito1" : "hito2";

            // Helpers de transición
            const isAproved = transitionKey === "Pendiente__Aprobado";
            const isObserved = transitionKey === "Pendiente__Observado";
            const isReturnPending = transitionKey === "Observado__Pendiente";
            const isCancelled = nextState === "Cancelado"; // desde cualquier estado

            // Armar payload dinámico según transición
            const payload = {
                patch: {
                    name: form.name ?? "",
                    requester: form.requester ?? "",
                    estado: nextState ?? current ?? "Pendiente",
                    
                    // isClose: isClose ? true : false,
                    // initValidate: initValidate ?? false,
                },

                // Solo aplica realmente para Observado -> Pendiente CT
                // replaceSites: Boolean(isReturnPending && selectedFile),

                // Si no hay archivo, puede enviarse [] / undefined
                // sites: sheetData?.[0] ?? [],
                // sites: sitesValidate.dataFinalInsertar,

                comment: comment
                    ? {
                        text: comment,
                        type: `${current} -> ${nextState}`,
                        author: {
                            name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
                            email: user?.email ?? "",
                        },
                        clientAt: new Date().toISOString(),
                    }
                    : null,
            };

            // console.log("PAYLOAD", payload)

            fd.append("payload", JSON.stringify(payload));

            const deliverableId = form?._id ?? "";
            if (!deliverableId) throw new Error("No se encontró deliverableId para actualizar.");

            // ============================
            // Ejecutar API según transición
            // ============================
            let resp;

            if (isAproved) {
                resp = await updateDeliverableStateApproved(deliverableId, fd);
            } else if(isObserved) {
                resp = await updateDeliverableStateObserved(deliverableId, fd);
            } else if (isReturnPending) {
                resp = await updateDeliverableStateReturn(deliverableId, fd);
            } else if (isCancelled) {
                resp = await updateDeliverableStateCancelled(deliverableId, fd);
            } else {
                throw new Error(`Transición no soportada: ${transitionKey}`);
            }
            
            setEditing(false);
            setCommentText("");

            toast.success("Estado actualizado", {
                description: `El ticket ${form.code ?? id} pasó a "${nextState}".`,
            });

            return resp;

        } catch (err) {
            console.log(err);
            toast.error("No se pudo actualizar el estado", {
                description: err?.message ?? "Error desconocido",
            });
        }

    }

    if (loading || deliverabl === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Cargando ticket...</h1>
                </div>
            </div>
        )
    }

    if (!deliverabl) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Ticket no encontrado</h1>
                    <Link to="/budget/analytics/deliverables" className="mt-4 inline-block text-blue-600 hover:underline">
                        Volver a la lista
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/budget/analytics/deliverables"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/budget/analytics/deliverables" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Entregables
                            </Link>
                            <span className="text-gray-400"> / </span>
                            <span className="text-[#2b7fff]">{id}</span>
                        </h2>
                    </div>
                </div>

                {/* Main */}
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
                                            <h1 className="text-lg font-medium text-gray-400">{deliverabl?.name}</h1>
                                        </div>
                                    </div>
                                </div>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className={"cursor-pointer " + STATUS_TICKET[deliverabl?.estado][0]}>
                                            {deliverabl?.estado ?? "Acción"}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-60">
                                        <DropdownMenuItem className="cursor-pointer" onClick={changeEditing}>
                                            {editing ? "Deshabilitar" : "Habilitar campos para editar"}
                                        </DropdownMenuItem>

                                        <Separator />

                                        <DropdownMenuItem className="cursor-pointer" onClick={onSaveOnly} disabled={saving}>
                                            Guardar
                                        </DropdownMenuItem>

                                        <Separator />

                                        {/* Cambios de estado */}
                                        {currentState === "Pendiente" && can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_UPDATE_MASTER) && (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Aprobado")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Aprobado"][0]}>Aprobado</Badge>
                                            </DropdownMenuItem>
                                            <Separator />
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Observado")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Observado"][0]}>Observado</Badge>
                                            </DropdownMenuItem>
                                            <Separator />
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Cancelado")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Cancelado"][0]}>Cancelado</Badge>
                                            </DropdownMenuItem>
                                            </>
                                        )}

                                        {currentState === "Aprobado" && (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Cancelado")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Cancelado"][0]}>Cancelado</Badge>
                                            </DropdownMenuItem>
                                            </>
                                        )}

                                        {currentState === "Observado" && (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Pendiente")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Pendiente"][0]}>Pendiente</Badge>
                                            </DropdownMenuItem>
                                            </>
                                        )}

                                        {currentState === "Cancelado" && can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_UPDATE_MASTER) &&  (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Pendiente")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Pendiente"][0]}>Pendiente</Badge>
                                            </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <Tabs className="" defaultValue="Información">
                            <TabsList className="mb-4">
                                <TabsTrigger value="Información" className="py-4 px-10 my-2 cursor-pointer">Información</TabsTrigger>
                                <TabsTrigger value="Detalles" className="py-4 px-10 my-2 cursor-pointer">{deliverabl?.type_code}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="Información">
                                <div className="rounded-2xl bg-white relative">
                                    <div className="relative">
                                        <div className="relative min-h-44">
                                            <div className="contain-inline-size flex">
                                                <div className="w-full">    
                                                    <Information 
                                                        form={form}
                                                        editing={editing}
                                                        selectedFile={selectedFile}
                                                        onChangeField={onChangeField}
                                                        onPickFile={onPickFile}
                                                        onClearFile={onClearFile}
                                                        inputRef={inputRef}
                                                        download={downloadDeliverables}
                                                        // downloadAllSustentos={downloadAllSustentos}
                                                        loadingDownload={loadingDownload}

                                                        fileSustentos={fileSustentos}
                                                        setFileSustentos={setFileSustentos}
                                                        error={error}
                                                        setError={setError}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="Detalles">
                                <div className="rounded-2xl bg-white relative">
                                    <div className="relative">
                                        <div className="relative min-h-44">
                                            <div className="contain-inline-size flex">
                                                <div className="w-full">    
                                                    <DetailsByDeliverable 
                                                        fieldsData={deliverableFields}
                                                        disabled={!editing}
                                                        fields={fields}
                                                        setFields={setFields}
                                                        onChangeFields={(fields) => {
                                                            // console.log("fields actualizados", fields);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Confirmación (AlertDialog moderno) */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas el cambio de estado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se cambiará el Entregable <span className="font-medium">{form?.code ?? id}</span> de{" "}
                            <Badge>{currentState}</Badge> a{" "}
                            <Badge>{pendingNextState}</Badge>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onConfirmProceed} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continuar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Comentarios (Dialog) */}
            <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{commentConfigByTransition[transitionKey]?.title ?? "Comentario"}</DialogTitle>
                        <DialogDescription>{commentConfigByTransition[transitionKey]?.description ?? "Ingresa un comentario."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Comentario</Label>
                        <Textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={commentConfigByTransition[transitionKey]?.placeholder ?? "Escribe aquí..."}
                            className="min-h-[70px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCommentOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={onSubmitComment} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {commentConfigByTransition[transitionKey]?.submitLabel ?? "Enviar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}