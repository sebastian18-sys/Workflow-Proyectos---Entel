import AttachmentsGrid from "@/components/AttachmentGrid/AttachmentGrid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PERMS } from "@/constants/perm";
import { useDownloadFile } from "@/hooks/budget/capex/useDownloadFile";
import { useSettlements } from "@/hooks/budget/capex/useSettlements";
import { useSettlementsSites } from "@/hooks/budget/capex/useSettlementsSites";
import { useAuth } from "@/hooks/useAuth";
import { useAuthz } from "@/hooks/useAuthz";
import { formatCurrency, formatDDMMYYYYHour } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronDown, Loader2, NotebookTabs } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "wc-toast";


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


function Information({ 
    form, editing, selectedFile, onChangeField, onPickFile, 
    onClearFile, inputRef, download, loadingDownload, error, setError
}) {

    const existing = useMemo(() => getFileMeta(form?.file), [form?.file])
    const picked = selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null

    const meta = picked ?? existing

    console.log("FORM", form)

    // const existing = useMemo(() => getFileMeta(form?.file), [form?.file])
    return (
        <div className="p-6">
            <section className="space-y-4 mb-6">
                <h2 className="font-semibold text-blue-500">Información</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Nombre</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Ingresa nombre de ticket"
                            value={form?.name ?? ""}
                            disabled={!editing}
                            onChange={(e) => onChangeField("name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Solicitante</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Ingresa solicitante"
                            value={form?.requester ?? ""}
                            disabled
                            onChange={(e) => onChangeField("requester", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Q</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Sitios"
                            value={form?.count ?? 0}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Monto</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Monto"
                            value={formatCurrency(form?.amount ?? 0)}
                            disabled
                            // onChange={(e) => onChangeField("requester", e.target.value)}
                        />
                    </div>
                    {/* <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Monto Pago Hito 1</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Monto"
                            value={formatCurrency(form?.amount_h1 ?? 0)}
                            disabled
                            // onChange={(e) => onChangeField("requester", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Monto Pago Hito 2</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Monto"
                            value={formatCurrency(form?.amount_h2 ?? 0)}
                            disabled
                            // onChange={(e) => onChangeField("requester", e.target.value)}
                        />
                    </div> */}
                </div>
                {/* <div className="space-y-2">
                    <h2 className="font-semibold text-blue-500">Detalles</h2>
                    <div className="max-h-[320px] overflow-auto rounded-2xl">
                        <Table className="w-full table-fixed border">
                        <TableHeader>
                            <TableRow className="hover:bg-white">
                            <TableHead className="sticky top-0 z-20 bg-white text-sm text-muted-foreground">
                                Monto OC
                            </TableHead>
                            <TableHead className="sticky top-0 z-20 bg-white text-sm text-muted-foreground">
                                Hito 1
                            </TableHead>
                            <TableHead className="sticky top-0 z-20 bg-white text-sm text-muted-foreground">
                                Hito 2
                            </TableHead>
                            <TableHead className="sticky top-0 z-20 bg-white text-sm text-muted-foreground">
                                Pendiente
                            </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {!form ? (
                                <TableRow>
                                    <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                    >
                                    No hay grupos para mostrar
                                    </TableCell>
                                </TableRow>
                                ) : (
                            
                                    <TableRow key={form?._id} className="align-top">
                                        <TableCell className="p-2 font-medium">
                                            {formatCurrency(form?.amount_total)}
                                        </TableCell>

                                        <TableCell className="p-2 text-sm text-slate-500">
                                            {formatCurrency(form?.amount_h1)}
                                        </TableCell>

                                        <TableCell className="p-2 text-sm text-slate-500">
                                            {formatCurrency(form?.amount_h2)}
                                        </TableCell>

                                        <TableCell className="p-2 text-sm text-slate-500">
                                            {formatCurrency(form?.amount_total - form?.amount_h1 - form?.amount_h2)}
                                        </TableCell>

                                    </TableRow>
                                    )
                                }
                        </TableBody>
                        </Table>
                    </div>
                </div> */}

                <h2 className="font-semibold text-blue-500">Formato CR</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <AttachmentsGrid files={[meta] ?? []} download={download} editing={editing} inputRef={inputRef} />

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


const EditableTable = ({
    rows = [],
    setRows,
    disabled = false,
}) => {
   
    const sortedRows = useMemo(() => {
        const getNroValue = (nro) => {
            const match = String(nro ?? "").match(/\d+/)
            return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
        }

        return [...rows].sort((a, b) => {
            const aNro = getNroValue(a.nro)
            const bNro = getNroValue(b.nro)

            if (aNro !== bNro) return aNro - bNro

            // opcional: desempate para que quede estable
            return String(a.identificador ?? "").localeCompare(String(b.identificador ?? ""))
        })
    }, [rows])

    const updateCell = (id, field, value) => {

        setRows((prev) =>
            prev.map((row) =>
                row._id === id ? { ...row, [field]: value } : row
            )
        )
    }

    const handleNumberChange = (id, field, value) => {
        updateCell(id, field, value.replace(",", "."))
    }

    return (
        // <div className="overflow-x-auto rounded-2xl border bg-white">
        <div className="max-h-[520px] overflow-auto rounded-2xl">
        <Table className="min-w-[1100px] ">
        {/* <Table className="w-full table-fixed"> */}
            <TableHeader className="sticky top-0 z-20 bg-white backdrop-blur shadow-sm">
                <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="min-w-[230px] bg-white-100 font-semibold text-[#64748B]">
                        IDENTIFICADOR
                    </TableHead>
                    <TableHead className="min-w-[420px] bg-white-100 font-semibold text-[#64748B]">
                        SITIO
                    </TableHead>
                    <TableHead className="min-w-[100px] bg-white-100 font-semibold text-[#64748B]">
                        ACTIVIDAD
                    </TableHead>
                    <TableHead className="min-w-[180px] bg-white-100 font-semibold text-[#64748B]">
                        SOLUCIÓN
                    </TableHead>
                    <TableHead className="min-w-[80px] bg-white-100 font-semibold text-[#64748B] text-center">
                        PROYECTO
                    </TableHead>
                    <TableHead className="min-w-[150px] bg-white-100 font-semibold text-[#64748B] text-left">
                        LÍNEA INVERSIÓN
                    </TableHead>
                    <TableHead className="min-w-[120px] bg-white-100 font-semibold text-[#64748B] text-left">
                        RQ
                    </TableHead>
                    <TableHead className="min-w-[120px] bg-white-100 font-semibold text-[#64748B] text-left">
                        OC
                    </TableHead>
                    <TableHead className="min-w-[120px] bg-white-100 font-semibold text-[#64748B] text-left">
                        LINEA OC
                    </TableHead>
                    <TableHead className="min-w-[120px] bg-white-100 font-semibold text-[#64748B] text-left">
                        MONTO OC
                    </TableHead>
                    <TableHead className="min-w-[150px] bg-white-100 font-semibold text-[#64748B] text-left">
                        CANTIDAD
                    </TableHead>
                    <TableHead className="min-w-[300px] bg-white-100 font-semibold text-[#64748B] text-left">
                        MONTO A PAGAR
                    </TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {rows.length === 0 ? (
                    <TableRow>
                    <TableCell
                        colSpan={5}
                        className="h-24 text-center text-sm text-muted-foreground"
                    >
                        No hay registros
                    </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                    <TableRow key={row._id}>
                        <TableCell className="p-2">
                            <Input
                                value={row.identificador ?? ""}
                                // onChange={(e) =>
                                //     updateCell(row._id, "identificador", e.target.value)
                                // }
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.sitio ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.actividad ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.solucion ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.nombre_proyecto ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.linea_inversion ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.rq ?? ""}
                                // onChange={(e) =>
                                //     updateCell(row._id, "rq", e.target.value)
                                // }
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.oc ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.linea_oc ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="p-2">
                            <Input
                                value={row.monto_oc ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>


                        <TableCell className="p-2">
                            <Input
                                type="number"
                                step="any"
                                value={row.cantidad ?? ""}
                                onChange={(e) =>
                                    handleNumberChange(row._id, "cantidad", e.target.value)
                                }
                                disabled={disabled}
                                className="border-0 text-center shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="p-2">
                            <Input
                                type="number"
                                step="any"
                                value={row.precio_unitario ?? ""}
                                onChange={(e) =>
                                    handleNumberChange(row._id, "precio_unitario", e.target.value)
                                }
                                disabled={disabled}
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        {/* <TableCell className="p-2">
                            {disabled ? (
                                <div
                                    className={cn(
                                        "inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                                        STATUS_TICKET[row.estado][0]
                                    )}
                                >
                                    <span
                                        className={cn(
                                        "h-2 w-2 rounded-full shrink-0",
                                        STATUS_TICKET[row.estado][1]
                                        )}
                                    />
                                    <span>{row.estado ?? "Sin estado"}</span>
                                </div>
                            ) : (
                                <Select
                                    value={row.estado ?? ""}
                                    onValueChange={(value) => updateCell(row._id, "estado", value)}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "w-[130px] border-0 shadow-none text-xs focus:ring-0 focus:ring-offset-0",
                                            STATUS_TICKET[row.estado][0]
                                        )}
                                    >
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {Object.keys(STATUS_TICKET).map((estado) => (
                                            <SelectItem key={estado} value={estado}>
                                                <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                    "h-2 w-2 rounded-full shrink-0",
                                                    STATUS_TICKET[estado][1]
                                                    )}
                                                />
                                                <span>{estado}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </TableCell> */}  

                    </TableRow>
                    ))
                )}
                </TableBody>
        </Table>
        </div>
    )
}


export default function SettlementDetails() {

    const { id } = useParams()
    const { 
        settlement,
        loading,
        updateStateApproved, updateStateObserved, updateStateReturn, updateStateCancelled
    } = useSettlements({ code: id })
    const { settlementSite } = useSettlementsSites({ code: id })
    const settlemen = settlement?.[0]

    const { download, loadingDownload } = useDownloadFile({ code: id })
    const { user } = useAuth()
    const { can } = useAuthz()

    const [draftSites, setDraftSites] = useState([])

    const cloneSites = (sites = []) =>
        sites.map((item) => ({
            ...item,
            identificador: item.identificador ?? "",
            sitio: item.sitio ?? "",
            actividad: item.actividad ?? "",
            estado: item.estado ?? "",
            nombre_proyecto: item.nombre_proyecto ?? "",
            linea_inversion: item.linea_inversion ?? "",
            rq: item.rq ?? "",
            oc: item.oc ?? "",
            linea_oc: item.linea_oc ?? "",
            monto_oc: item.monto_oc ?? "",
            cantidad: item.cantidad ?? "",
            precio_unitario: item.precio_unitario ?? "",
        })
    )

    const [error, setError] = useState(null);
    const { downloadCR } = useDownloadFile({ code: id })
    const inputRef = useRef(null)
    const [editing, setEditing] = useState(false)
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

    const currentState = form?.estado ?? settlemen?.estado ?? "Pendiente"

    const transitionKey = useMemo(() => {
        if (!currentState || !pendingNextState) return null
        if (pendingNextState === "Cancelado") return "Cancelado"
        return `${currentState}__${pendingNextState}`
    }, [pendingNextState])


    useEffect(() => {
        if (!editing) {
            setDraftSites(cloneSites(settlementSite || []))
        }
    }, [settlementSite, editing])

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
        if (settlemen) {
            // importante: clon superficial para editar en UI sin mutar el objeto del hook
            // setForm({ ...ticket })
            setForm((prev) => ({ ...prev, ...settlemen }))
            setSelectedFile(null)
            setEditing(false)
        }
    }, [settlemen, id])

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

        console.log("DRAFTSITES", draftSites)

        const payload = {
            code: id,
            items: draftSites.map((item) => ({
                _id: item._id,
                estado: item.estado,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario
            }))
        }

        fd.append("payload", JSON.stringify(payload));
        // const resp = await updatePaymentsSites(id, fd);

        // if (resp.result !== "OK") {
        //     throw new Error(resp.msg || "No se pudo actualizar")
        // }

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

            const settlementId = form?._id ?? "";
            if (!settlementId) throw new Error("No se encontró settlementId para actualizar.");

            // ============================
            // Ejecutar API según transición
            // ============================
            let resp;

            if (isAproved) {
                resp = await updateStateApproved(settlementId, fd);
            } else if(isObserved) {
                resp = await updateStateObserved(settlementId, fd);
            } else if (isReturnPending) {
                resp = await updateStateReturn(settlementId, fd);
            } else if (isCancelled) {
                resp = await updateStateCancelled(settlementId, fd);
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

    if (loading || settlemen === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Cargando ticket...</h1>
                </div>
            </div>
        )
    }

    if (!settlemen) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Ticket no encontrado</h1>
                    <Link to="/budget/analytics/settlement" className="mt-4 inline-block text-blue-600 hover:underline">
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
                            to="/budget/analytics/settlement"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/budget/analytics/settlement" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Liquidaciones
                            </Link>
                            <span className="text-gray-400"> / </span>
                            <span className="text-[#2b7fff]">{id}</span>
                        </h2>
                    </div>
                    <div>
                        {/* Button to download files with icon color white border gray */}
                        {/* <Button size="icon" onClick={onDownloadSites} className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0">
                            <Download className="h-4 w-4" /> Descargar Sitios
                        </Button> */}
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
                                            <h1 className="text-lg font-medium text-gray-400">{settlemen.name}</h1>
                                        </div>
                                    </div>
                                </div>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className={"cursor-pointer " + STATUS_TICKET[settlemen.estado][0]}>
                                            {settlemen.estado ?? "Acción"}
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
                                <TabsTrigger value="Detalles" className="py-4 px-10 my-2 cursor-pointer">Detalles</TabsTrigger>
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
                                                        download={download}
                                                        // downloadAllSustentos={downloadAllSustentos}
                                                        loadingDownload={loadingDownload}

                                                        // fileSustentos={fileSustentos}
                                                        // setFileSustentos={setFileSustentos}
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
                                                    <EditableTable 
                                                        rows={draftSites}
                                                        setRows={setDraftSites}
                                                        disabled={!editing}
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
                            Se cambiará el ticket <span className="font-medium">{form?.code ?? id}</span> de{" "}
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