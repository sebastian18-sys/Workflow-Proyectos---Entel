import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import MoreOptions from "@/components/Tables/MoreOptions";
import Pagination from "@/components/Tables/Pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContracts } from "@/hooks/budget/capex/useContracts";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { buildPaRowForTemplate, exportPaToXlsx } from "@/lib/exportExcel";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatCurrency, formatDDMMYYYY } from "@/lib/helpers";
import { getContractsTable } from "@/services/capex/getAllContracts";
import { getPAOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, Briefcase, FileText, FolderKanban, Search, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react";

const TABLE_ID = "pa"

const columns = [
    { id: "pa", label: "PA", visible: true },
    { id: "proveedor", label: "Proveedor", visible: true },
    { id: "area", label: "Area", visible: true },
    { id: "concurso", label: "Concurso", visible: true },
	{ id: "importe_acuerdo", label: "Importe Acuerdo", visible: true },
    { id: "importe_liberado", label: "Importe Liberado", visible: true },
    { id: "importe_solicitado", label: "Importe Solicitado", visible: true },
    { id: "fecha_vigencia", label: "Fecha Vigencia", visible: true },
    { id: "status_fecha", label: "Estado Contrato", visible: true },
    { id: "status_final", label: "Estado Final", visible: true },
]

const toolbarConfig = {
	search: { placeholder: "Buscar por código o nombre" },
	selects: [],
    visibleKeys: ["search"]
};

const STATUS_FECHA = {
    "VIGENTE": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    "PROXIMO A VENCER": "bg-orange-100 text-orange-700 hover:bg-orange-200",
    "VENCIDO": "bg-red-100 text-red-700 hover:bg-red-200",
}

const STATUS_FINAL = {
    "OK": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    "NOK": "bg-red-100 text-red-700 hover:bg-red-200"
}

export default function PAProveedor() {

    const { user } = useAuth()

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
        request: getPAOptions,
        debugName: "getPAOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "area",
                label: "Area",
                type: "select",
                icon: FolderKanban,
                options: filterOptions.area || [],
            },
            {
                id: "status_final",
                label: "Estado Final",
                type: "select",
                icon: FileText,
                options: filterOptions.status_final || [],
            }
        ];
    }, [filterOptions]);

    // const [activeAdvancedFilters, setActiveAdvancedFilters] = useState([]);
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

    let {
        contracts,
        loading,
        totalResults,
        totalPages,
        error
    } = useContracts(queryParams);

    console.log("contracts", contracts)

    // const removeAdvancedFilter = (filterId) => {
    //     setActiveAdvancedFilters((prev) =>
    //         prev.filter((filter) => filter.id !== filterId)
    //     );
    // };

    // const { pa, loadingPa } = usePa()
    // const contracts = useContracts(advParams)
    // const pa_ticket = useSummaryByPa()
    // const resultData = matchPA(contracts, pa, pa_ticket)

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">PA</h2>
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
                                                    data={contracts}
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
                                                        queryParams={queryParams}
                                                        totalResults={totalResults}
                                                        service={getContractsTable}
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
                                                        // SKELETON
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
                                                    ) : contracts.length === 0 ? (
                                                        // SIN RESULTADOS
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>

                                                    ) : (
                                                        contracts.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {visibleColumns.pa && (
                                                            <TableCell className="">
                                                                <div className="truncate font-medium text-blue-500" title={row.pa}>
                                                                    {row.pa}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.proveedor && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate font-medium text-slate-800" title={row.proveedor}>
                                                                    {row.proveedor}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.area && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.area}>
                                                                    {row.area}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.concurso && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.concurso}>
                                                                    {row.concurso}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.importe_acuerdo && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.habilitado}>
                                                                    {formatCurrency(row.habilitado)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.importe_liberado && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.liberado}>
                                                                    {formatCurrency(row.liberado)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.importe_solicitado && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.solicitado}>
                                                                    {formatCurrency(row.solicitado)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.fecha_vigencia && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.fecha_vigencia}>
                                                                    {formatDDMMYYYY(row.fecha_vigencia)}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.status_fecha && (
                                                            <TableCell className="min-w-[100px]">
                                                                <Badge className={"flex justify-center items-center gap-4 truncate p-1.5 rounded-xl " + STATUS_FECHA[row.status_fecha]} title={row.status_fecha}>
                                                                    {row.status_fecha}
                                                                </Badge>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.status_final && (
                                                            <TableCell className="min-w-[100px]">
                                                                <Badge className={"flex justify-center items-center gap-4 truncate p-1.5 rounded-xl " + STATUS_FINAL[row.status_final]} title={row.status_final}>
                                                                    {row.status_final === "OK" ? "HABILITADO" : "BLOQUEADO"}
                                                                </Badge>
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
        </div>    
    )
}