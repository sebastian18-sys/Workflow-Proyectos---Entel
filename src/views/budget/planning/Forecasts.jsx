import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForecasts } from "@/hooks/budget/planning/useForecasts";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatCurrency } from "@/lib/helpers";
import { getForecastsOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, Briefcase, ChevronDown, ChevronRight, Columns2, DraftingCompass, Hash, Layers, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const TABLE_ID = "forecasts"

const columns = [
	{ id: "tipo", label: "Tipo", visible: true },
	{ id: "codigo_proyecto", label: "Código", visible: true },
	{ id: "nombre_proyecto", label: "Proyecto", visible: true },
	{ id: "linea_inversion", label: "Línea de Inversión", visible: true },
	{ id: "grupo", label: "Grupo", visible: true },
]

const FCST_MONTHS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
];

const CF_MONTHS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
];

const isAll = (value) =>
	value === "Todos" ||
	value == null ||
	(Array.isArray(value) && value.length === 0);

const matchesFilter = (selected, currentValue) => {
	if (isAll(selected)) return true;
	if (Array.isArray(selected)) return selected.includes(currentValue);
	return selected === currentValue;
};

function useFilters(data) {
    const [gerencia, setGerencia] = useState(["GERENCIA DE CONSTRUCCION E INFRAESTRUCTURA DE RED"]);
    const [tipo, setTipo] = useState(["Proy."]);
    const [unidadFuncional, setUnidadFuncional] = useState([]);
    const [categoria, setCategoria] = useState([]);
    const [fcst, setFcst] = useState("6+6");
    const [mes, setMes] = useState("Julio");

    // Helper: Apply filters
    const apply = (omit) => (d) => {
        const byGer = omit === "gerencia" || matchesFilter(gerencia, d.gerencia);
        const byAno = omit === "tipo" || matchesFilter(tipo, d.tipo);
        const byUFuncional = omit === "unidadFuncional" || matchesFilter(unidadFuncional, d.unidad_funcional);
        const byCat = omit === "categoria" || matchesFilter(categoria, d.categoria);
        return byGer && byAno && byUFuncional && byCat;
    };

    const options = {
        gerencias: useMemo(() => unique(data.filter(apply("gerencia")).map(d => d.gerencia)), [data, unidadFuncional, tipo, categoria]),
        unidadFuncionales: useMemo(() => unique(data.filter(apply("unidadFuncional")).map(d => d.unidad_funcional)), [data, gerencia, tipo, categoria]),
        tipos: ["Todos", "CARRYOVER", "Proy."],
        categorias: useMemo(() => unique(data.filter(apply("categoria")).map(d => d.categoria)), [data, unidadFuncional, gerencia, tipo]),
        fcsts: ["Plan", "1+11","2+10","3+9", "4+8", "5+7","6+6", "7+5", "8+4","9+3", "10+2", "11+1"],
        meses: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    };

    const filtered = useMemo(() => data.filter(apply("")), [data, unidadFuncional, gerencia, tipo, categoria]);

    return { 
        options, 
        filtered,
        gerencia, setGerencia,
        unidadFuncional, setUnidadFuncional,
        tipo, setTipo,
        categoria, setCategoria,
        fcst, setFcst,
        mes, setMes
    };
}

const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar por código o nombre" },
	selects: [],
    visibleKeys: ["search"]
};

