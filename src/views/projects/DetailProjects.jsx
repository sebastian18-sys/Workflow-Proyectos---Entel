import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, CalendarIcon, ChevronDown, ChevronRight, FileText, Folder, MoreVertical, NotebookTabs, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import useTableTool from "@/hooks/useTableTool"
import Pagination from "@/components/Tables/Pagination"
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, CartesianGrid, XAxis, YAxis, Legend, LabelList, Tooltip } from "recharts"
import { useProjects } from "@/hooks/projects/useProjects"
import { rowPassesAdvancedFilters, toNumber } from "@/lib/helpers"

const sidebarItems = [
    { id: "informacion", label: "Información" },
    { id: "sitios", label: "Sitios" },
    { id: "status", label: "Status" },
    { id: "adherencia", label: "Adherencia metodológica" },
    { id: "servicio", label: "Servicio No Conforme" }
]

const tipoProyectoOptions = ["COSITE", "TRANSPORTE", "MACRO", "OPERATIVO", "COMERCIAL", "INDOOR", "GCIR", "OTROS"]
const pmOptions = ["Sebastian", "Jason", "Luis", "Andrea"]
const sponsorOptions = ["GCIR", "GIRA", "CORE"]
const jefaturaOptions = ["AYA", "Nodos y Tx", "OOCC y OOEE", "PMO"]

const demoData = [
    {
        codigo: "P-001",
        proposito: "Sitios Nuevos",
        tipoProyecto: "",
        projectManager: "",
        jefatura: "PMO",
        fechaInicioIniciativa: undefined,
        fechaFinCI: undefined,
        fechaFinSOLPE: undefined,
        fechaFinEjecucion: undefined,
        fechaFinCierre: undefined,
        assignments: [{
            id: crypto.randomUUID(),
            tipoProyecto: "MACRO",
            projectManager: "Sebastian Alexis",
        }],
        alcance: 100,
        sponsor: "GIRA",
        anio: 2026,
        proyecto: "COBERTURA INDOOR APT 2026",
        avance: 0,
        stage: "Ejecución",
        milestones: {
        iniciativa: { stage: "iniciativa", date: "06Abr", status: "actual" },
        planificacion: { stage: "planificacion", date: "08Abr", status: "actual" },
        ejecucion: { stage: "ejecucion", date: "20Jun", status: "actual" },
        cierre: { stage: "cierre", date: "20Nov", status: "planned" },
        },
        segments: ["none", "actual", "planned"],
    },
    {
        codigo: "P-0196",
        proposito: "Cobertura",
        tipoProyecto: "",
        projectManager: "",
        jefatura: "PMO",
        fechaInicioIniciativa: undefined,
        fechaFinCI: undefined,
        fechaFinSOLPE: undefined,
        fechaFinEjecucion: undefined,
        fechaFinCierre: undefined,
        assignments: [],
        alcance: 100,
        sponsor: "GIRA",
        anio: 2026,
        proyecto: "MANTENER DECLARACIONES PROVINCIA 2026",
        avance: 100,
        stage: "Ejecución",
        milestones: {
        iniciativa: { stage: "iniciativa", date: "06Abr", status: "actual" },
        planificacion: { stage: "planificacion", date: "08Abr", status: "actual" },
        ejecucion: { stage: "ejecucion", date: "20Jun", status: "actual" },
        cierre: { stage: "cierre", date: "20Nov", status: "actual" },
        },
        segments: ["none", "actual", "actual"],
    },
    {
        codigo: "P-0197",
        alcance: 100,
        proposito: "Cobertura",
        tipoProyecto: "",
        projectManager: "",
        jefatura: "PMO",
        fechaInicioIniciativa: undefined,
        fechaFinCI: undefined,
        fechaFinSOLPE: undefined,
        fechaFinEjecucion: undefined,
        fechaFinCierre: undefined,
        assignments: [],
        sponsor: "GIRA",
        anio: 2026,
        proyecto: "VULNERABILIDAD RED PLANTA EXTERNA 2026",
        avance: 83,
        stage: "Ejecución",
        milestones: {
        iniciativa: { stage: "iniciativa", date: "06Abr", status: "actual" },
        planificacion: { stage: "planificacion", date: "08Abr", status: "actual" },
        ejecucion: { stage: "ejecucion", date: "20Jun", status: "risk" }, // punto rojo
        cierre: { stage: "cierre", date: "20Nov", status: "planned" },
        },
        segments: ["none", "actual", "planned"],
    },
    {
        codigo: "P-0204",
        alcance: 100,
        proposito: "Cobertura",
        tipoProyecto: "",
        projectManager: "",
        assignments: [],
        jefatura: "PMO",
        fechaInicioIniciativa: undefined,
        fechaFinCI: undefined,
        fechaFinSOLPE: undefined,
        fechaFinEjecucion: undefined,
        fechaFinCierre: undefined,
        sponsor: "OPERATIVO",
        anio: 2026,
        proyecto: "SISTEMA DE CLIMATIZACION EN SITES 2026",
        avance: 0,
        stage: "Planificación",
        standby: true,
        milestones: {
        iniciativa: { stage: "iniciativa", date: "06Abr", status: "actual" },
        planificacion: { stage: "planificacion", date: "08Abr", status: "actual" },
        ejecucion: { stage: "ejecucion", date: "20Jun", status: "planned" },
        cierre: { stage: "cierre", date: "20Nov", status: "planned" },
        },
        segments: ["none", "planned", "planned"],
    },
]

