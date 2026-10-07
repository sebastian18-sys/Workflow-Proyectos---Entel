import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useOutletContext } from "react-router"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIdentifers } from "@/hooks/projects/useIdentifers"
import { buildGenerateCrH2RowForTemplate, buildGenerateCrRowForTemplate, buildTicketSitesRowForTemplate, exportGenerateCrToXlsx, exportTicketSitesToXlsx } from "@/lib/exportExcel"
import { formatCurrency, formatDDMMYYYYHour, toNumber, unique } from "@/lib/helpers"
import { getOCbyProjects } from "@/services/capex/getOCbyProjects"
import { AlertCircle, ArrowLeft, Briefcase, Check, CheckCircle2, Circle, CircleHelp, Clock3, FileText, FolderKanban, GalleryHorizontalEnd, ListCollapse, Loader2, Plus, Search, X } from "lucide-react"
import { toast } from "wc-toast"
import useTableTool from "@/hooks/useTableTool"
import { useDebounce } from "@/hooks/useDebounce"
import Pagination from "@/components/Tables/Pagination"
import FilterAdvanced from "@/components/Filters/FilterAdvanced"
import MoreOptions from "@/components/Tables/MoreOptions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { usePayments } from "@/hooks/budget/capex/usePayments"
import { StatusModal } from "@/components/StatusModal/StatusModal"
import { useAuth } from "@/hooks/useAuth"
import MultiSelectFilter from "@/components/ui/_multiselect3"
import { Label } from "@/components/ui/label"
import { getOCOptions, getPaymentsOptions } from "@/services/getOptionsFilters"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"
import { Spinner } from "@/components/ui/spinner"
import { usePersistentAdvancedFilters } from "@/hooks/usePersistentFilters"
import { activeFiltersToParams } from "@/lib/filterUtils"
import { useAuthz } from "@/hooks/useAuthz"
import { PERMS } from "@/constants/perm"

const TABLE_ID = "payments"

