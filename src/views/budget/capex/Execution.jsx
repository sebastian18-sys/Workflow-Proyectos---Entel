import { useEffect, useMemo, useState } from "react"
import {
	Briefcase,
	Search,
    ArrowLeft,
    Hash,
    Building2,
    X
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import useTableTool from "@/hooks/useTableTool"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import MoreOptions from "@/components/Tables/MoreOptions"
import Pagination from "@/components/Tables/Pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, rowPassesAdvancedFilters, toNumber } from "@/lib/helpers"
import { buildProjectRowForTemplate, exportProjectsToXlsx } from "@/lib/exportExcel"
import { getProjectOptions } from "@/services/getOptionsFilters"
import { activeFiltersToParams } from "@/lib/filterUtils"
import { useDebounce } from "@/hooks/useDebounce"
import { useProjectsCapexTable } from "@/hooks/budget/capex/useProjectsCapexTable"
import { getProjectsCapex } from "@/services/capex/getAllProjectsCapex"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { useAuth } from "@/hooks/useAuth"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
import { cn } from "@/lib/utils"

const TABLE_ID = "projects_capex"

const columns = [
	{ id: "project_code", label: "Código", visible: true },
	{ id: "project_name", label: "Proyecto", visible: true },
	{ id: "investment_line", label: "Línea de Inversión", visible: true },
    { id: "tipo", label: "Tipo", visible: true },
	{ id: "jefatura", label: "Jefatura", visible: true },
	{ id: "pm_actual", label: "PM", visible: true },
	{ id: "requisitor", label: "Requisitor", visible: true },
	{ id: "solpe_original", label: "SOLPE ORIGINAL", visible: true },
	{ id: "solpe", label: "SOLPE", visible: true },
	{ id: "import_oc", label: "Comprometido", visible: true },
    { id: "solicitado", label: "Solicitado", visible: true },
	{ id: "import_ac", label: "Acta", visible: true },
]

const STICKY_WIDTHS = {
    project_code: 90,
    project_name: 180,
    investment_line: 380,
};

const getStickyStyle = (id) => {

    if (id === "project_code") {
        return {
            left: 0,
            width: STICKY_WIDTHS.project_code,
            minWidth: STICKY_WIDTHS.project_code,
        };
    }

    if (id === "project_name") {
        return {
            left: STICKY_WIDTHS.project_code,
            // width: STICKY_WIDTHS.project_name,
            minWidth: 320,
        };
    }

    if (id === "investment_line") {
        return {
            left: STICKY_WIDTHS.investment_line,
            minWidth: 320,
        };
    }

    return {};
};

const getColumnClass = (id, isHeader = false) => {
    const sticky = id === "project_code" || id === "project_name" || id === "investment_line";

    return cn(
        "whitespace-nowrap",

        sticky && [
            "sticky",
            isHeader ? "z-50 bg-slate-50" : "z-30 bg-white",
        ],

        id === "project_name" && "whitespace-normal",

        // id === "project_code" && "shadow-[inset_-1px_0_0_#e2e8f0]",
        id === "investment_line" && "shadow-[inset_-1px_0_0_#e2e8f0] whitespace-normal",
    );
};


const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar por código o nombre" },
	selects: [],
    visibleKeys: ["search"]
};

