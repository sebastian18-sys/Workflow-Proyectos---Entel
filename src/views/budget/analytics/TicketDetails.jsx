import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useTickets } from "@/hooks/budget/capex/useTickets"
import { formatCurrency, formatDDMMYYYYHour } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
import { ArrowLeft, ChevronDown, Download, FileDown, FileText, Loader2, NotebookTabs, Trash2, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "wc-toast"
import * as XLSX from "xlsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/useAuth"
import { useDownloadFile } from "@/hooks/budget/capex/useDownloadFile"
import { validateTemplateTickets } from "@/lib/validateTemplate"
import { useAuthz } from "@/hooks/useAuthz"
import { PERMS } from "@/constants/perm"
import validatePa from "@/lib/validatePa"
import { useContracts } from "@/hooks/budget/capex/useContracts"
import { StatusModal } from "@/components/StatusModal/StatusModal"
import { useProjectsByLlaveCapex } from "@/hooks/budget/capex/useProjectsByLlave"
import AttachmentsGrid from "@/components/AttachmentGrid/AttachmentGrid"
import { SITIOS } from "@/constants/maestros"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTicketSites } from "@/hooks/budget/capex/useTicketSites"
import Dropzone from "@/components/drag_drop/drag_drop"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { buildGenerateRQRowForTemplate, buildTicketSitesRowForTemplate, exportRQTemplateToXlsx, exportTicketSitesToXlsx } from "@/lib/exportExcel"
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy"


const STATUS_TICKET = {
    "Pendiente CT": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Enviado a MG": ["bg-blue-100 text-blue-700 hover:bg-blue-200", "bg-blue-500 outline-blue-500/20"],
    "RQ Generado": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"],
    "Observado": ["bg-red-100 text-red-700 hover:bg-red-200", "bg-red-500 outline-red-500/20"],
    "Cancelado": ["bg-gray-100 text-gray-700 hover:bg-gray-200", "bg-gray-500 outline-gray-500/20"],

    // Pagos
    "Intención de Pago": ["bg-amber-200 text-amber-700 hover:bg-amber-200", "bg-amber-500 outline-amber-500/20"],
    "Pago Enviado a MG": ["bg-sky-200 text-sky-700 hover:bg-sky-200", "bg-sky-500 outline-sky-500/20"],
    "Pago Generado": ["bg-green-300 text-green-700 hover:bg-green-200", "bg-green-500 outline-green-500/20"],
    "Intención de Pago - Hito 2": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Pago Enviado a MG - Hito 2": ["bg-sky-200 text-sky-700 hover:bg-sky-200", "bg-sky-500 outline-sky-500/20"],
    "Pago Generado - Hito 2": ["bg-green-300 text-green-700 hover:bg-green-200", "bg-green-500 outline-green-500/20"],
}

