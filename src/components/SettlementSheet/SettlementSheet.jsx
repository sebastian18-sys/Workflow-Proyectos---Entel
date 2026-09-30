import { formatCurrency, toNumber } from "@/lib/helpers";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { FileDown, Upload } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Separator } from "../ui/separator";
import Dropzone from "../drag_drop/drag_drop";
import { Spinner } from "../ui/spinner";
import { toast } from "wc-toast";
import * as XLSX from "xlsx";
import { buildSettlementSitesRowForTemplate, exportSettlementToXlsx } from "@/lib/exportExcel";
import { COORDINADORES, UNIDADES_FUNCIONALES } from "@/constants/coordinadores";
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy";
import { PERMS } from "@/constants/perm";
import { useAuthz } from "@/hooks/useAuthz";

const ALL_VALUE = "__all__";

const isBlank = (value) => {
    return value === undefined || value === null || value === "";
};

const unique = (arr) => {
    return [...new Set(arr.filter(Boolean))];
};


const isTouched = (draft) => {
    return (
        !isBlank(draft?.liquidacion) ||
        !isBlank(draft?.status_deliverable) ||
        !isBlank(draft?.descuento) ||
        !isBlank(draft?.penalidad) ||
        Boolean(draft?.sustentoFile)
    );
};

const getValidation = (row, draft) => {
    const total_cotizacion = toNumber(row?.total_cotizacion);
    const liquidacion = toNumber(draft?.liquidacion);
    // const monto_pago = toNumber(row?.monto_pago);

    const hasLiquidacion = !isBlank(draft?.liquidacion);
    const superaMonto = hasLiquidacion && liquidacion > total_cotizacion;
    const minorMonto = hasLiquidacion && liquidacion < total_cotizacion;

    const requiereSustento = minorMonto;
    const tieneSustento = Boolean(draft?.sustentoFile || draft?.sustentoName);

    return {
        superaMonto,
        requiereSustento,
        tieneSustento,
        isValid: !requiereSustento || tieneSustento,
    };
};

function ConfirmActionButton({
    children,
    title,
    description,
    disabled,
    onConfirm,
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={disabled} className="flex-1 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-full">
                {children}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Confirmar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}



function UploadSites({ user, ocSites, onLoadRows }) {

    const [open, setOpen] = useState(false)
    const [file, setFile] = useState([]);
    const [fileSustentos, setFileSustentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sheetData = []

    const initialForm = {
        nombre: "",
        file: [],
        fileSustentos: []
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

        if (!file) return;
        setError(null);
        setLoading(true);

        const fd = new FormData();

        try {
            const buffer = await file[0].arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0]

            console.log("sheetName", sheetName)

            const ws = workbook.Sheets[sheetName];

            // Validar Formato
            // validateTemplateTickets(workbook, sheetName)

            const range = XLSX.utils.decode_range(ws['!ref']);
            range.s.r = 1 // Fila 0
            range.s.c = 1 // Columna B

            const rows = XLSX.utils.sheet_to_json(ws, {
                header: 1,   // primera fila = encabezados
                defval: "",  // celdas vacías = "",
                range
            });

            if (!rows.length) {
                throw new Error("La hoja está vacía o no tiene datos.");
            }

            // ---- Estructura (según formato):
            const header = rows[0]
            const dataRows = rows.slice(1)
            const rqMap = new Map();

            const parsed = dataRows
                .filter((r) => r[0]) 
                .map((r) => {

                    const identificador = String(r[0]).trim();
                    const sitio = String(r[1]).trim();
                    const rq = String(r[11]).trim();
                    const oc = String(r[12]).trim();
                    const linea_oc = String(r[13]).trim();

                    // user complete
                    const liquidacion = String(r[17]).trim();
                    const status_deliverable = String(r[18]).trim();
                    const descuento = String(r[19]).trim();
                    const penalidad = String(r[20]).trim();
                    const pendiente_pago = String(r[21]).trim();
                    const monto_final_pagado = 0

                    return {
                        identificador,
                        sitio,
                        rq,
                        oc,
                        linea_oc,
                        // user complete
                        liquidacion,
                        status_deliverable,
                        descuento,
                        penalidad,
                        pendiente_pago,
                        monto_final_pagado
                        // jefatura
                    };
                })
                .filter((item) => item.liquidacion !== "");;

            console.log("parsed", parsed)

            sheetData.push(parsed)

            console.log("sheetData", sheetData)

            onLoadRows?.(parsed);
    
        } catch (e) {

            setError(e?.message || "No se pudo procesar el archivo");
            console.error(e)
            toast.error("Error al cargar archivo")
        } finally {
            setLoading(false);
        }
        setForm(initialForm)
        setOpen(false)
    }
    // cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex whitespace-nowrap w-auto shrink-0">
                    <Upload className="h-6 w-6 text-white" /> Actualizar masivamente
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-3xl max-h-[85vh] overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-sm font-semibold text-blue-500 pb-2">
                                Actualizar Masivamente
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Descarga la información Completa e importa para actualizar masivamente los sitios. 
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                
                <Separator />

                <div className="flex items-center justify-between px-6 ">
                    <Button onClick={downloadTemplate} className="cursor-pointer inline-flex items-center gap-2 rounded-xl border bg-blue-500 border-gray-300 px-3 py-2 text-sm hover:bg-blue-400">
                        <FileDown className="h-4 w-4" /> Descargar Información de Sitios
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
    )
}