export default function ExecutionBudget() {

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
        request: getProjectOptions,
        debugName: "getProjectOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "tipo",
                label: "Tipo",
                type: "select",
                icon: Hash,
                options: filterOptions.tipo || [],
            },
            {
                id: "jefatura",
                label: "Jefatura",
                type: "select",
                icon: Briefcase,
                options: filterOptions.jefatura || [],
            },
            {
                id: "pm_actual",
                label: "PM",
                type: "select",
                icon: Briefcase,
                options: filterOptions.pm_actual || [],
            },
            {
                id: "requisitor",
                label: "Requisitor",
                type: "select",
                icon: Building2,
                options: filterOptions.requisitor || [],
            },
            {
                id: "categoria",
                label: "Categoria",
                type: "select",
                icon: Building2,
                options: filterOptions.categoria || [],
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
        projectsT,
        loading,
        totalResults,
        totalPages,
        error
    } = useProjectsCapexTable(queryParams);

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
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Ejecución presupuestal</h2>
                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        <div className="relative rounded-2xl bg-white p-4 md:p-5 lg:p-6">

                            <div className="relative">

                                <div className="relative min-h-44">

                                    <div className="contain-inline-size">

                                        {/* Filters, search, selects, pagination */}
                                        {/* Toolbar */}
                                        <div className="flex  pb-6  flex-col">
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                                                
                                                {/* Filtros avanzados */}
                                                <FilterAdvanced
                                                    columns={columns}
                                                    availableFilters={availableFilters}
                                                    data={projectsT}
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
                                                            // defaultValue={select.defaultValue}
                                                            key={select.key}
                                                            // value={select.defaultValue}
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
                                                        template="/plantillas/template_download_project.xlsx"
                                                        fileName="Reporte CAPEX"
                                                        // data={projectsT}
                                                        queryParams={queryParams}
                                                        totalResults={totalResults}
                                                        service={getProjectsCapex}
                                                        transformData={buildProjectRowForTemplate}
                                                        exportData={exportProjectsToXlsx}     
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
                                               
                                                <TableHeader>
                                                    <TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                                    {columns.map(
                                                        (column) =>
                                                        visibleColumns[column.id] && (
                                                            <TableHead
                                                                key={column.id} 
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
                                                    ) : projectsT.length === 0 ? (
                                                        // SIN RESULTADOS
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        projectsT.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {visibleColumns.project_code && (
                                                            <TableCell 
                                                                style={getStickyStyle("project_code")}
                                                                // className="font-medium text-blue-500 min-w-[100px]"
                                                                className={cn(
                                                                    "font-medium text-blue-500",
                                                                    getColumnClass("project_code")
                                                                )}
                                                            >
                                                                <div className="">
                                                                    {row.project_code}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.project_name && (
                                                            <TableCell 
                                                                style={getStickyStyle("project_name")}
                                                                // className="whitespace-normal font-medium text-slate-800 min-w-[300px]"
                                                                className={cn(
                                                                    "whitespace-normal font-medium text-slate-800",
                                                                    getColumnClass("project_name")
                                                                )}
                                                            >
                                                                <div className="" title={row.project_name}>
                                                                    {row.project_name}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.investment_line && (
                                                            <TableCell 
                                                                style={getStickyStyle("investment_line")}
                                                                className={cn(
                                                                    "whitespace-normal font-medium text-slate-800",
                                                                    getColumnClass("investment_line")
                                                                )}
                                                                // className="whitespace-normal min-w-[300px]"
                                                            >
                                                                <div className="" title={row.investment_line}>
                                                                    {row.investment_line}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.tipo && (
                                                            <TableCell>
                                                                <div className="truncate">
                                                                    {row.tipo}
                                                                </div>                                                                
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.jefatura && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.jefatura}>
                                                                    {row.jefatura}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.pm_actual && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.pm_actual}>
                                                                    {row.pm_actual}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.requisitor && (
                                                            <TableCell className="min-w-[180px] max-w-[220px]">
                                                                <div className="truncate" title={row.requisitor}>
                                                                    {row.requisitor}
                                                                </div>
                                                            </TableCell>
                                                            )}
            
                                                            {visibleColumns.solpe_original && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.solpe_original}>
                                                                    {formatCurrency(row.solpe_original)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.solpe && (
                                                            <TableCell className="font-medium min-w-[150px]">
                                                                <div className="truncate" title={row.solpe}>
                                                                    {formatCurrency(row.solpe)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.import_oc && (
                                                            <TableCell className="font-medium min-w-[150px]">
                                                                <div className="truncate" title={row.import_oc}>
                                                                    {formatCurrency(row.importe_oc)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.solicitado && (
                                                            <TableCell className="font-medium min-w-[150px]">
                                                                <div className="truncate" title={row.solicitado}>
                                                                    {formatCurrency(row.solicitado)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.import_ac && (
                                                            <TableCell className="font-medium min-w-[150px]">
                                                                <div className="truncate" title={row.import_ac}>
                                                                    {formatCurrency(row.importe_ac)}
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