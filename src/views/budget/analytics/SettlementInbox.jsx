import DialogAssign from "@/components/DialogAssign/DialogAssign";
import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import SettlementSheet from "@/components/SettlementSheet/SettlementSheet";
import MoreOptions from "@/components/Tables/MoreOptions";
import Pagination from "@/components/Tables/Pagination";
import MultiSelectFilter from "@/components/ui/_multiselect3";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COORDINADORES, COORDINADORES_REAL, UNIDADES_FUNCIONALES } from "@/constants/coordinadores";
import { PERMS } from "@/constants/perm";
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy";
import { useSettlements } from "@/hooks/budget/capex/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { useAuthz } from "@/hooks/useAuthz";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { buildSettlementSitesRowForTemplate, buildTicketSitesRowForTemplate, exportSettlementToXlsx, exportTicketSitesToXlsx } from "@/lib/exportExcel";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatCurrency } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { getOCbyProjects } from "@/services/capex/getOCbyProjects";
import { getOCOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, Briefcase, Building2, FileText, FolderKanban, HandCoins, Inbox, Search, User2, UserRoundCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { toast } from "wc-toast";

const TABLE_ID = "settlement"

const columns = [
    { id: "identificador", label: "Identificador", visible: true },
	{ id: "sitio", label: "Sitio", visible: true },
    { id: "actividad", label: "Actividad", visible: true },
    { id: "solucion", label: "Solución", visible: true },
    { id: "proveedor", label: "Proveedor", visible: true },
    { id: "nombre_proyecto", label: "Proyecto", visible: true },
    { id: "linea_inversion", label: "Línea de Inversión", visible: true },
    { id: "coordinador", label: "Coordinador", visible: true },
    { id: "rq", label: "RQ", visible: true },
    { id: "oc", label: "OC", visible: true },
    { id: "linea_oc", label: "Línea OC", visible: true },
    { id: "total_cotizacion", label: "Monto OC", visible: true },
    { id: "cantidad_pago", label: "Cantidad Pagada", visible: true },
    { id: "monto_pago", label: "Monto Pagado", visible: true },

    // NEWS
    { id: "settlement", label: "Liquidación", visible: true },
    { id: "status_settlement", label : "Estado Liquidacion", visible : true },
    { id: "status_deliverable", label: "Entregable", visible: true },
    { id: "percentaje_discount", label: "% Descuento", visible: true },
    { id: "penalty", label: "Penalidad SNC", visible: true },
]

const STICKY_WIDTHS = {
    identificador: 160,
};

const getStickyStyle = (id) => {
    if (id === "identificador") {
        return {
            left: 0,
            width: STICKY_WIDTHS.identificador,
            minWidth: STICKY_WIDTHS.identificador,
        };
    }

    if (id === "sitio") {
        return {
            left: STICKY_WIDTHS.identificador,
            minWidth: 320,
        };
    }

    return {};
};

const getColumnClass = (id, isHeader = false) => {
    const sticky =
        id === "identificador" || id === "sitio";

    return cn(
        "whitespace-nowrap",

        sticky && [
            "sticky",
            isHeader ? "z-50 bg-slate-50" : "z-30 bg-white",
        ],

        id === "sitio" && "shadow-[inset_-1px_0_0_#e2e8f0]",
        id === "rq" && "border-l-2 bg-blue-50 text-blue-800 border-blue-200",
        id === "oc" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "linea_oc" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "total_cotizacion" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "cantidad_pago" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "monto_pago" && "bg-blue-50 text-blue-800 border-blue-200",

        id === "settlement" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "status_settlement" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "status_deliverable" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "percentaje_discount" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "penalty" && "bg-emerald-50 text-emerald-800 border-emerald-200",
    );
};


const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar..." },
	selects: [],
    visibleKeys: ["search"]
};


const coordinatorUsers = Object.keys(UNIDADES_FUNCIONALES);

