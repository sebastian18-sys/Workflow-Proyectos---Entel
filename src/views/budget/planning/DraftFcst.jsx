import { Fragment, useMemo, useState } from "react";
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronRight,
    Columns2,
    DraftingCompass,
    Edit3,
    FileDown,
    FilePenLine,
    History,
    Layers,
    Layers3,
    PanelRightOpen,
    RotateCcw,
    Save,
    Search,
    Send,
    TableProperties,
    Upload,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router";
import Dropzone from "@/components/drag_drop/drag_drop";
import { Spinner } from "@/components/ui/spinner";

const MONTHS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const initialRows = [
    {
        id: "1",
        code: "M0945",
        project: "REUBICACION DE FIBRA OPTICA LIMA CENTRO 2026",
        line: "2-1-SERVICIO IMPLEMENTACION FIBRA OPTICA",
        group: "SERVICIO",
        type: "Proyecto",
        editableFromMonth: 6,
        fcst: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50639.95],
        cf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
        id: "2",
        code: "M0940",
        project: "OPTIMIZACION DE ESPACIO EN TORRE - REDUCCION OPEX 2026",
        line: "2-1-SERVICIOS RF Y TX",
        group: "SERVICIO",
        type: "Proyecto",
        editableFromMonth: 5,
        fcst: [0, 0, 0, 0, 0, 1685.41, 0, 47559.61, 47559.61, 47559.61, 24395.67, 0],
        cf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
        id: "3",
        code: "M0939",
        project: "COMPANIA MINERA COIMOLACHE S.A. 2026",
        line: "2-3-SERVICIO IMPLEMENTACION NODO",
        group: "SERVICIO",
        type: "Proyecto",
        editableFromMonth: 6,
        fcst: [0, 0, 0, 0, 0, 0, 29824.3, 29824.3, 0, 0, 0, 0],
        cf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
        id: "4",
        code: "M0939",
        project: "COMPANIA MINERA COIMOLACHE S.A. 2026",
        line: "2-2-SERVICIOS OOCC",
        group: "SERVICIO",
        type: "Proyecto",
        editableFromMonth: 6,
        fcst: [0, 0, 0, 0, 0, 0, 31766.76, 31766.76, 0, 0, 0, 0],
        cf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
];

