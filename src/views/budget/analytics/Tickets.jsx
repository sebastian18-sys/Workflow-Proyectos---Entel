import { useEffect, useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router"
import Dropzone from "@/components/drag_drop/drag_drop"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import { StatusModal } from "@/components/StatusModal/StatusModal"
import MoreOptions from "@/components/Tables/MoreOptions"
import Pagination from "@/components/Tables/Pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PERMS } from "@/constants/perm"
import { useContracts } from "@/hooks/budget/capex/useContracts"
import { useProjectsByLlaveCapex } from "@/hooks/budget/capex/useProjectsByLlave"
import { useProjectsCapex } from "@/hooks/budget/capex/useProjectsCapex"
import { useSolicitadoByKey } from "@/hooks/budget/capex/useSolicitadoByKey"
import { useTickets } from "@/hooks/budget/capex/useTickets"
import { useIdentifers } from "@/hooks/projects/useIdentifers"
import { useAuth } from "@/hooks/useAuth"
import { useAuthz } from "@/hooks/useAuthz"
import { useDebounce } from "@/hooks/useDebounce"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import useTableTool from "@/hooks/useTableTool"
import { buildTicketRowForTemplate, exportTicketToXlsx } from "@/lib/exportExcel"

import { activeFiltersToParams } from "@/lib/filterUtils"
import { formatCurrency, formatDDMMYYYYHour, toNumber } from "@/lib/helpers"
import validateLineInvertion from "@/lib/validateLineaInverion"
import validatePa from "@/lib/validatePa"
import { validateTemplateTickets } from "@/lib/validateTemplate"
import { getAllTickets } from "@/services/capex/getTickets"
import { getTicketOptions } from "@/services/getOptionsFilters"
import { ArrowLeft, Columns2, FileDown, FileText, FolderKanban, Plus, Search, Ticket, X } from "lucide-react"
import { toast } from "wc-toast";
import * as XLSX from "xlsx";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
import { COORDINADORES_REAL, UNIDADES_FUNCIONALES } from "@/constants/coordinadores"

const TABLE_ID = "tickets"

const columns = [
    { id: "ticket_code", label: "Código", visible: true },
	{ id: "ticket_name", label: "Nombre", visible: true },
	{ id: "requester", label: "Solicitante", visible: true },
    { id: "sites_count", label: "Sitios", visible: true },
    { id: "total_cotizacion", label: "Monto", visible: true },
    { id: "state", label: "Estado", visible: true },
    { id: "ticket_jira", label: "Ticket Jira", visible: true },
    { id: "createdAt", label: "Fecha Creación", visible: true }
]

const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar por código o nombre" },
	selects: [],
    visibleKeys: ["search"]
};

const STATUS_TICKET = {
    "Pendiente CT": ["bg-yellow-100 text-yellow-700 hover:bg-yellow-200", "bg-yellow-500 outline-yellow-500/20"],
    "Enviado a MG": ["bg-blue-100 text-blue-700 hover:bg-blue-200", "bg-blue-500 outline-blue-500/20"],
    "RQ Generado": ["bg-emerald-100 text-emerald-700 hover:bg-emerald-200", "bg-emerald-500 outline-emerald-500/20"],
    "Observado": ["bg-red-100 text-red-700 hover:bg-red-200", "bg-red-500 outline-red-500/20"],
    "Cancelado": ["bg-gray-100 text-gray-700 hover:bg-gray-200", "bg-gray-500 outline-gray-500/20"],
}

const TEMPLATE = "/plantillas/Formato_Solicitud_RQ 2.xlsx"