const SettlementRow = memo(function SettlementRow({
    row,
    draft,
    onCommit,
    onAttachFile,
}) {
    const [local, setLocal] = useState(() => ({
        liquidacion: draft?.liquidacion ?? row.liquidacion ?? "",
        status_deliverable:
        draft?.status_deliverable ?? row.status_deliverable ?? "Pendiente",
        descuento: draft?.descuento ?? row.descuento ?? "",
        penalidad: draft?.penalidad ?? row.penalidad ?? "",
    }));

    useEffect(() => {
        setLocal({
            liquidacion: draft?.liquidacion ?? row.liquidacion ?? "",
            status_deliverable:
                draft?.status_deliverable ?? row.status_deliverable ?? "Pendiente",
            descuento: draft?.descuento ?? row.descuento ?? "",
            penalidad: draft?.penalidad ?? row.penalidad ?? "",
        });
    }, [
        row._id,
        row.liquidacion,
        row.status_deliverable,
        row.descuento,
        row.penalidad,
        draft?.liquidacion,
        draft?.status_deliverable,
        draft?.descuento,
        draft?.penalidad,
    ]);

    const effectiveDraft = useMemo(() => {
        return {
            ...draft,
            ...local,
        };
    }, [draft, local]);

    const validation = useMemo(() => {
        return getValidation(row, effectiveDraft);
    }, [
        row,
        effectiveDraft,
    ]);

    const calculatedValues = useMemo(() => {
        return calculatePaymentValues(row, effectiveDraft);
    }, [
        row,
        effectiveDraft,
    ]);

    const commit = useCallback(
        (patch) => {
            onCommit(row._id, patch);
        },
        [onCommit, row._id]
    );

    return (
        <TableRow>
            <TableCell 
                style={{ left: 0, width: 180, minWidth: 180 }}
                className="font-medium text-blue-600 sticky z-10 bg-white">
                {row.identificador}
            </TableCell>

            <TableCell
                style={{ left: 230, width: 300, minWidth: 300 }}
                className="max-w-[250px] whitespace-normal font-medium text-slate-800 sticky z-10 bg-white border-r-2"
            >
                <div className="max-w-[250px]" title={row.sitio}>
                {row.sitio}
                </div>
            </TableCell>

            <TableCell className="max-w-[250px] truncate" title={row.actividad}>
                {row.actividad}
            </TableCell>
            <TableCell className="max-w-[250px] truncate" title={row.proveedor}>
                {row.proveedor}
            </TableCell>

            <TableCell>
                <div className="max-w-[250px] truncate" title={row.nombre_proyecto}>
                {row.nombre_proyecto ?? "-"}
                </div>
            </TableCell>

            <TableCell>
                <div className="max-w-[250px] truncate" title={row.linea_inversion}>
                {row.linea_inversion ?? "-"}
                </div>
            </TableCell>

            <TableCell className="border-l">{row.rq ?? "-"}</TableCell>
            <TableCell>{row.oc ?? "-"}</TableCell>
            <TableCell>{row.linea_oc ?? "-"}</TableCell>

            <TableCell className="font-medium">
                {row.total_cotizacion}
            </TableCell>

            <TableCell className="border-r font-medium">
                {row.monto_pago ?? 0}
            </TableCell>

            <TableCell>
                <Input
                type="number"
                className={cn(
                    "w-[130px]",
                    validation.superaMonto && "border-amber-300 bg-amber-50"
                )}
                value={local.liquidacion}
                onChange={(e) => {
                    setLocal((prev) => ({
                    ...prev,
                    liquidacion: e.target.value,
                    }));
                }}
                onBlur={(e) => {
                    commit({
                    liquidacion: e.target.value,
                    });
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                    e.currentTarget.blur();
                    }
                }}
                placeholder="0.00"
                />
            </TableCell>

            <TableCell>
                <select
                className="h-9 w-[120px] rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                value={local.status_deliverable}
                onChange={(e) => {
                    const value = e.target.value;

                    setLocal((prev) => ({
                    ...prev,
                    status_deliverable: value,
                    }));

                    commit({
                    status_deliverable: value,
                    });
                }}
                >
                <option value="Entregables">Entregables</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Stand by">Stand by</option>
                <option value="Ok">Ok</option>
                </select>
            </TableCell>

            <TableCell>
                <Input
                    type="number"
                    className="w-[100px]"
                    value={local.descuento}
                    onChange={(e) => {
                        setLocal((prev) => ({
                        ...prev,
                        descuento: e.target.value,
                        }));
                    }}
                    onBlur={(e) => {
                        commit({
                        descuento: e.target.value,
                        });
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                        e.currentTarget.blur();
                        }
                    }}
                    placeholder="0"
                />
            </TableCell>

            <TableCell>
                <Input
                    type="number"
                    className="w-[100px]"
                    value={local.penalidad}
                    onChange={(e) => {
                        setLocal((prev) => ({
                        ...prev,
                        penalidad: e.target.value,
                        }));
                    }}
                    onBlur={(e) => {
                        commit({
                        penalidad: e.target.value,
                        });
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                        e.currentTarget.blur();
                        }
                    }}
                    placeholder="0"
                />
            </TableCell>

            <TableCell>
                <div className="w-[120px] font-medium">
                {formatCurrency(calculatedValues.pendiente_pago)}
                </div>
            </TableCell>

            {/* <TableCell>
                <div className="w-[130px] font-medium">
                {formatCurrency(calculatedValues.monto_final_pagado)}
                </div>
            </TableCell> */}

            <TableCell>
                {validation.superaMonto ? (
                <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-700"
                >
                    Supera Monto Cotizado
                </Badge>
                ) : validation.requiereSustento ? (
                    <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-700"
                    >
                        Subir archivo liquidacion
                    </Badge>
                ) : (
                <span className="text-sm text-muted-foreground">No requerido</span>
                )}
            </TableCell>

            <TableCell>
                {validation.requiereSustento ? (
                <div className="space-y-1">
                    <Input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.zip,.rar,.png,.jpg,.jpeg"
                    className="w-[180px]"
                    onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) return;

                        onAttachFile(row._id, file);
                    }}
                    />

                    {draft?.sustentoName && (
                    <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                        {draft.sustentoName}
                    </p>
                    )}
                </div>
                ) : (
                <span className="text-sm text-muted-foreground">
                    No requerido
                </span>
                )}
            </TableCell>
        </TableRow>
    );
})