const commentConfigByTransition = {
    "Pendiente CT__Enviado a MG": {
        title: "Cambiar estado a Enviado a MG",
        description: "Deja un comentario para registrar el ticket.",
        placeholder: "Ej: Registrado en Jira...",
        submitLabel: "Enviar",
    },
    "Pendiente CT__Observado": {
        title: "Cambiar estado a Observado",
        description: "Indica el motivo de la observación.",
        placeholder: "Ej: Información incompleta / archivo inválido / falta aprobación ...",
        submitLabel: "Observar",
    },
    "Observado__Pendiente CT": {
        title: "Cambiar estado a Pendiente CT",
        description: "Comentario",
        placeholder: "Ej: Se han revisado las observaciones",
        submitLabel: "Enviar",
    },
    "Enviado a MG__RQ Generado": {
        title: "Cambiar estado a RQ Generado",
        description: "Deja un comentario para registrar la RQ.",
        placeholder: "Ej: Registrado en RQ...",
        submitLabel: "Confirmar",
    },
    "Enviado a MG__Observado": {
        title: "Cambiar estado a Observado",
        description: "Indica el motivo de la observación.",
        placeholder: "Ej: Información incompleta / archivo inválido / falta aprobación ...",
        submitLabel: "Observar",
    },
    "Cancelado" :{
        title: "Cambiar estado a Cancelado",
        description: "Deja un comentario para registrar la cancelación.",
        placeholder: "Ej: Cancelado...",
        submitLabel: "Confirmar",
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

const extractNroOrder = (nro) => {
    const match = String(nro ?? "").match(/\d+/)
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

const buildGroupedRqRows = (rows = []) => {

    const map = new Map()

    rows.forEach((item) => {
        const key = item.nro ?? ""

        if (!key) return

        if (!map.has(key)) {
            map.set(key, {
                nro: key,
                estado: item.estado ?? "Pendiente CT",
                rq: item.rq ?? "",
                comentarios: item.comentarios ?? "",
                totalItems: 1,
                monto: item.total_cotizacion ?? 0
            })
        } else {
            map.get(key).totalItems += 1
            map.get(key).monto += item.total_cotizacion ?? 0
        }
    })

    return [...map.values()].sort(
        (a, b) => extractNroOrder(a.nro) - extractNroOrder(b.nro)
    )
}

function normalize(text = "") {
    return String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

const Information = ({
    form,
    editing,
    selectedFile,
    onChangeField,
    onPickFile,
    onClearFile,
    inputRef,
    download,
    downloadAllSustentos,
    loadingDownload,

    fileSustentos,
    setFileSustentos,
    error,
    setError
}) => {

    const existing = useMemo(() => getFileMeta(form?.file), [form?.file])
    const existingSustento = useMemo(
        () => getArrayFilesMeta(form?.sustentos),
        [form?.sustentos]
    );
    const picked = selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null
    const meta = picked ?? existing
    const hasAnyFile = Boolean(meta?.name)

    // Download File
    const handleDownload = async () => {

        const resp = await download()

        const blob = resp
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = form?.file?.originalName || "archivo.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    }

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
                            value={form?.ticket_name ?? ""}
                            disabled={!editing}
                            onChange={(e) => onChangeField("ticket_name", e.target.value)}
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
                        <Label className="text-sm text-muted-foreground">Q Sitios</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Sitios"
                            value={form?.sites_count ?? 0}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Monto Total</Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Monto"
                            value={formatCurrency(form?.total_cotizacion ?? 0)}
                            disabled
                            // onChange={(e) => onChangeField("requester", e.target.value)}
                        />
                    </div>
                </div>

                <h2 className="font-semibold text-blue-500">Formato RQ</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <AttachmentsGrid 
                            files={[meta] ?? []} 
                            download={download} 
                            downloadAllSustentos={downloadAllSustentos} 
                            loadingDownload={loadingDownload}
                            editing={editing} 
                            inputRef={inputRef} 
                        />

                    </div>
                </div>
                

                <h2 className="font-semibold text-blue-500">Sustento</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <AttachmentsGrid 
                            files={existingSustento ?? []} 
                            download={download} 
                            downloadAllSustentos={downloadAllSustentos} 
                            loadingDownload={loadingDownload}
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

    // console.log("rows", rows)


    // GET OC from rqProy by rq in rows
    // const getOcFromRq = (rq) => {
    //     let oc = crProy.find(r => r.rq === rq)?.nro_oc
        
    //     oc == 0 ? oc = "" : oc

    //     return oc
    // }

    // // Add key oc in rows
    
    // rows.forEach(r => {
    //     const oc = getOcFromRq(r.rq)
    //     r.oc = oc
    // })

    // const rowsWithLineaOC = useMemo(() => {
    //     return attachLineaOC(sortedRows, crProy);
    // }, [sortedRows, crProy]);

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
                    <TableHead 
                        style={{ left: 0, width: 80, minWidth: 80 }}
                        className="py-0 min-w-[80px] bg-white-100 font-semibold text-[#64748B] sticky z-50 bg-slate-50"
                    >
                        NRO
                    </TableHead>
                    <TableHead
                        style={{ left: 80, width: 280, minWidth: 280 }}
                        className="py-0 min-w-[230px] bg-white-100 font-semibold text-[#64748B] sticky z-50 bg-slate-50"
                    >
                        IDENTIFICADOR
                    </TableHead>
                    <TableHead
                        style={{ left: 280, width: 380, minWidth: 380 }}
                        className="py-0 min-w-[420px] bg-white-100 font-semibold text-[#64748B] sticky z-50 bg-slate-50 border-r-2"
                    >
                        SITIO
                    </TableHead>
                    <TableHead className="py-0 min-w-[420px] bg-white-100 font-semibold text-[#64748B]">
                        SUSTENTO
                    </TableHead>
                    <TableHead className="py-0 min-w-[100px] bg-white-100 font-semibold text-[#64748B]">
                        ACUERDO
                    </TableHead>
                    <TableHead className="py-0 min-w-[180px] bg-white-100 font-semibold text-[#64748B]">
                        PROVEEDOR
                    </TableHead>
                    <TableHead className="py-0 min-w-[80px] bg-white-100 font-semibold text-[#64748B] text-center">
                        CANTIDAD
                    </TableHead>
                    <TableHead className="py-0 min-w-[150px] bg-white-100 font-semibold text-[#64748B] text-left">
                        PRECIO UNITARIO
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-[#64748B] text-left">
                        PROYECTO
                    </TableHead>
                    <TableHead className="py-0 min-w-[300px] bg-white-100 font-semibold text-[#64748B]">
                        LINEA DE INVERSION
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-[#64748B] text-left">
                        ESTADO
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-left border-l border-b bg-blue-50 text-blue-800 border-blue-200">
                        RQ
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-left bg-blue-50 text-blue-800 border-blue-200">
                        OC
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-left bg-blue-50 text-blue-800 border-blue-200">
                        LINEA OC
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-left bg-blue-50 text-blue-800 border-blue-200">
                        CR 1
                    </TableHead>
                    <TableHead className="py-0 min-w-[120px] bg-white-100 font-semibold text-left bg-blue-50 text-blue-800 border-blue-200">
                        CR 2
                    </TableHead>
                    <TableHead className="py-0 min-w-[150px] bg-white-100 font-semibold text-left border-r border-b bg-blue-50 text-blue-800 border-blue-200">
                        PAGADO
                    </TableHead>
                    <TableHead className="py-0 min-w-[300px] bg-white-100 font-semibold text-[#64748B] text-left">
                        COMENTARIOS
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
                    sortedRows.map((row) => (
                    <TableRow key={row._id}>
                        <TableCell 
                            style={{ left: 0, width: 80, minWidth: 80 }}
                            className="py-0 sticky z-10 bg-white"
                        >
                            <Input
                                value={row.nro ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1 "
                            />
                        </TableCell>
                        <TableCell 
                            style={{ left: 60, width: 280, minWidth: 280 }}
                            className="py-0 sticky z-10 bg-white"
                        >
                            <Input
                                value={row.identificador ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "identificador", e.target.value)
                                }
                                disabled={disabled}
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell 
                            className="py-0 sticky z-10 bg-white border-r-2"
                            style={{ left: 300, width: 380, minWidth: 380 }}
                        >
                            <Input
                                value={row.sitio ?? ""}
                                disabled
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>
                        <TableCell className="py-0 min-w-[420px] whitespace-normal">
                            <Textarea
                                value={row.sustento ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "sustento", e.target.value)
                                }
                                disabled={disabled}
                                rows={2}
                                resize={false}
                                // className="border-0 shadow-none focus-visible:ring-1 resize-none"
                                className="min-h-[20px] border-0 shadow-none focus-visible:ring-1 resize-none pt-5 pb-3"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Input
                                value={row.acuerdo_compras ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "acuerdo_compras", e.target.value)
                                }
                                disabled={disabled}
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Input
                                value={row.proveedor ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "proveedor", e.target.value)
                                }
                                disabled={disabled}
                                className="border-0 shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
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

                        <TableCell className="py-0">
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
                        <TableCell className="py-0">
                            <Textarea
                                value={row.nombre_proyecto ?? ""}
                                disabled
                                // className="border-0 shadow-none focus-visible:ring-1 resize-none"
                                className="min-h-[20px] border-0 shadow-none focus-visible:ring-1 resize-none pt-5 pb-3"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Textarea
                                value={row.linea_inversion ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "linea_inversion", e.target.value)
                                }
                                rows={2}
                                disabled={disabled}
                                // className="border-0 shadow-none focus-visible:ring-1 resize-none"
                                className="min-h-[20px] border-0 shadow-none focus-visible:ring-1 resize-none pt-5 pb-3"
                            />
                        </TableCell>
                        

                        <TableCell className="py-0">
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
                        </TableCell>

                        <TableCell className="py-0 border-l">
                            <Input
                                value={row.rq ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "rq", e.target.value)
                                }
                                disabled={disabled}
                                className="border-0 font-medium shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Input
                                value={row.oc ?? ""}
                                disabled={true}
                                className="border-0 font-medium shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Input
                                value={row.linea_oc ?? ""}
                                disabled={true}
                                className="border-0 font-medium shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Input
                                value={row.cr_list[0] ?? ""}
                                disabled={true}
                                className="border-0 font-medium shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Input
                                value={row.cr_list[1] ?? ""}
                                disabled={true}
                                className="border-0 font-medium shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0 border-r">
                            <Input
                                value={row.importe_ac ?? ""}
                                disabled={true}
                                className="border-0 font-medium shadow-none focus-visible:ring-1"
                            />
                        </TableCell>

                        <TableCell className="py-0">
                            <Textarea
                                value={row.comentarios ?? ""}
                                onChange={(e) =>
                                    updateCell(row._id, "comentarios", e.target.value)
                                }
                                rows={2}
                                disabled={disabled}
                                className="border-0 shadow-none focus-visible:ring-1 resize-none"
                            />
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
        </Table>
        </div>
    )
}

export default function TicketDetails() {

    const { id } = useParams()
    const { 
        tickets, loading, 
        updateStateSendMg, updateStateObserved, 
        updateStateObservedFromMg, updateStatePending, 
        updateStateSendRq, updateStateCancelled 
    } = useTickets({ ticket_code: id })
    const { updateTicketsSites } = useTicketSites({ ticket_code: id, limit: 2000 })
    const { ocSites } = useOCbyProy({ ticket_code: id, page: 1, limit: 2000 })

    console.log('ocSites', ocSites)

    const { download, downloadAllSustentos, loadingDownload } = useDownloadFile({ ticket_code: id })
    const ticket = tickets?.[0]
    const { user } = useAuth()
    const navigate = useNavigate()
    const { can } = useAuthz()

    const projectsByKey = useProjectsByLlaveCapex()
    let { contracts } = useContracts({ page: 1, limit: 1000 })

    const [draftSites, setDraftSites] = useState([])

    const cloneSites = (sites = []) =>
        sites.map((item) => ({
            ...item,
            identificador: item.identificador ?? "",
            sustento: item.sustento ?? "",
            acuerdo_compras: item.acuerdo_compras ?? "",
            proveedor: item.proveedor ?? "",
            cantidad: item.cantidad ?? "",
            precio_unitario: item.precio_unitario ?? "",
            linea_inversion: item.linea_inversion ?? "",
            estado: item.estado ?? "",
            rq: item.rq ?? "",
            comentarios: item.comentarios ?? "",
        })
    )

    const [alertState, setAlertState] = useState({
        open: false,
        type: "error",
        title: "",
        message: "",
        details: [],
        route: ""
    })

    const showAlert = (payload) => {
        setAlertState((prev) => ({
            ...prev,
            open: true,
            type: "error",
            title: "",
            message: "",
            details: [],
            route: "",
            ...payload,
        }));
    };

    const inputRef = useRef(null)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        ticket_code : id ?? "",
        ticket_name : "",
        requester : "",
        state : "Pendiente CT",
        ticket_jira: "",
        file: null,
        sustentos: []
    })

    const [selectedFile, setSelectedFile] = useState(null)

    // UI estados (dialogs)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [commentOpen, setCommentOpen] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [jiraTicket, setJiraTicket] = useState("")
    const [rqTicket, setRQTicket] = useState("")
    const [updateStates, setUpdateStates] = useState(false)
    const [pendingNextState, setPendingNextState] = useState(null)
    const [groupedRqRows, setGroupedRqRows] = useState([])

    const sheetData = []

    const [fileSustentos, setFileSustentos] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!editing) {
        setDraftSites(cloneSites(ocSites || []))
        }
    }, [ocSites, editing])

    const hasChanges = useMemo(() => {
        return JSON.stringify(draftSites) !== JSON.stringify(cloneSites(ocSites || []))
    }, [draftSites, ocSites])

    const handleStartEdit = () => {
        setDraftSites(cloneSites(ocSites || []))
        setEditing(true)
    }

    const handleCancelEdit = () => {
        setDraftSites(cloneSites(ocSites || []))
        setEditing(false)
    }

    const handleSaveSites = async () => {
        try {
            setSaving(true)

            const fd = new FormData();

            const payload = {
                ticket_code: id,
                items: draftSites.map((item) => ({
                    _id: item._id,
                    identificador: item.identificador,
                    sustento: item.sustento,
                    acuerdo_compras: item.acuerdo_compras,
                    cantidad: Number(item.cantidad || 0),
                    precio_unitario: Number(item.precio_unitario || 0),
                    estado: item.estado
                })),
            }

            fileSustentos.forEach((file) => {
                fd.append("fileSustentos", file);
            });

            setEditing(false)
        } catch (error) {
            console.error("Error al guardar:", error)
        } finally {
            setSaving(false)
        }
    }

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (ticket) {
            setForm((prev) => ({ ...prev, ...ticket }))
            setSelectedFile(null)
            setEditing(false)
        }
    }, [ticket, id])

    const currentState = form?.state ?? ticket?.state ?? "Pendiente CT"

    const transitionKey = useMemo(() => {
        if (!currentState || !pendingNextState) return null
        if (pendingNextState === "Cancelado") return "Cancelado"
        return `${currentState}__${pendingNextState}`
    }, [currentState, pendingNextState])

    const isRqGeneratedTransition = transitionKey === "Enviado a MG__RQ Generado"

    useEffect(() => {
        if (commentOpen && isRqGeneratedTransition) {
            setGroupedRqRows(buildGroupedRqRows(ocSites || []))
        }
    }, [commentOpen, isRqGeneratedTransition, ocSites])

    const updateGroupedRqCell = (nro, field, value) => {
        setGroupedRqRows((prev) =>
            prev.map((row) =>
            row.nro === nro ? { ...row, [field]: value } : row
            )
        )
    }

    const requiresComment = Boolean(transitionKey && commentConfigByTransition[transitionKey])

    const onChangeField = (field, value) => setForm((p) => ({ ...(p ?? {}), [field]: value }))

    function onPickFile(file) {
        setSelectedFile(file)
    }

    function onClearFile() {
        setSelectedFile(null)
    }

    function startStateChange(nextState) {
        setPendingNextState(nextState)
        setConfirmOpen(true)
    }

    async function submitChangeState({ nextState, comment }) {
        if (!form) return;

        setSaving(true);
        try {
            const fd = new FormData();
            const fd2 = new FormData();

            const sheetData = [];
            let sitesValidate = {}
            // Estado actual real
            const current = form?.state ?? currentState ?? "Pendiente CT";

            if (selectedFile) {
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: "array" });

                for (const sheetName of workbook.SheetNames) {

                    const ws = workbook.Sheets[sheetName];
                    
                    // Validar Formato
                    validateTemplateTickets(workbook, sheetName)
    
                    const range = XLSX.utils.decode_range(ws['!ref']);
                    range.s.r = 0 // Fila 0
                    range.s.c = 1 // Columna B
    
                    const rows = XLSX.utils.sheet_to_json(ws, {
                        header: 1,   // primera fila = encabezados
                        defval: "",  // celdas vacías = "",
                        range
                    });

                    if (!rows.length) {
                        throw new Error("La hoja está vacía o no tiene datos.");
                    }

                    // según tu formato actual
                    const header = rows[0]
                    const dataRows = rows.slice(1)

                    const parsed = dataRows
                        .filter((r) => r[0]) 
                        .map((r) => {
                            const identificador = String(r[0]).trim();
                            const actividad = String(r[1]).trim();
                            const solucion = String(r[2]).trim()
                            const proveedor = String(r[3]).trim();
                            const sustento = String(r[4]).trim();
                            const acuerdo_compras = String(r[5]).trim();
                            const coordinador = String(r[6]).trim();
                            const moneda = String(r[7]).trim();
                            const cantidad = String(r[8]).trim();
                            const precio_unitario = String(r[9]).trim();
                            const fecha_inicio_servicio = String(r[10]).trim();
                            const fecha_fin_servicio = String(r[11]).trim();
                            const linea_inversion = String(r[12]).trim();
                            const articulo = String(r[13]).trim();
    
                            const sitios = SITIOS.find(s => s.identificador == identificador)
                            const total_cot = cantidad * precio_unitario
                            const descrip_adi = identificador + " / " + (sitios.site ?? "") + " / " + actividad + " / " + solucion
                        
                            return {
                                // nro,
                                identificador,
                                sitio: sitios.site ?? "",
                                actividad,
                                solucion,
                                proveedor,
                                sustento,
                                acuerdo_compras,
                                coordinador,
                                moneda,
                                cantidad,
                                precio_unitario,
                                total_cotizacion: total_cot ?? 0,
                                fecha_registro: "",
                                fecha_inicio_servicio,
                                fecha_fin_servicio,
                                descripcion_adicional: descrip_adi ?? "",
                                id_proyecto: sitios.id_proyecto ?? "",    
                                nombre_proyecto: sitios.nombre_proyecto ?? "",
                                linea_inversion,
                                articulo
                            };
                        });

                    sheetData.push(parsed)
                }

                sitesValidate = validatePa(contracts, sheetData[0], projectsByKey)

            }

            // Helpers de transición
            const isSendMg = transitionKey === "Pendiente CT__Enviado a MG";
            const isObserved = transitionKey === "Pendiente CT__Observado";
            const isReturnPending = transitionKey === "Observado__Pendiente CT";
            const isRqGenerated = transitionKey === "Enviado a MG__RQ Generado";
            const isObservedFromMG = transitionKey === "Enviado a MG__Observado";
            const isCancelled = nextState === "Cancelado"; // desde cualquier estado

            // Validaciones front (opcionales pero recomendadas)
            if (isSendMg && !String(jiraTicket ?? "").trim()) {
                throw new Error("Debe ingresar Ticket Jira para cambiar a 'Enviado a MG'.");
            }

            if (isRqGenerated) {
                const groupedMap = new Map(
                    groupedRqRows.map((row) => [row.nro, row])
                )
                const expandedItems = (ocSites || []).map((item) => {
                    const group = groupedMap.get(item.nro)
                    if (!group) return item
                    return {
                        // ...item,
                        _id: item._id,
                        identificador: item.identificador ?? "",
                        sustento: item.sustento ?? "",
                        acuerdo_compras: item.acuerdo_compras ?? "",
                        proveedor: item.proveedor ?? "",
                        cantidad: item.cantidad ?? "",
                        precio_unitario: item.precio_unitario ?? "",
                        linea_inversion: item.linea_inversion ?? "",
                        total_cotizacion: item.total_cotizacion ?? "",
                        descripcion_adicional: item?.identificador + " / " + (item.sitio ?? "") + " / " + (item.actividad ?? "") + " / " + (item.solucion ?? ""),
                        estado: group.estado ?? item.estado,
                        rq: group.rq ?? "",
                        comentarios: group.comentarios ?? "",
                    }
                })

                const payload = {
                    transitionKey,
                    ticket_code: id,
                    updateSites: true,
                    items: expandedItems.map((item) => ({
                        _id: item._id,
                        // nro: item.nro,
                        identificador: item.identificador,
                        sustento: item.sustento,
                        acuerdo_compras: item.acuerdo_compras,
                        proveedor: item.proveedor,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        linea_inversion: item.linea_inversion,
                        total_cotizacion: item.total_cotizacion,
                        descripcion_adicional: item.descripcion_adicional,
                        estado: item.estado,
                        rq: item.rq,
                        comentarios: item.comentarios
                        
                    })),
                }
                fd2.append("payload", JSON.stringify(payload))
            }

            // Armar payload dinámico según transición
            const payload = {
                patch: {
                    ticket_name: form.ticket_name ?? "",
                    requester: form.requester ?? "",
                    state: nextState ?? current ?? "Pendiente CT",

                    ...(isSendMg ? { ticket_jira: String(jiraTicket ?? "").trim() } : {}),
                    // ...(isRqGenerated ? { rq: String(rqTicket ?? "").trim() } : {}),
                    updateSites: updateStates ?? false,
                },

                // Solo aplica realmente para Observado -> Pendiente CT
                replaceSites: Boolean(isReturnPending && selectedFile),

                // Si no hay archivo, puede enviarse [] / undefined
                // sites: sheetData?.[0] ?? [],
                sites: sitesValidate.dataFinalInsertar,

                comment: comment
                    ? {
                        text: comment,
                        type: `${current} -> ${nextState}`, // mejor que form.state
                        author: {
                            name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
                            email: user?.email ?? "",
                        },
                        clientAt: new Date().toISOString(),
                    }
                    : null,
            };

            fd.append("payload", JSON.stringify(payload));

            // Archivo opcional (especialmente return-pending)
            if (selectedFile) fd.append("file", selectedFile);

            const ticketId = form?._id ?? ticket?._id ?? "";
            if (!ticketId) throw new Error("No se encontró ticketId para actualizar.");

            // ============================
            // Ejecutar API según transición
            // ============================
            let resp;

            if (isSendMg) {
                resp = await updateStateSendMg(ticketId, fd);
            } else if (isObserved) {
                resp = await updateStateObserved(ticketId, fd);
            } else if (isObservedFromMG) {
                resp = await updateStateObservedFromMg(ticketId, fd);
            } else if (isReturnPending) {
                resp = await updateStatePending(ticketId, fd);
            } else if (isRqGenerated) {
                resp = await updateStateSendRq(ticketId, fd);
                await updateTicketsSites(ticketId, fd2)
            } else if (isCancelled) {
                resp = await updateStateCancelled(ticketId, fd);
            } else {
                throw new Error(`Transición no soportada: ${transitionKey}`);
            }

            if(!isReturnPending) {
                // UI update local
                setForm((p) => ({
                    ...(p ?? {}),
                    state: nextState,
                    ...(isSendMg ? { ticket_jira: String(jiraTicket ?? "").trim() } : {}),
                    // ...(isRqGenerated ? { rq: String(rqTicket ?? "").trim() } : {}),
                }));

                setEditing(false);
                setSelectedFile(null);
                setCommentText("");
                setJiraTicket("");
                // setRQTicket("");

                toast.success("Estado actualizado", {
                    description: `El ticket ${form.ticket_code ?? id} pasó a "${nextState}".`,
                });
                navigate("/budget/analytics/tickets", { replace: true });
            }
            return resp;
        } catch (err) {
            console.log(err);
            toast.error("No se pudo actualizar el estado", {
                description: err?.message ?? "Error desconocido",
            });
        } finally {
            setSaving(false);
        }
    }

    function onConfirmProceed() {
        setConfirmOpen(false)
        // 2) si requiere comentario -> abrimos Dialog de comentario
        if (requiresComment) {
            setCommentText("")
            setJiraTicket("")
            // setRQTicket("")
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
        // setEditing(!editing)
        setEditing(!editing)
    }

    async function onSaveOnly() {
        
        const fd = new FormData();

        fileSustentos.forEach((file) => {
            fd.append("fileSustentos", file);
        });

        const payload = {
            ticket_code: id,
            items: draftSites.map((item) => ({
                _id: item._id,
                identificador: item.identificador,
                sustento: item.sustento,
                acuerdo_compras: item.acuerdo_compras,
                proveedor: item.proveedor,
                cantidad: Number(item.cantidad || 0),
                precio_unitario: Number(item.precio_unitario || 0),
                linea_inversion: item.linea_inversion,
                total_cotizacion: Number(item.cantidad || 0) * Number(item.precio_unitario || 0),
                descripcion_adicional: item?.identificador + " / " + (item.sitio ?? "") + " / " + (item.actividad ?? "") + " / " + (item.solucion ?? ""),
                estado: item.estado,
                rq: item.rq,
                comentarios: item.comentarios
            }))
        }

        fd.append("payload", JSON.stringify(payload));
        const resp = await updateTicketsSites(id, fd);


        if (resp.result !== "OK") {
            throw new Error(resp.msg || "No se pudo actualizar")
        }

        toast.success("Sitios actualizados correctamente")

    }

    async function onDownloadSites() {
        const template="/plantillas/template_download_ticket_rq_2.xlsx"
        const fileName=`Reporte Sites ${id}` 

        const transformProject = ocSites.map(buildTicketSitesRowForTemplate);

        await exportTicketSitesToXlsx({
            templatePath: template,
            dataFinal: transformProject,
            fileName: fileName
        })
    }

    async function onDownloadTemplate() {
        const template="/plantillas/Generación RQ_Template.xlsx"
        const fileName = "Generación RQ_Template"

        const transformProject = ocSites.map(buildGenerateRQRowForTemplate);

        await exportRQTemplateToXlsx({
            templatePath: template,
            dataFinal: transformProject,
            fileName: fileName
        })
    }


    if (loading || tickets === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Cargando ticket...</h1>
                </div>
            </div>
        )
    }

    if (!ticket) {
        return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Ticket no encontrado</h1>
                <Link to="/budget/analytics/tickets" className="mt-4 inline-block text-blue-600 hover:underline">
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
                            to="/budget/analytics/tickets"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/budget/analytics/tickets" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Tickets
                            </Link>
                            <span className="text-gray-400"> / </span>
                            <span className="text-[#2b7fff]">{id}</span>
                        </h2>
                    </div>
                    <div className="flex gap-4">
                        {/* Button to download files with icon color white border gray */}
                        <Button size="icon" onClick={onDownloadSites} className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0">
                            <Download className="h-4 w-4" /> Descargar Sitios
                        </Button>
                        <Button size="icon" onClick={onDownloadTemplate} className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0">
                            <Download className="h-4 w-4" /> Descargar Formato MG
                        </Button>
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
                                            <h1 className="text-lg font-medium text-gray-400">{ticket.ticket_name}</h1>
                                        </div>
                                    </div>
                                </div>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className={"cursor-pointer " + STATUS_TICKET[ticket.state][0]}>
                                            {ticket.state ?? "Acción"}
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
                                        {currentState === "Pendiente CT" && can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_UPDATE_MASTER) && (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Enviado a MG")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Enviado a MG"][0]}>Enviado a MG</Badge>
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

                                        {currentState === "Enviado a MG" && can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_UPDATE_MASTER) && (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("RQ Generado")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["RQ Generado"][0]}>RQ Generado</Badge>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Observado")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Observado"][0]}>Observado</Badge>
                                            </DropdownMenuItem>
                                            </>
                                        )}

                                        {currentState === "Observado" && (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Pendiente CT")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Pendiente CT"][0]}>Pendiente CT</Badge>
                                            </DropdownMenuItem>
                                            </>
                                        )}

                                        {currentState === "Cancelado" && can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_UPDATE_MASTER) &&  (
                                            <>
                                            <DropdownMenuItem
                                                onClick={() => startStateChange("Pendiente CT")}
                                                className="cursor-pointer"
                                                disabled={saving}
                                            >
                                                Cambiar a <Badge className={STATUS_TICKET["Pendiente CT"][0]}>Pendiente CT</Badge>
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
                                <TabsTrigger value="Sitios" className="py-4 px-10 my-2 cursor-pointer">Sitios</TabsTrigger>
                                
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
                                                            downloadAllSustentos={downloadAllSustentos}
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

                            <TabsContent value="Sitios">

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

            <StatusModal
                open={alertState.open}
                onOpenChange={(open) => setAlertState((s) => ({ ...s, open }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                details={alertState.details}
                route={alertState.route}
            />

            {/* Confirmación (AlertDialog moderno) */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas el cambio de estado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se cambiará el ticket <span className="font-medium">{form.ticket_code ?? id}</span> de{" "}
                            <Badge className={STATUS_TICKET[currentState]?.[0] ?? ""}>{currentState}</Badge> a{" "}
                            <Badge className={STATUS_TICKET[pendingNextState]?.[0] ?? ""}>{pendingNextState}</Badge>.
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

                    {transitionKey === "Pendiente CT__Enviado a MG" && (
                        <div className="space-y-2">
                            <Label>Ticket Jira</Label>
                            <Input
                                value={jiraTicket}
                                onChange={(e) => setJiraTicket(e.target.value)}
                                placeholder="Ej: GCIR-1234"
                            />
                        </div>
                    )}

                    {transitionKey === "Enviado a MG__RQ Generado" ? (

                        <div className="space-y-4">
                            <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                            Completa la información por grupo <span className="font-semibold">NRO</span>.
                            Al actualizar un grupo, el valor se aplicará a todas las líneas asociadas a ese mismo NRO.
                            </div>

                            <div className="rounded-2xl border bg-white">
                            <div className="max-h-[320px] overflow-auto rounded-2xl">
                                <Table className="w-full table-fixed">
                                <TableHeader>
                                    <TableRow className="hover:bg-white">
                                    <TableHead className="sticky top-0 z-20 bg-white w-[100px]">
                                        NRO
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-white w-[80px]">
                                        Items
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-white w-[100px]">
                                        Monto
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-white w-[150px]">
                                        Estado
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-white w-[180px]">
                                        RQ
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-white min-w-[320px]">
                                        Comentarios
                                    </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {groupedRqRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                            colSpan={5}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                            >
                                            No hay grupos para mostrar
                                            </TableCell>
                                        </TableRow>
                                        ) : (
                                        groupedRqRows.map((row) => {
                                            // const [statusClass, dotClass] = getStatusStyles(row.estado)

                                            return (
                                            <TableRow key={row.nro} className="align-top">
                                                <TableCell className="p-2 font-medium">
                                                    {row.nro}
                                                </TableCell>

                                                <TableCell className="p-2 text-sm text-slate-500">
                                                    {row.totalItems}
                                                </TableCell>

                                                <TableCell className="p-2 text-sm text-slate-500">
                                                    {formatCurrency(row.monto)}
                                                </TableCell>

                                                <TableCell className="p-2">
                                                <Select
                                                    value={row.estado ?? ""}
                                                    onValueChange={(value) =>
                                                        updateGroupedRqCell(row.nro, "estado", value)
                                                    }
                                                >
                                                    <SelectTrigger
                                                    className={cn(
                                                        "w-[130px] border-0 shadow-none text-xs focus:ring-0 focus:ring-offset-0",
                                                        STATUS_TICKET[row.estado][0]
                                                    )}
                                                    >
                                                        <SelectValue placeholder="Seleccionar estado" />
                                                    {/* <div className="flex items-center gap-2">
                                                        <span
                                                        className={cn(
                                                            "h-2 w-2 rounded-full shrink-0",
                                                            dotClass
                                                        )}
                                                        />
                                                        <SelectValue placeholder="Seleccionar estado" />
                                                    </div> */}
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
                                                </TableCell>

                                                <TableCell className="p-2">
                                                <Input
                                                    value={row.rq ?? ""}
                                                    onChange={(e) =>
                                                    updateGroupedRqCell(row.nro, "rq", e.target.value)
                                                    }
                                                    placeholder="Ej: RQ123456"
                                                    className="border-0 shadow-none focus-visible:ring-1"
                                                />
                                                </TableCell>

                                                <TableCell className="p-2">
                                                <Textarea
                                                    value={row.comentarios ?? ""}
                                                    onChange={(e) =>
                                                    updateGroupedRqCell(row.nro, "comentarios", e.target.value)
                                                    }
                                                    placeholder="-"
                                                    rows={2}
                                                    className="border-0 shadow-none focus-visible:ring-1 resize-none"
                                                />
                                                </TableCell>
                                            </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                                </Table>
                            </div>
                            </div>
                        </div>

                    ) : (
                        // {/* Section to indicate IF update states or not WITH RADIO-GROUP */}
                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">
                                ¿Deseas actualizar los estados de los sitios seleccionados?
                            </span>
                            <RadioGroup
                                value={updateStates}
                                onValueChange={setUpdateStates}
                                className="grid gap-3 mt-3"
                            >
                                <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-slate-50">
                                <RadioGroupItem value={true} />
                                    <p className="text-sm font-medium text-slate-800">
                                        Sí
                                    </p>
                                </label>

                                <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-slate-50">
                                <RadioGroupItem value={false} />
                                    <p className="text-sm font-medium text-slate-800">
                                        No
                                    </p>
                                </label>
                            </RadioGroup>
                        </div>
                    )}

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