function FormNewTicket({ showAlert, user, addTickets }) {

    const [open, setOpen] = useState(false)
    const [file, setFile] = useState([]);
    const [fileSustentos, setFileSustentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { projects } = useProjectsCapex()
    const { identifiers } = useIdentifers()
    
    const projectsByKey = useProjectsByLlaveCapex()
    const solicitadoKey = useSolicitadoByKey()
    let { contracts } = useContracts({ page: 1, limit: 1000 })
    
    const sheetData = []

    const initialForm = {
        nombre: "",
        file: [],
        fileSustentos: []
    }

    const [form, setForm] = useState(initialForm)

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
            const ws = workbook.Sheets[sheetName];

            // Validar Formato
            validateTemplateTickets(workbook, sheetName)

            const range = XLSX.utils.decode_range(ws['!ref']);
            range.s.r = 0 // Fila 0
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
                    const actividad = String(r[1]).trim();
                    const solucion = String(r[2]).trim()
                    const proveedor = String(r[3]).trim();
                    const sustento = String(r[4]).trim();
                    const acuerdo_compras = String(r[5]).trim();
                    const coordinador = String(r[6]).trim();
                    const moneda = String(r[7]).trim();
                    const cantidad = String(r[8]).trim();
                    const precio_unitario = String(r[9]).trim();
                    const fecha_inicio_servicio = String(r[10]).trim();
                    const fecha_fin_servicio = String(r[11]).trim();
                    const linea_inversion = String(r[12]).trim();
                    const articulo = String(r[13]).trim();

                    const sitios = identifiers.find(s => s.name == identificador)

                    if (!sitios) {
                        throw new Error(`No se encontró el identificador ${identificador}. Revisar consolidado del PM`)
                    };

                    if(articulo === "") {
                        throw new Error(`El campo artículo es obligatorio`)
                    };

                    const unidad_funcional = UNIDADES_FUNCIONALES[user?.email] ?? ""

                    // if(acuerdo_compras === "NO APLICA") {
                    //     proveedor_final = proveedor
                    // } else {
                    //     proveedor_final = contracts.find(p => p.pa === acuerdo_compras)?.proveedor
                    // }
                    if (
                        !["JUAN.LINARES", "KATERIN.DELACRUZ", "CHRISTIAN.ALBUJAR"].includes(coordinador) &&
                        identificador !== "AMAZON2026_1" &&
                        (acuerdo_compras === "NO APLICA" || acuerdo_compras === "")
                    ) {
                        throw new Error(
                            `Ingresar a una PA correcta. En adelante ya no se admiten 'NO APLICA'`
                        );
                    }

                    let proveedor_final 
                    proveedor_final = contracts.find(p => p.pa === acuerdo_compras)?.proveedor ?? proveedor

                    validateLineInvertion(sitios?.project_code, projects, linea_inversion, identificador)

                    const total_cot = cantidad * precio_unitario
                    const descrip_adi = identificador + " / " + (sitios.site ?? "") + " / " + actividad + " / " + solucion

                    const nro_rq = [
                        acuerdo_compras ?? "",
                        proveedor_final ?? "",
                        sitios?.project_name ?? "",  
                        linea_inversion ?? "",
                    ].join("|")

                    if (!rqMap.has(nro_rq)) {
                        rqMap.set(nro_rq, `RQ${String(rqMap.size + 1).padStart(2, "0")}`);
                    }

                    return {
                        nro: rqMap.get(nro_rq),
                        identificador,
                        sitio: sitios?.site ?? "",
                        actividad,
                        solucion,
                        proveedor: proveedor_final,
                        sustento,
                        acuerdo_compras,
                        coordinador,
                        moneda,
                        cantidad,
                        precio_unitario,
                        total_cotizacion: total_cot ?? 0,
                        fecha_registro: "",
                        fecha_inicio_servicio,
                        fecha_fin_servicio,
                        descripcion_adicional: descrip_adi ?? "",
                        id_proyecto: sitios?.project_code ?? "",    
                        nombre_proyecto: sitios?.project_name ?? "",
                        linea_inversion,
                        articulo,
                        unidad_funcional,
                        assigned_to: coordinador,
                        assigned_to_email: COORDINADORES_REAL.find(c => c.name === coordinador)?.email ?? "",
                        jefatura: projects.find(p => p.investment_line == (linea_inversion).trim())?.jefatura ?? "",
                    };
                });

            sheetData.push(parsed)
            // console.log("sheetData", sheetData)

            const payload = {
                ticket_name: form.nombre,
                requester: user?.firstName + " " + user?.lastName,
                requester_email: user?.email,
            }

            const sitesValidate = validatePa(contracts, sheetData[0], projectsByKey, solicitadoKey)

            // console.log("sheetData", sheetData[0])
            // console.log("sitesValidate", sitesValidate.dataFinalInsertar)

            fd.append("ticketData", JSON.stringify(payload));
            fd.append("parsedSites", JSON.stringify(sitesValidate.dataFinalInsertar));
            // fd.append("parsedSites", JSON.stringify(sheetData[0]));
            fd.append("file", file[0]);
            fileSustentos.forEach((file) => {
                fd.append("fileSustentos", file);
            });

            const errors = sitesValidate.alertas?.errors ?? [
                ...(sitesValidate.alertasPA ?? []),
                ...(sitesValidate.alertasProyecto ?? []),
            ];

            const warnings = sitesValidate.alertas?.warnings ?? [];

            // console.log("errors", errors)

            if(sitesValidate.dataFinalInsertar.length > 0 && sitesValidate.rechazados.length === 0) {
                const res = await addTickets(fd)
                const ticket = res.content.ticket_code

                showAlert({
                    open: true,
                    type: warnings.length > 0 ? "warning" : "success",
                    title: warnings.length > 0
                        ? "Ticket registrado con advertencias"
                        : "Se registró el ticket",
                    message: warnings.length > 0
                        ? "La solicitud ingresó, pero revise las advertencias detectadas."
                        : "Ticket registrado con éxito",
                    details: {
                        warnings,
                    },
                    route: `/budget/analytics/tickets/${ticket}`,
                });
                toast.success("Ticket Registrado");
            } else {

                showAlert({
                    open: true,
                    type: "error",
                    title: "No se pudo registrar el ticket",
                    message: "Se encontraron observaciones que impiden registrar la solicitud. Revise el detalle.",
                    details: {
                        errors,
                        warnings,
                    },
                    route: "",
                    // route: `/budget/analytics/tickets/${ticket}`,
                });

                toast.error("No se pudo registrar el ticket");
            } 

        } catch (e) {
            showAlert({
                open: true,
                type: "error",
                title: e.title ?? "Archivo inválido",
                message: e.message ?? "Se encontraron errores en el archivo.",
                details: {
                    errors: e.alert ? [e.alert] : [],
                    warnings: [],
                },
                route: "",
            });
            setError(e?.message || "No se pudo procesar el archivo");
            console.error(e)
            toast.error("Error al cargar archivo")
        } finally {
            setLoading(false);
        }
        setForm(initialForm)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                    <Plus className="h-6 w-6 text-white" />
                    <span className="text-white">Solicitar RQ</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-3xl max-h-[85vh] overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-sm font-semibold text-blue-500 pb-2">
                                Crear Ticket
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Completa la información para registrar un nuevo ticket.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Separator />

                <div className="max-h-[calc(85vh-120px)] overflow-y-auto">
                    <form id="new-project-form" onSubmit={onSubmit} className="px-6 py-5 space-y-6">
                        <section className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Nombre <span className="text-red-400">*</span></Label>
                                    <Input
                                        className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                        placeholder="Ingresa nombre"
                                        value={form.nombre}
                                        required
                                        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Formato RQ <span className="text-red-400">*</span></Label>
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Sustentos <span className="text-red-400">*</span></Label>
                                    <Dropzone 
                                        files={fileSustentos}
                                        onFilesChange={setFileSustentos}
                                        error={error}
                                        setError={setError}
                                        maxFiles={30}
                                        onFile={setFileSustentos} 
                                    />
                                    <div className="mt-3 flex items-center justify-between">
                                        <a href={TEMPLATE} download className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                                            <FileDown className="h-4 w-4" /> Descargar plantilla
                                        </a>
                                    </div>
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
                                    <Plus className="h-4 w-4" /> Crear
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


