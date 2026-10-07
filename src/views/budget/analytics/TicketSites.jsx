import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import MoreOptions from "@/components/Tables/MoreOptions";
import Pagination from "@/components/Tables/Pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMS } from "@/constants/perm";
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy";
import { useAuth } from "@/hooks/useAuth";
import { useAuthz } from "@/hooks/useAuthz";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { buildTicketSitesRowForTemplate, exportTicketSitesToXlsx } from "@/lib/exportExcel";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatCurrency, formatDDMMYYYYHour } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { getOCbyProjects } from "@/services/capex/getOCbyProjects";
import { getOCOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, Building2, Columns2, FileText, FolderKanban, Search, Ticket, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router";

const TABLE_ID = "ticket_sites"

// Columns in header
const columns = [
    { id: "ticket_code", label: "Código Ticket", visible: true },
    { id: "identificador", label: "Identificador", visible: true },
	{ id: "sitio", label: "Sitio", visible: true },
    { id: "actividad", label: "Actividad", visible: true },
    { id: "id_proyecto", label: "Código Proyecto", visible: true },
    { id: "nombre_proyecto", label: "Nombre Proyecto", visible: true },
    { id: "inversion", label: "Linea de Inversion", visible: true },
    { id: "proveedor", label: "Proveedor", visible: true },
    { id: "cotizacion", label: "Cotizacion", visible: true },
    { id: "estado", label: "Estado", visible: true },
    { id: "ticket_jira", label: "Ticket Jira", visible: true },
    { id: "rq", label: "RQ", visible: true },
    { id: "oc", label: "OC", visible: true },
    { id: "linea_oc", label: "Linea OC", visible: true },
    // { id: "cr", label: "CR", visible: true },
    { id: "cr_1", label: "CR 1", visible: true },
    { id: "cr_2", label: "CR 2", visible: true },
    { id: "importe_ac", label: "Pagado", visible: true },
    { id: "liquidacion", label: "Liquidacion", visible: true },
    { id: "status_deliverable", label: "Entregable", visible: true },
    { id: "descuento", label: "% Descuento", visible: true },
    { id: "penalidad", label: "Penalidad", visible: true },
    { id: "fecha_creacion", label: "Fecha Creación", visible: true }
]

const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar..." },
	selects: [],
    visibleKeys: ["search"]
};

const STATUS_TICKET = {
    "Pendiente CT": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Enviado a MG": ["bg-blue-100 text-blue-700 hover:bg-blue-200", "bg-blue-500 outline-blue-500/20"],
    "RQ Generado": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"],
    "Observado": ["bg-red-100 text-red-700 hover:bg-red-200", "bg-red-500 outline-red-500/20"],
    "Cancelado": ["bg-gray-100 text-gray-700 hover:bg-gray-200", "bg-gray-500 outline-gray-500/20"],

    // payments
    "Intención de Pago": ["bg-amber-200 text-amber-700 hover:bg-amber-200", "bg-amber-500 outline-amber-500/20"],
    "Pago Enviado a MG": ["bg-sky-200 text-sky-700 hover:bg-sky-200", "bg-sky-500 outline-sky-500/20"],
    "Pago Generado": ["bg-green-300 text-green-700 hover:bg-green-200", "bg-green-500 outline-green-500/20"],
    "Intención de Pago - Hito 2": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Pago Enviado a MG - Hito 2": ["bg-sky-200 text-sky-700 hover:bg-sky-200", "bg-sky-500 outline-sky-500/20"],
    "Pago Generado - Hito 2": ["bg-green-300 text-green-700 hover:bg-green-200", "bg-green-500 outline-green-500/20"],
}

const STICKY_WIDTHS = {
    ticket_code: 80,
};

const getStickyStyle = (id) => {
    if (id === "ticket_code") {
        return {
            left: 0,
            width: STICKY_WIDTHS.ticket_code,
            minWidth: STICKY_WIDTHS.ticket_code,
        };
    }

    if (id === "identificador") {
        return {
            left: STICKY_WIDTHS.ticket_code,
            minWidth: 80,
        };
    }

    return {};
};

const getColumnClass = (id, isHeader = false) => {
    const sticky =
        id === "ticket_code" || id === "identificador";

    return cn(
        "whitespace-nowrap",

        sticky && [
            "sticky",
            isHeader ? "z-50 bg-slate-50" : "z-30 bg-white",
        ],

        id === "identificador" && "shadow-[inset_-1px_0_0_#e2e8f0]",
        id === "rq" && "border-l-2 bg-blue-50 text-blue-800 border-blue-200",
        id === "oc" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "linea_oc" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "cr_1" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "cr_2" && "bg-blue-50 text-blue-800 border-blue-200",
        id === "importe_ac" && "bg-blue-50 text-blue-800 border-blue-200",

        id === "liquidacion" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "status_deliverable" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "descuento" && "bg-emerald-50 text-emerald-800 border-emerald-200",
        id === "penalidad" && "bg-emerald-50 text-emerald-800 border-emerald-200",
    );
};