const STATUS_META = {
    no_iniciado: {
        status: "no_iniciado",
        label: "No Iniciado",
        icon: Clock3,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
        dotClass: "bg-slate-400",
        textClass: "text-slate-700",
    },
    pendiente: {
        status: "pendiente",
        label: "Intención de pago",
        icon: Clock3,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
    },
    proceso: {
        status: "proceso",
        label: "Pago Enviado a MG",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    pagado: {
        status: "pagado",
        label: "Pago Generado",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700",
    },
    cerrado: {
        status: "cerrado",
        label: "Cerrado",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700"
    },
    validacion: {
        status: "validacion",
        label: "Validación Jefatura",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    default: {
        label: "Sin estado",
        icon: CircleHelp,
        badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
    },
    intencion_pago: {
        status: "intencion_pago",
        label: "Intención de Pago",
        icon: Clock3,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
    },
    pago_enviado: {
        status: "pago_enviado",
        label: "Pago Enviado a MG",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    pago_generado: {
        status: "pago_generado",
        label: "Pago Generado",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700",
    },
    intencion_pago_h2: {
        status: "intencion_pago_h2",
        label: "Intención de Pago - Hito 2",
        icon: Clock3,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
    },
    pago_enviado_h2: {
        status: "pago_enviado_h2",
        label: "Pago Enviado a MG - Hito 2",
        icon: AlertCircle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700",
    },
    pago_generado_h2: {
        status: "pago_generado_h2",
        label: "Pago Generado - Hito 2",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-700"
    },
    cancelado: {
        status: "cancelado",
        label: "Cancelado",
        icon: X,
        badgeClass: "bg-gray-200 text-gray-800 hover:bg-gray-200",
        dotClass: "bg-gray-400",
        textClass: "text-gray-700",
    }
};

const STATES_INIT_HITO = {
    "hito1": {
        label: "Intención de Pago",
        status: "intencion_pago",
        text: "Hito 1"
    },
    "hito2": {
        label: "Intención de Pago - Hito 2",
        status: "intencion_pago_h2",
        text: "Hito 2"
    },
}

const getFilteredRows = (row) => {

    //trim and lowercase
    const hasOc = row.oc == 0 
            ? false
            : String(row.oc ?? "").trim() !== "";

    const notCr = String(row?.cr ?? "").trim() == ""
    return hasOc && notCr
    // return hasOc

}


function getOverallTone(row) {
    const current = row.currentStage
    return STATUS_META[row[current].status ?? "default"].badgeClass
}

function StepNode({ title, status, active, isLast }) {
    const meta = STATUS_META[status];
    const Icon = status === "cerrado" ? Check : active ? Circle : Circle;

    return (
        <div className="ml-2 flex min-w-[170px] items-center">
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${
                        status === "cerrado"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : active
                            ? "border-blue-200 bg-blue-50 text-[#2b7fff]"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                >
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <div className="text-sm font-semibold text-slate-800">{title}</div>
                    <div className={`text-xs ${meta?.textClass}`}>{meta?.label}</div>
                </div>
            </div>

            {!isLast ? (
                <div className="h-[2px] flex-1 rounded-full bg-slate-200">
                <div
                    className={`h-[2px] rounded-full ${status === "cerrado" ? "bg-emerald-500 w-full" : active ? "bg-[#2b7fff] w-1/2" : "bg-slate-200 w-full"}`}
                />
                </div>
            ) : null}
        </div>
    );
}

// Columns in header
const columns = [
    { id: "codigo", label: "Código", visible: true },
	{ id: "nombre", label: "Nombre", visible: true },
    { id: "sitio", label: "Sitios", visible: true },
    { id: "monto", label: "Monto", visible: true },
    { id: "hito", label: "Hito", visible: true },
    { id: "estado", label: "Estado", visible: true },
    { id: "solicitante", label: "Solicitante", visible: true },
    { id: "fecha_creacion", label: "Fecha Creación", visible: true },
    // { id: "resumen", label: "Resumen", visible: true },
    // { id: "seguimiento", label: "seguimiento", visible: true },
]

const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar..." },
	selects: [],
    visibleKeys: ["search"]
};


function PreviewTableRow({
    row,
    editable,
    onToggleRow,
    onCommitHito,
    formatCurrency,
}) {

    const [draftH1, setDraftH1] = useState(row.cantidad_h1 ?? "");

    useEffect(() => {
        setDraftH1(row.cantidad_h1 ?? "");
    }, [row.cantidad_h1]);

    const numeric =
        draftH1 === "" || draftH1 == null || Number.isNaN(Number(draftH1))
        ? 0
        : Math.max(0, Math.min(100, Number(draftH1)));

    const draftMontoH1 = draftH1 === "" ? 0 : (numeric * row.monto) / 100;
    const draftCantidadH2 = draftH1 === "" ? 100 : 100 - numeric;
    const draftMontoH2 = draftH1 === "" ? row.monto : ((100 - numeric) * row.monto) / 100;

    return (
        <tr className="border-b">
            <td className="px-3 py-3">
                <Checkbox
                    checked={row.selected}
                    disabled={!editable}
                    onCheckedChange={(checked) => onToggleRow(row.id, checked)}
                    aria-label={`Seleccionar ${row.identificador}`}
                />
            </td>

            <td className="px-3 py-3">{row.identificador || "-"}</td>
            <td className="px-3 py-3">{row.sitio || "-"}</td>
            <td className="px-3 py-3 whitespace-normal min-w-[200px]">{row.actividad || "-"}</td>
            <td className="px-3 py-3">{row.solucion || "-"}</td>
            <td className="px-3 py-3">{row.oc || "-"}</td>
            <td className="px-3 py-3">{row.linea_oc || "-"}</td>
            <td className="px-3 py-3">{formatCurrency(row.monto)}</td>

            <td className="px-3 py-3">
                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                {row.estado}
                </Badge>
            </td>

            <td className="px-3 py-3">
                <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={draftH1}
                disabled={!editable}
                onChange={(e) => setDraftH1(e.target.value)}
                onBlur={() => onCommitHito(row.id, draftH1)}
                placeholder={editable ? "0 - 100" : "-"}
                className={`w-[110px] ${editable ? "text-[#2b7fff]" : ""}`}
                />
            </td>

            <td className="px-3 py-3 font-medium text-[#2b7fff]">
                {formatCurrency(draftMontoH1)}
            </td>

            <td className="px-3 py-3 text-emerald-400">
                {draftCantidadH2}
            </td>

            <td className="px-3 py-3 font-medium text-emerald-400">
                {formatCurrency(draftMontoH2)}
            </td>
        </tr>
    );
};

function PreviewTableRowH2({
    row,
    editable,
    onToggleRow,
    onCommitHito,
    formatCurrency,
}) {

    // console.log("PREVIEW ROW", row)

    const [draftH2, setDraftH2] = useState(row.cantidad_h2 ?? "");

    useEffect(() => {
        setDraftH2(row.cantidad_h2 ?? "");
    }, [row.cantidad_h2]);

    const numeric = draftH2 === "" || draftH2 == null || Number.isNaN(Number(draftH2))
        ? 0
        : Math.max(0, Math.min(100, Number(draftH2)));

    const draftMontoH2 = draftH2 === "" ? 0 : (numeric * row.monto) / 100;
    // const draftCantidadH2 = draftH1 === "" ? 100 : 100 - numeric;
    // const draftMontoH2 = draftH1 === "" ? row.monto : ((100 - numeric) * row.monto) / 100;

    return (
        <tr className="border-b">
            <td className="px-3 py-3">
                <Checkbox
                    checked={row.selected}
                    disabled={!editable}
                    onCheckedChange={(checked) => onToggleRow(row.id, checked)}
                    aria-label={`Seleccionar ${row.identificador}`}
                />
            </td>

            <td className="px-3 py-3">{row.identificador || "-"}</td>
            <td className="px-3 py-3">{row.sitio || "-"}</td>
            <td className="px-3 py-3">{row.actividad || "-"}</td>
            <td className="px-3 py-3">{row.solucion || "-"}</td>
            <td className="px-3 py-3">{row.oc || "-"}</td>
            <td className="px-3 py-3">{row.linea_oc || "-"}</td>
            <td className="px-3 py-3">{formatCurrency(row.monto)}</td>

            <td className="px-3 py-3">
                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">
                    {row.estado}
                </Badge>
            </td>

            <td className="px-3 py-3">
                {row.cantidad_h1}
            </td>

            <td className="px-3 py-3 font-medium text-[#2b7fff]">
                {formatCurrency(row.total_pago_h1)}
            </td>

            <td className="px-3 py-3 text-emerald-400">
                <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={draftH2}
                    disabled={!editable}
                    onChange={(e) => setDraftH2(e.target.value)}
                    onBlur={() => onCommitHito(row.id, draftH2)}
                    placeholder={editable ? "0 - 100" : "-"}
                    className={`w-[110px] ${editable ? "text-[#2b7fff]" : ""}`}
                />
            </td>

            <td className="px-3 py-3 font-medium text-emerald-400">
                {formatCurrency(draftMontoH2)}
            </td>
        </tr>
    );
};



export default function PaymentsHistory() {

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false);

    const [processing, setProcessing] = useState(false);
    // const [selectedProject, setSelectedProject] = useState("");
    // const [selectedLinea, setSelectedLinea] = useState("");
    const [selectedJefatura, setSelectedJefatura] = useState("");
    const [nameTicket, setNameTicket] = useState("");
    const [selectedHito, setSelectedHito] = useState("");

    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewBaseRows, setPreviewBaseRows] = useState([]);
    // const [previewRows, setPreviewRows] = useState([]);

    const [filtroProyecto, setFiltroProyecto] = useState([]);
    const [filtroLineaInversion, setFiltroLineaInversion] = useState([]);
    const [filtroProveedor, setFiltroProveedor] = useState([]);
    const [filtroCoord, setFiltroCoord] = useState([]);
    const [searchOC, setSearchOC] = useState("");

    const { identifiers } = useIdentifers()
    const { user } = useAuth()
    const { can } = useAuthz()

    const { isCollapsed = false } = useOutletContext() || {}

    const [alertState, setAlertState] = useState({
        open: false,
        type: "error",
        title: "",
        message: "",
        details: [],
        route: ""
    })

    // Otions Jefatura
    const {
        filterOptions,
        loadingOptions,
        errorOptions,
    } = useOptionsFilter({
        request: getOCOptions,
        debugName: "getOCOptions",
    });

    // Otions Payments
    const {
        filterOptions: payOptions,
        loadingOptions: loadingPayOpts,
        errorOptions: errorPayOpts,
    } = useOptionsFilter({
        request: getPaymentsOptions,
        debugName: "getPaymentsOptions",
    });

    const availableFilters = useMemo(() => {
        return [
            {
                id: "requester",
                label: "Solicitante",
                type: "select",
                icon: FolderKanban,
                options: payOptions.requester || [],
            },
            {
                id: "state",
                label: "Hito",
                type: "select",
                icon: FileText,
                options: payOptions.state || [],
            },
            {
                id: "status_hito",
                label: "Estado",
                type: "select",
                icon: FileText,
                options: payOptions.status_hito
            }
        ];
    }, [payOptions]);

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

    const canReadAll = can(PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ_ALL);

    const ticketParams = canReadAll
        ? queryParams
        : { ...queryParams, requester_email: user.email };

    let {
        payments,
        loading,
        totalResults,
        totalPages,
        error,
        addPayments
    } = usePayments(ticketParams);


    const proyectoOptions = useMemo(() => {
        return [...new Set(
            previewBaseRows
                .map(r => r.nombre_proyecto)
                .filter(Boolean)
        )];
    }, [previewBaseRows]);

    const proveedorOptions = useMemo(() => {
        return [...new Set(
            previewBaseRows
                .map(r => r.proveedor)
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

    const lineaInversionOptions = useMemo(() => {
        const rowsProyecto = !filtroProyecto.length
            ? previewBaseRows
            : previewBaseRows.filter(row =>
                filtroProyecto.includes(row.nombre_proyecto)
            );

        return [...new Set(
            rowsProyecto
                .map(r => r.linea_inversion)
                .filter(Boolean)
        )];
    }, [previewBaseRows, filtroProyecto]);

    const previewRows = useMemo(() => {
        const search = searchOC.trim().toLowerCase();
        return previewBaseRows.filter((row) => {
            const matchProyecto =
                !filtroProyecto.length ||
                filtroProyecto.includes(row.nombre_proyecto);

            const matchLinea =
                !filtroLineaInversion.length ||
                filtroLineaInversion.includes(row.linea_inversion);

            const matchProveedor =
                !filtroProveedor.length ||
                filtroProveedor.includes(row.proveedor);

            const matchCoord =
                !filtroCoord.length ||
                filtroCoord.includes(row.coordinador);

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

            return matchProyecto && matchLinea && matchOC && matchProveedor && matchCoord;
        });
    }, [previewBaseRows, filtroProyecto, filtroLineaInversion, filtroProveedor, filtroCoord, searchOC]);

    useEffect(() => {
        setFiltroLineaInversion((prev) =>
            prev.filter(item => lineaInversionOptions.includes(item))
        );
    }, [lineaInversionOptions]);


    function canEditHito(row) {
        const hasOc = row.oc == 0 
            ? false
            : String(row.oc ?? "").trim() !== "";
        // const hasOc = true
        const hasLineaOc = String(row.linea_oc ?? "").trim() !== "";
        // const hasLineaOc = true
        const allowedStatuses = new Set(["Activado"]);
        return hasOc && hasLineaOc
    }

    const selectedRows = useMemo(() => {
        return previewBaseRows.filter((row) => row.selected);
    }, [previewBaseRows]);

    const selectedVisibleRows = useMemo(() => {
        return previewRows.filter((row) => row.selected);
    }, [previewRows]);

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

    const handleHitoCommit = useCallback((rowId, rawValue) => {
        setPreviewBaseRows((prev) => {
            const index = prev.findIndex((row) => row.id === rowId);
            if (index === -1) return prev;

            const currentRow = prev[index];

            let nextValue = String(rawValue ?? "").replace(/[^\d.]/g, "");

            let cantidad_h1 = "";
            let total_pago_h1 = 0;
            let cantidad_h2 = 100;
            let total_pago_h2 = Number(currentRow.monto || 0);

            if (nextValue !== "") {
            let numeric = Number(nextValue);
            if (!Number.isFinite(numeric)) numeric = 0;

            if (numeric < 0) numeric = 0;
            if (numeric > 100) numeric = 100;

            cantidad_h1 = numeric;
            total_pago_h1 = (numeric * currentRow.monto) / 100;
            cantidad_h2 = 100 - numeric;
            total_pago_h2 = ((100 - numeric) * currentRow.monto) / 100;
            }

            const updatedRow = {
            ...currentRow,
                cantidad_h1,
                total_pago_h1,
                cantidad_h2,
                total_pago_h2,
                _editedH1: true,
            };

            const next = [...prev];
            next[index] = updatedRow;
            return next;
        });
    }, []);

    
    const handleHitoCommitH2 = useCallback((rowId, rawValue) => {
        setPreviewBaseRows((prev) => {
            const index = prev.findIndex((row) => row.id === rowId);
            if (index === -1) return prev;

            const currentRow = prev[index];

            let nextValue = String(rawValue ?? "").replace(/[^\d.]/g, "");

            let cantidad_h1 = "";
            let total_pago_h1 = 0;
            let cantidad_h2 = 100;
            let total_pago_h2 = Number(currentRow.monto || 0);

            if (nextValue !== "") {

                let numeric = Number(nextValue);
                if (!Number.isFinite(numeric)) numeric = 0;

                if (numeric < 0) numeric = 0;
                if (numeric > 100) numeric = 100;

                cantidad_h1 = currentRow.cantidad_h1 ?? "";
                total_pago_h1 = currentRow.total_pago_h1 ?? 0;
                cantidad_h2 = numeric;
                total_pago_h2 = (numeric * currentRow.monto) / 100;

            }

            const updatedRow = {
            ...currentRow,
                cantidad_h1,
                total_pago_h1,
                cantidad_h2,
                total_pago_h2,
                _editedH1: true,
            };

            const next = [...prev];
            next[index] = updatedRow;
            return next;
        });
    }, []);



    function getDefaultHito1Value(jefatura) {
        if (jefatura === "AYA") return 100;
        if (jefatura === "Nodos y Tx") return 70;
        if (jefatura === "OOCC y OOEE") return 50;
        return "";
    }

    function applyDefaultHitos(row, jefatura) {
        const defaultH1 = getDefaultHito1Value(jefatura);

        if (row.cantidad_h1 !== "" && row.cantidad_h1 != null) {
            const h1 = Number(row.cantidad_h1);
            const h2 = 100 - h1;

            return {
                ...row,
                cantidad_h1: h1,
                total_pago_h1: (h1 * row.monto) / 100,
                cantidad_h2: h2,
                total_pago_h2: (h2 * row.monto) / 100,
            };
        }

        if (defaultH1 === "") {
            return {
                ...row,
                cantidad_h1: "",
                total_pago_h1: 0,
                cantidad_h2: 100,
                total_pago_h2: row.monto,
            };
        }

        const h1 = Number(defaultH1);
        const h2 = 100 - h1;

        return {
            ...row,
            cantidad_h1: h1,
            total_pago_h1: (h1 * row.monto) / 100,
            cantidad_h2: h2,
            total_pago_h2: (h2 * row.monto) / 100,
        };
    }

    const identifierStateMap = useMemo(() => {
        return new Map(
            (identifiers || []).map((item) => [item.name, item.state])
        );
    }, [identifiers]);

    function startGenerate() {
        setConfirmOpen(true)
    }

    async function submitChangeState({ jefatura }) {

        try {
            setLoadingPreview(true);
            setPreviewOpen(true);

            // LLAMADA API
            const res = await getOCbyProjects({
                is_payment: false,
                jefatura,
                page: 1,
                limit: 10000,
            });

            // console.log("RES", res)

            const rows = (res?.content?.items || []).map((row, idx) => {

                const baseRow = {
                    id: row._id || `${row.identificador}-${idx}`,
                    selected: false,
                    identificador: row.identificador ?? "",
                    descripcion_adicional: row.descripcion_adicional ?? "",
                    sitio: row.sitio ?? "",
                    actividad: row.actividad ?? "",
                    oc: row.oc ?? "",
                    linea_oc: row.linea_oc ?? "",
                    cantidad: row.cantidad ?? "",
                    monto: toNumber(row.total_cotizacion),
                    // estado: identifiers.find(s => s.name === row.identificador)?.state ?? "-",
                    estado: identifierStateMap.get(row.identificador) ?? "-",
                    cantidad_h1: "",
                    total_pago_h1: 0,
                    cantidad_h2: "",
                    total_pago_h2: 0,

                    // NEWS
                    id_proyecto: row.id_proyecto ?? "",
                    nombre_proyecto: row.nombre_proyecto ?? "",
                    linea_inversion: row.linea_inversion ?? "",
                    solucion: row.solucion ?? "",
                    proveedor: row.proveedor ?? "",
                    sustento: row.sustento ?? "",
                    acuerdo_compras: row.acuerdo_compras ?? "",
                    coordinador: row.coordinador ?? "",
                    rq: row.rq ?? "",
                    cr: row.cr ?? "",
                    is_payment: row.is_payment ?? ""
                }
                
                return applyDefaultHitos(baseRow, selectedJefatura);
            });

            const rowsValidate = rows.filter(r => getFilteredRows(r))
            setPreviewBaseRows(rowsValidate);
            
        } catch (error) {
            console.error("Error al obtener vista previa:", error);
            setPreviewBaseRows([]);
            setPreviewOpen(true);
        } finally {
            setLoadingPreview(false);
        }
    }

    async function submitChangeStateH2({ jefatura }) {

        try {
            setLoadingPreview(true);
            setPreviewOpen(true);

            // LLAMADA API
            const res = await getOCbyProjects({
                // nombre_proyecto,
                // linea_inversion,
                jefatura,
                // status_deliverable: "Ok",
                // status_settlement: "Ok",
                is_payment: true,
                is_payment_2: false,
                page: 1,
                limit: 10000,
            });

            const rows = (res?.content?.items || []).map((row, idx) => {

                const baseRow = {
                    id: row._id || `${row.identificador}-${idx}`,
                    selected: false,
                    identificador: row.identificador ?? "",
                    descripcion_adicional: row.descripcion_adicional ?? "",
                    sitio: row.sitio ?? "",
                    actividad: row.actividad ?? "",
                    oc: row.oc ?? "",
                    linea_oc: row.linea_oc ?? "",
                    cantidad: row.cantidad ?? "",
                    monto: toNumber(row.total_cotizacion),
                    // estado: identifiers.find(s => s.name === row.identificador)?.state ?? "-",
                    estado: identifierStateMap.get(row.identificador) ?? "-",
                    cantidad_h1: row.cantidad_pago ?? 0,
                    total_pago_h1: row.monto_pago ?? 0,
                    cantidad_h2: row.cantidad_pago_pendiente ?? 0,
                    total_pago_h2: row.monto_pago_pendiente ?? 0,

                    // NEWS
                    id_proyecto: row.id_proyecto ?? "",
                    nombre_proyecto: row.nombre_proyecto ?? "",
                    linea_inversion: row.linea_inversion ?? "",
                    solucion: row.solucion ?? "",
                    proveedor: row.proveedor ?? "",
                    sustento: row.sustento ?? "",
                    acuerdo_compras: row.acuerdo_compras ?? "",
                    coordinador: row.coordinador ?? "",
                    rq: row.rq ?? "",
                    cr: row.cr ?? "",
                    is_payment: row.is_payment ?? false
                }
                
                return baseRow
            });

            setPreviewBaseRows(rows);
            
        } catch (error) {
            console.error("Error al obtener vista previa:", error);
            setPreviewBaseRows([]);
            setPreviewOpen(true);
        } finally {
            setLoadingPreview(false);
        }

    }

    function onConfirmProceed() {
        if(!selectedJefatura) {
            e?.preventDefault?.();
            return;
        }
        setConfirmOpen(false);

        selectedHito === "hito1" 
            ? submitChangeState({ jefatura: selectedJefatura }) 
            : submitChangeStateH2({ jefatura: selectedJefatura })

    }

    async function handleProcess(rowsToProcess) {

        const template="/plantillas/template_generacion_cr.xlsx"
        const transformProject = rowsToProcess.map(buildGenerateCrRowForTemplate);
        const transformProjectH2 = rowsToProcess.map(buildGenerateCrH2RowForTemplate);

        setProcessing(true)

        const fd = new FormData();

        const payload = {
            name: nameTicket,
            requester: user?.firstName + " " + user?.lastName,
            requester_email: user?.email,
            currentStage: selectedHito, //hito1 o hito2
            state: STATES_INIT_HITO[selectedHito].text,

            [selectedHito]: {
                status: STATES_INIT_HITO[selectedHito].status,
                label: STATES_INIT_HITO[selectedHito].label,
                amount: selectedHito === "hito1" 
                            ? rowsToProcess.map(r => r.total_pago_h1).reduce((s, v) => s + v, 0)
                            : rowsToProcess.map(r => r.total_pago_h2).reduce((s, v) => s + v, 0),
                validated: true,
                owner: "",
                owner_email: "",
                updatedAt: new Date(),
                note: STATES_INIT_HITO[selectedHito].label,
            }

        }

        fd.append("paymentData", JSON.stringify(payload));
        fd.append("paymentSites", JSON.stringify(rowsToProcess));

        try {

            const dataFinal = selectedHito === "hito1" ? transformProject : transformProjectH2
            const fileName = selectedHito === "hito1" ? "Formato CR Hito 1" : "Formato CR Hito 2"

            const generatedFile = await exportGenerateCrToXlsx({
                templatePath: template,
                dataFinal,
                fileName,
                download: false,
                returnFile: true
            })

            const warnings = ""

            fd.append("file", generatedFile);

            const res = await addPayments(fd)
            const ticket = res.content.code

            showAlert({
                open: true,
                type: "success",
                title: "Se registró la solicitud",
                message: "Solicitud registrado con éxito",
                details: {
                    warnings,
                },
                route: `/budget/analytics/payments/${ticket}`
            })

            toast.success("Solicitud Registrada")
            setProcessing(false)
            setPreviewOpen(false)
        } catch (error) {
            console.log(error)
            toast.error("Error al descargar reporte")
            setProcessing(false)
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
                                    <Link aria-current="page" to="/budget/analytics/payments/" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <GalleryHorizontalEnd /> Historial
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/payments-sites/" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <ListCollapse /> Sitios
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
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Historial de Pagos</h2>
                    </div>
                    {/* <FormNewTicket showAlert={showAlert} user={user} /> */}
                    <Button size="icon" onClick={startGenerate} className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                        <Plus className="h-6 w-6 text-white" />
                        <span className="text-white">Solicitar CR</span>
                    </Button>
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
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center pb-6 gap-3">
                                                {/* Filtros avanzados */}
                                                <FilterAdvanced
                                                    columns={columns}
                                                    availableFilters={availableFilters}
                                                    data={payments}
                                                    activeFilters={activeAdvancedFilters}
                                                    onActiveFiltersChange={setActiveAdvancedFilters}
                                                    showFiltersInsidePopover={false}
                                                />

                                                {/* Búsqueda */}
                                                {toolbarConfig.search && isVisible("search") && ( 
                                                    <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            placeholder={toolbarConfig.search.placeholder || "Buscar"} 
                                                            value={filters.search ?? ""}
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
                                                        fileName="Reporte Sites"
                                                        data={payments}
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

                                        {/* Table   */}
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
                                                    ) : payments.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                                                No hay resultados
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : payments.map((row, index) => (
                                                        <TableRow key={index} className="hover:bg-slate-50/70 align-top">
                                                            {visibleColumns.codigo && (
                                                            <TableCell className="min-w-[80px] font-medium text-blue-600">
                                                                <Link to={`/budget/analytics/payments/${row.code}`} className="truncate hover:underline">
                                                                    {row.code}
                                                                </Link>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.nombre && (
                                                            <TableCell className="min-w-[150px] ">
                                                                <div className="truncate font-medium text-slate-800">
                                                                    {row.name}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.sitio && (
                                                            <TableCell className="min-w-[100px]">
                                                                <div className="truncate">
                                                                    {row.sites}
                                                                </div>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.monto && (
                                                            <TableCell className="min-w-[150px] ">
                                                                <div className="truncate">
                                                                    {/* {row.name} */}
                                                                    {row.currentStage === "hito1"
                                                                        ? formatCurrency(row.amount_h1)
                                                                        : formatCurrency(row.amount_h2)
                                                                    }
                                                                </div>
                                                            </TableCell>
                                                            )}


                                                            {visibleColumns.hito && (
                                                            <TableCell className="min-w-[150px] ">
                                                                <Badge variant="outline" className={`${getOverallTone(row)} rounded-full px-2.5 py-1 font-medium`}>
                                                                    {row.state}
                                                                </Badge>
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.estado && (
                                                            <TableCell className="min-w-[150px] ">
                                                                {/* <div className="truncate font-medium text-slate-800">
                                                                    {row.currentStage === "hito1"
                                                                        ? row?.hito1?.label
                                                                        : row?.hito2?.label
                                                                    }
                                                                </div> */}
                                                                {row.currentStage === "hito1" ?
                                                                    <Badge variant="outline" className={
                                                                        STATUS_META[row?.hito1?.status].badgeClass
                                                                    }>
                                                                        {row?.hito1?.label}
                                                                    </Badge>
                                                                    :
                                                                    <Badge variant="outline" className={
                                                                        STATUS_META[row?.hito2?.status].badgeClass
                                                                    }>
                                                                        {row?.hito2?.label}
                                                                    </Badge>
                                                                }
                                                                {/* <Badge className={STATUS_META[row]} */}
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.solicitante && (
                                                            <TableCell className="min-w-[150px] ">
                                                                <div className="truncate">
                                                                    {row.requester}
                                                                </div>  
                                                            </TableCell>
                                                            )}

                                                            {visibleColumns.fecha_creacion && (
                                                            <TableCell className="min-w-[150px] ">
                                                                <div className="truncate">
                                                                    {formatDDMMYYYYHour(row.createdAt)}
                                                                </div>  
                                                            </TableCell>
                                                            )}

                                                            {/* {visibleColumns.resumen && (
                                                            <TableCell className="min-w-[250px]">
                                                                <div className="space-y-2">
                                                                    <Badge variant="outline" className={`${getOverallTone(row)} rounded-full px-2.5 py-1 font-medium`}>
                                                                        {row.state}
                                                                    </Badge>
                                                                    <div className="text-xs text-slate-500">
                                                                        {row.currentStage === "hito1"
                                                                            ? row?.hito1?.label
                                                                            : row?.hito2?.label
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            )} */}
                                                            {/* {visibleColumns.seguimiento && (
                                                            <TableCell>
                                                                <div className="flex min-w-[220px] items-center py-2">
                                                                <StepNode
                                                                    title="Hito 1"
                                                                    status={row?.hito1?.status}
                                                                    active={row?.currentStage === "hito1"}
                                                                    isLast={false}
                                                                />
                                                                <StepNode
                                                                    title="Hito 2"
                                                                    status={row?.hito2?.status}
                                                                    active={row?.currentStage === "hito2"}
                                                                    isLast={true}
                                                                />
                                                                </div>
                                                            </TableCell>
                                                            )}            */}
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

            <StatusModal
                open={alertState.open}
                onOpenChange={(open) => setAlertState((s) => ({ ...s, open }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                details={alertState.details}
                route={alertState.route}
            />

            {/* Confirmación (AlertDialog moderno) */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="w-[800px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-blue-500">Generar Códigos de Recepción</AlertDialogTitle>
                        <AlertDialogDescription>
                            Seleccionar Unidad Funcional para continuar.                        
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Nombre <span className="text-red-400">*</span></Label>
                                <Input
                                    className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                    placeholder="Ingresa nombre"
                                    value={nameTicket}
                                    required
                                    onChange={(e) => setNameTicket(e.target.value)}
                                />
                            </div>
                        
                            <div className="space-y-2 w-full">
                                <Label className="text-xs text-muted-foreground">Unidad Funcional <span className="text-red-400">*</span></Label>
                                <Select
                                    value={selectedJefatura}
                                    onValueChange={(value) => {
                                        setSelectedJefatura(value);
                                    }}
                                >
                                    <SelectTrigger
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Seleccionar UF" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterOptions?.jefatura?.map((jefatura) => (
                                            <SelectItem key={jefatura} value={jefatura}>
                                                {jefatura}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 w-full">
                                <Label className="text-xs text-muted-foreground">Hito <span className="text-red-400">*</span></Label>
                                <Select
                                    value={selectedHito}
                                    onValueChange={(value) => {
                                        setSelectedHito(value);
                                    }}
                                >
                                    <SelectTrigger
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Seleccionar Hito" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem key="hito1" value="hito1">
                                            Hito 1
                                        </SelectItem>
                                        <SelectItem key="hito2" value="hito2">
                                            Hito 2
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmProceed}
                            disabled={!selectedJefatura || loadingPreview}
                        >
                        {loadingPreview ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                            Continuar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog con tabla H1 */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-[1300px]">
                    <DialogHeader>
                        <DialogTitle className="text-[#2b7fff]">Vista previa de datos filtrados</DialogTitle>
                        <div className="flex gap-4 my-4">
                            <div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Search className="h-4 w-4 text-[#2b7fff]" />
                                        Búsqueda
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
                                label="Línea de inversión"
                                icon={Briefcase}
                                options={lineaInversionOptions}
                                selected={filtroLineaInversion}
                                onChange={setFiltroLineaInversion}
                                placeholder="Seleccionar línea"
                            />
                            <MultiSelectFilter
                                label="Proveedor"
                                icon={Briefcase}
                                options={proveedorOptions}
                                selected={filtroProveedor}
                                onChange={setFiltroProveedor}
                                placeholder="Seleccionar proveedor"
                            />
                            <MultiSelectFilter
                                label="Coordinador"
                                icon={Briefcase}
                                options={coordOptions}
                                selected={filtroCoord}
                                onChange={setFiltroCoord}
                                placeholder="Seleccionar Coordinador"
                            />
                            
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
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Actividad</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">Solución</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">OC</th>
                                    <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">Línea OC</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Monto OC</th>
                                    <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Estado</th>
                                    <th className="px-3 py-3 text-left font-semibold text-[#2b7fff]">
                                        {selectedHito === "hito1" ? "Hito 1 (%)" : "Cantidada Pagada (%)" }
                                    </th>
                                    <th className="px-3 min-w-[120px] py-3 text-left font-semibold text-[#2b7fff]">
                                        {/* Monto a Pagar */}
                                        {selectedHito === "hito1" ? "Monto a Pagar" : "Monto Pagado" }
                                    </th>
                                    <th className="px-3 min-w-[120px] py-3 text-left font-semibold text-emerald-400">
                                        {/* Hito 2 (%) */}
                                        {selectedHito === "hito1" ? "Hito 2 (%)" : "Cantidad Pendiente (%)" }
                                    </th>
                                    <th className="px-3 min-w-[120px] py-3 text-left font-semibold text-emerald-400">
                                        {/* Monto a Pagar */}
                                        {selectedHito === "hito1" ? "Monto a Pagar" : "Monto Pendiente" }
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingPreview ? (
                                    Array.from({ length: 12 }).map((_, rowIdx) => (
                                    <tr key={`skeleton-${rowIdx}`}>
                                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                                            <Skeleton className="h-4 w-[90%]" />
                                        </td>        
                                    </tr>
                                ))  
                                ) : previewRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">
                                            No se encontraron registros para esos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                previewRows.map((row) => (

                                    selectedHito === "hito1" ? (
                                        <PreviewTableRow
                                            key={row.id}
                                            row={row}
                                            editable={canEditHito(row)}
                                            onToggleRow={toggleRow}
                                            onCommitHito={handleHitoCommit}
                                            formatCurrency={formatCurrency}
                                        />
                                    ) : (
                                        <PreviewTableRowH2
                                            key={row.id}
                                            row={row}
                                            editable={canEditHito(row)}
                                            onToggleRow={toggleRow}
                                            onCommitHito={handleHitoCommitH2}
                                            formatCurrency={formatCurrency}
                                        />
                                    )
                                    
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
                                onClick={() => {
                                    // const rowsToProcess = previewRows.filter((r) => r.selected);
                                    // handleProcess(rowsToProcess);
                                    handleProcess(selectedRows);
                                }}
                                // disabled={previewRows.every((r) => !r.selected)}
                                disabled={
                                    processing ||
                                    selectedRows.length === 0
                                }
                            >
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