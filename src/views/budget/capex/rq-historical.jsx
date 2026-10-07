import { useEffect, useMemo, useState } from "react"
import {
	Building2,
	Briefcase,
	User,
	Users,
	DollarSign,
	Hash,
	Search,
    ArrowLeft,
    X
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import useTableTool from "@/hooks/useTableTool"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import MoreOptions from "@/components/Tables/MoreOptions"
import Pagination from "@/components/Tables/Pagination"
import { useRQ } from "@/hooks/budget/capex/useRQ"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/helpers"
import { buildRqRowForTemplate, exportRQtoXlsx } from "@/lib/exportExcel"
import { getRQOptions } from "@/services/getOptionsFilters"
import { activeFiltersToParams } from "@/lib/filterUtils"
import { useDebounce } from "@/hooks/useDebounce"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { getRqTable } from "@/services/capex/getAllRq"
import { useAuth } from "@/hooks/useAuth"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"

const TABLE_ID = "rq"

const columns = [
    { id: "rq", label: "RQ", visible: true },
    { id: "nro_oc", label: "Nro OC", visible: true },
    { id: "estado_oc", label: "Estado OC", visible: true },
    { id: "fecha_emision_rq", label: "Fecha Emisión RQ", visible: true },
    { id: "fecha_aprobacion_rq", label: "Fecha Aprobación RQ", visible: true },
    { id: "tipo", label: "Tipo", visible: true },
    { id: "codigo_proyecto", label: "Código Proyecto", visible: true },
    { id: "nombre_proyecto", label: "Nombre Proyecto", visible: true },
    { id: "inversion_subrubro", label: "Inversión/SubRubro", visible: true },
    { id: "categoria", label: "Categoría", visible: true },
    { id: "acuerdo", label: "Acuerdo", visible: true },
    { id: "proveedor", label: "Proveedor", visible: true },
    { id: "requisitor", label: "Requisitor", visible: true },
    { id: "pm_actual", label: "PM ACTUAL", visible: true },
    { id: "importe_oc", label: "Importe OC", visible: true },
    { id: "importe_ac", label: "Importe AC", visible: true },
    { id: "importe_facturado", label: "Importe Facturado", visible: true },
    { id: "importe_rq", label: "Importe RQ", visible: true },
    { id: "provision_real", label: "Provision Real", visible: true },
    { id: "declaracion_no_uso", label: "Declaración no uso", visible: true },
    { id: "jefatura_final", label: "Jefatura Final", visible: true },
    { id: "gerencia", label: "Gerencia", visible: true },
]

const toolbarConfig = {
    filters: { visible: true },
    search: { placeholder: "Buscar por código o nombre" },
    selects: [],
    visibleKeys: ["search"]
};

export default function RQHistorical() {
    
    const { user } = useAuth()

    const {
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
        request: getRQOptions,
        debugName: "getRQOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "estado_oc",
                label: "Estado OC",
                type: "select",
                icon: Hash,
                options: filterOptions.estado_oc || [],
            },
            {
                id: "tipo",
                label: "Tipo",
                type: "select",
                icon: Briefcase,
                options: filterOptions.tipo || [],
            },
            {
                id: "categoria",
                label: "Categoría",
                type: "select",
                icon: DollarSign,
                options: filterOptions.categoria || [],
            },
            {
                id: "proveedor",
                label: "Proveedor",
                type: "select",
                icon: Building2,
                options: filterOptions.proveedor || [],
            },
            {
                id: "requisitor",
                label: "Requisitor",
                type: "select",
                icon: User,
                options: filterOptions.requisitor || [],
            },
            {
                id: "pm_actual",
                label: "PM ACTUAL",
                type: "select",
                icon: User,
                options: filterOptions.pm_actual || [],
            },
            {
                id: "jefatura_final",
                label: "Jefatura Final",
                type: "select",
                icon: Users,
                options: filterOptions.jefatura_final || [],
            },
            {
                id: "gerencia",
                label: "Gerencia",
                type: "select",
                icon: Building2,
                options: filterOptions.gerencia || [],
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
        rq,
        loading,
        totalResults,
        totalPages,
        error
    } = useRQ(queryParams);

    return (
        
        <div className="flex flex-col px-4 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">
            
                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Histórico RQ</h2>
                </div>

                {/* MAIN */}
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
                                                    data={rq}
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
                                                            className="pl-9"
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
                                                        <span className="text-sm font-bold">{totalResults}</span>
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
                                                        template="/plantillas/template_download_rq.xlsx"
                                                        fileName="RQ Historico"
                                                        // data={rq}
                                                        queryParams={queryParams}
                                                        totalResults={totalResults}
                                                        service={getRqTable}
                                                        transformData={buildRqRowForTemplate}
                                                        exportData={exportRQtoXlsx}     
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
                                                            <TableHead key={column.id} className="whitespace-nowrap">
                                                                <button className="flex items-center text-[#64748B] uppercase text-center gap-3 hover:text-foreground transition-colors">
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
                                                    ) : rq.length === 0 ? (
                                                        // SIN RESULTADOS
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (

                                                        rq.map((row, index) => (

                                                        <TableRow key={index}>
                                                            {visibleColumns.rq && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.rq}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.nro_oc && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.nro_oc}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.estado_oc && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.estado_oc}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.fecha_emision_rq && (
                                                            <TableCell className="text-center min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.fecha_emision_rq}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.fecha_aprobacion_rq && (
                                                            <TableCell className="text-center min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.fecha_aprobacion_rq}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.tipo && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.tipo}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.codigo_proyecto && (
                                                            <TableCell className="font-medium min-w-[80px]">
                                                                <div className="truncate">
                                                                    {row.codigo_proyecto}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.nombre_proyecto && (
                                                            <TableCell className="whitespace-normal min-w-[250px]">
                                                                <div className="" title={row.nombre_proyecto}>
                                                                    {row.nombre_proyecto}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.inversion_subrubro && (
                                                            <TableCell className="whitespace-normal min-w-[250px]">
                                                                <div className="" title={row.inversion_subrubro}>
                                                                    {row.inversion_subrubro}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.categoria && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate">
                                                                    {row.categoria}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.acuerdo && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate">
                                                                    {row.acuerdo}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.proveedor && (
                                                            <TableCell className="whitespace-normal min-w-[250px]">
                                                                <div className="">
                                                                    {row.proveedor}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.requisitor && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate">
                                                                    {row.requisitor}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.pm_actual && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate">
                                                                    {row.pm_actual}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.importe_oc && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.importe_oc}>
                                                                    {formatCurrency(row.importe_oc)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.importe_ac && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.importe_ac}>
                                                                    {formatCurrency(row.importe_ac)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.importe_facturado && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.importe_facturado}>
                                                                    {formatCurrency(row.importe_facturado)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.importe_rq && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.importe_rq}>
                                                                    {formatCurrency(row.importe_rq)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.provision_real && (
                                                            <TableCell className="min-w-[180px] max-w-[220px]">
                                                                <div className="truncate" title={row.provision_real}>
                                                                    {formatCurrency(row.provision_real)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.declaracion_no_uso && (
                                                            <TableCell className="min-w-[180px] max-w-[220px]">
                                                                <div className="truncate" title={row.declaracion_no_uso}>
                                                                    {formatCurrency(row.declaracion_no_uso)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.jefatura_final && (
                                                            <TableCell className="min-w-[120px]">
                                                                <div className="truncate" title={row.jefatura_final}>
                                                                    {row.jefatura_final}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.gerencia && (
                                                            <TableCell className="whitespace-normal min-w-[250px]">
                                                                <div className="" title={row.gerencia}>
                                                                    {row.gerencia}
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
        </div>
    )
}