export default function TicketSites() {

    const { isCollapsed = false } = useOutletContext() || {}
    // User perms
    const { can } = useAuthz()
    const { user } = useAuth()

    // Filters
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
                id: "requester",
                label: "Solicitante",
                type: "select",
                icon: FileText,
                options: filterOptions.requester || [],
            },
            {
                id: "estado",
                label: "Estado",
                type: "select",
                icon: FileText,
                options: filterOptions.estado || [],
            },
            {
                id: "acuerdo_compras",
                label: "Acuerdo",
                type: "select",
                icon: Building2,
                options: filterOptions.acuerdo_compras || [],
            },
            {
                id: "proveedor",
                label: "Proveedor",
                type: "select",
                icon: FileText,
                options: filterOptions.proveedor || [],
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

    const canReadAll = can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ_ALL_TICKETS);
    
    const ticketParams = canReadAll
        ? queryParams
        : { ...queryParams, requester_email: user.email };

    let {
        ocSites,
        loading,
        totalResults,
        totalPages,
        error,
    } = useOCbyProy(ticketParams);
 
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
                                    <Link aria-current="page" to="/budget/analytics/tickets/" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Ticket /> Tickets
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/details/" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Columns2 /> Detalles
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Detalles</h2>
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
                                                            placeholder="Buscar"
                                                            value={filters.search ?? ""}
                                                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                            className="pl-9 focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                                        />
                                                    </div>
                                                )}
                                                {/* Selects Opcionales */}
                                                {toolbarConfig.selects?.map(select =>
                                                    isVisible(select.key) ? (
                                                        <Select
                                                            key={select.key}
                                                            value={filters[select.key] ?? ""} 
                                                            onValueChange={v => setFilters({ ...filters, [select.key]: v })}
                                                        >
                                                            <SelectTrigger className="w-full sm:w-[140px]">
                                                                <SelectValue placeholder={select.label} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {select.options.map(option => (
                                                                    <SelectItem value={option} key={option}>
                                                                        {option}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : null
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
                                                        template="/plantillas/template_download_ticket_rq_2.xlsx"
                                                        fileName="Reporte Sites"
                                                        queryParams={ticketParams}
                                                        totalResults={totalResults}
                                                        service={getOCbyProjects}
                                                        transformData={buildTicketSitesRowForTemplate}
                                                        exportData={exportTicketSitesToXlsx}     
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
                                                <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">
                                                    <TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                                    {columns.map(
                                                        (column) =>
                                                        visibleColumns[column.id] && (
                                                            <TableHead
                                                                key={column.id} 
                                                                // className="whitespace-nowrap"
                                                                style={getStickyStyle(column.id)}
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
                                                    ) : ocSites.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {visibleColumns.ticket_code && (
                                                            <TableCell 
                                                                // className="min-w-[80px] font-medium text-blue-600"
                                                                style={getStickyStyle("ticket_code")}
                                                                // className="min-w-[80px] font-medium text-blue-600"
                                                                className={cn(
                                                                    "font-medium text-blue-600",
                                                                    getColumnClass("ticket_code")
                                                                )}
                                                            >
                                                                <div className="truncate">
                                                                    {row.ticket_code}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.identificador && (
                                                            <TableCell 
                                                                // className="min-w-[80px]"
                                                                style={getStickyStyle("identificador")}
                                                                // className="min-w-[100px]"
                                                                className={cn(
                                                                    "font-medium text-slate-800 ",
                                                                    getColumnClass("identificador")
                                                                )}
                                                            >
                                                                <div className="truncate font-medium text-slate-800">
                                                                    {row.identificador}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.sitio && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.sitio}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.actividad && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.actividad}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.id_proyecto && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.id_proyecto}>
                                                                    {row.id_proyecto}
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
                                                            
                                                            {visibleColumns.inversion && (
                                                            <TableCell className="min-w-[250px]">
                                                                <div className="truncate" title={row.linea_inversion}>
                                                                    {row.linea_inversion}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.proveedor && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.proveedor}>
                                                                    {row.proveedor}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.cotizacion && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.total_cotizacion}>
                                                                    {formatCurrency(row.total_cotizacion)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.estado && (
                                                            <TableCell className="min-w-[150px]">
                                                                
                                                                <Badge className={"flex justify-center items-center gap-4 truncate p-1.5 rounded-xl " + STATUS_TICKET[row.estado][0]} title={row.estado}>
                                                                    <div className={"size-2 flex-none rounded-full outline-4 outline-solid " + STATUS_TICKET[row.estado][1]}></div>
                                                                    {row.estado}
                                                                </Badge>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.ticket_jira && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.ticket_jira}>
                                                                    {row.ticket_jira}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.rq && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.rq}>
                                                                    {row.rq}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.oc && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.oc}>
                                                                    {row.oc}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.linea_oc && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.linea_oc}>
                                                                    {row.linea_oc}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {/* {visibleColumns.cr && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.cr}>
                                                                    {row.cr}
                                                                </div>
                                                            </TableCell>
                                                            )} */}
                                                            {visibleColumns.cr_1 && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.cr}>
                                                                    {row.cr_list[0]}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.cr_2 && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.cr}>
                                                                    {row.cr_list[1]}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.importe_ac && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.importe_ac}>
                                                                    {formatCurrency(row.importe_ac)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.liquidacion && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.liquidacion}>
                                                                    {row.liquidacion}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.status_deliverable && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.status_deliverable}>
                                                                    <Badge className="bg-slate-400">
                                                                        {row.status_deliverable ?? "-"}
                                                                    </Badge>
                                                                    {/* {row.status_deliverable} */}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.descuento && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.descuento}>
                                                                    {row.descuento}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.penalidad && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.penalidad}>
                                                                    {row.penalidad}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.fecha_creacion && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.fecha_creacion}>
                                                                    {formatDDMMYYYYHour(row.fecha_creacion)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                        </TableRow>
                                                        ))
                                                    }
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