const toNumber = (value) => {
	if (typeof value === "string") {
		const parsed = Number(value.replaceAll(",", ""));
		return Number.isFinite(parsed) ? parsed : 0;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};


export default function Forecasts() {

    const { user } = useAuth()
    // const {
    //     sortBy,
    //     setSortBy,
    //     currentPage,
    //     setCurrentPage,
    //     sortDirection,
    //     setSortDirection,
    //     itemsPerPage,
    //     setItemsPerPage,
    //     visibleColumns,
    //     toggleColumn,
    // } = useTableTool({ columns })

    const isVisible = (key) => !toolbarConfig.visibleKeys || toolbarConfig.visibleKeys.includes(key)

    const [filters, setFilters] = useState({
        search: ""
    })

    const {
        filterOptions,
        loadingOptions,
        errorOptions,
    } = useOptionsFilter({
        request: getForecastsOptions,
        debugName: "getForecastsOptions",
    });

    console.log("filterOptions", filterOptions)

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
                id: "unidad_funcional",
                label: "Unidad Funcional",
                type: "select",
                icon: Briefcase,
                options: filterOptions.unidad_funcional || [],
            },
            {
                id: "grupo",
                label: "Grupo",
                type: "select",
                icon: Briefcase,
                options: filterOptions.grupo || [],
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

    // useEffect(() => {
    //     setCurrentPage(1);
    // }, [
    //     debouncedSearch,
    //     advancedFiltersKey,
    //     itemsPerPage,
    //     sortBy,
    //     sortDirection,
    //     setCurrentPage,
    // ]);

    const queryParams = useMemo(() => {
        return {
            page: 1,
            limit: 1000,
            search: debouncedSearch,
            // sortBy,
            // sortDirection,
            ...advancedFilters,
        };
    }, [
        // currentPage,
        // itemsPerPage,
        debouncedSearch,
        // sortBy,
        // sortDirection,
        advancedFilters,
    ]);

    let {
        forecast,
        loading,
        totalResults,
        totalPages,
        error
    } = useForecasts(queryParams);

    // const { forecast, loading } = useForecasts({ page: 1, limit: 1000})

    const [showOldFcstMonths, setShowOldFcstMonths] = useState(false);
    const [showOldCfMonths, setShowOldCfMonths] = useState(false);

    const [showFcstMonths, setShowFcstMonths] = useState(false);
    const [showCfMonths, setShowCfMonths] = useState(false);

    const visibleColumnCount =
        5 +
        (showFcstMonths ? FCST_MONTHS.length : 0) +
        1 + // Total FCST
        (showCfMonths ? CF_MONTHS.length : 0) +
        1; // Total CF

    const tableTotals = useMemo(() => {
        const createGroup = (monthsLength) => ({
            months: Array(monthsLength).fill(0),
            total: 0,
        });

        const totals = {
            old: {
                fcst: createGroup(FCST_MONTHS.length),
                cf: createGroup(CF_MONTHS.length),
            },
            new: {
                fcst: createGroup(FCST_MONTHS.length),
                cf: createGroup(CF_MONTHS.length),
            },
        };

        const accumulateGroup = (target, source) => {
            const sourceMonths = source?.months ?? [];

            let calculatedRowTotal = 0;

            target.months = target.months.map((currentValue, index) => {
                const monthValue = toNumber(sourceMonths[index]?.value);

                calculatedRowTotal += monthValue;

                return currentValue + monthValue;
            });

            /*
            * Se utiliza el total entregado por el backend.
            * Cuando no existe, se calcula sumando los meses.
            */
            target.total +=
                source?.total !== undefined && source?.total !== null
                    ? toNumber(source.total)
                    : calculatedRowTotal;
        };

        for (const row of forecast) {
            accumulateGroup(
                totals.old.fcst,
                row.forecasts?.old?.fcst
            );

            accumulateGroup(
                totals.old.cf,
                row.forecasts?.old?.cf
            );

            accumulateGroup(
                totals.new.fcst,
                row.forecasts?.new?.fcst
            );

            accumulateGroup(
                totals.new.cf,
                row.forecasts?.new?.cf
            );
        }

        return totals;
    }, [forecast]);


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
                                    <Link to="/budget/planning/forecasts/details" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Columns2 /> Detalles
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/planning/forecasts/draft" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
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
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Forecasts</h2>
                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
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
                                                    data={forecast}
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
                                                {/* {toolbarConfig.selects?.map(select =>
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
                                                )} */}

                                                <div className="flex items-center justify-between sm:justify-start gap-6 sm:ml-auto">
                                                    
                                                    {/* Resultados */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-[#364153] font-medium">{totalResults}</span>
                                                        <span className="text-sm text-muted-foreground">resultados</span>
                                                    </div>

                                                    {/* Mas Opciones */}
                                                    {/* <MoreOptions
                                                        itemsPerPage={itemsPerPage}
                                                        setItemsPerPage={setItemsPerPage}
                                                        sortBy={sortBy}
                                                        setSortBy={setSortBy}
                                                        sortDirection={sortDirection}
                                                        setSortDirection={setSortDirection}	
                                                        template="/plantillas/template_download_project.xlsx"
                                                        fileName="Reporte CAPEX"
                                                        queryParams={queryParams}
                                                        totalResults={totalResults}
                                                        service={getProjectsCapex}
                                                        transformData={buildProjectRowForTemplate}
                                                        exportData={exportProjectsToXlsx}     
                                                    /> */}

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

                                        {/* Nested Table */}
										<div className="max-h-[520px] overflow-auto" >
											<Table className="">
                                                <TableHeader className="sticky top-0 z-20 bg-white border-b-2">
                                                    {/* Primera fila: agrupadores */}
                                                    <TableRow className="h-9 bg-slate-50 hover:bg-slate-50">
                                                        <TableHead rowSpan={2}className="py-2 uppercase align-middle text-slate-800 bg-slate-100">
                                                            Código
                                                        </TableHead>
                                                        <TableHead rowSpan={2} className="py-2 uppercase align-middle text-slate-800 bg-slate-100">
                                                            Proyecto
                                                        </TableHead>
                                                        <TableHead rowSpan={2} className="py-2 uppercase align-middle text-slate-800 bg-slate-100">
                                                            Línea de inversión
                                                        </TableHead>
                                                        <TableHead rowSpan={2} className="py-2 uppercase align-middle text-slate-800 bg-slate-100">
                                                            Grupo
                                                        </TableHead>
                                                        <TableHead rowSpan={2} className="py-2 uppercase align-middle text-slate-800 bg-slate-100">
                                                            Tipo
                                                        </TableHead>

                                                        {/* Agrupador FCST OLD */}
                                                        <TableHead
                                                            colSpan={showOldFcstMonths ? FCST_MONTHS.length + 1 : 1}
                                                            className="py-2 h-9 p-0 text-center border-l border-slate-200 uppercase text-amber-700 bg-amber-50"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowOldFcstMonths((current) => !current)}
                                                                aria-expanded={showOldFcstMonths}
                                                                className="flex h-full w-full items-center justify-center gap-2 px-3 font-semibold transition-colors hover:bg-blue-200/70"
                                                            >
                                                                {showOldFcstMonths ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}
                                                                FCST
                                                            </button>
                                                        </TableHead>

                                                        {/* Agrupador CF */}
                                                        <TableHead
                                                            colSpan={showOldCfMonths ? CF_MONTHS.length + 1 : 1}
                                                            className="py-2 h-9 p-0 text-center border-l border-slate-200 uppercase text-amber-700 bg-amber-50"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowOldCfMonths((current) => !current)}
                                                                aria-expanded={showOldCfMonths}
                                                                className="flex h-full w-full items-center justify-center gap-2 px-3 font-semibold transition-colors hover:bg-emerald-200/70"
                                                            >
                                                                {showOldCfMonths ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}

                                                                CF
                                                            </button>
                                                        </TableHead>

                                                        {/* Agrupador FCST */}
                                                        <TableHead
                                                            colSpan={showFcstMonths ? FCST_MONTHS.length + 1 : 1}
                                                            className="py-2 h-9 p-0 text-center border-l border-slate-200 uppercase text-amber-700 bg-amber-50"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowFcstMonths((current) => !current)}
                                                                aria-expanded={showFcstMonths}
                                                                className="flex h-full w-full items-center justify-center gap-2 px-3 font-semibold transition-colors hover:bg-blue-200/70"
                                                            >
                                                                {showFcstMonths ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}
                                                                FCST
                                                            </button>
                                                        </TableHead>

                                                        {/* Agrupador CF */}
                                                        <TableHead
                                                            colSpan={showCfMonths ? CF_MONTHS.length + 1 : 1}
                                                            className="py-2 h-9 p-0 text-center border-l border-slate-200 uppercase text-amber-700 bg-amber-50"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowCfMonths((current) => !current)}
                                                                aria-expanded={showCfMonths}
                                                                className="flex h-full w-full items-center justify-center gap-2 px-3 font-semibold transition-colors hover:bg-emerald-200/70"
                                                            >
                                                                {showCfMonths ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}

                                                                CF
                                                            </button>
                                                        </TableHead>
                                                    </TableRow>

                                                    {/* Segunda fila: new meses y totales */}
                                                    <TableRow className="h-8 bg-slate-50 hover:bg-slate-50">


                                                        {showOldFcstMonths &&
                                                            FCST_MONTHS.map((month, index) => (
                                                                <TableHead
                                                                    key={`fcst-header-${month}`}
                                                                    className={`
                                                                        py-2 min-w-[130px] text-right uppercase
                                                                        ${
                                                                            index < 6
                                                                                ? "bg-blue-50 text-blue-800"
                                                                                : "bg-emerald-50 text-emerald-800"
                                                                        }
                                                                    `}
                                                                >
                                                                    {month} FCST
                                                                </TableHead>
                                                            ))}

                                                        {/* Siempre visible */}
                                                        <TableHead className="py-2 min-w-[130px] border-l text-center uppercase text-amber-700 bg-amber-50">
                                                            TOTAL 6+6
                                                        </TableHead>

                                                        {showOldCfMonths &&
                                                            CF_MONTHS.map((month) => (
                                                                <TableHead
                                                                    key={`cf-header-${month}`}
                                                                    className="py-2 min-w-[130px] text-right uppercase bg-emerald-50 text-emerald-800"
                                                                >
                                                                    {month} CF
                                                                </TableHead>
                                                            ))}

                                                        {/* Siempre visible */}
                                                        <TableHead className="py-2 min-w-[130px] border-l text-center uppercase text-amber-700 bg-amber-50">
                                                            TOTAL 6+6
                                                        </TableHead>

                                                        {showFcstMonths &&
                                                            FCST_MONTHS.map((month, index) => (
                                                                <TableHead
                                                                    key={`fcst-header-${month}`}
                                                                    className={`
                                                                        py-2 min-w-[130px] text-right uppercase
                                                                        ${
                                                                            index < 6
                                                                                ? "bg-blue-50 text-blue-800"
                                                                                : "bg-emerald-50 text-emerald-800"
                                                                        }
                                                                    `}
                                                                >
                                                                    {month} FCST
                                                                </TableHead>
                                                            ))}

                                                        {/* Siempre visible */}
                                                        <TableHead className="py-2 min-w-[130px] border-l text-center uppercase text-amber-700 bg-amber-50">
                                                            TOTAL 7+5
                                                        </TableHead>

                                                        {showCfMonths &&
                                                            CF_MONTHS.map((month) => (
                                                                <TableHead
                                                                    key={`cf-header-${month}`}
                                                                    className="py-2 min-w-[130px] text-right uppercase bg-emerald-50 text-emerald-800"
                                                                >
                                                                    {month} CF
                                                                </TableHead>
                                                            ))}

                                                        {/* Siempre visible */}
                                                        <TableHead className="py-2 min-w-[130px] border-l text-center uppercase text-amber-700 bg-amber-50">
                                                            TOTAL 7+5
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>

												<TableBody>

                                                    {loading ? (
                                                        Array.from({ length: 5 }).map((_, rowIdx) => (
                                                        <TableRow key={`skeleton-${rowIdx}`}>
                                                            <TableCell className="py-2">
                                                                <Skeleton className="h-4 w-[90%]" />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                    ) : forecast.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={12} className="py-2 h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        forecast.map((fc) => (
                                                        <TableRow key={fc.id} className="bg-muted/30 hover:bg-muted/50">
                                                            {/* <TableCell><span>{fc.llave}</span></TableCell> */}
															<TableCell className="py-2 font-medium text-blue-500">{fc.codigo_proyecto}</TableCell>
                                                            <TableCell className="py-2 font-medium text-slate-800 whitespace-normal min-w-[300px]">{fc.nombre_proyecto}</TableCell>
                                                            <TableCell className="py-2 whitespace-normal min-w-[300px]">{fc.linea_inversion}</TableCell>
                                                            <TableCell className="py-2">{fc.grupo}</TableCell>
                                                            <TableCell className="py-2">{fc.tipo}</TableCell>

                                                            {/* Meses OLD FCST */}
                                                            {showOldFcstMonths &&
                                                                FCST_MONTHS.map((month, index) => (
                                                                    <TableCell
                                                                        key={`${fc._id ?? fc.id}-fcst-${month}`}
                                                                        className="py-2 min-w-[130px] text-right"
                                                                    >
                                                                        {formatCurrency(
                                                                            fc.forecasts?.["old"]?.fcst?.months?.[index]
                                                                                ?.value ?? 0
                                                                        )}
                                                                    </TableCell>
                                                                ))}

                                                            {/* Total FCST siempre visible */}
                                                            <TableCell className="py-2 min-w-[130px] border-l text-right font-medium text-amber-700 bg-amber-50/60">
                                                                {formatCurrency(
                                                                    fc.forecasts?.["old"]?.fcst?.total ?? 0
                                                                )}
                                                            </TableCell>

                                                            {/* Meses OLD CF */}
                                                            {showOldCfMonths &&
                                                                CF_MONTHS.map((month, index) => (
                                                                    <TableCell
                                                                        key={`${fc._id ?? fc.id}-cf-${month}`}
                                                                        className="py-2 min-w-[130px] text-right"
                                                                    >
                                                                        {formatCurrency(
                                                                            fc.forecasts?.["old"]?.cf?.months?.[index]
                                                                                ?.value ?? 0
                                                                        )}
                                                                    </TableCell>
                                                                ))}

                                                            {/* Total CF siempre visible */}
                                                            <TableCell className="py-2 min-w-[130px] border-l text-right font-medium text-amber-700 bg-amber-50/60">
                                                                {formatCurrency(
                                                                    fc.forecasts?.["old"]?.cf?.total ?? 0
                                                                )}
                                                            </TableCell>

                                                            {/* Meses NEW FCST */}
                                                            {showFcstMonths &&
                                                                FCST_MONTHS.map((month, index) => (
                                                                    <TableCell
                                                                        key={`${fc._id ?? fc.id}-fcst-${month}`}
                                                                        className="py-2 min-w-[130px] text-right"
                                                                    >
                                                                        {formatCurrency(
                                                                            fc.forecasts?.["new"]?.fcst?.months?.[index]
                                                                                ?.value ?? 0
                                                                        )}
                                                                    </TableCell>
                                                                ))}

                                                            {/* Total FCST siempre visible */}
                                                            <TableCell className="py-2 min-w-[130px] border-l text-right font-medium text-amber-700 bg-amber-50/60">
                                                                {formatCurrency(
                                                                    fc.forecasts?.["new"]?.fcst?.total ?? 0
                                                                )}
                                                            </TableCell>

                                                            {/* Meses CF */}
                                                            {showCfMonths &&
                                                                CF_MONTHS.map((month, index) => (
                                                                    <TableCell
                                                                        key={`${fc._id ?? fc.id}-cf-${month}`}
                                                                        className="py-2 min-w-[130px] text-right"
                                                                    >
                                                                        {formatCurrency(
                                                                            fc.forecasts?.["new"]?.cf?.months?.[index]
                                                                                ?.value ?? 0
                                                                        )}
                                                                    </TableCell>
                                                                ))}

                                                            {/* Total CF siempre visible */}
                                                            <TableCell className="py-2 min-w-[130px] border-l text-right font-medium text-amber-700 bg-amber-50/60">
                                                                {formatCurrency(
                                                                    fc.forecasts?.["new"]?.cf?.total ?? 0
                                                                )}
                                                            </TableCell>

														</TableRow>
                                   
                                                        ))
                                                        
                                                    )}
												</TableBody>

                                                <TableFooter className="sticky bottom-0 z-20">
                                                    <TableRow className="border-t-2 border-slate-400 bg-white ">
                                                        {/* Cinco columnas iniciales */}
                                                        <TableCell
                                                            colSpan={5}
                                                            className="py-3 text-left font-semibold uppercase text-slate-900"
                                                        >
                                                            Total general
                                                        </TableCell>

                                                        {/* OLD FCST: meses */}
                                                        {showOldFcstMonths &&
                                                            FCST_MONTHS.map((month, index) => (
                                                                <TableCell
                                                                    key={`total-old-fcst-${month}`}
                                                                    className="min-w-[130px] py-3 text-right font-semibold text-white"
                                                                >
                                                                    {formatCurrency(
                                                                        tableTotals.old.fcst.months[index]
                                                                    )}
                                                                </TableCell>
                                                            ))}

                                                        {/* OLD FCST: total 5+7 */}
                                                        <TableCell className="min-w-[130px] border-l border-amber-300 bg-amber-100 py-3 text-right font-bold text-amber-900">
                                                            {formatCurrency(tableTotals.old.fcst.total)}
                                                        </TableCell>

                                                        {/* OLD CF: meses */}
                                                        {showOldCfMonths &&
                                                            CF_MONTHS.map((month, index) => (
                                                                <TableCell
                                                                    key={`total-old-cf-${month}`}
                                                                    className="min-w-[130px] py-3 text-right font-semibold text-white"
                                                                >
                                                                    {formatCurrency(
                                                                        tableTotals.old.cf.months[index]
                                                                    )}
                                                                </TableCell>
                                                            ))}

                                                        {/* OLD CF: total 5+7 */}
                                                        <TableCell className="min-w-[130px] border-l border-amber-300 bg-amber-100 py-3 text-right font-bold text-amber-900">
                                                            {formatCurrency(tableTotals.old.cf.total)}
                                                        </TableCell>

                                                        {/* NEW FCST: meses */}
                                                        {showFcstMonths &&
                                                            FCST_MONTHS.map((month, index) => (
                                                                <TableCell
                                                                    key={`total-new-fcst-${month}`}
                                                                    className="min-w-[130px] py-3 text-right font-semibold text-white"
                                                                >
                                                                    {formatCurrency(
                                                                        tableTotals.new.fcst.months[index]
                                                                    )}
                                                                </TableCell>
                                                            ))}

                                                        {/* NEW FCST: total 6+6 */}
                                                        <TableCell className="min-w-[130px] border-l border-amber-300 bg-amber-100 py-3 text-right font-bold text-amber-900">
                                                            {formatCurrency(tableTotals.new.fcst.total)}
                                                        </TableCell>

                                                        {/* NEW CF: meses */}
                                                        {showCfMonths &&
                                                            CF_MONTHS.map((month, index) => (
                                                                <TableCell
                                                                    key={`total-new-cf-${month}`}
                                                                    className="min-w-[130px] py-3 text-right font-semibold text-white"
                                                                >
                                                                    {formatCurrency(
                                                                        tableTotals.new.cf.months[index]
                                                                    )}
                                                                </TableCell>
                                                            ))}

                                                        {/* NEW CF: total 6+6 */}
                                                        <TableCell className="min-w-[130px] border-l border-amber-300 bg-amber-100 py-3 text-right font-bold text-amber-900">
                                                            {formatCurrency(tableTotals.new.cf.total)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableFooter>

											</Table>
										</div>
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