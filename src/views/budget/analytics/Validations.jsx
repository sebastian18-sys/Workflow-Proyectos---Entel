import { useEffect, useMemo, useState } from "react";
import useTableTool from "@/hooks/useTableTool"
import { ArrowLeft, Briefcase, MoreVertical, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoreOptions from "@/components/Tables/MoreOptions";
import { buildTicketSitesRowForTemplate, exportTicketSitesToXlsx } from "@/lib/exportExcel";
import Pagination from "@/components/Tables/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDDMMYYYYHour } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Validations() {

    const columns = [
        { id: "codigo", label: "Código", visible: true },
        { id: "nombre", label: "Nombre", visible: true },
        { id: "site", label: "Sitios", visible: true },
        { id: "monto", label: "Monto Hito 2", visible: true },
        { id: "estado", label: "Estado", visible: true },
        { id: "fecha", label: "Fecha llegada", visible: true },
        { id: "accion", label: "Acción", visible: true },
    ]

    // Filters available in ADVANCED FILTERS
    const availableFilters = [
        { id: "codigo", label: "Código", icon: Briefcase, type: "select" },
        { id: "estado", label: "Estado", icon: Briefcase, type: "select" }
    ]

    const toolbarConfig = {
        search: { placeholder: "Buscar por código o nombre" },
        selects: [],
        visibleKeys: ["search"]
    };

    const STATUS_TICKET = {
        "Pendiente": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
        "Validado": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"],
    }

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

    const [advancedFilters , setAdvancedFilters] = useState({
        codigo: "",
        estado: ""
    })

    const debouncedSearch = useDebounce(filters.search, 300);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        advancedFilters.codigo,
        advancedFilters.estado,
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
    
    const dataTest = [
        {
            codigo: "SCR-00001",
            nombre: "Pago Generado 30-03-2026",
            site: 14,
            monto: "2026",
            estado: "Pendiente",
            fecha: "2026-09-04"
        },
        {
            codigo: "SCR-00002",
            nombre: "Pago Generado 25-03-2026",
            site: 2,
            monto: "2026",
            estado: "Pendiente",
            fecha: "2026-10-08"
        },
        {
            codigo: "SCR-00003",
            nombre: "Pago Generado 10-04-2026",
            site: 20,
            monto: "2026",
            estado: "Validado",
            fecha: "2026-11-11"
        },
        {
            codigo: "SCR-00004",
            nombre: "Pago Generado 17-04-2026",
            site: 55,
            monto: "2026",
            estado: "Validado",
            fecha: "2026-11-24"
        }
    ]

    const loading = false
    const totalResults = dataTest.length
    const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

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
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Validaciones</h2>
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
                                                    data={dataTest} 
                                                    onChange={setAdvancedFilters}
                                                />

                                                {/* Búsqueda */}
                                                {toolbarConfig.search && isVisible("search") && ( 
                                                    <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            placeholder={toolbarConfig.search.placeholder || "Buscar"} 
                                                            value={filters.search ?? ""}
                                                            // onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                            onChange={(e) =>
                                                                setFilters((prev) => ({
                                                                     ...prev,
                                                                    search: e.target.value
                                                                }))  
                                                            }
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
                                                        fileName="Reporte Validaciones"
                                                        data={dataTest}
                                                        transformData={buildTicketSitesRowForTemplate}
                                                        exportData={exportTicketSitesToXlsx}     
                                                    />

                                                </div>
                                                
                                            </div>

                                            {advancedFilters.length > 0 && (
                                                <div className="col-span-2 col-start-1 row-start-3 mt-4 flex flex-wrap items-center gap-2">
                                                    <div className="text-lighttext mr-2 cursor-default border-r pr-4 leading-6">
                                                        Filtros activos
                                                    </div>
                                                    {advancedFilters.map((filter) => (
                                                        <div data-filtercontainer="" className="relative">
                                                        <input type="hidden" name="filterSuperStatus" value="0" />
                                                            <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3.5 leading-6 text-violet-600 pr-8 cursor-pointer">
                                                                {filter.label}: <strong className="font-medium">{filter.value}</strong>
                                                                <button type="button" className="absolute right-px rounded-full p-1.25 opacity-75 transition-all hover:opacity-100 focus:bg-violet-200">
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
                                                    <TableRow className="h-8 bg-slate-50/90 hover:bg-slate-50/90">
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
                                                        Array.from({ length: 7 }).map((_, rowIdx) => (
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
                                                    ) : dataTest.length === 0 ? (
                                                        // SIN RESULTADOS
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : dataTest.map((row, index) => (

                                                        <TableRow key={index}>

                                                            {visibleColumns.codigo && (
                                                            <TableCell className="min-w-[80px] font-medium text-blue-600">
                                                                <div className="truncate">
                                                                    {row.codigo}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.nombre && (
                                                            <TableCell>
                                                                <div className="truncate font-medium text-slate-800" title={row.ticket_name}>
                                                                    {row.nombre}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.site && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={String(row.site)}>
                                                                    {row.site}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            
                                                            {visibleColumns.actividad && (
                                                            <TableCell className="min-w-[120px]">
                                                                <div className="truncate" title={row.actividad}>
                                                                    {row.actividad}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.monto && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={String(row.monto)}>
                                                                    {formatCurrency(row.monto)}
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
                                                            {visibleColumns.fecha && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.fecha}>
                                                                    {formatDDMMYYYYHour(row.fecha)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.accion && (
                                                            <TableCell className="">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>

                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
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