export default function Tickets() {

    const { isCollapsed = false } = useOutletContext() || {}

    const { can } = useAuthz()
    const { user } = useAuth()

    const [alertState, setAlertState] = useState({
        open: false,
        type: "error",
        title: "",
        message: "",
        details: [],
        route: ""
    })

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
        request: getTicketOptions,
        debugName: "getTicketOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "requester",
                label: "Solicitante",
                type: "select",
                icon: FolderKanban,
                options: filterOptions.requester || [],
            },
            {
                id: "state",
                label: "Estado",
                type: "select",
                icon: FileText,
                options: filterOptions.state || [],
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

    const canReadAll = can(PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ_ALL_TICKETS);

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

    const ticketParams = canReadAll
        ? queryParams
        : { ...queryParams, requester_email: user.email };

    let {
        tickets,
        loading,
        totalResults,
        totalPages,
        error,
        addTickets
    } = useTickets(ticketParams);

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
                                    <Link aria-current="page" to="/budget/analytics/tickets/" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Ticket /> Tickets
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/details/" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
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
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <a 
                            href="#" 
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Tickets</h2>
                    </div>
                    <FormNewTicket showAlert={showAlert} user={user} addTickets={addTickets} />
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
                                                <FilterAdvanced
                                                    columns={columns}
                                                    availableFilters={availableFilters}
                                                    data={tickets}
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
                                                        template="/plantillas/template_download_ticket.xlsx"
                                                        fileName="Reporte Tickets"
                                                        // data={tickets}
                                                        queryParams={ticketParams}
                                                        totalResults={totalResults}
                                                        service={getAllTickets}
                                                        transformData={buildTicketRowForTemplate}
                                                        exportData={exportTicketToXlsx}     
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
                                                    ) : tickets.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        tickets.map((row, index) => (
                                                        <TableRow key={index}>
                                                            {visibleColumns.ticket_code && (
                                                            <TableCell className="font-medium text-blue-600">
                                                                <Link to={`/budget/analytics/tickets/${row.ticket_code}`} className="truncate hover:underline">
                                                                    {row.ticket_code}
                                                                </Link>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.ticket_name && (
                                                            <TableCell>
                                                                <div className="truncate font-medium text-slate-800" title={row.ticket_name}>
                                                                    {row.ticket_name}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.requester && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.requester}>
                                                                    {row.requester}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.sites_count && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={String(row.sites_count)}>
                                                                    {row.sites_count}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.total_cotizacion && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={String(row.total_cotizacion)}>
                                                                    {formatCurrency(row.total_cotizacion)}
                                                                </div>
                                                            </TableCell>
                                                            )}
                                                            {visibleColumns.state && (
                                                            <TableCell className="min-w-[100px]">
                                                                <Badge
                                                                    className={
                                                                        "flex justify-center items-center gap-4 truncate p-1.5 rounded-xl " +
                                                                        STATUS_TICKET[row.state][0]
                                                                    }
                                                                    title={row.state}
                                                                >
                                                                    <div
                                                                        className={
                                                                        "size-2 flex-none rounded-full outline-4 outline-solid " +
                                                                        STATUS_TICKET[row.state][1]
                                                                        }
                                                                    />
                                                                    {row.state}
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
                <StatusModal
                    open={alertState.open}
                    onOpenChange={(open) => setAlertState((s) => ({ ...s, open }))}
                    type={alertState.type}
                    title={alertState.title}
                    message={alertState.message}
                    details={alertState.details}
                    route={alertState.route}
                />
            </div>
        </div>
    )
}