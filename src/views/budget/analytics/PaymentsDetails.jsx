import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import AttachmentsGrid from "@/components/AttachmentGrid/AttachmentGrid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDownloadFile } from "@/hooks/budget/capex/useDownloadFile";
import { usePayments } from "@/hooks/budget/capex/usePayments";
import { usePaymentsSites } from "@/hooks/budget/capex/usePaymentsSites";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDDMMYYYYHour, normalizePercentInput, toNumber } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, CircleDashed, CircleHelp, Clock3, Loader2, NotebookTabs } from "lucide-react";
import { toast } from "wc-toast";

const STATUS_META = {
    no_iniciado: {
        status: "no_iniciado",
        label: "No Iniciado",
        icon: Clock3,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
        dotClass: "bg-slate-400",
        textClass: "text-slate-700",
    },
    pendiente: {
        status: "pendiente",
        label: "Intención de pago",
        icon: Clock3,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
    },
    proceso: {
        status: "proceso",
        label: "Pago Enviado a MG",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    pagado: {
        status: "pagado",
        label: "Pago Generado",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700"
    },
    cerrado: {
        status: "cerrado",
        label: "Cerrado",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700"
    },
    validacion: {
        status: "validacion",
        label: "Validación Jefatura",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    default: {
        label: "Sin estado",
        icon: CircleHelp,
        badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
    },
    intencion_pago: {
        status: "intencion_pago",
        label: "Intención de Pago",
        icon: Clock3,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
    },
    pago_enviado: {
        status: "pago_enviado",
        label: "Pago Enviado a MG",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    pago_generado: {
        status: "pago_generado",
        label: "Pago Generado",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700",
    },
    intencion_pago_h2: {
        status: "intencion_pago_h2",
        label: "Intención de Pago - Hito 2",
        icon: Clock3,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
    },
    pago_enviado_h2: {
        status: "pago_enviado_h2",
        label: "Pago Enviado a MG - Hito 2",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    pago_generado_h2: {
        status: "pago_generado_h2",
        label: "Pago Generado - Hito 2",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700"
    },
};

const STATUS_TICKET = {
    "Hito 1": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Hito 2": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"],
    "Cancelado": ["bg-gray-100 text-gray-700 hover:bg-gray-200", "bg-gray-500 outline-gray-500/20"],
}

const STATUS_PAYMENT_SITE = {
    "Abierto": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Cerrado": ["bg-slate-100 text-slate-700 hover:bg-slate-200", "bg-slate-500 outline-slate-500/20"],
}

const commentConfigByTransition = {
    "Intención de Pago__Pago Enviado a MG": {
        title: "Cambiar estado a Pago Enviado a MG",
        description: "Deja un comentario para actualizar el ticket.",
        placeholder: "Ej: Registrado en Jira...",
        submitLabel: "Enviar",
    },
    "Pago Enviado a MG__Pago Generado": {
        title: "Cambiar estado a Pago Generado",
        description: "Deja un comentario",
        placeholder: "Comentario...",
        submitLabel: "Confirmar",
    },
    "Intención de Pago - Hito 2__Pago Enviado a MG - Hito 2": {
        title: "Cambiar estado a Pago Enviado a MG - Hito 2",
        description: "Deja un comentario para actualizar el ticket.",
        placeholder: "Ej: Registrado en Jira...",
        submitLabel: "Enviar",
    },
    "Pago Enviado a MG - Hito 2__Pago Generado - Hito 2": {
        title: "Cambiar estado a Pago Generado - Hito 2",
        description: "Deja un comentario",
        placeholder: "Comentario...",
        submitLabel: "Confirmar",
    },
    // "Validación Jefatura__Pago Enviado a MG": {
    //     title: "Cambiar estado a Pago Enviado a MG",
    //     description: "Deja un comentario para registrar el ticket.",
    //     placeholder: "Comentario...",
    //     submitLabel: "Enviar",
    // },
    // "Pendiente CT__Observado": {
    //     title: "Cambiar estado a Observado",
    //     description: "Indica el motivo de la observación.",
    //     placeholder: "Ej: Información incompleta / archivo inválido / falta aprobación ...",
    //     submitLabel: "Observar",
    // },
    // "Observado__Pendiente CT": {
    //     title: "Cambiar estado a Pendiente CT",
    //     description: "Comentario",
    //     placeholder: "Ej: Se han revisado las observaciones",
    //     submitLabel: "Enviar",
    // },

    "Cancelado" :{
        title: "Cambiar estado a Cancelado",
        description: "Deja un comentario para registrar la cancelación.",
        placeholder: "Ej: Cancelado...",
        submitLabel: "Confirmar",
    },
    "Cerrado" : {
        title: "Cerrado",
        description: "Deja un comentario para cerrar el ticket",
        placeholder: "Comentario...",
        submitLabel: "Confirmar",
    },
    // "Pago Generado__Validación Jefatura": {
    //     title: "Cambiar estado a Hito 2",
    //     description: "Deja un comentario para actualizar el ticket.",
    //     placeholder: "Comentario...",
    //     submitLabel: "Enviar",
    // }
}

const PAYMENT_STEPS_HITO1 = [
    "Intención de Pago",
    "Pago Enviado a MG",
    "Pago Generado",
    // "Cerrado"
];

const PAYMENT_STEPS_HITO2 = [
    "Intención de Pago - Hito 2",
    "Pago Enviado a MG - Hito 2",
    "Pago Generado - Hito 2",
    // "Cerrado"
];

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


function StatusBadge({ status = "default", active = false }) {
    // const meta = STATUS_META[status];

    const meta = STATUS_META[status] ?? {
        ...STATUS_META.default,
        label: status || STATUS_META.default.label,
    };

    const Icon = meta?.icon;

    return (
        <Badge
            variant="outline"
            className={`${meta?.badgeClass} ${active ? "ring-2 ring-offset-1 ring-[#2b7fff]/20" : ""} gap-1.5 rounded-full px-2.5 py-1 font-medium`}
        >
            <Icon className="h-3.5 w-3.5" />
            {meta?.label}
        </Badge>
    );
}


// function MiniStep({ title, status = "pendiente", active, last = false }) {

//     // const meta = STATUS_META[status];
//     const meta = STATUS_META[status] ?? {
//         ...STATUS_META.default,
//         label: status || STATUS_META.default.label,
//     };

//     const Icon = status === "cerrado" ? CheckCircle2 : active ? AlertCircle : CircleDashed;

//     return (
//         <div className="flex items-center">
//             <div className="flex items-center gap-3">
//                 <div
//                     className={`flex h-10 w-10 items-center justify-center rounded-full border ${
//                         status === "cerrado"
//                         ? "border-emerald-200 bg-emerald-50 text-emerald-600"
//                         : active
//                             ? "border-blue-200 bg-blue-50 text-[#2b7fff]"
//                             : "border-slate-200 bg-slate-50 text-slate-400"
//                     }`}
//                 >
//                     <Icon className="h-4 w-4" />
//                 </div>
//                 <div>
//                     <div className="text-sm font-semibold text-slate-800">{title}</div>
//                     <div className="text-xs text-slate-500">{meta?.label}</div>
//                 </div>
//             </div>
//             {!last ? <div className="mx-4 h-[2px] w-16 rounded-full bg-slate-200" /> : null}
//         </div>
//     );
// }

// function getPaymentStepIndex(status) {
//     const idx = PAYMENT_STEPS.indexOf(status);
//     return idx >= 0 ? idx : -1;
// }

function getPaymentStepIndex(status, steps) {
    const idx = steps.indexOf(status);
    return idx >= 0 ? idx : -1;
}

function PaymentStatusTimeline({ status, currentStage }) {

    const steps = currentStage === "hito2" ? PAYMENT_STEPS_HITO2 : PAYMENT_STEPS_HITO1;
    const currentIndex = getPaymentStepIndex(status, steps);
    const isClose = status === "Cerrado";
    // console.log("status", status)

    return (
        <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Timeline de estado</div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-3">
                {steps.map((step, index) => {
                    const done = index < currentIndex;
                    // const close = step === "Pago Generado";
                    // console.log("index", index, "currentIndex", currentIndex)

                    const current = index === currentIndex;
                    return (
                        <>
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${
                                        done || isClose
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                        : current
                                            ? "border-blue-200 bg-blue-50 text-[#2b7fff]"
                                            : "border-slate-200 bg-white text-slate-400"
                                    }`}
                                >
                                    {done || isClose ? <CheckCircle2 className="h-4 w-4" /> : <span>{index + 1}</span>}
                                </div>
                                <div>
                                    <div className={`text-sm font-medium ${current ? "text-[#2b7fff]" : done || isClose ? "text-emerald-700" : "text-slate-500"}`}>
                                        {step}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {current ? "Estado actual" : done || isClose ? "Completado" : "Pendiente"}
                                    </div>
                                </div>
                            </div>
                            {index < steps.length - 1 ? (
                                <div className={`mx-3 h-[2px] w-12 rounded-full ${index < currentIndex || isClose ? "bg-emerald-400" : "bg-slate-200"}`} />
                            ) : null}
                        </>
                    );
                })}
            </div>
        </div>
    );
}


function TimelineItem({ title, data, currentStage, active, done, startStateChange }) {

    // title="Hito 2 · Validación final"
    // data={form?.hito2}
    // currentStage={"hito2"}
    // active={form?.currentStage === "hito2"}
    // done={form?.hito2?.status === "cerrado"}
    // startStateChange={startStateChange}

    return (
        <div className="relative pl-8">
            <div className="absolute left-0 top-1 h-full w-px bg-slate-200" />
            <div
                className={`absolute left-[-8px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                done
                    ? "border-emerald-500 bg-emerald-500"
                    : active
                        ? "border-[#2b7fff] bg-[#2b7fff]"
                        : "border-slate-300 bg-white"
                }`}
            />

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">{title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={data?.status} active={active} />
                        {active ? (
                            <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 text-[#2b7fff]">
                                Actual
                            </Badge>
                        ) : null}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={!active} className={"cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"}>
                                    {data?.label}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                {/* Cambios de estado */}
                                {data?.label === "Intención de Pago" && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Pago Enviado a MG")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Pago Enviado a MG</Badge>
                                        </DropdownMenuItem>
                                        <Separator />
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Cancelado")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Cancelado</Badge>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {data?.label === "Pago Enviado a MG" && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Pago Generado")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Pago Generado</Badge>
                                        </DropdownMenuItem>
                                        <Separator />
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Cancelado")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Cancelado</Badge>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {data?.label === "Intención de Pago - Hito 2" && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Pago Enviado a MG - Hito 2")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Pago Enviado a MG - Hito 2</Badge>
                                        </DropdownMenuItem>
                                        <Separator />
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Cancelado")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Cancelado</Badge>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {data?.label === "Pago Enviado a MG - Hito 2" && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Pago Generado - Hito 2")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Pago Generado - Hito 2</Badge>
                                        </DropdownMenuItem>
                                        <Separator />
                                        <DropdownMenuItem
                                            onClick={() => startStateChange("Cancelado")}
                                            className="cursor-pointer"
                                        >
                                            Cambiar a <Badge>Cancelado</Badge>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="mt-4">
                    <PaymentStatusTimeline status={data?.label} currentStage={currentStage} />
                </div>
            </div>
        </div>
    );
}


function Information({ 
    form, editing, selectedFile, selectedFile_h2, onChangeField, onPickFile, 
    onClearFile, inputRef, download, error, setError, startStateChange
}) {

    const existing = useMemo(() => getFileMeta(form?.file), [form?.file])
    const existing_h2 = useMemo(() => getFileMeta(form?.file_h2), [form?.file_h2])

    const picked = selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null
    const picked_h2 = selectedFile_h2 ? { name: selectedFile_h2.name, size: selectedFile_h2.size } : null

    const meta = picked ?? existing
    const meta_h2 = picked_h2 ?? existing_h2

    function getStageLabel(stage) {
        return stage === "hito2" ? "Hito 2" : "Hito 1";
    }

    function getRequestProgress(req) {
        const h1 = req.hito1.validationStatus;
        const h2 = req.hito2.validationStatus;

        if (h2 === "cerrado") return 100;
        if (req.currentStage === "hito2" && h2 === "revision") return 80;
        if (req.currentStage === "hito2") return 65;
        if (h1 === "cerrado") return 50;
        if (h1 === "revision") return 30;
        return 10;
    }

    // console.log("FORM", form)
    const dataHito = form.currentStage == "hito1"
        ? form?.hito1
        : form?.hito2

    // const is_currentStage = form?.currentStage == "hito1"

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
                            value={form?.sites ?? 0}
                            disabled
                            // onChange={(e) => onChangeField("ticket_name", e.target.value)}
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
                <div className="space-y-2">
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
                </div>

                <h2 className="font-semibold text-blue-500">Formato CR</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <AttachmentsGrid files={[meta] ?? []} download={download} editing={editing} inputRef={inputRef} />

                    </div>
                </div>

                {/* <h2 className="font-semibold text-blue-500">Formato CR Hito 2</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        <AttachmentsGrid files={[meta_h2] ?? []} download={download} editing={editing} inputRef={inputRef} />

                    </div>
                </div> */}
                

                <h2 className="font-semibold text-blue-500">Seguimiento</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <div className="space-y-2">

                        {/* <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
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
                        </div> */}

                        <div className="space-y-4">
                            {/* <TimelineItem
                                title="Hito 1 · Validación inicial"
                                data={form?.hito1}
                                currentStage={"hito1"}
                                active={form?.currentStage === "hito1"}
                                done={form?.hito1?.status === "cerrado"}
                                startStateChange={startStateChange}
                            /> */}
                            <TimelineItem
                                title={form?.state}
                                data={dataHito}
                                currentStage={form?.currentStage}
                                active={true}
                                done={form?.hito2?.status === "cerrado"}
                                startStateChange={startStateChange}
                            />
                        </div>

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

// const toNumber = (value) => {
//     const n = Number(String(value ?? "").replace(/,/g, ""));
//     return Number.isFinite(n) ? n : 0;
// };

const EditableTable = ({
    rows = [],
    setRows,
    disabled = false
}) => {
   
    const updateCell = (id, field, value) => {

        setRows((prev) =>
            prev.map((row) => {
                if (row._id !== id) return row;

                const updatedRow = {
                    ...row,
                    [field]: value,
                };

                const monto = toNumber(updatedRow.monto);
                const porcentajeh1 = toNumber(updatedRow.cantidad_h1);
                const porcentajeh2 = toNumber(updatedRow.cantidad_h2);

                updatedRow.cantidad_h1 = Number(updatedRow.cantidad_h1)
                updatedRow.cantidad_h2 = Number(updatedRow.cantidad_h2)
                updatedRow.total_pago_h1 = (monto * porcentajeh1) / 100;
                updatedRow.total_pago_h2 = (monto * porcentajeh2) / 100;
                updatedRow.total_pago = (monto * (porcentajeh1 + porcentajeh2)) / 100;
                updatedRow.pendiente_total = (monto - updatedRow.total_pago);

                return updatedRow;
            }
                // row._id === id ? { ...row, [field]: value } : row
            )
        )
    }

    const handleNumberChange = (id, field, value) => {
        updateCell(id, field, value.replace(",", "."))
    }

    return (
        <div className="max-h-[520px] overflow-auto rounded-2xl">
            <Table className="min-w-[1100px] ">
                <TableHeader className="sticky top-0 z-20 bg-white backdrop-blur shadow-sm">
                    <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                        <TableHead className="min-w-[230px] bg-white-100 font-semibold text-[#64748B]">
                            IDENTIFICADOR
                        </TableHead>
                        <TableHead className="min-w-[230px] bg-white-100 font-semibold text-[#64748B]">
                            SITIO
                        </TableHead>
                        <TableHead className="min-w-[220px] bg-white-100 font-semibold text-[#64748B]">
                            ACTIVIDAD
                        </TableHead>
                        <TableHead className="min-w-[100px] bg-white-100 font-semibold text-[#64748B]">
                            ESTADO
                        </TableHead>
                        <TableHead className="min-w-[300px] bg-white-100 font-semibold text-[#64748B]">
                            PROYECTO
                        </TableHead>
                        <TableHead className="min-w-[300px] bg-white-100 font-semibold  text-[#64748B]">
                            LINEA INVERSION
                        </TableHead>
                        <TableHead className="min-w-[120px]  font-semibold text-left border-l bg-slate-100 text-slate-800">
                            RQ
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold  text-left border-b bg-slate-100 text-slate-800">
                            OC
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold  text-left border-b bg-slate-100 text-slate-800 border-slate-200">
                            LINEA OC
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold  text-left border-r border-b bg-slate-100 text-slate-800 border-slate-200">
                            MONTO OC
                        </TableHead>

                        <TableHead className="min-w-[120px] font-semibold  text-left border-l border-b bg-blue-50 text-blue-800 border-blue-200">
                            HITO 1 (%)
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold  text-left border-b bg-blue-50 text-blue-800 border-blue-200">
                            A PAGAR H1
                        </TableHead>

                        <TableHead className="min-w-[120px] font-semibold  text-left border-l border-b bg-emerald-50/60 text-emerald-700">
                            HITO 2 (%)
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold  text-left border-r border-b bg-emerald-50/60 text-emerald-700">
                            A PAGAR H2
                        </TableHead>

                        <TableHead className="min-w-[120px] font-semibold  text-left border-b bg-amber-50/60 text-amber-700">
                            TOTAL A PAGAR
                        </TableHead>

                        <TableHead className="min-w-[120px] font-semibold  text-left border-r border-b bg-amber-50/60 text-amber-700">
                            PENDIENTE
                        </TableHead>

                        <TableHead className="min-w-[150px] bg-white-100 font-semibold text-[#64748B]">
                            ESTADO PAGO
                        </TableHead>

                        <TableHead className="min-w-[300px] bg-white-100 font-semibold text-[#64748B] text-left">
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
                        rows.map((row) => (

                        <TableRow key={row._id}>
                            <TableCell className="p-2">
                                <Input
                                    value={row.identificador ?? ""}
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
                                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                                    {row.estado}
                                </Badge>
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
                            <TableCell className="p-2 border-l">
                                <Input
                                    value={row.rq ?? ""}
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
                            <TableCell className="p-2 border-r">
                                <Input
                                    value={row.monto ?? ""}
                                    disabled
                                    className="border-0 shadow-none focus-visible:ring-1"
                                />
                            </TableCell>
                            <TableCell className="p-2 border-l">
                                <Input
                                    value={row.cantidad_h1 ?? ""}
                                    disabled={disabled}
                                    // type="number"
                                    // min={0}
                                    // max={100}
                                    // step="0.01"
                                    type="text"
                                    inputMode="decimal"
                                    onChange={(e) => {
                                        const value = normalizePercentInput(e.target.value);
                                        updateCell(row._id, "cantidad_h1", value)
                                    }}
                                        
                                    className="border-0 shadow-none focus-visible:ring-1"
                                />
                            </TableCell>
                            <TableCell className="p-2 border-r">
                                <Input
                                    // value={row.total_pago_h1 ?? ""}
                                    value={formatCurrency(row.total_pago_h1)}
                                    disabled
                                    className="border-0 shadow-none focus-visible:ring-1"
                                />
                            </TableCell>
                            <TableCell className="p-2">
                                <Input
                                    value={row.cantidad_h2 ?? ""}
                                    disabled={disabled}
                                    // type="number"
                                    // min={0}
                                    // max={100}
                                    // step="0.01"
                                    type="text"
                                    inputMode="decimal"
                                    onChange={(e) => {
                                        const value = normalizePercentInput(e.target.value);
                                        updateCell(row._id, "cantidad_h2", value);
                                    }}
                                    className="border-0 shadow-none focus-visible:ring-1"
                                />
                            </TableCell>
                            <TableCell className="p-2 border-r">
                                <Input
                                    value={formatCurrency(row.total_pago_h2)}
                                    disabled
                                    className="border-0 shadow-none focus-visible:ring-1"
                                />
                            </TableCell>

                            <TableCell className="p-2 ">
                                <Input
                                    value={formatCurrency(row.total_pago)}
                                    disabled
                                    className="border-0 shadow-none focus-visible:ring-1"
                                />
                            </TableCell>

                            <TableCell className="p-2 border-r">
                                <Input
                                    value={formatCurrency(row.pendiente_total)}
                                    disabled
                                    className={"border-0 shadow-none focus-visible:ring-1 " + (row.pendiente_total < 0 ? "text-red-500" : "text-green-500")}
                                />
                            </TableCell>

                            <TableCell className="p-2">
                                {disabled ? (
                                    <div
                                        className={cn(
                                            "inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                                            STATUS_PAYMENT_SITE[row.status_payment][0]
                                        )}
                                    >
                                        <span
                                            className={cn(
                                            "h-2 w-2 rounded-full shrink-0",
                                            STATUS_PAYMENT_SITE[row.status_payment][1]
                                            )}
                                        />
                                        <span>{row.status_payment ?? "Sin estado"}</span>
                                    </div>
                                ) : (
                                    <Select
                                        value={row.status_payment ?? ""}
                                        onValueChange={(value) => updateCell(row._id, "status_payment", value)}
                                        >
                                        <SelectTrigger
                                            className={cn(
                                                "w-[130px] border-0 shadow-none text-xs focus:ring-0 focus:ring-offset-0",
                                                STATUS_PAYMENT_SITE[row.status_payment][0]
                                            )}
                                        >
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
    
                                        <SelectContent>
                                            {Object.keys(STATUS_PAYMENT_SITE).map((estado) => (
                                                <SelectItem key={estado} value={estado}>
                                                    <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                        "h-2 w-2 rounded-full shrink-0",
                                                        STATUS_PAYMENT_SITE[estado][1]
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

                            <TableCell className="p-2">
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


export default function PaymentsDetails() {

    const { id } = useParams()
    const { 
        payments, 
        loading, 
        updateStatePaySendMg, updateStatePayGenerated, 
        updateStatePaySendMgH2, updateStatePayGeneratedH2,
        updateStatePayCancelled, updateStatePayClose 
    } = usePayments({ code: id })
    const { paymentsSites, updatePaymentsSites } = usePaymentsSites({ code: id, limit: 300 })
    const payment = payments?.[0]

    const { user } = useAuth()

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
            monto: item.monto ?? "",

            cantidad_h1: item.cantidad_h1 ?? "",
            total_pago_h1: item.total_pago_h1 ?? "",

            cantidad_h2: item.cantidad_h2 ?? "",
            total_pago_h2: item.total_pago_h2 ?? "",

            total_pago: item.total_pago ?? "",
            pendiente_total: item.pendiente_total ?? "",
            status_payment: item.status_payment ?? "",

            comentarios: item.comentarios ?? "",
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
        state : "Pendiente CT",
        ticket_jira: "",
        amount_h1: 0,
        amount_h2: 0,
        hito1: null,
        hito2: null,
        file: null,
        file_h2: null,
        comments: [],
        // sustentos: []
    })

    //UI estados (dialogs)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [commentOpen, setCommentOpen] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [jiraTicket, setJiraTicket] = useState("")
    // const [jiraTicketH2, setJiraTicketH2] = useState("")
    const [initValidate, setInitValidate] = useState(false)
    const [initHito2, setInitHito2] = useState(false)
    const [pendingNextState, setPendingNextState] = useState(null)
    const [saving, setSaving] = useState(false)

    const currentStage = form?.currentStage ?? "hito1"
    const currentState = form?.currentStage == "hito1" ? form?.hito1?.label : form?.hito2?.label

    // console.log("currentState", currentState)

    const transitionKey = useMemo(() => {
        if (!currentState || !pendingNextState) return null
        if (pendingNextState === "Cancelado") return "Cancelado"
        if (pendingNextState === "Cerrado") return "Cerrado"
        // if (pendingNextState === "Hito 2") return "Hito 2"
        return `${currentState}__${pendingNextState}`
    }, [currentState, pendingNextState])

    useEffect(() => {
        if (!editing) {
            setDraftSites(cloneSites(paymentsSites || []))
        }
    }, [paymentsSites, editing])

    const [selectedFile, setSelectedFile] = useState(null)
    const [selectedFile_h2, setSelectedFile_h2] = useState(null)

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
        if (payment) {
            // importante: clon superficial para editar en UI sin mutar el objeto del hook
            // setForm({ ...ticket })
            setForm((prev) => ({ ...prev, ...payment }))
            setSelectedFile(null)
            setSelectedFile_h2(null)
            setEditing(false)
        }
    }, [payment, id])

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

        console.log("DRAFTSITES", draftSites)

        const payload = {
            code: id,
            items: draftSites.map((item) => ({
                _id: item._id,
                status_payment: item.status_payment,
                cantidad_h1: item.cantidad_h1,
                total_pago_h1: item.total_pago_h1,
                cantidad_h2: item.cantidad_h2,
                total_pago_h2: item.total_pago_h2,
                total_pago: item.total_pago,
                pendiente_total: item.pendiente_total,
                comentarios: item.comentarios
            }))
        }

        fd.append("payload", JSON.stringify(payload));
        const resp = await updatePaymentsSites(id, fd);

        if (resp.result !== "OK") {
            throw new Error(resp.msg || "No se pudo actualizar")
        }

        toast.success("Sitios actualizados correctamente")

    }

    async function submitChangeState({ nextState, comment }) {
        // console.log("submitChangeState", nextState, comment)

        if (!form) return;

        try {

            const fd = new FormData();

            const currentStage = form?.currentStage ?? "hito1";
            const currentLabel = currentStage == "hito1" ? form?.hito1?.label : form?.hito2?.label;
            const stageKey = currentStage === "hito1" ? "hito1" : "hito2";

            // Helpers de transición
            const isPaySendMg = transitionKey === "Intención de Pago__Pago Enviado a MG";
            const isPayGenerated = transitionKey === "Pago Enviado a MG__Pago Generado";
            const isPaySendMgH2 = transitionKey === "Intención de Pago - Hito 2__Pago Enviado a MG - Hito 2";
            const isPayGeneratedH2 = transitionKey === "Pago Enviado a MG - Hito 2__Pago Generado - Hito 2";

            const isCancelled = nextState === "Cancelado"; // desde cualquier estado
            const isClose = nextState === "Cerrado"; // desde cualquier estado

            const isApprovedJefatura = false

            if (isPaySendMg && !String(jiraTicket ?? "").trim()) {
                throw new Error("Debe ingresar Ticket Jira para cambiar a 'Pago Enviado a MG'.");
            }

            if (isPaySendMgH2 && !String(jiraTicket ?? "").trim()) {
                throw new Error("Debe ingresar Ticket Jira para cambiar a 'Pago Enviado a MG - Hito 2'.");
            }

            const status = nextState === "Intención de Pago"
                ? "intencion_pago"
                : nextState === "Pago Enviado a MG"
                    ? "pago_enviado"
                    : nextState === "Pago Generado"
                        ? "pago_generado"
                        : nextState === "Intención de Pago - Hito 2"
                            ? "intencion_pago_h2"
                            : nextState === "Pago Enviado a MG - Hito 2"
                                ? "pago_enviado_h2"
                                : nextState === "Pago Generado - Hito 2"
                                    ? "pago_generado_h2"
                                    : nextState === "Cancelado"
                                        ? "cerrado"
                                        : nextState === "Cerrado"
                                            ? "cerrado"
                                            : "cerrado";

            // Armar payload dinámico según transición
            const payload = {
                patch: {
                    name: form.name ?? "",
                    requester: form.requester ?? "",
                    // state: nextState ?? current ?? "Pendiente CT",
                    // updated status and label from hito1 or hito2
                    [stageKey]: {
                        status: status,
                        label: nextState
                    },

                    ...(isPaySendMg ? { ticket_jira: String(jiraTicket ?? "").trim() } : {}),
                    ...(isPaySendMgH2 ? { ticket_jira: String(jiraTicket ?? "").trim() } : {}),
                    
                    isClose: isClose ? true : false,
                    openHito2: initHito2 ?? false,
                    initValidate: initValidate ?? false,
                },

                // Solo aplica realmente para Observado -> Pendiente CT
                // replaceSites: Boolean(isReturnPending && selectedFile),

                // Si no hay archivo, puede enviarse [] / undefined
                // sites: sheetData?.[0] ?? [],
                // sites: sitesValidate.dataFinalInsertar,

                comment: comment
                    ? {
                        text: comment,
                        type: `${currentLabel} -> ${nextState}`, // mejor que form.state
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

            const paymentId = form?._id ?? "";
            if (!paymentId) throw new Error("No se encontró paymentId para actualizar.");

            // ============================
            // Ejecutar API según transición
            // ============================
            let resp;

            if (isPaySendMg) {
                resp = await updateStatePaySendMg(paymentId, fd);
            } 
            // else if(isPayGenValidate) {
            //     resp = await updateStatePayGenValidate(paymentId, fd);
            // }
            // else if (isValidateSendMg) {
            //     if(isApprovedJefatura) {
            //         resp = await updateStateValidateSendMg(paymentId, fd);
            //     } else {
            //         throw new Error(`No se puede validar el ticket ${paymentId} porque no se ha aprobado la jefatura.`);
            //     }       
            // } 
            
            else if (isPayGenerated) {
                resp = await updateStatePayGenerated(paymentId, fd);
                // await updateTicketsSites(ticketId, fd2)
            } else if (isPaySendMgH2) {
                resp = await updateStatePaySendMgH2(paymentId, fd);
            } else if (isPayGeneratedH2) {
                resp = await updateStatePayGeneratedH2(paymentId, fd);
            } else if (isCancelled) {
                resp = await updateStatePayCancelled(paymentId, fd);
            } else if (isClose) {
                resp = await updateStatePayClose(paymentId, fd);
            } else {
                throw new Error(`Transición no soportada: ${transitionKey}`);
            }

            setEditing(false);
            setCommentText("");
            setJiraTicket("");

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

    if (loading || payment === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Cargando ticket...</h1>
                </div>
            </div>
        )
    }

    if (!payment) {
        return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Ticket no encontrado</h1>
                <Link to="/budget/analytics/payments" className="mt-4 inline-block text-blue-600 hover:underline">
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
                            to="/budget/analytics/payments"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/budget/analytics/payments" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Historial
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
                                            <h1 className="text-lg font-medium text-gray-400">{payment.name}</h1>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="cursor-pointer bg-blue-500 hover:bg-blue-400 text-white">
                                            Acción
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
                                                        selectedFile_h2={selectedFile_h2}
                                                        onChangeField={onChangeField}
                                                        onPickFile={onPickFile}
                                                        onClearFile={onClearFile}
                                                        inputRef={inputRef}
                                                        download={downloadCR}
                                                        // fileSustentos={fileSustentos}
                                                        // setFileSustentos={setFileSustentos}
                                                        error={error}
                                                        setError={setError}
                                                        // Update Mini State
                                                        startStateChange={startStateChange}
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

                    {transitionKey === "Intención de Pago__Pago Enviado a MG" && (
                        <div className="space-y-2">
                            <Label>Ticket Jira</Label>
                            <Input
                                value={jiraTicket}
                                onChange={(e) => setJiraTicket(e.target.value)}
                                placeholder="Ej: GCIR-1234"
                            />
                        </div>
                    )}

                    {transitionKey === "Intención de Pago - Hito 2__Pago Enviado a MG - Hito 2" &&  (
                        <div className="space-y-2">
                            <Label>Ticket Jira</Label>
                            <Input
                                value={jiraTicket}
                                onChange={(e) => setJiraTicket(e.target.value)}
                                placeholder="Ej: GCIR-1234"
                            />
                        </div>
                    )}

                    {/* {transitionKey === "Intención de Pago__Pago Enviado a MG" &&  (
                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">
                                ¿Deseas enviar a validar Hito 2?
                            </span>
                            <RadioGroup
                                value={initValidate}
                                onValueChange={setInitValidate}
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
                    )} */}

                    {currentStage === "hito1" && pendingNextState === "Cerrado" && (
                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">
                                ¿Desea Iniciar Hito 2?
                            </span>
                            <RadioGroup
                                value={initHito2}
                                onValueChange={setInitHito2}
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