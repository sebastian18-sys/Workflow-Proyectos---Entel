import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import MoreOptions from "@/components/Tables/MoreOptions";
import Pagination from "@/components/Tables/Pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COORDINADORES, UNIDADES_FUNCIONALES } from "@/constants/coordinadores";
import { PERMS } from "@/constants/perm";
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy";
import { useIdentifers } from "@/hooks/projects/useIdentifers";
import { useAuth } from "@/hooks/useAuth";
import { useAuthz } from "@/hooks/useAuthz";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { buildSettlementSitesHistoryRowForTemplate, buildSettlementSitesRowForTemplate, buildTicketSitesRowForTemplate, exportSettlementHistoryToXlsx, exportSettlementToXlsx, exportTicketSitesToXlsx } from "@/lib/exportExcel";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatCurrency, formatDDMMYYYYHour } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { getOCbyProjects } from "@/services/capex/getOCbyProjects";
import { getOCOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, Building2, FileText, FolderKanban, Inbox, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

const TABLE_ID = "settlement_history"

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
    { id: "liquidacion", label: "Liquidación", visible: true },
    { id: "status_settlement", label : "Estado Liquidacion", visible : true },
    { id: "status_deliverable", label: "Entregable", visible: true },
    { id: "descuento", label: "% Descuento", visible: true },
    { id: "penalidad", label: "Penalidad SNC", visible: true },
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

        id === "liquidacion" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "status_settlement" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "status_deliverable" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "descuento" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "penalidad" && "bg-emerald-50 text-emerald-800 border-emerald-200",
    );
};

const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar..." },
	selects: [],
    visibleKeys: ["search"]
};

export default function SettlementHistory() {

    const { user } = useAuth()
    const { can } = useAuthz()
    const { identifiers } = useIdentifers()

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

    const canReadAll = can(PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ_ALL);
    const canReadAllInternal = can(PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ_ALL_INTERNAL);
    // const canReadAll = false;
    
    const ticketParams = canReadAll
        ? queryParams
        : canReadAllInternal 
            ? { ...queryParams, unidad_funcional: UNIDADES_FUNCIONALES[user?.email] ?? "SIN UNIDAD FUNCIONAL" }
            // : { ...queryParams, coordinador: COORDINADORES[user?.email] ?? "SIN COORDINADOR" };
            : { ...queryParams, assigned_to_email: user?.email ?? "SIN COORDINADOR" };

    let {
        ocSites,
        loading,
        totalResults,
        totalPages,
        error,
    } = useOCbyProy(ticketParams);

    ocSites = ocSites.map(r => {
        const id = r.identificador
        const item = identifiers.find(s => s.name === id)
        return {
            ...r,
            estado: item?.state ?? "-"
        }
    })

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* NAV TABS */}
                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    {/* group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent */}
                                    <Link aria-current="page" to="/budget/analytics/settlement/" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Inbox /> Mis Liquidaciones
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/settlement/history" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Historial</h2>
                    </div>
                    {/* <FormNewTicket showAlert={showAlert} user={user} /> */}
                    {/* <Button size="icon" onClick={startGenerate} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                        <Plus className="h-6 w-6 text-white" />
                    </Button> */}
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
                                                        template="/plantillas/template_download_settlement_history.xlsx"
                                                        fileName="Reporte Liquidaciones"
                                                        // data={resultData}
                                                        queryParams={ticketParams}
                                                        totalResults={totalResults}
                                                        service={getOCbyProjects}
                                                        transformData={buildSettlementSitesHistoryRowForTemplate}
                                                        exportData={exportSettlementHistoryToXlsx}        
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

                                                            {visibleColumns.liquidacion && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.liquidacion ?? 0}>
                                                                    {formatCurrency(row.liquidacion ?? 0)}
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

                                                            {visibleColumns.descuento && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.descuento ?? ""}>
                                                                    {row.descuento ?? ""}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.penalidad && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.penalidad ?? ""}>
                                                                    {row.penalidad ?? ""}
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
        </div>
    )

}