// console.log("coordinatorUsers", coordinatorUsers)

function PreviewTableRow({
    row,
    // editable,
    onToggleRow,
    // onCommitHito,
    // formatCurrency,
}) {

    return (
        <tr className="border-b">
            <td className="px-3 py-3">
                <Checkbox
                    checked={row.selected}
                    // disabled={!editable}
                    onCheckedChange={(checked) => onToggleRow(row.id, checked)}
                    aria-label={`Seleccionar ${row.identificador}`}
                />
            </td>

            <td className="px-3 py-3">{row.identificador || "-"}</td>
            <td className="px-3 py-3">{row.sitio || "-"}</td>
            <td className="px-3 py-3">{row.nombre_proyecto || "-"}</td>
            <td className="px-3 py-3">{row.oc || "-"}</td>
            <td className="px-3 py-3">{row.assigned_to || "-"}</td>
            {/* <td className="px-3 py-3"></td> */}
        </tr>
    );
};


export default function SettlementInbox() {

    const { isCollapsed = false } = useOutletContext() || {}

    const { user } = useAuth()
    const { can } = useAuthz()
    
    // sheet
    const [sheetOpen, setSheetOpen] = useState(false);
    // const [dialogOpen, setDialogOpen] = useState(false);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const [previewBaseRows, setPreviewBaseRows] = useState([]);
    const [filtroProyecto, setFiltroProyecto] = useState([]);
    const [filtroCoord, setFiltroCoord] = useState([]);
    const [filtroActividad, setFiltroActividad] = useState([]);
    const [searchOC, setSearchOC] = useState("");

    const [assignToEmail, setAssignToEmail] = useState("");
    const [processing, setProcessing] = useState(false);


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
        request: getOCOptions,
        debugName: "getOCOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "id_proyecto",
                label: "Código Proyecto",
                type: "select",
                icon: FolderKanban,
                options: filterOptions.id_proyecto || [],
            },
            {
                id: "nombre_proyecto",
                label: "Nombre Proyecto",
                type: "select",
                icon: FileText,
                options: filterOptions.nombre_proyecto || [],
            },
            {
                id: "coordinador",
                label: "Coordinador",
                type: "select",
                icon: Building2,
                options: filterOptions.coordinador || [],
            },
            {
                id: "proveedor",
                label: "Proveedor",
                type: "select",
                icon: Building2,
                options: filterOptions.proveedor || [],
            },
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
            is_payment: true,
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

    // const canReadAll = can(PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ_ALL);
    const canReadAll = false;
    const canReadAllInternal = can(PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ_ALL_INTERNAL);
    // const canReadAllInternal = false;

    const ticketParams = canReadAll
        ? queryParams
        : canReadAllInternal 
            ? { ...queryParams, unidad_funcional: UNIDADES_FUNCIONALES[user?.email] ?? "SIN UNIDAD FUNCIONAL", exclude_status_settlement: true }
            // : { ...queryParams, coordinador: COORDINADORES[user?.email] ?? "SIN COORDINADOR", exclude_status_settlement: true };
            : { ...queryParams, assigned_to_email: user?.email ?? "SIN COORDINADOR", exclude_status_settlement: true };


    let {
        ocSites,
        loading,
        totalResults,
        totalPages,
        error,
        updateAssignTo,
    } = useOCbyProy(ticketParams);

    const { updateSettlements } = useSettlements({ page: 1, limit: 1000 })


    const startGenerate = (e) => {
        e.preventDefault()
        setSheetOpen(true)
    }

    const handleSubmitLiquidation = async (data) => {
        
        const fd = new FormData();

        const payload = {
            action: data.action,
            itemsSettlement: data.itemsSettlement
        }

        data.filesSettlement.forEach(({ fieldName, file }) => {
            fd.append(fieldName, file);
        });

        fd.append("payload", JSON.stringify(payload));
        const resp = await updateSettlements(fd);
        
        if (resp.result !== "OK") {
            throw new Error(resp.msg || "No se pudo actualizar")
        }

        toast.success("Sitios actualizados correctamente")

    }

    const startAssign = (e) => {
        e.preventDefault()
        submitChange()
    }

    const proyectoOptions = useMemo(() => {
        return [...new Set(
            previewBaseRows
                .map(r => r.nombre_proyecto)
                .filter(Boolean)
        )];
    }, [previewBaseRows]);

    const coordOptions = useMemo(() => {
        return [...new Set(
            previewBaseRows
                .map(r => r.coordinador)
                .filter(Boolean)
        )];
    }, [previewBaseRows]);

    const actividadOptions = useMemo(() => {
        return [...new Set(
            previewBaseRows
                .map(r => r.actividad)
                .filter(Boolean)
        )];
    }, [previewBaseRows]);


    const previewRows = useMemo(() => {
        const search = searchOC.trim().toLowerCase();

        return previewBaseRows.filter((row) => {
            const matchProyecto =
                !filtroProyecto.length ||
                filtroProyecto.includes(row.nombre_proyecto);

            const matchCoord =
                !filtroCoord.length ||
                filtroCoord.includes(row.coordinador);

            const matchActividad =
                !filtroActividad.length ||
                filtroActividad.includes(row.actividad);

            const matchOC =
                !search ||
                String(row.oc ?? "")
                    .toLowerCase()
                    .includes(search) ||
                String(row.identificador ?? "")
                    .toLowerCase()
                    .includes(search) ||
                String(row.sitio ?? "")
                    .toLowerCase()
                    .includes(search);

            return matchProyecto && matchCoord && matchActividad && matchOC;
        });
    }, [previewBaseRows, filtroProyecto, filtroCoord, filtroActividad, searchOC]);


    const selectedVisibleRows = useMemo(() => {
        return previewRows.filter((row) => row.selected);
    }, [previewRows]);

    const selectedRows = useMemo(() => {
        return previewBaseRows.filter((row) => row.selected);
    }, [previewBaseRows]);

    const allSelectableChecked =
        previewRows.length > 0 &&
        previewRows.every((row) => row.selected);

    const someSelectableChecked =
        previewRows.some((row) => row.selected) &&
        !allSelectableChecked;

    function toggleSelectAll(checked) {
        const nextChecked = checked === true;

        // Solamente contiene los registros que quedaron luego de aplicar filtros.
        const visibleIds = new Set(
            previewRows.map((row) => row.id)
        );

        setPreviewBaseRows((prev) =>
            prev.map((row) => {
                // Los registros ocultos por el filtro no se modifican.
                if (!visibleIds.has(row.id)) {
                    return row;
                }

                if (row.selected === nextChecked) {
                    return row;
                }

                return {
                    ...row,
                    selected: nextChecked,
                };
            })
        );
    }

    function toggleRow(rowId, checked) {
        const nextChecked = checked === true;

        setPreviewBaseRows((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        selected: nextChecked,
                    }
                    : row
            )
        );
    }

    const selectedAssignee = useMemo(() => {
        return (
            COORDINADORES_REAL.find(
                (user) => user.email === assignToEmail
            ) ?? null
        )
    }, [COORDINADORES_REAL, assignToEmail]);

    // Assign
    async function submitChange() {

        try {
            setLoadingPreview(true);
            setPreviewOpen(true);


            const queryParams = {
                page: 1,
                limit: 5000,
                is_payment: true,
                exclude_status_settlement: true
            };

            if(canReadAllInternal) {
                queryParams.unidad_funcional = UNIDADES_FUNCIONALES[user?.email] ?? "SIN UNIDAD FUNCIONAL"
                // queryParams.unidad_funcional = "Transporte e Indoor"
            } else {
                // queryParams.coordinador = COORDINADORES[user?.email] ?? "SIN COORDINADOR"
                queryParams.assigned_to_email = user?.email ?? "SIN COORDINADOR"
            }

            const res = await getOCbyProjects(queryParams);

            const rows = (res?.content?.items || []).map((row, idx) => {

                const baseRow = {
                    id: row._id || `${row.identificador}-${idx}`,
                    selected: false,
                    identificador: row.identificador ?? "",
                    sitio: row.sitio ?? "",
                    actividad: row.actividad ?? "",
                    oc: row.oc ?? "",
                    linea_oc: row.linea_oc ?? "",
                    nombre_proyecto: row.nombre_proyecto ?? "",
                    coordinador: row.coordinador ?? "",

                    assigned_to: row.assigned_to ?? "",
                    assigned_to_email: row.assigned_to_email ?? "",
                }
                
                return baseRow
            });

            // console.log("ROWSVALIDATE", rows)
            setPreviewBaseRows(rows);
            
        } catch (error) {
            console.error("Error al obtener vista previa:", error);
            setPreviewBaseRows([]);
            setPreviewOpen(true);
        } finally {
            setLoadingPreview(false);
        }

    }

    async function handleProcess(rowsToProcess, assignee) {

        if (!rowsToProcess.length) return
        if (!assignee) return

        try {

            setProcessing(true);
            const fd = new FormData();

            const rowsPayload = rowsToProcess.map((row) => ({
                id: row.id,
                _id: row._id,
                identificador: row.identificador,
                sitio: row.sitio,
                oc: row.oc,
                linea_oc: row.linea_oc,

                // Nuevo coordinador
                assign_to: assignee.name,
                assign_to_email: assignee.email,
            }));

            console.log("rowsPayload", rowsPayload)

            fd.append("payload", JSON.stringify(rowsPayload));

            const res = await updateAssignTo(fd)

            toast.success("Usuarios reasignados correctamente")
            setProcessing(false)
            setPreviewOpen(false)

        } catch (error) {
            console.log(error)
            toast.error("Error")
            setPreviewOpen(false)
        }

    }


    return (
        <div className="flex flex-col px-4 mt-14 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">

                {/* NAV TABS */}
                <div className={`fixed top-18 right-0 left-0 z-10 -mt-px flex h-14 flex-col items-center border-b bg-white px-4 md:px-6 lg:px-8 2xl:top-20 xl:px-10 2xl:px-14
                    ${
                        isCollapsed
                            ? "xl:left-16 2xl:left-16"
                            : "xl:left-60 2xl:left-72"
                    }`}
                >
                    <div className="flex min-h-full w-full flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    {/*  */}
                                    <Link aria-current="page" to="/budget/analytics/settlement" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
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
                    <div className="flex gap-4">
                        {/* <FormNewTicket showAlert={showAlert} user={user} /> */}
                        <Button type="button" size="icon" onClick={startAssign} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-blue-500 bg-white hover:bg-gray-100 focus:outline-offset-2 border-2 border-blue-500 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex whitespace-nowrap w-auto shrink-0">
                            <User2 className="h-6 w-6 text-blue-500" /> Asignar
                        </Button>

                        <Button type="button" size="icon" onClick={startGenerate} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex whitespace-nowrap w-auto shrink-0">
                            <HandCoins className="h-6 w-6 text-white" /> Liquidar
                        </Button>
                    </div>

                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        <div className="relative rounded-2xl bg-white p-4 md:p-5 lg:p-6">
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
                                                    data={ocSites}
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
                                                        template="/plantillas/template_download_settlement.xlsx"
                                                        fileName="Reporte Liquidaciones"
                                                        // data={resultData}
                                                        queryParams={ticketParams}
                                                        totalResults={totalResults}
                                                        service={getOCbyProjects}
                                                        transformData={buildSettlementSitesRowForTemplate}
                                                        exportData={exportSettlementToXlsx}        
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
                                        <div className="w-full max-h-[calc(100vh-360px)] overflow-auto">
                                            <Table className="w-full min-w-[1050px]">
                                                {/* <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2"> */}
                                                <TableHeader>
                                                    <TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                                    {columns.map(
                                                        (column) =>
                                                        visibleColumns[column.id] && (
                                                            <TableHead
                                                                key={column.id} 
                                                                style={getStickyStyle(column.id)}
                                                                // className="whitespace-nowrap"
                                                                className={cn(
                                                                    "sticky top-0 z-20 bg-slate-50 text-[#64748B] backdrop-blur border-b-2",
                                                                    getColumnClass(column.id, true)
                                                                )}
                                                            >
                                                                <button className="flex items-center uppercase  text-center gap-3 hover:text-foreground transition-colors">                                 
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
                                                    ) : ocSites.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>

                                                    ) : (
                                                        ocSites.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {visibleColumns.identificador && (
                                                            <TableCell 
                                                                style={getStickyStyle("identificador")}
                                                                // className="min-w-[80px] font-medium text-blue-600"
                                                                 className={cn(
                                                                    "font-medium text-blue-600",
                                                                    getColumnClass("identificador")
                                                                )}
                                                            >
                                                                {row.identificador}
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.sitio && (
                                                            <TableCell 
                                                                style={getStickyStyle("sitio")}
                                                                // className="min-w-[100px]"
                                                                className={cn(
                                                                    "font-medium text-slate-800 ",
                                                                    getColumnClass("sitio")
                                                                )}
                                                            >
                                                                <div className="truncate font-medium text-slate-800" title={row.sitio}>
                                                                    {row.sitio}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.actividad && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.actividad}>
                                                                    {row.actividad}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.solucion && (
                                                            <TableCell className="whitespace-normal text-slate-800 min-w-[350px]">
                                                                <div className="" title={row.solucion}>
                                                                    {row.solucion}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.proveedor && (
                                                            <TableCell className="whitespace-normal text-slate-800 min-w-[350px]">
                                                                <div className="" title={row.proveedor}>
                                                                    {row.proveedor}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.nombre_proyecto && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.nombre_proyecto}>
                                                                    {row.nombre_proyecto}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.linea_inversion && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.linea_inversion}>
                                                                    {row.linea_inversion}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.coordinador && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.coordinador}>
                                                                    {row.coordinador}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.rq && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate font-medium text-slate-800" title={row.rq}>
                                                                    {row.rq}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.oc && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate font-medium text-slate-800" title={row.oc}>
                                                                    {row.oc}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.linea_oc && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate font-medium text-slate-800" title={row.linea_oc}>
                                                                    {row.linea_oc}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.total_cotizacion && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate font-medium text-slate-800" title={row.total_cotizacion}>
                                                                    {formatCurrency(row.total_cotizacion)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.cantidad_pago && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.cantidad_pago}>
                                                                    {row.cantidad_pago}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.monto_pago && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.monto_pago}>
                                                                    {formatCurrency(row.monto_pago)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.settlement && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.settlement ?? 0}>
                                                                    {row.settlement ?? 0}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.status_settlement && (
                                                            <TableCell className="min-w-[150px]">
                                                                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                                                                    {row.status_settlement ?? "-"}
                                                                </Badge>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.status_deliverable && (
                                                            <TableCell className="min-w-[150px]">
                                                                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                                                                    {row.status_deliverable ?? "-"}
                                                                </Badge>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.percentaje_discount && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.percentaje_discount ?? ""}>
                                                                    {row.percentaje_discount ?? ""}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.penalty && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.penalty ?? ""}>
                                                                    {row.penalty ?? ""}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {/* {visibleColumns.coordinador && (
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
                                                            )} */}

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

            <SettlementSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                user={user}
                onSubmitLiquidation={handleSubmitLiquidation}
            />

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-[1200px]">
                    <DialogHeader>
                        <DialogTitle className="text-[#2b7fff]">Vista previa de datos filtrados</DialogTitle>
                        <div className="flex justify-between gap-4 my-4">
                            <div className="flex gap-4">
                                <div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Search className="h-4 w-4 text-[#2b7fff]" />
                                            Buscar
                                        </label>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={searchOC}
                                                onChange={(e) => setSearchOC(e.target.value)}
                                                placeholder="Identificador / Sitio / OC"
                                                className="h-11 rounded-2xl border-slate-200 pl-9"
                                                aria-label="Búsqueda rápida"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <MultiSelectFilter
                                    label="Proyecto"
                                    icon={Briefcase}
                                    options={proyectoOptions}
                                    selected={filtroProyecto}
                                    onChange={setFiltroProyecto}
                                    placeholder="Seleccionar proyecto"
                                />
                                <MultiSelectFilter
                                    label="Actividad"
                                    icon={Briefcase}
                                    options={actividadOptions}
                                    selected={filtroActividad}
                                    onChange={setFiltroActividad}
                                    placeholder="Seleccionar proyecto"
                                />
                                <MultiSelectFilter
                                    label="Coordinador"
                                    icon={Briefcase}
                                    options={coordOptions}
                                    selected={filtroCoord}
                                    onChange={setFiltroCoord}
                                    placeholder="Seleccionar línea"
                                />
                            </div>

                            <div className="min-w-[280px] space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <UserRoundCheck className="h-4 w-4 text-[#2b7fff]" />
                                    Reasignar seleccionados a
                                </label>

                                <Select
                                    value={assignToEmail}
                                    onValueChange={setAssignToEmail}
                                >
                                    <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                                        <SelectValue placeholder="Seleccionar nuevo coordinador" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {COORDINADORES_REAL.map((user) => (
                                            <SelectItem
                                                key={user.email}
                                                value={user.email}
                                            >
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                        </div>
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
                                    <th className="px-3 min-w-[150px] py-3 text-left text-[#64748B] font-semibold">Proyecto</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">OC</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Coordinador Actual</th>
                                    {/* <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Coordinador a Asignar</th> */}
                                    
                                </tr>
                            </thead>
                            <tbody>
                                {loadingPreview ? (
                                    Array.from({ length: 6 }).map((_, rowIdx) => (
                                    <tr key={`skeleton-${rowIdx}`}>
                                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                                            <Skeleton className="h-4 w-[90%]" />
                                        </td>        
                                    </tr>
                                ))  
                                ) : previewRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                                            No se encontraron registros para esos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                previewRows.map((row) => (
                                    // (
                                        <PreviewTableRow
                                            key={row.id}
                                            row={row}
                                            // editable={canEditHito(row)}
                                            onToggleRow={toggleRow}
                                            // onCommitHito={handleHitoCommitH2}
                                            // formatCurrency={formatCurrency}
                                        />
                                    // )
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            <div>
                                Seleccionados:{" "}
                                <span className="font-semibold text-[#2b7fff]">
                                    {/* {previewRows.filter((r) => r.selected).length} */}
                                    {selectedRows.length}
                                </span>
                            </div>
                            {selectedVisibleRows.length !== selectedRows.length && (
                                <div className="text-xs">
                                    Visibles con el filtro actual:{" "}
                                    <span className="font-medium">
                                        {selectedVisibleRows.length}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                                Cerrar
                            </Button>

                            <Button
                                // onClick={() => {
                                //     const rowsToProcess = previewRows.filter((r) => r.selected);
                                //     handleProcess(rowsToProcess);
                                // }}
                                onClick={() =>
                                    handleProcess(
                                        selectedRows,
                                        selectedAssignee
                                    )
                                }
                                disabled={
                                    processing ||
                                    selectedRows.length === 0 ||
                                    !selectedAssignee
                                }
                                // disabled={previewRows.every((r) => !r.selected)}
                            >
                                {/* Procesar seleccionados */}
                                {processing
                                    ? "Procesando..."
                                    : `Procesar seleccionados (${selectedRows.length})`
                                }
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}