import Dropzone from "@/components/drag_drop/drag_drop";
import FilterAdvanced from "@/components/Filters/FilterAdvanced";
import IdentifierAutocomplete from "@/components/IdentifierAutocomplete/IdentifierAutocomplete";
import MoreOptions from "@/components/Tables/MoreOptions";
import Pagination from "@/components/Tables/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContracts } from "@/hooks/budget/capex/useContracts";
import { useDeliverables } from "@/hooks/budget/capex/useDeliverables";
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy";
import { useTypeDeliverable } from "@/hooks/budget/capex/useTypeDeliverable";
import { useIdentifers } from "@/hooks/projects/useIdentifers";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptionsFilter } from "@/hooks/useOptionsFilter";
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters";
import useTableTool from "@/hooks/useTableTool";
import { buildPaRowForTemplate, exportPaToXlsx } from "@/lib/exportExcel";
import { activeFiltersToParams } from "@/lib/filterUtils";
import { formatDDMMYYYYHour } from "@/lib/helpers";
import { getDeliverables } from "@/services/capex/getDeliverables";
import { getOCbyProjects } from "@/services/capex/getOCbyProjects";
import { getDeliverablesOptions } from "@/services/getOptionsFilters";
import { ArrowLeft, FileText, FolderKanban, Inbox, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "wc-toast";

const TABLE_ID = "deliverables"

const columns = [
    { id: "type_code", label: "Tipo", visible: true },
    { id: "code", label: "Código", visible: true },
    { id: "name", label: "Nombre", visible: true },
    { id: "identificador", label: "Identificador", visible: true },
    { id: "nombre_proyecto", label: "Proyecto", visible: true },
    { id: "estado", label: "Estado", visible: true },
    { id: "proveedor", label: "Proveedor", visible: true },
    { id: "requester", label: "Solicitante", visible: true },    
    { id: "createdAt", label: "Fecha Creación", visible: true },
    { id: "assigned", label: "Asignado a", visible: true }
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

const INITIAL_FORM = {
    type_code: "",
    name: "",
    identificador: "",
    sitio: "",
    actividad: "",
    id_proyecto: "",
    nombre_proyecto: "",
    proveedor: "",
    oc: "",
    linea_oc: "",
    rq_pext: "",
    rq_pint: "",
    id_planner_ne: "",
    id_planner_fe: "",
    id_ticket_transferencia: "",
    sustentos: []
};


function FormNewTicket({ showAlert, user, addDeliverables, identifiers, providers }) {

    const [open, setOpen] = useState(false)
    const [file, setFile] = useState([]);
    const [fileSustentos, setFileSustentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openInput, setOpenInput] = useState(false);
    const anchorRef = useRef(null);
    // const [activeIndex, setActiveIndex] = useState(0);
    // const { projects } = useProjectsCapex()

    const [ocActividadRows, setOcActividadRows] = useState([]);
    const [loadingOcActividad, setLoadingOcActividad] = useState(false);
    const [errorOcActividad, setErrorOcActividad] = useState(null);
    
    // Type
    const [selectedType, setSelectedType] = useState("")
    const [selectedProvider, setSelectedProvider] = useState("")
    
    // Identificador
    const [selectedIdentificador, setSelectedIdentificador] = useState("")
    const [selectedSite, setSelectedSite] = useState("")
    const [selectedProject, setSelectedProject] = useState("")

    const typeDeliverable = useTypeDeliverable()

    const sheetData = []

    const [form, setForm] = useState(INITIAL_FORM);

    const handleSelectIdentificador = useCallback((item) => {
        setSelectedIdentificador(item.name);
        setSelectedSite(item.site ?? "");
        setSelectedProject(item.project_name ?? "");

        setForm((prev) => ({
            ...prev,
            identificador: item.name,
            sitio: item.site ?? "",
            id_proyecto: item.project_code,
            nombre_proyecto: item.project_name ?? ""
        }));

    }, []);


    useEffect(() => {
        const identificador = form.identificador?.trim();
        const proveedor = selectedProvider

        if (!identificador || !proveedor) {
            setOcActividadRows([]);
            return;
        }

        let ignore = false;

        const loadData = async () => {

            try {
                setLoadingOcActividad(true);
                setErrorOcActividad(null);

                const res = await getOCbyProjects({
                    identificador,
                    proveedor,
                    page: 1,
                    limit: 100,
                });

                if (ignore) return;

                const rows = res?.content?.items ?? [];
                setOcActividadRows(rows);
            } catch (error) {
                if (ignore) return;
                console.error(error);
                setErrorOcActividad("No se pudo obtener OC y Actividad.");
                setOcActividadRows([]);
            } finally {
                if (!ignore) {
                    setLoadingOcActividad(false);
                }
            }
        };

        loadData();

        return () => {
            ignore = true;
        };
    }, [form.identificador, selectedProvider])

    const ocOptions = useMemo(() => {
        const map = new Map();

        ocActividadRows.forEach((row) => {
            const oc = String(row.oc ?? "").trim();

            if (!oc) return;

            map.set(oc, {
                value: oc,
                label: oc
            });
        });

        return Array.from(map.values());
    }, [ocActividadRows]);

    const lineaOcOptions = useMemo(() => {
        const values = new Set();

        ocActividadRows.forEach((row) => {
            const linea = String(row.linea_oc ?? "").trim();

            if (linea) {
                values.add(linea);
            }
        });

        return Array.from(values).map((linea) => ({
            value: linea,
            label: linea
        }));
    }, [ocActividadRows]);

    // console.log("ocActividadRows", ocActividadRows)

    console.log("form", form.oc)
    const selectedOC = ocActividadRows.find(r => (r.oc == form?.oc) && (r.linea_oc == form?.linea_oc))
    console.log("selectedOC", selectedOC)
    
    const onSubmit = async (e) => {
        e.preventDefault()

        if (!file) return;
        setError(null);
        setLoading(true);

        const fd = new FormData();

        // Type
        form.type_code = selectedType
        form.type_name = selectedType
        form.type = typeDeliverable?.items?.find(t => t.code === selectedType)?.type
        form.proveedor = selectedProvider

        console.log("FORM", form)

        try {

            const payload = {
                name: form.name,
                identificador: form.identificador,
                sitio: form.sitio,
                actividad: selectedOC.actividad,
                id_proyecto: form.id_proyecto,
                nombre_proyecto: form.nombre_proyecto,
                linea_inversion: selectedOC.linea_inversion,
                estado: "Pendiente",
                proveedor: form.proveedor,

                rq: selectedOC.rq,
                oc: form.oc,
                linea_oc: form.linea_oc,

                requester: user?.firstName + " " + user?.lastName,
                requester_email: user?.email,

                assigned_to: "",
                assigned_to_email: "",
                validated_to: "",
                validated_to_email: "",

                type_code: form.type_code,
                type_name: form.type_name,

                rq_pext: form.rq_pext,
                rq_pint: form.rq_pint,
                id_planner_ne: form.id_planner_ne,
                id_planner_fe: form.id_planner_fe,
                id_ticket_transferencia: form.id_ticket_transferencia
            }

            fd.append("deliverableData", JSON.stringify(payload));
            file.forEach((file) => {
                fd.append("fileEvidencias", file);
            });

            const res = await addDeliverables(fd)
            const ticket = res.content.code

            showAlert({
                open: true,
                type: "success",
                title: "Se registró el ticket",
                message: "Ticket registrado con éxito",
                details: {},
                route: `/budget/analytics/deliverables/${ticket}`,
            });
            toast.success("Ticket Registrado");

        } catch (e) {
            console.log(e)
            showAlert({
                open: true,
                type: "error",
                title: e.title ?? "Archivo inválido",
                message: e.message ?? "Se encontraron errores en el archivo.",
                details: {
                    errors: e.alert ? [e.alert] : []
                },
                route: "",
            });
            setError(e?.message || "No se pudo procesar el archivo");
            console.error(e)
            toast.error("Error al cargar archivo")
        }

    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                    <Plus className="h-6 w-6 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-5xl max-h-[85vh] overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-sm font-semibold text-blue-500 pb-2">
                                Generar Solicitud
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Completa la información para registrar una nueva solicitud.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Separator />

                <div className="max-h-[calc(85vh-120px)] overflow-y-auto">
                    <form id="new-project-form" onSubmit={onSubmit} className="px-6 py-4 space-y-6">
                        <section className="space-y-2">

                            <h2 className="font-semibold text-blue-500 pb-1">Información Sitio</h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Tipo Solicitud <span className="text-red-400">*</span></Label>
                                        <Select
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            value={selectedType}
                                            onValueChange={(value) => {
                                                setSelectedType(value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {typeDeliverable?.items?.map((type) => (
                                                    <SelectItem key={type.code} value={type.code}>
                                                        {type.type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Nombre <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Ingresa nombre"
                                            value={form.name}
                                            required
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Identificador <span className="text-red-400">*</span></Label>
                                        <IdentifierAutocomplete
                                            identifiers={identifiers}
                                            value={selectedIdentificador}
                                            onSelect={handleSelectIdentificador}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Sitio <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Sitio"
                                            value={selectedSite}
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Proyecto <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Proyecto"
                                            value={selectedProject}
                                            required
                                            disabled
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">OC <span className="text-red-400">*</span></Label>
                                    <Select
                                        value={form.oc}
                                        disabled={!form.identificador || !selectedProvider || loadingOcActividad}
                                        onValueChange={(value) => {
                                            setForm((prev) => ({
                                                ...prev,
                                                oc: value
                                            }));
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    loadingOcActividad
                                                        ? "Cargando OC..."
                                                        : "Seleccionar OC"
                                                }
                                            />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {ocOptions.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Línea OC <span className="text-red-400">*</span></Label>
                                    <Select
                                        value={form.linea_oc}
                                        disabled={!form.identificador || !selectedProvider || loadingOcActividad}
                                        onValueChange={(value) => {
                                            setForm((prev) => ({
                                                ...prev,
                                                linea_oc: value
                                            }));
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    loadingOcActividad
                                                        ? "Cargando Línea OC..."
                                                        : "Seleccionar Línea OC"
                                                }
                                            />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {lineaOcOptions.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <h2 className="font-semibold text-blue-500 pt-2 pb-1">Información Solicitud</h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">RQ PEXT <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Ingresa RQ PEXT"
                                            value={form.rq_pext}
                                            required
                                            onChange={(e) => setForm((p) => ({ ...p, rq_pext: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">RQ PINT <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Ingresa RQ PINT"
                                            value={form.rq_pint}
                                            required
                                            onChange={(e) => setForm((p) => ({ ...p, rq_pint: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>  
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">ID Planner NE <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Ingresa ID"
                                            value={form.id_planner_ne}
                                            required
                                            onChange={(e) => setForm((p) => ({ ...p, id_planner_ne: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">ID Planner FE <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Ingresa ID"
                                            value={form.id_planner_fe}
                                            required
                                            onChange={(e) => setForm((p) => ({ ...p, id_planner_fe: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>      
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">ID Ticket (Transferencia de Sitio) <span className="text-red-400">*</span></Label>
                                        <Input
                                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                            placeholder="Ingresa ID"
                                            value={form.id_ticket_transferencia}
                                            required
                                            onChange={(e) => setForm((p) => ({ ...p, id_ticket_transferencia: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h2 className="font-semibold text-blue-500 pt-2 pb-1">Evidencias</h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Sustentos <span className="text-red-400">*</span></Label>
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

function uniqueProviders(contract) {
    const setCont = new Set()
    contract.forEach(p => setCont.add(p.proveedor))
    return Array.from(setCont)
}


export default function Deliverable() {

    const { user } = useAuth()
    
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewBaseRows, setPreviewBaseRows] = useState([]);
    const [filtroProyecto, setFiltroProyecto] = useState([]);
    const [filtroLineaInversion, setFiltroLineaInversion] = useState([]);
    const [nameTicket, setNameTicket] = useState("");

    const { identifiers } = useIdentifers()
    const { contracts } = useContracts({ page: 1, limit: 1000 })
    const uniqueContracts = uniqueProviders(contracts)

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
        request: getDeliverablesOptions,
        debugName: "getDeliverablesOptions",
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
            },
            {
                id: "type_code",
                label: "Tipo",
                type: "select",
                icon: FileText,
                options: filterOptions.type_code || [],
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
        deliverable,
        loading,
        totalResults,
        totalPages,
        error,
        addDeliverables
    } = useDeliverables(queryParams);

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
                                    <Link aria-current="page" to="/budget/analytics/deliverables/" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Inbox /> Mis Entregables
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/deliverables/history" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Entregables</h2>
                    </div>
                    <FormNewTicket showAlert={showAlert} user={user} addDeliverables={addDeliverables} identifiers={identifiers} providers={uniqueContracts} />
                    {/* <Button size="icon" onClick={startGenerate} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto"> */}
                        {/* <Plus className="h-6 w-6 text-white" /> */}
                    {/* </Button> */}
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
                                                    data={deliverable}
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
                                                        fileName="Reporte Entregables"
                                                        // data={resultData}
                                                        queryParams={queryParams}
                                                        totalResults={totalResults}
                                                        service={getDeliverables}
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
                                                    ) : deliverable.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>

                                                    ) : (
                                                        deliverable.map((row, index) => (
                                                        <TableRow key={index}>

                                                            {visibleColumns.type_code && (
                                                            <TableCell className="min-w-[80px]">
                                                                <div className="truncate" title={row.type_code}>
                                                                    {row.type_code}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.code && (
                                                            <TableCell className="min-w-[80px] font-medium text-blue-600">
                                                                <Link to={`/budget/analytics/deliverables/${row.code}`} className="truncate hover:underline">
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

                                                            

                                                            {visibleColumns.identificador && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate" title={row.identificador}>
                                                                    {row.identificador}
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

                                                            {visibleColumns.proveedor && (
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

                                                            {visibleColumns.createdAt && (
                                                            <TableCell className="min-w-[150px]">
                                                                <div className="truncate" title={row.createdAt}>
                                                                    {formatDDMMYYYYHour(row.createdAt)}
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