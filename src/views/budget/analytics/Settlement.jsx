import { useCallback, useEffect, useMemo, useState } from "react";
import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import MoreOptions from "@/components/Tables/MoreOptions";
import Pagination from "@/components/Tables/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSettlements } from "@/hooks/budget/capex/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { buildGenerateCrRowForTemplate, buildPaRowForTemplate, exportGenerateCrToXlsx, exportPaToXlsx } from "@/lib/exportExcel";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatCurrency, formatDDMMYYYYHour, toNumber } from "@/lib/helpers";
import { getOCbyProjects } from "@/services/capex/getOCbyProjects";
import { getSettlements } from "@/services/capex/getSettlements";
import { getSettlementOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, FileText, FolderKanban, Inbox, Plus, Search, X } from "lucide-react";
import { Link } from "react-router";
import { toast } from "wc-toast"
import { StatusModal } from "@/components/StatusModal/StatusModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContracts } from "@/hooks/budget/capex/useContracts";

const TABLE_ID = "settlements"

const columns = [
    { id: "code", label: "Código", visible: true },
    { id: "name", label: "Nombre", visible: true },
    
    { id: "count", label: "Q", visible: true },
    { id: "amount", label: "Monto", visible: true },
    { id: "provider", label: "Proveedor", visible: true },
    { id: "requester", label: "Solicitante", visible: true },
    { id: "assigned", label: "Asignado a", visible: true },
    { id: "estado", label: "Estado", visible: true },
    { id: "createdAt", label: "Fecha Creación", visible: true }
]

const toolbarConfig = {
	search: { placeholder: "Buscar por código o nombre" },
	selects: [],
    visibleKeys: ["search"]
};

const STATUS_TICKET = {
    "Pendiente": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Aprobado": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"]
}


function PreviewTableRow({
    row,
    editable,
    onToggleRow,
    onCommitHito,
    formatCurrency,
}) {

    // console.log("PREVIEW ROW", row)

    const [draftH1, setDraftH1] = useState(row.cantidad ?? "");

    useEffect(() => {
        setDraftH1(row.cantidad ?? "");
    }, [row.cantidad]);

    const numeric =
        draftH1 === "" || draftH1 == null || Number.isNaN(Number(draftH1))
        ? 0
        : Math.max(0, Math.min(100, Number(draftH1)));

    const draftMontoH1 = draftH1 === "" ? 0 : (numeric * row.monto_oc) / 100;
    // const draftCantidadH2 = draftH1 === "" ? 100 : 100 - numeric;
    // const draftMontoH2 = draftH1 === "" ? row.monto : ((100 - numeric) * row.monto) / 100;

    return (
        <tr className="border-b">
            <td className="px-3 py-3">
                <Checkbox
                    checked={row.selected}
                    disabled={!editable}
                    onCheckedChange={(checked) => onToggleRow(row.id, checked)}
                    aria-label={`Seleccionar ${row.identificador}`}
                />
            </td>

            <td className="px-3 py-3">{row.identificador || "-"}</td>
            <td className="px-3 py-3">{row.sitio || "-"}</td>
            <td className="px-3 py-3">{row.actividad || "-"}</td>
            <td className="px-3 py-3">{row.solucion || "-"}</td>
            <td className="px-3 py-3">{row.oc || "-"}</td>
            <td className="px-3 py-3">{row.linea_oc || "-"}</td>
            <td className="px-3 py-3">{formatCurrency(row.monto_oc)}</td>

            <td className="px-3 py-3">{row.cantidad_h1}</td>
            <td className="px-3 py-3">{formatCurrency(row.total_pago_h1)}</td>

            {/* <td className="px-3 py-3">
                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                {row.estado}
                </Badge>
            </td> */}

            <td className="px-3 py-3">
                <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={draftH1}
                disabled={!editable}
                onChange={(e) => setDraftH1(e.target.value)}
                onBlur={() => onCommitHito(row.id, draftH1)}
                placeholder={editable ? "0 - 100" : "-"}
                className={`w-[110px] ${editable ? "text-[#2b7fff]" : ""}`}
                />
            </td>

            <td className="px-3 py-3 font-medium text-[#2b7fff]">
                {formatCurrency(draftMontoH1)}
            </td>

        </tr>
    );
};