const normalizeDiscount = (value) => {
    const n = toNumber(value);

    if (n > 1) return n / 100;

    return n;
};

const getFinalValue = (draft, row, field) => {
    return draft?.[field] ?? row?.[field] ?? "";
};

const calculatePaymentValues = (row, draft = {}) => {
    const totalCotizacion = toNumber(row.total_cotizacion);
    const montoPago = toNumber(row.monto_pago);

    const liquidacionRaw = getFinalValue(draft, row, "liquidacion");
    const descuentoRaw = getFinalValue(draft, row, "descuento");
    const penalidadRaw = getFinalValue(draft, row, "penalidad");

    const liquidacion = toNumber(liquidacionRaw);
    const descuento = normalizeDiscount(descuentoRaw);
    const penalidad = toNumber(penalidadRaw);

    let pendientePago = 0;

    if (liquidacion === 0) {
        pendientePago = totalCotizacion - montoPago;
    } else {
        pendientePago =
        liquidacion * (1 - descuento) -
        montoPago -
        penalidad;
    }

    const montoTotalPago = montoPago + pendientePago;

    return {
        pendiente_pago: Number(pendientePago.toFixed(2)),
        monto_final_pagado: Number(montoTotalPago.toFixed(2)),
    };
};


export default function SettlementSheet({
    open,
    onOpenChange,
    user,
    onSubmitLiquidation
}) {

    const [renderTable, setRenderTable] = useState(false);

    useEffect(() => {
        if (!open) {
            setRenderTable(false);
            return;
        }

        const timer = setTimeout(() => {
            setRenderTable(true);
        }, 200);

        return () => clearTimeout(timer);
    }, [open]);

    const { can } = useAuthz()

    const canReadAll = false;
    const canReadAllInternal = can(PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ_ALL_INTERNAL);
    // const canReadAllInternal = false;

    const queryParams = useMemo(() => {
        return {
            page: 1,
            limit: 5000,
            is_payment: true,
            exclude_status_settlement: true,
        };
    }, []);

    const ticketParams = useMemo(() => {
        if (canReadAll) return queryParams;

        if (canReadAllInternal) {
            return {
                ...queryParams,
                unidad_funcional: UNIDADES_FUNCIONALES[user?.email] ?? "SIN UNIDAD FUNCIONAL"
            }
        };

        return {
            ...queryParams,
            // coordinador: COORDINADORES[user?.email] ?? "SIN COORDINADOR",
            assigned_to_email: user?.email ?? "SIN COORDINADOR",
        };
    }, [canReadAll, canReadAllInternal, queryParams, user?.email]);

    let {
        ocSites,
        loading,
        totalResults,
        totalPages,
        error,
    } = useOCbyProy(ticketParams, { enabled: open });

    const [draftsById, setDraftsById] = useState({});

    const [importResult, setImportResult] = useState(null);
    const [openUpload, setOpenUpload] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        coordinador: "",
        nombre_proyecto: "",
        linea_inversion: "",
    });

    const deferredSearch = useDeferredValue(filters.search);

    const coordinadorOptions = useMemo(() => {
        return unique(ocSites.map((row) => row.coordinador));
    }, [ocSites]);

    const projectOptions = useMemo(() => {
        return unique(ocSites.map((row) => row.nombre_proyecto));
    }, [ocSites]);

    const lineOptions = useMemo(() => {
        return unique(
        ocSites
            .filter((row) => {
            if (!filters.nombre_proyecto) return true;
            return row.nombre_proyecto === filters.nombre_proyecto;
            })
            .map((row) => row.linea_inversion)
        );
    }, [ocSites, filters.nombre_proyecto]);

    const filteredRows = useMemo(() => {
        // const q = filters.search.trim().toLowerCase();
        const q = deferredSearch.trim().toLowerCase();

        return ocSites.filter((row) => {
        const matchSearch =
            !q ||
            [
                row.identificador,
                row.sitio,
                row.oc,
                row.rq,
                row.nombre_proyecto,
                row.linea_inversion,
            ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));

        const matchCoord =
            !filters.coordinador ||
            row.coordinador === filters.coordinador;

        const matchProject =
            !filters.nombre_proyecto ||
            row.nombre_proyecto === filters.nombre_proyecto;

        const matchLine =
            !filters.linea_inversion ||
            row.linea_inversion === filters.linea_inversion;

        return matchSearch && matchCoord && matchProject && matchLine;
        });
    }, [
        ocSites,
        deferredSearch,
        filters.coordinador,
        filters.nombre_proyecto,
        filters.linea_inversion
     ]);

    // console.log("filteredRows", filteredRows)

    // const updateDraft = (rowId, patch) => {
    //     setDraftsById((prev) => ({
    //     ...prev,
    //     [rowId]: {
    //         ...prev[rowId],
    //         ...patch,
    //     },
    //     }));
    // };

    const updateDraft = useCallback((rowId, patch) => {
        setDraftsById((prev) => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                ...patch,
            },
        }));
    }, []);

    const attachFile = useCallback((rowId, file) => {
        setDraftsById((prev) => ({
            ...prev,
            [rowId]: {
            ...prev[rowId],
                sustentoFile: file,
                sustentoName: file.name,
            },
        }));    
    }, []);

    const rowsById = useMemo(() => {
        return new Map(ocSites.map((row) => [row._id, row]));
    }, [ocSites]);

    const touchedRows = useMemo(() => {
        return Object.entries(draftsById)
            .map(([id, draft]) => ({
                row: rowsById.get(id),
                draft,
            }))
            .filter(({ row, draft }) => row && isTouched(draft));
    }, [rowsById, draftsById]);

    const rowsWithPendingSupport = useMemo(() => {
        return touchedRows.filter(({ row, draft }) => {
        const validation = getValidation(row, draft);
        // return validation.requiereSustento && !validation.tieneSustento;
        return validation.requiereSustento && !validation.tieneSustento;
        });
    }, [touchedRows]);

    const hasBlockingErrors = rowsWithPendingSupport.length > 0;

    const buildItems = () => {
        return touchedRows.map(({ row, draft }) => {
        const validation = getValidation(row, draft);

        const {
            pendiente_pago,
            monto_final_pagado,
        } = calculatePaymentValues(row, draft);

        return {
            _id: row._id,

            identificador: row.identificador,
            sitio: row.sitio,
            rq: row.rq ?? null,
            oc: row.oc ?? null,
            linea_oc: row.linea_oc ?? null,

            nombre_proyecto: row.nombre_proyecto ?? null,
            linea_inversion: row.linea_inversion ?? null,

            total_cotizacion: toNumber(row.total_cotizacion),
            monto_pago: toNumber(row.monto_pago),

            liquidacion: isBlank(draft.liquidacion)
                ? null
                : toNumber(draft.liquidacion),

            status_deliverable: draft.status_deliverable || null,
            // estado_oc_draw: draft.estado_oc_draw || null,

            descuento: isBlank(draft.descuento)
                ? null
                : toNumber(draft.descuento),

            penalidad: isBlank(draft.penalidad)
                ? null
                : toNumber(draft.penalidad),

            pendiente_pago,
            monto_final_pagado,

            supera_monto: validation.superaMonto,
            requiere_sustento: validation.requiereSustento,

            sustento_file_field: draft.sustentoFile
                ? `sustento_${row._id}`
                : null,

            sustento_name: draft.sustentoName || null,
        };
        });
    };

    const submitAction = async (action) => {
        const itemsSettlement = buildItems();

        if (!itemsSettlement.length) return;
        if (hasBlockingErrors) return;

        const filesSettlement = touchedRows
            .filter(({ draft }) => draft?.sustentoFile)
            .map(({ row, draft }) => ({
                fieldName: `sustento_${row._id}`,
                file: draft.sustentoFile,
                rowId: row._id,
                originalName: draft.sustentoName,
            }));

        // console.log("action:", action);
        // console.log("items:", itemsSettlement);
        // console.log("files:", filesSettlement);

        await onSubmitLiquidation?.({
            action,
            itemsSettlement,
            filesSettlement
        });
    };

    const startUpload = () => {
        setOpenUpload(true)
    }

    const normalizeKeyPart = (value) => {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/\.0$/, "");
    };

    const makeLiquidationKey = (row) => {
        return [
            normalizeKeyPart(row.identificador),
            normalizeKeyPart(row.oc),
            normalizeKeyPart(row.linea_oc),
        ].join("|");
    };

    const cleanNumberInput = (value) => {
        if (value === undefined || value === null) return "";

        const text = String(value).trim();

        if (!text) return "";

        return text.replace(",", ".");
    };

    const applyImportedRowsToTable = (importedRows = []) => {

        console.log("importedRows", importedRows)

        const rowsByKey = new Map();

        ocSites.forEach((row) => {
            const key = makeLiquidationKey(row);

            if (!rowsByKey.has(key)) {
            rowsByKey.set(key, []);
            }

            rowsByKey.get(key).push(row);
        });

        let matched = 0;
        const notFound = [];
        const invalidDeliverables = [];

        setDraftsById((prev) => {
            const next = { ...prev };

            importedRows.forEach((importedRow) => {
            const key = makeLiquidationKey(importedRow);
            const matchedRows = rowsByKey.get(key);

            if (!matchedRows?.length) {
                notFound.push(importedRow);
                return;
            }

            const statusDeliverable = importedRow.status_deliverable === "" || importedRow.status_deliverable === null
                ? ""
                : importedRow.status_deliverable;

            if (
                importedRow.status_deliverable &&
                !statusDeliverable
            ) {
                invalidDeliverables.push({
                    identificador: importedRow.identificador,
                    oc: importedRow.oc,
                    linea_oc: importedRow.linea_oc,
                    value: importedRow.status_deliverable,
                });
            }

            matchedRows.forEach((siteRow) => {
                next[siteRow._id] = {
                    ...next[siteRow._id],

                    liquidacion: cleanNumberInput(importedRow.liquidacion),

                    // Entregable
                    status_deliverable: statusDeliverable,

                    descuento: cleanNumberInput(importedRow.descuento),
                    penalidad: cleanNumberInput(importedRow.penalidad),
                    // estado_oc_draw: importedRow.estado_oc_draw
                };

                matched++;
            });
            });

            return next;
        });

        setImportResult({
            total: importedRows.length,
            matched,
            notFound,
            invalidDeliverables,
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full lg:w-[80vw] lg:max-w-none sm:max-w-none">
                <SheetHeader>
                    <SheetTitle className="text-lg font-semibold text-blue-500">Borrador de liquidación</SheetTitle>
                    <SheetDescription>Completa solo los registros que correspondan. Si la liquidación supera el monto pagado, adjunta sustento.</SheetDescription>
                </SheetHeader>

                <div className="flex h-full min-h-0 flex-col space-y-4 px-6 py-4">
                    <div className="flex flex-col gap-3 border-b pb-4">
                        
                        <div className="flex justify-between">
                            <div className="flex gap-3">
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">Buscar</Label>
                                    <Input
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value,
                                            }))
                                        }
                                        placeholder="Identificador, sitio, OC, RQ..."
                                    />
                                </div>

                                {/* Filtro Coordinador */}
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">Coordinador</Label>
                                    <Select
                                        value={filters.coordinador || ALL_VALUE}
                                        onValueChange={(value) =>
                                            setFilters((prev) => ({
                                            ...prev,
                                            coordinador: value === ALL_VALUE ? "" : value
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                                                {coordinadorOptions.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filtro Proyecto */}
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">Proyecto</Label>
                                    <Select
                                        value={filters.nombre_proyecto || ALL_VALUE}
                                        onValueChange={(value) =>
                                            setFilters((prev) => ({
                                            ...prev,
                                            nombre_proyecto: value === ALL_VALUE ? "" : value,
                                            linea_inversion: "",
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                                                {projectOptions.map((project) => (
                                                <SelectItem key={project} value={project}>
                                                    {project}
                                                </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filtro Linea de Inversión */}
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">Línea inversión</Label>
                                    <Select
                                        value={filters.linea_inversion || ALL_VALUE}
                                        onValueChange={(value) =>
                                            setFilters((prev) => ({
                                            ...prev,
                                            linea_inversion: value === ALL_VALUE ? "" : value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                                            {lineOptions.map((line) => (
                                            <SelectItem key={line} value={line}>
                                                {line}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setFilters({
                                            search: "",
                                            coordinador: "",
                                            nombre_proyecto: "",
                                            linea_inversion: "",
                                            })
                                        }
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span>{filteredRows.length} registro(s) visibles</span>
                                <span>·</span>
                                <span>{touchedRows.length} registro(s) completados</span>

                                {rowsWithPendingSupport.length > 0 && (
                                    <>
                                        <span>·</span>
                                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                                            {rowsWithPendingSupport.length} sustento(s) pendiente(s)
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <UploadSites 
                                user={user} 
                                ocSites={ocSites}
                                onLoadRows={(rowsFromExcel) => {
                                    applyImportedRowsToTable(rowsFromExcel)
                                }} 
                            />
                            <div className="flex flex-wrap gap-2">
                                <ConfirmActionButton
                                    title="Confirmar guardado"
                                    description="Se guardará el borrador de liquidación con los registros completados."
                                    disabled={touchedRows.length === 0 || hasBlockingErrors}
                                    onConfirm={() => submitAction("SAVE")}
                                >
                                    Guardar
                                </ConfirmActionButton>

                                <ConfirmActionButton
                                    title="Confirmar generación de liquidación"
                                    description="Se generará la liquidación con los registros completados."
                                    disabled={touchedRows.length === 0 || hasBlockingErrors}
                                    onConfirm={() => submitAction("GENERATE")}
                                >
                                    Generar Liquidación
                                </ConfirmActionButton>
                            </div>
                        </div>

                            
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {String(error)}
                        </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                        <Table className="min-w-max border-separate border-spacing-0">
                        <TableHeader>
                            <TableRow>
                            <TableHead 
                                style={{ left: 0, width: 180, minWidth: 180 }}
                                className="sticky top-0 z-50 min-w-[200px] bg-slate-50"
                            >
                                Identificador
                            </TableHead>
                            <TableHead 
                                style={{ left: 230, width: 300, minWidth: 300 }}
                                className="sticky top-0 z-50 bg-slate-50 border-r-2"
                            >
                                Sitio
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[100px] bg-slate-50">
                                Actividad
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[100px] bg-slate-50">
                                Proveedor
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[260px] bg-slate-50">
                                Proyecto
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[260px] bg-slate-50">
                                Línea inversión
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[100px] border-l-2 bg-blue-50 text-blue-800 border-blue-200">
                                RQ
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[100px] bg-blue-50 text-blue-800 border-blue-200">
                                OC
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[100px] bg-blue-50 text-blue-800 border-blue-200">
                                LINEA OC
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[100px] bg-blue-50 text-blue-800 border-blue-200">
                                Total Cotización
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[130px] bg-blue-50 text-blue-800 border-blue-200">
                                Monto pagado
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[150px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Liquidación
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[140px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Entregable
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[120px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                % Descuento
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[120px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Penalidad
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[120px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Pendiente Pago
                            </TableHead>
                            {/* <TableHead className="sticky top-0 z-30 min-w-[120px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Mongo Final Pagado
                            </TableHead> */}
                            <TableHead className="sticky top-0 z-30 min-w-[260px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Alerta
                            </TableHead>
                            <TableHead className="sticky top-0 z-30 min-w-[260px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Sustento
                            </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading || !renderTable ? (
                            <TableRow>
                                <TableCell colSpan={18} className="h-24 text-center">
                                Cargando...
                                </TableCell>
                            </TableRow>
                            ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                colSpan={18}
                                className="h-24 text-center text-muted-foreground"
                                >
                                No hay registros
                                </TableCell>
                            </TableRow>
                            ) : (
                            filteredRows.map((row) => (

                                // <></>
                                <SettlementRow
                                    key={row._id}
                                    row={row}
                                    draft={draftsById[row._id]}
                                    onCommit={updateDraft}
                                    onAttachFile={attachFile}
                                />

                            ))
                            )}
                        </TableBody>
                        </Table>
                    </div>
                    </div>

            </SheetContent>

            

        </Sheet>
    )
}