function money(value) {
    return new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function sum(values) {
    return values.reduce((acc, value) => acc + Number(value || 0), 0);
}

function parseNumber(value) {
    if (value === "" || value == null) return 0;
    const parsed = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function cloneMonths(values) {
    return Array.from({ length: 12 }, (_, index) => Number(values?.[index] || 0));
}

function MonthEditor({
    values,
    originalValues,
    editableFromMonth,
    onChange,
    compact = false,
}) {
    return (
        <ScrollArea className="w-full rounded-xl border">
            <div className={compact ? "min-w-[940px] p-3" : "min-w-[980px] p-4"}>
                <div className="grid grid-cols-12 gap-2">
                {MONTHS.map((month, index) => {
                    const disabled = index < editableFromMonth;
                    const changed =
                    Number(values[index] || 0) !== Number(originalValues[index] || 0);

                    return (
                        <div key={month} className="space-y-1.5">
                            <div className="flex min-h-5 items-center justify-between gap-1">
                                <Label className={disabled ? "text-muted-foreground" : ""}>
                                    {month}
                                </Label>

                                {changed && (
                                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                                )}
                            </div>

                            <Input
                                type="number"
                                step="0.01"
                                value={values[index]}
                                disabled={disabled}
                                onChange={(event) =>
                                    onChange(index, parseNumber(event.target.value))
                                }
                                className={[
                                    "h-9 text-right tabular-nums",
                                    changed ? "border-blue-500 bg-blue-50" : "",
                                    disabled ? "bg-slate-100 text-muted-foreground" : "",
                                ].join(" ")}
                            />
                        </div>
                    );
                })}
                </div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}

function DetailsTable({ rows, onEdit, expandedId, onToggleInline, inlineDraft, setInlineDraft }) {
    return (
        <div className="overflow-hidden rounded-2xl border bg-white">
            <ScrollArea className="w-full">
                <div className="min-w-[1180px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100 hover:bg-slate-100">
                                <TableHead className="py-2 w-12" />
                                <TableHead className="py-2">CÓDIGO</TableHead>
                                <TableHead className="py-2 min-w-[360px]">PROYECTO</TableHead>
                                <TableHead className="py-2 min-w-[360px]">LÍNEA DE INVERSIÓN</TableHead>
                                <TableHead className="py-2">GRUPO</TableHead>
                                <TableHead className="py-2">TIPO</TableHead>
                                <TableHead className="py-2 min-w-[130px] text-right bg-amber-50 text-amber-700">
                                    TOTAL FCST
                                </TableHead>
                                <TableHead className="py-2 min-w-[130px] text-right bg-amber-50 text-amber-700">
                                    TOTAL CF
                                </TableHead>
                                <TableHead className="py-2 w-24 text-right">ACCIÓN</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                        {rows.map((row) => (
                        <Fragment key={row.id}>
                            <TableRow>
                                <TableCell className="py-2">
                                {onToggleInline && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleInline(row)}
                                    >
                                    {expandedId === row.id ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    </Button>
                                )}
                                </TableCell>
                                <TableCell className="py-2 font-medium text-blue-600">{row.code}</TableCell>
                                <TableCell className="py-2 font-medium">{row.project}</TableCell>
                                <TableCell className="py-2">{row.line}</TableCell>
                                <TableCell className="py-2">{row.group}</TableCell>
                                <TableCell className="py-2">{row.type}</TableCell>
                                <TableCell className="py-2 text-right font-semibold text-amber-700 bg-amber-50/60">
                                    {money(sum(row.fcst))}
                                </TableCell>
                                <TableCell className="py-2 text-right font-semibold text-amber-700 bg-amber-50/60">
                                    {money(sum(row.cf))}
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                {onEdit && (
                                    <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                )}
                                </TableCell>
                            </TableRow>

                            {expandedId === row.id && inlineDraft && (
                                <TableRow className="bg-slate-50/70">
                                    <TableCell colSpan={9} className="py-2 p-5">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">Edición rápida — Forecast</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Editable desde {MONTHS[row.editableFromMonth]}.
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setInlineDraft((current) => ({
                                                        ...current,
                                                        fcst: cloneMonths(row.fcst),
                                                        }))
                                                    }
                                                >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                    Restablecer
                                                </Button>
                                                <Button>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Guardar borrador
                                                </Button>
                                            </div>
                                        </div>

                                        <MonthEditor
                                            compact
                                            values={inlineDraft.fcst}
                                            originalValues={row.fcst}
                                            editableFromMonth={row.editableFromMonth}
                                            onChange={(monthIndex, value) =>
                                                setInlineDraft((current) => {
                                                    const next = cloneMonths(current.fcst);
                                                    next[monthIndex] = value;
                                                    return { ...current, fcst: next };
                                                })
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

function InlineDemo({ rows }) {
    const [expandedId, setExpandedId] = useState(null);
    const [inlineDraft, setInlineDraft] = useState(null);

    function toggle(row) {
        if (expandedId === row.id) {
            setExpandedId(null);
            setInlineDraft(null);
            return;
        }
        setExpandedId(row.id);
        setInlineDraft({
            rowId: row.id,
            fcst: cloneMonths(row.fcst),
        });
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <TableProperties className="h-5 w-5 text-blue-600" />
                    Edición individual expandible dentro de la tabla
                </CardTitle>
            </CardHeader>
            <CardContent>
                <DetailsTable
                    rows={rows}
                    expandedId={expandedId}
                    onToggleInline={toggle}
                    inlineDraft={inlineDraft}
                    setInlineDraft={setInlineDraft}
                />
            </CardContent>
        </Card>
    );
}



export default function DraftFcst() {

    const [popOpen, setPopOpen] = useState(false);
    const [file, setFile] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function startUpload(e) {
        e.preventDefault()
        setPopOpen(true)
    }

    const sheetData = []
    const initialForm = {
        nombre: "",
        file: [],
        // fileSustentos: []
    }

    const [form, setForm] = useState(initialForm)
    
    const downloadTemplate = async () => {

        const TEMPLATE = "/plantillas/Liquidaciones_Actualizacion_Masiva.xlsx"
        const transformProject = ocSites.map(buildSettlementSitesRowForTemplate);

        console.log("transformProject", transformProject)

        const fileName = "Liquidaciones_Masivas"

        await exportSettlementToXlsx({
            templatePath: TEMPLATE,
            dataFinal: transformProject,
            fileName: fileName
        })

    }

    const onSubmit = async (e) => {
        e.preventDefault()

        // if (!file) return;
        // setError(null);
        // setLoading(true);

        // const fd = new FormData();

        // try {
        //     const buffer = await file[0].arrayBuffer();
        //     const workbook = XLSX.read(buffer, { type: "array" });
        //     const sheetName = workbook.SheetNames[0]

        //     console.log("sheetName", sheetName)

        //     const ws = workbook.Sheets[sheetName];

        //     // Validar Formato
        //     // validateTemplateTickets(workbook, sheetName)

        //     const range = XLSX.utils.decode_range(ws['!ref']);
        //     range.s.r = 1 // Fila 0
        //     range.s.c = 1 // Columna B

        //     const rows = XLSX.utils.sheet_to_json(ws, {
        //         header: 1,   // primera fila = encabezados
        //         defval: "",  // celdas vacías = "",
        //         range
        //     });

        //     if (!rows.length) {
        //         throw new Error("La hoja está vacía o no tiene datos.");
        //     }

        //     // ---- Estructura (según formato):
        //     const header = rows[0]
        //     const dataRows = rows.slice(1)
        //     const rqMap = new Map();

        //     const parsed = dataRows
        //         .filter((r) => r[0]) 
        //         .map((r) => {

        //             const identificador = String(r[0]).trim();
        //             const sitio = String(r[1]).trim();
        //             const rq = String(r[11]).trim();
        //             const oc = String(r[12]).trim();
        //             const linea_oc = String(r[13]).trim();

        //             // user complete
        //             const liquidacion = String(r[17]).trim();
        //             const status_deliverable = String(r[18]).trim();
        //             const descuento = String(r[19]).trim();
        //             const penalidad = String(r[20]).trim();
        //             const pendiente_pago = String(r[21]).trim();
        //             const monto_final_pagado = String(r[22]).trim();

        //             return {
        //                 identificador,
        //                 sitio,
        //                 rq,
        //                 oc,
        //                 linea_oc,
        //                 // user complete
        //                 liquidacion,
        //                 status_deliverable,
        //                 descuento,
        //                 penalidad,
        //                 pendiente_pago,
        //                 monto_final_pagado
        //                 // jefatura
        //             };
        //         })
        //         .filter((item) => item.liquidacion !== "");;

        //     console.log("parsed", parsed)

        //     sheetData.push(parsed)

        //     console.log("sheetData", sheetData)

        //     onLoadRows?.(parsed);
    
        // } catch (e) {

        //     setError(e?.message || "No se pudo procesar el archivo");
        //     console.error(e)
        //     toast.error("Error al cargar archivo")
        // } finally {
        //     setLoading(false);
        // }
        // setForm(initialForm)
        // setOpen(false)
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* NAV TABS */}
                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    {/* className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent" */}
                                    <Link aria-current="page" to="/budget/planning/forecasts/summary" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Layers /> Resumen
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/planning/forecasts/details" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Columns2 /> Detalles
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/planning/forecasts/draft" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <DraftingCompass /> Borrador
                                        </div>
                                    </Link>
                                </div>
                            </div>  
                        </div>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex justify-between gap 4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <a 
                            href="#" 
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Draft</h2>
                    </div>
                    <div className="flex gap-4">
                        <Button type="button" size="icon" onClick={startUpload} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex whitespace-nowrap w-auto shrink-0">
                            <Upload className="h-6 w-6 text-white" /> Actualizar masivo
                        </Button>
                    </div>
                </div>
                

                {/* Main */}
                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">
                                        <InlineDemo rows={initialRows} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog open={popOpen} onOpenChange={setPopOpen}>
                    {/* <DialogTrigger asChild>
                        <Button size="icon" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex whitespace-nowrap w-auto shrink-0">
                            <Upload className="h-6 w-6 text-white" /> Actualizar masivamente
                        </Button>
                    </DialogTrigger> */}
                    <DialogContent className="p-0 sm:max-w-3xl max-h-[85vh] overflow-hidden">
                        <DialogHeader className="px-6 pt-5 pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-sm font-semibold text-blue-500 pb-2">
                                        Actualizar Masivamente
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                        Descarga la información Completa e importa para actualizar masivamente los proyectos. 
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
        
                        <Separator />
        
                        <div className="flex items-center justify-between px-6 ">
                            <Button className="cursor-pointer inline-flex items-center gap-2 rounded-xl border bg-blue-500 border-gray-300 px-3 py-2 text-sm hover:bg-blue-400">
                                <FileDown className="h-4 w-4" /> Descargar Información de Proyectos
                            </Button>
                        </div>
        
                        <div className="max-h-[calc(85vh-120px)] overflow-y-auto">
        
                            <form id="new-project-form" onSubmit={onSubmit} className="px-6 py-5 space-y-6">
        
                                <section className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Carga de Datos <span className="text-red-400">*</span></Label>
                                            <Dropzone
                                                files={file}
                                                onFilesChange={setFile}
                                                error={error}
                                                setError={setError}
                                                maxFiles={1}
                                                onFile={setFile} 
                                            />
                                        </div>
                                    </div>
                                </section>
                                <Separator />
                                <DialogFooter className="gap-2 pt-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" className="cursor-pointer">
                                            Cancelar
                                        </Button>
                                    </DialogClose>
                                    {!loading ? (
                                        <Button type="submit" className="gap-2 bg-blue-500 hover:bg-blue-400 cursor-pointer">
                                            <Upload className="h-4 w-4" /> Subir
                                        </Button>
                                    ) : (
                                        <Button disabled type="submit" className="gap-2 bg-blue-500 hover:bg-blue-400 cursor-pointer">
                                            <Spinner className="h-4 w-4" />
                                        </Button>
                                    )}
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