function uniqueProviders(contract) {
    const setCont = new Set()
    contract.forEach(p => setCont.add(p.proveedor))
    return Array.from(setCont)
}

export default function Settlement() {

    const { user } = useAuth()

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewBaseRows, setPreviewBaseRows] = useState([]);
    const [filtroProyecto, setFiltroProyecto] = useState([]);
    const [filtroLineaInversion, setFiltroLineaInversion] = useState([]);
    const [nameTicket, setNameTicket] = useState("");
    const [selectedProvider, setSelectedProvider] = useState("");

    const { contracts } = useContracts({ page: 1, limit: 1000 })
    const providers = uniqueProviders(contracts)

    const [alertState, setAlertState] = useState({
        open: false,
        type: "error",
        title: "",
        message: "",
        details: [],
        route: ""
    })

    let {
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        sortDirection,
        setSortDirection,
        itemsPerPage,
        setItemsPerPage,
        visibleColumns,
        toggleColumn,
    } = useTableTool({ columns })

    const isVisible = (key) => !toolbarConfig.visibleKeys || toolbarConfig.visibleKeys.includes(key)

    const [filters, setFilters] = useState({
        search: ""
    })

    const {
        filterOptions,
        loadingOptions,
        errorOptions,
    } = useOptionsFilter({
        request: getSettlementOptions,
        debugName: "getSettlementOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "estado",
                label: "Estado",
                type: "select",
                icon: FolderKanban,
                options: filterOptions.estado || [],
            },
            {
                id: "proveedor",
                label: "Proveedor",
                type: "select",
                icon: FileText,
                options: filterOptions.proveedor || [],
            },
            {
                id: "requester",
                label: "Solicitante",
                type: "select",
                icon: FileText,
                options: filterOptions.requester || [],
            },
            {
                id: "assigned_to",
                label: "Asignado a",
                type: "select",
                icon: FileText,
                options: filterOptions.assigned_to || [],
            }
        ];
    }, [filterOptions]);

    const {
        activeAdvancedFilters,
        setActiveAdvancedFilters,
        removeAdvancedFilter,
        clearAdvancedFilters,
    } = usePersistentAdvancedFilters({
        tableId: TABLE_ID,
        userKey: user?.email
    });
    
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

    const advancedFilters = useMemo(() => {
        return activeFiltersToParams(activeAdvancedFilters);
    }, [activeAdvancedFilters]);

    const advancedFiltersKey = useMemo(() => {
        return JSON.stringify(advancedFilters);
    }, [advancedFilters]);

    const debouncedSearch = useDebounce(filters.search, 300);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        advancedFiltersKey,
        itemsPerPage,
        sortBy,
        sortDirection,
        setCurrentPage,
    ]);

    const queryParams = useMemo(() => {
        return {
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearch,
            sortBy,
            sortDirection,
            ...advancedFilters,
        };
    }, [
        currentPage,
        itemsPerPage,
        debouncedSearch,
        sortBy,
        sortDirection,
        advancedFilters,
    ]);

    let {
        settlement,
        loading,
        totalResults,
        totalPages,
        error,
        addSettlements
    } = useSettlements(queryParams);

    console.log("settlement", settlement)

    const getFilteredRows = (row) => {
        //trim and lowercase
        const hasOc = row.oc == 0 
            ? false
            : String(row.oc ?? "").trim() !== "";
        const hasLineaOc = String(row.linea_oc ?? "").trim() !== "";
        return hasOc && hasLineaOc
    }

    function startGenerate() {
        setConfirmOpen(true)
    }

    function onConfirmProceed() {

        setConfirmOpen(false);
        submitChangeState() 
        // submitChangeState({ jefatura: selectedJefatura });
    }

    async function submitChangeState() {

        setPreviewOpen(true);
        
        try {
            // LLAMADA API
            const res = await getOCbyProjects({
                // nombre_proyecto,
                // linea_inversion,
                is_payment: true,
                proveedor: selectedProvider,
                page: 1,
                limit: 2000,
            });

            console.log("RES", res)

            const rows = (res?.content?.items || []).map((row, idx) => {
            
                const baseRow = {
                    id: row._id || `${row.identificador}-${idx}`,
                    selected: false,
                    identificador: row.identificador ?? "",
                    descripcion_adicional: row.descripcion_adicional ?? "",
                    sitio: row.sitio ?? "",
                    actividad: row.actividad ?? "",
                    rq: row.rq ?? "",
                    oc: row.oc ?? "",
                    linea_oc: row.linea_oc ?? "",
                    monto_oc: toNumber(row.total_cotizacion),
                    // estado: identifiers.find(s => s.name === row.identificador)?.state ?? "-",
                    // estado: row.estado,

                    cantidad_h1: row.cantidad_pago ?? 0,
                    total_pago_h1: row.monto_pago ?? 0,

                    cantidad: row.cantidad_pago_pendiente ?? 0,
                    precio_unitario: row.monto_pago_pendiente ?? 0,
                    
                    // NEWS
                    id_proyecto: row.id_proyecto ?? "",
                    nombre_proyecto: row.nombre_proyecto ?? "",
                    linea_inversion: row.linea_inversion ?? "",
                    proveedor: row.proveedor ?? "",
                    solucion: row.solucion ?? "",
                    is_payment: row.is_payment ?? ""
                }
            
                // return applyDefaultHitos(baseRow, selectedJefatura);
                return baseRow
            });

            // const rowsValidate = rows.filter(r => STATUS_SITE_VALIDATE.includes(r.estado))
            // const rowsValidate = getStatusSiteValidate(rows)
            const rowsValidate = rows.filter(r => getFilteredRows(r))
            // console.log("ROWSVALIDATE", rowsValidate)


            // setPreviewRows(res?.content?.items || []);
            setPreviewBaseRows(rowsValidate);
            // setPreviewOpen(true);

        } catch (error) {
            console.log(error)
        }
        
        // setPreviewOpen(true)
    }

    const previewRows = useMemo(() => {
        return previewBaseRows.filter((row) => {
            const matchProyecto =
                !filtroProyecto.length ||
                filtroProyecto.includes(row.nombre_proyecto);

            const matchLinea =
                !filtroLineaInversion.length ||
                filtroLineaInversion.includes(row.linea_inversion);

            return matchProyecto && matchLinea;
        });
    }, [previewBaseRows, filtroProyecto, filtroLineaInversion]);

    function canEditHito(row) {
        const hasOc = String(row.oc ?? "").trim() !== "";
        const hasLineaOc = String(row.linea_oc ?? "").trim() !== "";
        // const allowedStatuses = new Set(["Activado"]);
        return hasOc && hasLineaOc
    }

    const selectableRows = useMemo(
        () => previewRows.filter((row) => canEditHito(row)),
        [previewRows]
    );

    const allSelectableChecked =
        selectableRows.length > 0 &&
        selectableRows.every((row) => row.selected);

    const someSelectableChecked =
        selectableRows.some((row) => row.selected) && !allSelectableChecked;

    function toggleSelectAll(checked) {
        setPreviewBaseRows((prev) =>
            prev.map((row) =>
            canEditHito(row)
                ? { ...row, selected: !!checked }
                : { ...row, selected: false }
            )
        );
    }

    function toggleRow(rowId, checked) {
        setPreviewBaseRows((prev) =>
            prev.map((row) =>
                row.id === rowId ? { ...row, selected: !!checked } : row
            )
        );
    }

    const handleHitoCommit = useCallback((rowId, rawValue) => {
        setPreviewBaseRows((prev) => {
            const index = prev.findIndex((row) => row.id === rowId);
            if (index === -1) return prev;

            const currentRow = prev[index];

            let nextValue = String(rawValue ?? "").replace(/[^\d.]/g, "");

            let cantidad = "";
            let total_pago = 0;
            // let cantidad_h2 = 100;
            // let total_pago_h2 = Number(currentRow.monto || 0);

            if (nextValue !== "") {
                let numeric = Number(nextValue);
                if (!Number.isFinite(numeric)) numeric = 0;

                if (numeric < 0) numeric = 0;
                if (numeric > 100) numeric = 100;

                cantidad = numeric;
                total_pago = (numeric * currentRow.monto_oc) / 100;
                // cantidad_h2 = 100 - numeric;
                // total_pago_h2 = ((100 - numeric) * currentRow.monto) / 100;
            }

            const updatedRow = {
                ...currentRow,
                cantidad,
                total_pago,
                // cantidad_h2,
                // total_pago_h2,
                _editedH1: true,
            };

            const next = [...prev];
            next[index] = updatedRow;
            return next;
        });
    }, []);

    async function handleProcess(rowsToProcess) {
    
        const template="/plantillas/template_generacion_cr.xlsx"
        const transformProject = rowsToProcess.map(buildGenerateCrRowForTemplate);

        const fd = new FormData();

        const payload = {
            name: nameTicket,
            requester: user?.firstName + " " + user?.lastName,
            requester_email: user?.email,
            proveedor: selectedProvider,
            assigned_to: "",
            assigned_to_email: "",
            estado: "Pendiente",
        }

        fd.append("settlementData", JSON.stringify(payload));
        fd.append("settlementSites", JSON.stringify(rowsToProcess));

        try {

            const fileName = "Formato CR"

            const generatedFile = await exportGenerateCrToXlsx({
                templatePath: template,
                transformProject,
                fileName,
                download: false,
                returnFile: true
            })

            const warnings = ""

            fd.append("file", generatedFile);


            const res = await addSettlements(fd)
            const ticket = res.content.code

            showAlert({
                open: true,
                type: "success",
                title: "Se registró la solicitud",
                message: "Solicitud registrado con éxito",
                details: {
                    warnings,
                },
                route: `/budget/analytics/settlement/${ticket}`
            })

            toast.success("Solicitud Registrada")
            setPreviewOpen(false)
        } catch (error) {
            console.log(error)
            toast.error("Error al descargar reporte")
            setPreviewOpen(false)
        }

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
                                    <Link aria-current="page" to="/budget/analytics/settlement/" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Inbox /> Mis Liquidaciones
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/settlement/history" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <FolderKanban /> Historial
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <a 
                            href="#" 
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Liquidaciones</h2>
                    </div>
                    {/* <FormNewTicket showAlert={showAlert} user={user} /> */}
                    <Button size="icon" onClick={startGenerate} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        {/* Toolbar */}
                                        <div className="flex  pb-6  flex-col">
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">

                                                {/* Filtros avanzados */}
                                                <FilterAdvanced
                                                    columns={columns}
                                                    availableFilters={availableFilters}
                                                    data={settlement}
                                                    activeFilters={activeAdvancedFilters}
                                                    onActiveFiltersChange={setActiveAdvancedFilters}
                                                    showFiltersInsidePopover={false}
                                                />
                                                                                    
                                                {/* Búsqueda */}
                                                {toolbarConfig.search && isVisible("search") && ( 
                                                    <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Buscar por código o nombre"
                                                            value={filters.search ?? ""}
                                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                            className="pl-9 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between sm:justify-start gap-6 sm:ml-auto">
                                                    
                                                    {/* Resultados */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-[#364153] font-medium">{totalResults}</span>
                                                        <span className="text-sm text-muted-foreground">resultados</span>
                                                    </div>

                                                    {/* Mas Opciones */}
                                                    <MoreOptions
                                                        itemsPerPage={itemsPerPage}
                                                        setItemsPerPage={setItemsPerPage}
                                                        sortBy={sortBy}
                                                        setSortBy={setSortBy}
                                                        sortDirection={sortDirection}
                                                        setSortDirection={setSortDirection}	
                                                        template="/plantillas/template_download_pa.xlsx"
                                                        fileName="Reporte PA"
                                                        // data={resultData}
                                                        totalResults={totalResults}
                                                        service={getSettlements}
                                                        transformData={buildPaRowForTemplate}
                                                        exportData={exportPaToXlsx}     
                                                    />

                                                </div>
                                            </div>

                                            {activeAdvancedFilters.length > 0 && (
                                                <div className="col-span-2 col-start-1 row-start-3 mt-4 flex flex-wrap items-center gap-2">
                                                    <div className="text-lighttext mr-2 cursor-default border-r pr-4 leading-6">
                                                        Filtros activos
                                                    </div>
                                                    {activeAdvancedFilters.map((filter) => (
                                                        <div key={filter.id} data-filtercontainer="" className="relative">
                                                        <input type="hidden" name="filterSuperStatus" value="0" />
                                                            <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3.5 leading-6 text-violet-600 pr-8 cursor-pointer">
                                                                {filter.label}: <strong className="font-medium">{filter.value}</strong>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeAdvancedFilter(filter.id)}
                                                                    className="absolute right-px rounded-full p-1.25 opacity-75 transition-all hover:opacity-100 focus:bg-violet-200"
                                                                    aria-label={`Quitar filtro ${filter.label}`}
                                                                >
                                                                    <X className="h-4 w-4 " />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Table */}
                                        <div className="max-h-[520px] overflow-auto">
                                            <Table className="">
                                                <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">
                                                    <TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                                    {columns.map(
                                                        (column) =>
                                                        visibleColumns[column.id] && (
                                                            <TableHead
                                                                key={column.id} 
                                                                className="whitespace-nowrap">
                                                                <button className="flex items-center uppercase text-[#64748B] text-center gap-3 hover:text-foreground transition-colors">                                 
                                                                    {column.label}
                                                                </button>
                                                            </TableHead>
                                                        ),
                                                    )}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loading ? (
                                                        Array.from({ length: 5 }).map((_, rowIdx) => (
                                                        <TableRow key={`skeleton-${rowIdx}`}>
                                                            {columns.map(
                                                                (col) =>
                                                                visibleColumns[col.id] && (
                                                                <TableCell key={col.id}>
                                                                    <Skeleton className="h-4 w-[90%]" />
                                                                </TableCell>
                                                                )
                                                            )}
                                                        </TableRow>
                                                    ))
                                                    ) : settlement.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>

                                                    ) : (
                                                        settlement.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {visibleColumns.code && (
                                                            <TableCell className="min-w-[80px] font-medium text-blue-600">
                                                                <Link to={`/budget/analytics/settlement/${row.code}`} className="truncate hover:underline">
                                                                    {row.code}
                                                                </Link>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.name && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate font-medium text-slate-800" title={row.name}>
                                                                    {row.name}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            

                                                            {visibleColumns.count && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.count}>
                                                                    {row.count}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.amount && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.amount}>
                                                                    {formatCurrency(row.amount)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.provider && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.proveedor}>
                                                                    {row.proveedor}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.requester && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.requester}>
                                                                    {row.requester}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.assigned && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.assigned_to}>
                                                                    {row.assigned_to}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.estado && (
                                                            <TableCell className="min-w-[100px]">
                                                                <Badge
                                                                    className={
                                                                        "flex justify-center items-center gap-4 truncate p-1.5 rounded-xl " +
                                                                        STATUS_TICKET[row.estado][0]
                                                                    }
                                                                    title={row.estado}
                                                                >
                                                                    <div
                                                                        className={
                                                                        "size-2 flex-none rounded-full outline-4 outline-solid " +
                                                                        STATUS_TICKET[row.estado][1]
                                                                        }
                                                                    />
                                                                    {row.estado}
                                                                </Badge>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.createdAt && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.createdAt}>
                                                                    {formatDDMMYYYYHour(row.createdAt)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                        </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        {/* PAGINATION */}
                                        <Pagination
                                            totalResults={totalResults} 
                                            totalPages={totalPages} 
                                            currentPage={currentPage} 
                                            setCurrentPage={setCurrentPage} 
                                        />
                                    </div>
                                </div>
                            </div> 
                        </div>     
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
                <AlertDialogContent className="w-[800px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-blue-500">Generar Liquidaciones</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ingresar nombre de la solicitud para continuar.                        
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Nombre <span className="text-red-400">*</span></Label>
                                <Input
                                    className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                    placeholder="Ingresa nombre"
                                    value={nameTicket}
                                    required
                                    onChange={(e) => setNameTicket(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Proveedor <span className="text-red-400">*</span></Label>
                                <Select
                                    className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                    value={selectedProvider}
                                    onValueChange={(value) => {
                                        setSelectedProvider(value);
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar Proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers?.map((p) => (
                                            <SelectItem key={p} value={p}>
                                                {p}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmProceed}
                            disabled={loadingPreview}
                        >
                        {loadingPreview ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                            Continuar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog con tabla */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-[1200px]">
                    <DialogHeader>
                        <DialogTitle className="text-[#2b7fff]">Vista previa de datos filtrados</DialogTitle>
                        {/* <DialogDescription> */}
                        {/* <div className="flex gap-4 my-4">
                            <MultiSelectFilter
                                label="Proyecto"
                                icon={Briefcase}
                                options={proyectoOptions}
                                selected={filtroProyecto}
                                onChange={setFiltroProyecto}
                                placeholder="Seleccionar proyecto"
                            />
                            <MultiSelectFilter
                                label="Línea de inversión"
                                icon={Briefcase}
                                options={lineaInversionOptions}
                                selected={filtroLineaInversion}
                                onChange={setFiltroLineaInversion}
                                placeholder="Seleccionar línea"
                            />
                        </div> */}
                        {/* </DialogDescription> */}
                    </DialogHeader>

                    <div className="max-h-[500px] overflow-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-20 backdrop-blur border-b-2">
                                <tr className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                    <th className="w-[60px] px-3 py-3 text-left">
                                        <Checkbox
                                            checked={allSelectableChecked ? true : someSelectableChecked ? "indeterminate" : false}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Seleccionar todos"
                                        />
                                    </th>
                                    <th className="px-3 min-w-[120px] py-3 text-left text-[#64748B] font-semibold">Identificador</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Site</th>
                                    <th className="px-3 min-w-[150px] py-3 text-left text-[#64748B] font-semibold">Actividad</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">Solución</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">OC</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">Línea OC</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Monto</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Cantidad Pagada</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Monto Pagado</th>
                                    {/* <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Estado</th> */}
                                    <th className="px-3 py-3 text-left font-semibold text-[#2b7fff]">
                                        Cantidad Liquidar
                                    </th>
                                    <th className="px-3 min-w-[120px] py-3 text-left font-semibold text-[#2b7fff]">
                                        Monto Liquidar
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                                    No se encontraron registros para esos filtros.
                                    </td>
                                </tr>
                                ) : (
                                previewRows.map((row) => (
                                    <PreviewTableRow
                                        key={row.id}
                                        row={row}
                                        editable={canEditHito(row)}
                                        onToggleRow={toggleRow}
                                        onCommitHito={handleHitoCommit}
                                        formatCurrency={formatCurrency}
                                    />
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            Seleccionados:{" "}
                            <span className="font-semibold text-[#2b7fff]">
                            {previewRows.filter((r) => r.selected).length}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                                Cerrar
                            </Button>
                            <Button
                                onClick={() => {
                                    const rowsToProcess = previewRows.filter((r) => r.selected);
                                    handleProcess(rowsToProcess);
                                }}
                                disabled={previewRows.every((r) => !r.selected)}
                                >
                                Procesar seleccionados
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}   