const getSncStateBadge = (estado) => {
    switch (estado) {
        case "PENDIENTE DE ATENCIÓN":
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{estado}</Badge>
        default:
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{estado}</Badge>
    }
}

const getEstadoBadge = (estado) => {
    switch (estado) {
        case "Ejecución":
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ejecución</Badge>
        case "Finalizado":
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Finalizado</Badge>
        case "No iniciado":
            return <Badge className="bg-gray-300 text-gray-700 hover:bg-gray-300">No iniciado</Badge>
        case "On Hold":
            return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">On Hold</Badge>
        default:
            return <Badge>{estado}</Badge>
    }
}


const getPrioridadIndicator = (prioridad) => {
    const color = prioridad === "Alta" ? "bg-yellow-400" : "bg-blue-400"
    return (
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm text-gray-700">{prioridad}</span>
      </div>
    )
}


const handleEditar = () => {
    console.log("Editando proyecto:", id)
    // Aquí puedes agregar la lógica para habilitar la edición
}

const handleGuardar = () => {
    console.log("Guardando proyecto:", id)
    // Aquí puedes agregar la lógica para guardar los cambios
}

function formatDate(d) {
    if (!d) return ""
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}


const LineBadge = (props) => {
    const { x, y, value } = props;
    if (x == null || y == null) return null;
    const text = (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    const padX = 4,
        padY = 2;
    const width = text.length * 6 + padX * 2;
    const height = 16;
    const rx = 4;
    const tx = (x) - width / 2;
    const ty = (y) - height - 6;
    return (
        <g>
        <rect x={tx} y={ty} width={width} height={height} rx={rx} ry={rx} stroke="#d1d5db" fill="#ffffff" />
        <text x={x} y={ty + height / 2 + 3} textAnchor="middle" fontSize={10} fill="#111827">
            {text}
        </text>
        </g>
    );
};


function DateField({
    label,
    value,
    onChange,
    placeholder = "dd/mm/yyyy"
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
                >
                    <span>{value ? value : placeholder}</span>
                    <CalendarIcon className="h-4 w-4" />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
                </PopoverContent>
            </Popover>
        </div>
    )
}

function InformationTab({ project, id }) {

    // console.log("PROJECT", project)
    const [form, setForm] = useState({
        project_code : id ?? "",
        project_name : ""
    })
    const [assignments, setAssignments] = useState([])

    useEffect(() => {
        if (project) {
            // importante: clon superficial para editar en UI sin mutar el objeto del hook
            // setForm({ ...ticket })
            setForm((prev) => ({ ...prev, ...project }))
            // setSelectedFile(null)
            // setEditing(false)
        }
    }, [project, id])

    console.log("FORM........", form)

    const updateField = (field, value) => {
        setForm((p) => ({ ...p, [field]: value }))
    }
    
    const addAssignment = () => {
        if (!form.tipoProyecto || !form.projectManager) return
        setAssignments((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                tipoProyecto: form.tipoProyecto,
                projectManager: form.projectManager,
                fecha: new Date(),
            },
        ])
    }

    return (
        <div className="p-6">
            <section className="space-y-4">
                <h3 className="text-[13px] font-semibold text-blue-400">Proyecto</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Nombre <span className="text-red-400">*</span></Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Ingresa nombre de Iniciativa"
                            value={form?.project_name}
                            disabled
                            onChange={(e) => updateField("project_name", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Alcance <span className="text-red-400">*</span></Label>
                        <Input
                            className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                            placeholder="Ingresa el alcance de la iniciativa"
                            value={form?.scope_value}
                            disabled
                            onChange={(e) => setForm((p) => ({ ...p, scope_value: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Propósito / Justificación</Label>
                    <Textarea
                        placeholder="Ingresar propósito"
                        className="min-h-[70px] focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                        value={form?.purpose}
                        disabled
                        onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tipo Proyecto: <span className="text-red-400">*</span></Label>
                        <Select
                            // required
                            // value=
                            onValueChange={(v) => setForm((p) => ({ ...p, tipoProyecto: v }))}
                            disabled
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {tipoProyectoOptions.map((o) => (
                                    <SelectItem key={o} value={o}>
                                    {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>    
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Project Manager: <span className="text-red-400">*</span></Label>
                        <Select
                            // value={project.projectManager}
                            onValueChange={(v) => setForm((p) => ({ ...p, projectManager: v }))}
                            disabled
                        >
                            <SelectTrigger required className="w-full">
                                <SelectValue placeholder="Seleccionar PM" />
                            </SelectTrigger>
                            <SelectContent>
                                {pmOptions.map((o) => (
                                    <SelectItem key={o} value={o}>
                                    {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botón + al lado */}
                    <div className="flex items-end">
                    <Button
                        type="button"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-blue-500 hover:bg-blue-400 cursor-pointer"
                        onClick={addAssignment}
                        title="Añadir"
                        disabled
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Tipo Proyecto</TableHead>
                                <TableHead className="text-xs">Project Manager</TableHead>
                                <TableHead className="text-xs">Fecha</TableHead>
                                <TableHead className="text-xs text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {form?.users?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 text-gray-300">
                                            <SearchX className="h-10 w-10" />
                                        </div>
                                        <div className="text-gray-300">Sin Resultados</div>
                                    </div>
                                </TableCell>
                            </TableRow>
                            ) : (
                            form?.users?.map((a, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-sm">{a.project_type}</TableCell>
                                    <TableCell className="text-sm">{a.full_name}</TableCell>
                                    <TableCell className="text-sm">{a.joined_at}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeAssignment(index)}
                                            aria-label="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <Separator />

            {/* === SPONSOR === */}
            <section className="space-y-4 mt-6">
                <h3 className="text-[13px] font-semibold text-blue-400">Sponsor</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sponsor:</Label>
                        <Select
                            value={form?.sponsors}
                            disabled
                            onValueChange={(v) => setForm((p) => ({ ...p, sponsors: v }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar Sponsor" />
                            </SelectTrigger>
                            <SelectContent>
                                {sponsorOptions.map((o) => (
                                    <SelectItem key={o} value={o}>
                                    {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Jefatura:</Label>
                        <Select
                            value={form?.jefatura}
                            disabled
                            onValueChange={(v) => setForm((p) => ({ ...p, jefatura: v }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar Jefatura" />
                            </SelectTrigger>
                            <SelectContent>
                                {jefaturaOptions.map((o) => (
                                    <SelectItem key={o} value={o}>
                                    {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            <Separator />

            {/* === PLANIFICACIÓN === */}
            <section className="space-y-4 mt-6">
                <h3 className="text-[13px] font-semibold text-blue-400">Planificación</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {form?.stages?.map((stage, index) => (
                        <div key={stage.code} className="space-y-2">
                            <div className="text-center bg-[#696969] py-1 rounded-lg text-white font-medium mb-3">{stage.code}</div>
                            <DateField
                                label={`Fecha Inicio ${stage.name}:`}
                                value={stage.actual_start_date}
                                onChange={(d) => setForm((p) => ({ ...p, stages: p.stages.map((s, i) => (i === index ? { ...s, actual_start_date: d } : s)) }))}
                            />
                            <DateField
                                label={`Fecha Fin ${stage.name}:`}
                                value={stage.actual_end_date}
                                onChange={(d) => setForm((p) => ({ ...p, stages: p.stages.map((s, i) => (i === index ? { ...s, actual_end_date: d } : s)) }))}
                            />
                        </div>
                    ))}

                    {/* <DateField
                        label="Fecha Inicio Iniciativa:"
                        value={project.fechaInicioIniciativa}
                        onChange={(d) => setForm((p) => ({ ...p, fechaInicioIniciativa: d }))}
                    /> */}
                    {/* <DateField
                        label="Fecha Fin Iniciativa"
                        value={project.fechaFinCI}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinCI: d }))}
                    />
                    <DateField
                        label="Fecha Inicio Planificación:"
                        value={project.fechaFinSOLPE}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinSOLPE: d }))}
                    />
                    <DateField
                        label="Fecha Fin Planificación"
                        value={project.fechaFinEjecucion}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinEjecucion: d }))}
                    />
                    <DateField
                        label="Fecha Inicio Ejecución"
                        value={project.fechaFinCierre}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinCierre: d }))}
                    />
                    <DateField
                        label="Fecha Fin Ejecución"
                        value={project.fechaFinCierre}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinCierre: d }))}
                    />
                    <DateField
                        label="Fecha Inicio Cierre"
                        value={project.fechaFinCierre}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinCierre: d }))}
                    />
                    <DateField
                        label="Fecha Fin Cierre"
                        value={project.fechaFinCierre}
                        onChange={(d) => setForm((p) => ({ ...p, fechaFinCierre: d }))}
                    /> */}
                </div>
            </section>
        </div>
    )
}


function SitiosTab() {

    const columns = [
        { id: "codigo", label: "Código", visible: true },
        { id: "identificador", label: "Identificador", visible: true },
        { id: "sitio", label: "Sitio", visible: true },
        { id: "prioridad", label: "Prioridad", visible: true },
        { id: "estado", label: "Estado", visible: true },
        { id: "fechainicio", label: "F. Inicio", visible: true },
        { id: "fechafin", label: "F. Fin", visible: true },
        { id: "fechafcst", label: "F. FCST", visible: true },
        { id: "fechareal", label: "F. Real", visible: true },
    ]

    const toolbarConfig = {
        filters: { visible: true },
        search: { placeholder: "Buscar por código o nombre" },
        selects: [],
        visibleKeys: ["search"]
    };

    const sitiosData = [
        {
            codigo: "S-0173",
            identificador: "MAC_COIAdicional5G_49",
            sitio: "010140337_AQ_Yumina",
            prioridad: "Alta",
            estado: "Ejecución",
            fechaInicio: "23/01/2024",
            fechaFin: "23/02/2024",
            fcst: "",
            fechaReal: "",
        },
        {
            codigo: "S-0174",
            identificador: "MAC_COIAdicional5G_50",
            sitio: "010160176_CA_Montegrande",
            prioridad: "Alta",
            estado: "Finalizado",
            fechaInicio: "10/03/2024",
            fechaFin: "23/05/2024",
            fcst: "",
            fechaReal: "23/05/2024",
        },
        {
            codigo: "S-0175",
            identificador: "MAC_COIAdicional5G_51",
            sitio: "010160429_CA_Gomez_Ascarate",
            prioridad: "Normal",
            estado: "Ejecución",
            fechaInicio: "10/03/2024",
            fechaFin: "14/04/2024",
            fcst: "",
            fechaReal: "",
        },
        {
            codigo: "S-0176",
            identificador: "MAC_COIAdicional5G_52",
            sitio: "010140341_AQ_Pampas_Camana",
            prioridad: "Normal",
            estado: "No iniciado",
            fechaInicio: "10/03/2024",
            fechaFin: "10/04/2024",
            fcst: "",
            fechaReal: "",
        },
        {
            codigo: "S-0177",
            identificador: "MAC_COIAdicional5G_53",
            sitio: "010140332_AQ_Consorcio_Horeb",
            prioridad: "Normal",
            estado: "No iniciado",
            fechaInicio: "10/03/2024",
            fechaFin: "10/04/2024",
            fcst: "",
            fechaReal: "",
        },
        {
            codigo: "S-0178",
            identificador: "MAC_COIAdicional5G_54",
            sitio: "010140354_AQ_Altiplano_Arequipa",
            prioridad: "Normal",
            estado: "On Hold",
            fechaInicio: "10/03/2024",
            fechaFin: "10/04/2024",
            fcst: "",
            fechaReal: "",
        },
    ]

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

    const [advancedFilters , setAdvancedFilters] = useState([])

    const filteredData = useMemo(() => {
        const q = filters.search.toLowerCase();

        return sitiosData.filter(project => {
            const matchesText = 
                !q || 
                project.sitio.toLowerCase().includes(q)

            const matchesAdvanced = rowPassesAdvancedFilters(project, advancedFilters)

            return matchesText && matchesAdvanced
        })
    }, [filters, sitiosData, advancedFilters])


    console.log(filteredData)

    const totalResults = filteredData.length
    const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

    return (
        <div className="p-6">
            <section className="space-y-4">

                <div className="rounded-2xl bg-white relative">

                    <div className="relative">

                        <div className="relative min-h-44">

                            <div className="contain-inline-size">

                                {/* Filters, search, selects, pagination */}
                                {/* Toolbar */}
                                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center pb-6 gap-3">
                                    
                                    {/* Filtros avanzados */}
                                

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
                               

                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto border-t-1">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">
                                            <TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                                {columns.map(
                                                    (column) =>
                                                    visibleColumns[column.id] && (
                                                        <TableHead 
                                                            key={column.id} 
                                                            className="whitespace-nowrap">
                                                            {/* If columns.id is "solpe", "import_oc", "import_ac" bg-blue-200 */}
                                                            <button className="flex items-center uppercase text-[#64748B] text-center gap-3 hover:text-foreground transition-colors">                   
                                                                {column.label}
                                                            </button>
                                                        </TableHead>
                                                    ),
                                                )}
                                            </TableRow>
                                            
                                        </TableHeader>
                                        <TableBody>
                                            {sitiosData.map((r) => {
                                                return (
                                                    <TableRow key={r.codigo} className="hover:bg-slate-50">
                                                        <TableCell className="font-medium text-blue-600">
                                                            <Link to="#" className="hover:underline">{r.codigo}</Link>
                                                        </TableCell>
                                                        <TableCell className="text-slate-700">{r.identificador}</TableCell>
                                                        <TableCell className="text-slate-700">{r.sitio}</TableCell>
                                                        <TableCell className="text-slate-700">{getPrioridadIndicator(r.prioridad)}</TableCell>
                                                        <TableCell className="truncate text-slate-700">{getEstadoBadge(r.estado)}</TableCell>
                                        
                                                        <TableCell className="px-4 py-3 text-sm text-gray-700">{r.fechaInicio}</TableCell>
                                                        <TableCell className="px-4 py-3 text-sm text-gray-700">{r.fechaFin}</TableCell>
                                                        <TableCell className="px-4 py-3 text-sm text-gray-700">{r.fcst || "-"}</TableCell>
                                                        <TableCell className="px-4 py-3 text-sm text-gray-700">{r.fechaReal || "-"}</TableCell>
                                    
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                                                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">
                                                                Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                                })}
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

            </section>
        </div>
    )
}

function StatusTab() {
    return (
        <div className="p-6">
            <section className="space-y-4">

                <div className="mb-6 space-y-4">
                    {/* <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">Periodo:</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-500">Semana</Button>
                            <Button variant="default" size="sm" className="bg-blue-100 text-blue-600 hover:bg-blue-200">Mes</Button>
                        </div>
                    </div> */}
                    
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">Actividad:</span>
                        <Select defaultValue="todos">
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="lpi">LPI</SelectItem>
                                <SelectItem value="ing">ING</SelectItem>
                                <SelectItem value="rfi">RFI</SelectItem>
                                <SelectItem value="impl">IMPL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">Acumulativo:</span>
                        <div className="flex gap-2">
                            <Button variant="default" size="sm" className="bg-blue-100 text-blue-600 hover:bg-blue-200">Sí</Button>
                            <Button variant="ghost" size="sm" className="text-gray-500">No</Button>
                        </div>
                    </div> */}
                </div>

            
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Línea Base Chart */}
                    <div className="rounded-lg border bg-white p-6">
                        <h3 className="mb-6 text-lg font-semibold text-blue-600">Línea Base</h3>
                        
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={[
                                    { month: 'Ene.', realAcc: 32, fcstAcc: 40, planAcc: 210 },
                                    { month: 'Feb.', realAcc: 249, fcstAcc: 354, planAcc: 354 },
                                    { month: 'Mar.', realAcc: 665, fcstAcc: 883, planAcc: 803 },
                                    { month: 'Abr.', realAcc: 734, fcstAcc: 1198, planAcc: 544 },
                                    { month: 'May.', realAcc: 1123, fcstAcc: 1474, planAcc: 603 },
                                    { month: 'Jun.', realAcc: 1547, fcstAcc: 1673, planAcc: 1547 },
                                    { month: 'Jul.', realAcc: 1673, fcstAcc: 1740, planAcc: 1673 },
                                    { month: 'Ago.', realAcc: 1741, fcstAcc: 1791, planAcc: 1740 },
                                    { month: 'Sep.', realAcc: 1836, fcstAcc: 1883, planAcc: 1923 },
                                    { month: 'Oct.', realAcc: 1923, fcstAcc: 2006, planAcc: 2053 },
                                    { month: 'Nov.', realAcc: 2053, fcstAcc: 2328, planAcc: 2344 },
                                    { month: 'Dic.', realAcc: 2344, fcstAcc: null, planAcc: null }
                                ]}
                                margin={{ top: 20, right: 10, bottom: 2, left: -20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#fffff" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={{ stroke: "#d7dbe2" }}
                                    tickLine={false}
                                    tick={{ fill: '#4b5563', fontSize: 13 }}
                                    
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#4b5563', fontSize: 13 }}
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px'
                                    }}
                                />
                                <Legend 
                                    // verticalAlign="bottom" 
                                    // height={36}
                                    // iconType="line"
                                    wrapperStyle={{ fontSize: 12 }}
                                />
                                <Bar 
                                    dataKey="realAcc" 
                                    fill="#43E7B4" 
                                    name="Real Acc"
                                    radius={[0, 0, 0, 0]}
                                    barSize={26}
                                >
                                    <LabelList 
                                        dataKey="realAcc" 
                                        position="center" 
                                        fill="#6b7280"
                                        fontSize={11}
                                        fontWeight={100}
                                    />

                                </Bar>
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="fcstAcc" 
                                    stroke="#002EFF" 
                                    strokeWidth={2}
                                    // strokeDasharray="5 5"
                                    name="FCST Acc"
                                    dot={{ fill: '#002EFF', r: 0, strokeWidth: 0 }}
                                >
                                    <LabelList
                                        dataKey="fcstAcc"
                                        position="top"
                                        offset={8}
                                        formatter={(value) => (value ? value : "")}
                                        style={{ fill: "#002EFF", fontSize: 11 }}
                                    />
                                </Line>
                                <Line 
                                    type="monotone" 
                                    dataKey="planAcc" 
                                    stroke="#FF3D00" 
                                    strokeWidth={2}
                                    name="Plan Acc"
                                    dot={{ fill: '#FF3D00', r: 0, strokeWidth: 0 }}
                                >
                                    <LabelList
                                        dataKey="planAcc"
                                        position="top"
                                        offset={8}
                                        formatter={(value) => (value ? value : "")}
                                        style={{ fill: "#FF3D00", fontSize: 11 }}
                                    />
                                </Line>
                            </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Ejecución Presupuestal Chart */}
                    <div className="rounded-lg border bg-white p-6">
                    <h3 className="mb-6 text-lg font-semibold text-blue-600">Ejecución presupuestal</h3>
                    
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* <BarChart
                                data={[
                                    { category: 'SOLPE', hardware: 3.86, servicios: 6.10, total: 9.96 },
                                    { category: 'Comprometido', hardware: 2.42, servicios: 4.21, total: 6.63 },
                                    { category: 'Actas', hardware: 1.21, servicios: 1.23, total: 2.44 },
                                ]}
                                margin={{ top: 40, right: 30, left: 0, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis 
                                    dataKey="category" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#1F2937', fontSize: 13, fontWeight: 500 }}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px'
                                    }}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    iconType="line"
                                />
                                <Bar 
                                    dataKey="hardware" 
                                    stackId="a" 
                                    fill="#FF3D00"
                                    name="Hardware"
                                    radius={[0, 0, 0, 0]}
                                    
                                >
                                    <LabelList 
                                        dataKey="hardware" 
                                        position="inside" 
                                        fill="white"
                                        fontSize={13}
                                        fontWeight={600}
                                    />
                                </Bar>
                                <Bar 
                                    dataKey="servicios" 
                                    stackId="a" 
                                    fill="#002EFF"
                                    name="Servicios"
                                    radius={[0, 0, 0, 0]}
                                >
                                    <LabelList 
                                        dataKey="servicios" 
                                        position="inside" 
                                        fill="white"
                                        fontSize={13}
                                        fontWeight={600}
                                    />
                                    <LabelList
                                        dataKey="total"
                                        position="top"
                                        fill="#1F2937"
                                        fontSize={13}
                                        fontWeight={600}
                                        offset={8}
                                    />
                                </Bar>
                            </BarChart> */}

                            <ComposedChart data={[
                                {
                                    "month": "Ene",
                                    "ac": 0,
                                    "oc": 24.7,
                                    "fcst_2_10": 0,
                                    "details": {
                                        "month": "Ene",
                                        "monthIdx": 1
                                    }
                                },
                                {
                                    "month": "Feb",
                                    "ac": 0.9,
                                    "oc": 25,
                                    "fcst_2_10": 0,
                                    "details": {
                                        "month": "Feb",
                                        "monthIdx": 2
                                    }
                                },
                                {
                                    "month": "Mar",
                                    "ac": 13,
                                    "oc": 27.2,
                                    "fcst_2_10": 0.2,
                                    "details": {
                                        "month": "Mar",
                                        "monthIdx": 3
                                    }
                                },
                                {
                                    "month": "Abr",
                                    "ac": 13,
                                    "oc": 27.2,
                                    "fcst_2_10": 4.5,
                                    "details": {
                                        "month": "Abr",
                                        "monthIdx": 4
                                    }
                                },
                                {
                                    "month": "May",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 7.4,
                                    "details": {
                                        "month": "May",
                                        "monthIdx": 5
                                    }
                                },
                                {
                                    "month": "Jun",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 8,
                                    "details": {
                                        "month": "Jun",
                                        "monthIdx": 6
                                    }
                                },
                                {
                                    "month": "Jul",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 8.9,
                                    "details": {
                                        "month": "Jul",
                                        "monthIdx": 7
                                    }
                                },
                                {
                                    "month": "Ago",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 10,
                                    "details": {
                                        "month": "Ago",
                                        "monthIdx": 8
                                    }
                                },
                                {
                                    "month": "Sep",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 10.9,
                                    "details": {
                                        "month": "Sep",
                                        "monthIdx": 9
                                    }
                                },
                                {
                                    "month": "Oct",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 11.8,
                                    "details": {
                                        "month": "Oct",
                                        "monthIdx": 10
                                    }
                                },
                                {
                                    "month": "Nov",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 13.2,
                                    "details": {
                                        "month": "Nov",
                                        "monthIdx": 11
                                    }
                                },
                                {
                                    "month": "Dic",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 14.4,
                                    "details": {
                                        "month": "Dic",
                                        "monthIdx": 12
                                    }
                                },
                                {
                                    "month": "CF",
                                    "ac": null,
                                    "oc": null,
                                    "fcst_2_10": 14.4,
                                    "details": {
                                        "month": "CF",
                                        "monthIdx": 13
                                    }
                                }
                            ]
                            } margin={{ top: 20, right: 10, bottom: 2, left: -30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#fffff" />
                                <XAxis 
                                    dataKey="month" 
                                    tick={{ fontSize: 12 }} 
                                    axisLine={{ stroke: "#d7dbe2" }}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 })} 
                                    tick={{ fontSize: 12 }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip formatter={(v) => `${v} M`} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
        
                                {/* Barras AC */}
                                <Bar 
                                    dataKey="ac" 
                                    name="Acta (AC)" 
                                    barSize={22} 
                                    fill="#002EFF"
                                >
                                    <LabelList 
                                        dataKey="ac" 
                                        position="center" 
                                        fill="#ffffff" 
                                        className="text-[10px]" 
                                    />
                                </Bar>
        
                                {/* OC */}
                                <Line 
                                    type="monotone" 
                                    dataKey="oc" 
                                    name="Comprometido (OC)" 
                                    stroke="#FF3D00" 
                                    strokeWidth={2} 
                                    dot={{ r: 0 }}
                                >
                                    <LabelList content={<LineBadge />} />
                                </Line>
        
                                {/* FCST */}
                                {/* <Line type="monotone" dataKey="fcst312" name="Plan" stroke="#43E7B4" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 4">
                                    <LabelList content={<LineBadge />} />
                                </Line> */}
        
                                {/* {selectedFcst.map((fcst) => ( */}
                                    <Line 
                                        key={"fcst_2_10"}
                                        type="monotone" 
                                        dataKey={"fcst_2_10"}
                                        name={`FCST 2+10`}
                                        stroke={"#2FCBF1"}
                                        strokeWidth={2} 
                                        dot={{ r: 0 }} 
                                        strokeDasharray="4 4"
                                        // onClick={(d) => openWithRow(d?.payload)}
                                    >
                                        <LabelList content={<LineBadge />} />
                                    </Line>
                                {/* ))} */}
        
                            </ComposedChart>
                            

                        </ResponsiveContainer>
                    </div>
                    </div>
                </div>
            
            </section>
        </div>
    )
}

function AdherenciaTab() {

    const [currentFolder, setCurrentFolder] = useState(null)

    const handleOpenFile = (fileName) => {
        alert(`Abriendo archivo: ${fileName}`)
    }

    const handleDownloadFile = (fileName) => {
        alert(`Descargando archivo: ${fileName}`)
    }

    // Estructura de carpetas para Adherencia Metodológica
    const foldersData = [
        { id: "iniciativa", name: "Iniciativa", type: "folder" },
        { id: "planificacion", name: "Planificación", type: "folder" },
        { id: "ejecucion", name: "Ejecución", type: "folder" },
        { id: "cierre", name: "Cierre", type: "folder" },
    ]

    const filesData = {
        iniciativa: [
            { id: "f1", name: "ID Oracle_5G_2024.msg", size: "50KB", type: "file" },
            { id: "f2", name: "Aprobación de comité de inversiones.pptx", size: "50KB", type: "file" },
            { id: "f3", name: "Acta de inicio del proyecto.docx", size: "35KB", type: "file" },
        ],
        planificacion: [
            { id: "f4", name: "Cronograma_proyecto_v1.xlsx", size: "120KB", type: "file" },
            { id: "f5", name: "Plan de recursos.docx", size: "85KB", type: "file" },
            { id: "f6", name: "Presupuesto_detallado.xlsx", size: "95KB", type: "file" },
        ],
        ejecucion: [
            { id: "f7", name: "Reporte_avance_semana_1.pdf", size: "200KB", type: "file" },
            { id: "f8", name: "Acta_reunion_seguimiento.docx", size: "45KB", type: "file" },
            { id: "f9", name: "Control_cambios_v2.xlsx", size: "78KB", type: "file" },
        ],
        cierre: [
            { id: "f10", name: "Acta_cierre_proyecto.pdf", size: "150KB", type: "file" },
            { id: "f11", name: "Lecciones_aprendidas.docx", size: "62KB", type: "file" },
        ],
    }

    return (
        <div className="p-6">
            <section className="space-y-4">

                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-sm">
                    <button 
                        onClick={() => setCurrentFolder(null)}
                        className={`${currentFolder ? 'text-gray-600 hover:text-blue-600' : 'text-gray-900 font-medium'}`}
                    >
                        Inicio
                    </button>
                    {currentFolder && (
                    <>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 capitalize">{currentFolder}</span>
                    </>
                    )}
                </div>

                {/* Folder/File List */}
                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">NOMBRE</th>
                            {currentFolder && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">TAMAÑO</th>
                            )}
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!currentFolder ? (
                        // Show folders
                        foldersData.map((folder) => (
                            <tr key={folder.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setCurrentFolder(folder.id)}
                                        className="flex items-center gap-3 text-left"
                                    >
                                        <Folder className="h-5 w-5 text-blue-500" />
                                        <span className="text-sm text-gray-700">{folder.name}</span>
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setCurrentFolder(folder.id)}>
                                                Abrir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))
                        ) : (
                        // Show files in selected folder
                        filesData[currentFolder]?.map((file) => (
                            <tr key={file.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <span className="text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => handleOpenFile(file.name)}>
                                    {file.name}
                                </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{file.size}</td>
                            <td className="px-4 py-3 text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenFile(file.name)}>
                                    Abrir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadFile(file.name)}>
                                    Descargar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                    </table>
                </div>
            
            </section>
        </div>
    )
}

function SncTab() {
    const columns = [
        { id: "id", label: "ID", visible: true },
        { id: "proveedor", label: "Proveedor", visible: true },
        { id: "coordinador", label: "Coordinador", visible: true },
        { id: "sitio", label: "Sitio Asociado", visible: true },
        { id: "rq", label: "RQ", visible: true },
        { id: "oc", label: "OC", visible: true },
        { id: "penality", label: "Total Penalidad", visible: true },
        { id: "state", label: "Estado", visible: true },
        { id: "date", label: "Fecha", visible: true },
        // { id: "fechareal", label: "F. Real", visible: true },
    ]

    const toolbarConfig = {
        filters: { visible: true },
        search: { placeholder: "Buscar por código o nombre" },
        selects: [],
        visibleKeys: ["search"]
    };

    const sitiosData = [
        {
            id: "2026194",
            proveedor: "F1 SERVICES",
            coordinador: "Everaldo Ccopa",
            sitio: "010140337_AQ_Yumina",
            rq: "RQ354921",
            oc: "54231",
            penalty: 182.90,
            state: "PENDIENTE DE ATENCIÓN",
            date: "23/04/2026"
        },
        {
            id: "2026195",
            proveedor: "GRUPO TRICONM SAC",            
            coordinador: "Miguel De Los Santos",
            sitio: "010160176_CA_Montegrande",
            rq: "RQ354932",
            oc: "54251",
            penalty: 1489.29,
            state: "PENDIENTE DE ATENCIÓN",
            date: "25/04/2026"
        },
        {
            id: "2026196",
            proveedor: "GRUPO TRICONM SAC",            
            coordinador: "Melina Rojas",
            sitio: "010140341_AQ_Pampas_Camana",
            rq: "RQ354421",
            oc: "54281",
            penalty: 1489.29,
            state: "PENDIENTE DE ATENCIÓN",
            date: "01/05/2026"
        }
    ]

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

    const [advancedFilters , setAdvancedFilters] = useState([])

    const filteredData = useMemo(() => {
        const q = filters.search.toLowerCase();

        return sitiosData.filter(project => {
            const matchesText = 
                !q || 
                project.sitio.toLowerCase().includes(q)

            const matchesAdvanced = rowPassesAdvancedFilters(project, advancedFilters)

            return matchesText && matchesAdvanced
        })
    }, [filters, sitiosData, advancedFilters])


    console.log(filteredData)

    const totalResults = filteredData.length
    const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

    return (
        <div className="p-6">
            <section className="space-y-4">

                <div className="rounded-2xl bg-white relative">

                    <div className="relative">

                        <div className="relative min-h-44">

                            <div className="contain-inline-size">

                                {/* Filters, search, selects, pagination */}
                                {/* Toolbar */}
                                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center pb-6 gap-3">
                                    
                                    {/* Filtros avanzados */}
                                

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
                               

                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto border-t-1">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">
                                            <TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                                {columns.map(
                                                    (column) =>
                                                    visibleColumns[column.id] && (
                                                        <TableHead 
                                                            key={column.id} 
                                                            className="whitespace-nowrap">
                                                            {/* If columns.id is "solpe", "import_oc", "import_ac" bg-blue-200 */}
                                                            <button className="flex items-center uppercase text-[#64748B] text-center gap-3 hover:text-foreground transition-colors">                   
                                                                {column.label}
                                                            </button>
                                                        </TableHead>
                                                    ),
                                                )}
                                            </TableRow>
                                            
                                        </TableHeader>
                                        <TableBody>
                                            {sitiosData.map((r) => {
                                                return (
                                                    <TableRow key={r.id} className="hover:bg-slate-50">
                                                        <TableCell className="font-medium text-blue-600">
                                                            <Link to="#" className="hover:underline">{r.id}</Link>
                                                        </TableCell>
                                                        <TableCell className="text-slate-700">{r.proveedor}</TableCell>
                                                        <TableCell className="text-slate-700">{r.coordinador}</TableCell>
                                                        <TableCell className="text-slate-700">{r.sitio}</TableCell>
                                                        <TableCell className="text-slate-700">{r.rq}</TableCell>
                                                        <TableCell className="text-slate-700">{r.oc}</TableCell>
                                                        <TableCell className="text-slate-700">{r.penalty}</TableCell>
                                                        <TableCell className="truncate text-slate-700">{getSncStateBadge(r.state)}</TableCell>  
                                                        <TableCell className="px-4 py-3 text-sm text-gray-700">{r.date}</TableCell>
                                                                  
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                                                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">
                                                                Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                                })}
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

            </section>
        </div>
    )
}


export default function DetailProjects() {

    const { id } = useParams()

    console.log("ID", id)

    const { projectById, loading } = useProjects(id)
    const [activeSection, setActiveSection] = useState("informacion")
    // const project = demoData.find((project) => project.codigo === id)
    // console.log(project)
    console.log("BY ID", projectById)
    const project = projectById?.[0]

    if (!projectById) {
        return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Proyecto no encontrado</h1>
                <Link to="/projects/history" className="mt-4 inline-block text-blue-600 hover:underline">
                    Volver a la lista
                </Link>
            </div>
        </div>
        )
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/projects/history" 
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold"><Link to="/projects/history" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">Historial Proyectos</Link><span className="text-gray-400"> / </span><span className="text-[#2b7fff]">{id}</span> </h2>
                    </div>
                </div>

                {/* Main */}
                <div>
                    <div className="relative">

                        <div className="bg-white relative rounded-lg p-6 mb-6">
                             <div className="mx-auto flex max-w-7xl items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-[#cce5ff] rounded-full p-2">
                                                <NotebookTabs className="w-5 h-5 text-[#3b82f6]" />
                                            </div>
                                            <h1 className="text-lg font-medium text-gray-400">{project?.project_name}</h1>
                                        </div>
                                    </div>
                                </div>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            Acción
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={handleEditar} className="cursor-pointer">
                                            Habilitar campos para editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleGuardar} className="cursor-pointer">
                                            Guardar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>


                        <div className="rounded-2xl bg-white relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size flex">

                                        <div className="w-56 border-r rounded-bl-lg rounded-tl-lg bg-gray-50 p-4">
                                            <nav className="space-y-1">
                                                {sidebarItems.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setActiveSection(item.id)}
                                                        className={`w-full rounded px-3 py-2 cursor-pointer text-left text-sm ${
                                                        activeSection === item.id ? "bg-blue-50 font-medium text-[#3b82f6]" : "text-gray-400 hover:bg-gray-100"
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </nav>
                                        </div>

                                        {/* Tabs */}
                                        <div className="w-full">                                            
                                            {
                                            activeSection === "informacion" && (
                                                <InformationTab project={project} id={id} />
                                            )}
                                            {
                                            activeSection === "sitios" && (
                                                <SitiosTab />
                                            )
                                            }
                                            {
                                            activeSection === "status" && (
                                                <StatusTab />
                                            )
                                            }
                                            {
                                            activeSection === "adherencia" && (
                                                <AdherenciaTab />
                                            )
                                            }
                                            {
                                            activeSection === "servicio" && (
                                                <SncTab />
                                            )   
                                            }
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