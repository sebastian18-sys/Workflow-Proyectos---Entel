import { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LabelList,
    ComposedChart,
    Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, BriefcaseBusiness, Wallet, UserRound, Search, ChevronsUpDown, Check, ChevronRight, ChevronDown, Users, Briefcase } from "lucide-react";
import { useRQProvider } from "@/hooks/budget/capex/useRQProvider";
import { toNumber, unique } from "@/lib/helpers";
import MultiSelectFilter from "../ui/_multiselect3";
import SelectFilter from "../ui/_select3";

const BLUE = "#123DFF";
const BLUE_DARK = "#1C2AA0";
const RED = "#F21818";
const AMBER = "#F59E0B";
const GREEN = "#16A34A";
const GRID = "#D9DDE7";
const BG = "#F5F7FB";

const money = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("es-PE");

// function toNumber(value) {
//     const n = Number(value ?? 0);
//     if (!Number.isFinite(n)) return 0;
//     // corrige residuos de coma flotante como -1.364e-12
//     return Math.abs(n) < 0.000001 ? 0 : n;
// }

function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function formatMM(value) {
    return `S/ ${round(value / 1_000_000, 1)} mill.`;
}

function formatCompact(value) {
    if (Math.abs(value) >= 1_000_000) {
        return `S/ ${round(value / 1_000_000, 1)} mill.`;
    }
    if (Math.abs(value) >= 1_000) {
        return `S/ ${round(value / 1_000, 1)} mil`;
    }
    return money.format(value);
}

function pct(value) {
    return `${round(value, 2).toFixed(2)}%`;
}

function normalizeRow(row) {
    return {
        ...row,
        importe_oc: toNumber(row.importe_oc),
        proveedor: row.proveedor || "Sin proveedor",
        nombre_proyecto: row.nombre_proyecto || "Sin proyecto",
        requisitor: row.requisitor || "Sin requisitor",
        jefatura_final: row.jefatura_final || "Sin jefatura",
    };
}

function groupSum(rows, key) {
    const map = new Map();

    for (const item of rows) {
        const label = item[key] || "Sin dato";
        const current = map.get(label) || 0;
        map.set(label, current + toNumber(item.importe_oc));
    }

    return [...map.entries()].map(([name, value]) => ({
        name,
        value,
    }));
}

function getColorByPercent(percent) {
    if (percent <= 30) return GREEN;
    if (percent <= 39) return AMBER;
    return RED;
}

function DashboardTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload ?? {};

    return (
        <div className="rounded-2xl border bg-white p-3 shadow-xl min-w-[220px]">
        <p className="mb-2 text-sm font-semibold text-slate-900">{label || data.name}</p>
        {typeof data.value === "number" && (
            <p className="text-sm text-slate-700">Comprometido: <span className="font-semibold">{money.format(data.value)}</span></p>
        )}
        {typeof data.valueMM === "number" && (
            <p className="text-sm text-slate-700">En MM: <span className="font-semibold">S/ {data.valueMM.toFixed(2)}</span></p>
        )}
        {typeof data.percent === "number" && (
            <p className="text-sm text-slate-700">% comprometido: <span className="font-semibold">{pct(data.percent)}</span></p>
        )}
        {typeof data.records === "number" && (
            <p className="text-sm text-slate-700">Registros: <span className="font-semibold">{integer.format(data.records)}</span></p>
        )}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div className="bg-[#123DFF] px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white md:text-xl rounded-t-2xl">
        {children}
        </div>
    );
}

const isAll = (value) =>
    value === "Todos" ||
    value == null ||
    (Array.isArray(value) && value.length === 0);

const matchesFilter = (selected, currentValue) => {
    if (isAll(selected)) return true;
    if (Array.isArray(selected)) return selected.includes(currentValue);
    return selected === currentValue;
};

/** ===== Filtros anidados ===== */
function useFilters(data) {
    // const [jefatura, setJefatura] = useState([]);
    const [unidadFuncional, setUnidadFuncional] = useState([]);
    const [ano, setAno] = useState("2026");
    const [proveedor, setProveedor] = useState([]);
    const [codProyecto, setCodProyecto] = useState([]);
    const [proyecto, setProyecto] = useState([]);
    const [requisitor, setRequisitor] = useState([]);
    const [categoria, setCategoria] = useState(["Servicios"]);

    // Helper: Apply filters
    const apply = (omit) => (d) => {
        // const byJef = omit === "jefatura" || jefatura === "Todos" || d.jefatura_final === jefatura;
        // const byJef = omit === "jefatura" || matchesFilter(jefatura, d.jefatura_final);
        const byUFuncional = omit === "unidadFuncional" || matchesFilter(unidadFuncional, d.unidad_funcional);
        const byAno = omit === "ano" || ano === "Todos" || (ano === "CARRYOVER" ? d.tipo === "CARRYOVER" : d.tipo === "Proy.");
        // const byProv = omit === "proveedor" || proveedor === "Todos" || d.proveedor === proveedor;
        const byProv = omit === "proveedor" || matchesFilter(proveedor, d.proveedor);
        // const byCodProy = omit === "codigo" || codProyecto === "Todos" || d.project_code === codProyecto;
        const byCodProy = omit === "codigo" || matchesFilter(codProyecto, d.codigo_proyecto);
        // const byProy = omit === "proyecto" || proyecto === "Todos" || d.project_name === proyecto;
        const byProy = omit === "proyecto" || matchesFilter(proyecto, d.nombre_proyecto);
        // const byReq = omit === "requisitor" || requisitor === "Todos" || (d.requisitor ?? "") === requisitor;
        const byReq = omit === "requisitor" || matchesFilter(requisitor, d.requisitor);
        // const byCat = omit === "categoria" || categoria === "Todos" || (d.categoria ?? "") === categoria;
        const byCat = omit === "categoria" || matchesFilter(categoria, d.categoria);
        return byUFuncional && byAno && byProv && byCodProy && byProy && byReq && byCat;
    };

    const options = {
        unidadFuncionales: useMemo(() => unique(data.filter(apply("unidadFuncional")).map(d => d.unidad_funcional)), [data, ano, proveedor, codProyecto, proyecto, requisitor]),
        // jefaturas: useMemo(() => unique(data.filter(apply("jefatura")).map(d => d.jefatura_final)), [data, ano, proveedor, codProyecto, proyecto, requisitor]),
        anos: ["Todos", "CARRYOVER", "2026"],
        proveedores: useMemo(() => unique(data.filter(apply("proveedor")).map(d => d.proveedor)), [data, unidadFuncional, ano, codProyecto, proyecto, requisitor]),
        codigo: useMemo(() => unique(data.filter(apply("codigo")).map(d => d.codigo_proyecto)), [data, unidadFuncional, ano, proveedor, proyecto, requisitor]),
        proyectos: useMemo(() => unique(data.filter(apply("proyecto")).map(d => d.nombre_proyecto)), [data, unidadFuncional, ano, proveedor, codProyecto, requisitor]),
        requisitores: useMemo(() => unique(data.filter(apply("requisitor")).map(d => d.requisitor)), [data, unidadFuncional, ano, proveedor, codProyecto, proyecto]),
        categorias: useMemo(() => unique(data.filter(apply("categoria")).map(d => d.categoria)), [data, unidadFuncional, ano, proveedor, codProyecto, proyecto, requisitor]),
    };

    const filtered = useMemo(() => data.filter(apply("")), [data, unidadFuncional, ano, proveedor, codProyecto, proyecto, requisitor, categoria]);

    return { 
        options, 
        filtered,
        // jefatura, setJefatura,
        unidadFuncional, setUnidadFuncional,
        ano, setAno,
        proveedor, setProveedor,
        codProyecto, setCodProyecto,
        proyecto, setProyecto,
        requisitor, setRequisitor,
        categoria, setCategoria
    };
}

export default function DashboardAssign() {
    
    const [jefaturaFilter, setJefaturaFilter] = useState("all");
    const [searchProvider, setSearchProvider] = useState("");
    const [expandedJefaturas, setExpandedJefaturas] = useState({});

    // const dat
    const data = useRQProvider()
    const flt = useFilters(data);

    const rows = useMemo(() => flt.filtered.map(normalizeRow), [flt.filtered]);

    const totalCommitted = useMemo(
        () => rows.reduce((acc, item) => acc + toNumber(item.importe_oc), 0),
        [rows]
    );

    const providerAgg = useMemo(() => {
        return groupSum(rows, "proveedor")
        .map((item) => ({
            ...item,
            valueMM: round(item.value / 1_000_000, 2),
            percent: totalCommitted > 0 ? (item.value / totalCommitted) * 100 : 0,
            records: rows.filter((r) => r.proveedor === item.name).length,
        }))
        .sort((a, b) => b.value - a.value);
    }, [rows, totalCommitted]);

    const projectAgg = useMemo(() => {
        return groupSum(rows, "nombre_proyecto")
        .map((item) => ({
            ...item,
            valueMM: round(item.value / 1_000_000, 2),
            records: rows.filter((r) => r.nombre_proyecto === item.name).length,
        }))
        .sort((a, b) => b.value - a.value);
    }, [rows]);

    const requisitorAgg = useMemo(() => {
        return groupSum(rows, "requisitor")
        .map((item) => ({
            ...item,
            valueMM: round(item.value / 1_000_000, 2),
            percent: totalCommitted > 0 ? (item.value / totalCommitted) * 100 : 0,
            records: rows.filter((r) => r.requisitor === item.name).length,
        }))
        .sort((a, b) => b.value - a.value);
    }, [rows, totalCommitted]);

    const topProviders = useMemo(() => providerAgg.slice(0, 15), [providerAgg]);
    const topProjects = useMemo(() => projectAgg.slice(0, 15), [projectAgg]);
    const topRequisitors = useMemo(() => requisitorAgg.slice(0, 15), [requisitorAgg]);

    const jefaturas = useMemo(() => {
        return [...new Set(rows.map((r) => r.jefatura_final).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }, [rows]);


    const groupedJefaturaData = useMemo(() => {
        const jefaturaMap = new Map();

        for (const item of rows) {
            if (jefaturaFilter !== "all" && item.nombre_proyecto !== jefaturaFilter) continue;
            if (
                searchProvider.trim() &&
                !item.proveedor.toLowerCase().includes(searchProvider.trim().toLowerCase())
            ) {
                continue;
            }

            const jefaturaKey = item.nombre_proyecto;
            const proveedorKey = item.proveedor;

            if (!jefaturaMap.has(jefaturaKey)) {
                jefaturaMap.set(jefaturaKey, {
                    jefatura: jefaturaKey,
                    total: 0,
                    providersMap: new Map()
                });
            }

            const group = jefaturaMap.get(jefaturaKey);
            group.total += toNumber(item.importe_oc);

            if (!group.providersMap.has(proveedorKey)) {
                group.providersMap.set(proveedorKey, {
                    proveedor: proveedorKey,
                    value: 0,
                });
            }

            const provider = group.providersMap.get(proveedorKey);
            provider.value += toNumber(item.importe_oc);
        }

        const groups = [...jefaturaMap.values()]
            .map((group) => ({
                jefatura: group.jefatura,
                total: group.total,
                providers: [...group.providersMap.values()].sort((a, b) => b.value - a.value),
            }))
            .sort((a, b) => b.total - a.total);

        const total = groups.reduce((acc, item) => acc + item.total, 0);

        return groups.map((group) => {
        const groupPercent = total > 0 ? (group.total / total) * 100 : 0;

        return {
            ...group,
            percent: groupPercent,
            color: getColorByPercent(groupPercent),
            providers: group.providers.map((provider) => {
                const providerPercent = group.total > 0 ? (provider.value / group.total) * 100 : 0;
                return {
                    ...provider,
                    percent: providerPercent,
                    color: getColorByPercent(providerPercent),
                };
            }),
        };
        });
    }, [rows, jefaturaFilter, searchProvider]);

    const providerRowsCount = useMemo(
        () => groupedJefaturaData.reduce((acc, group) => acc + group.providers.length, 0),
        [groupedJefaturaData]
    );

    const toggleJefatura = (jefatura) => {
        setExpandedJefaturas((prev) => ({
        ...prev,
        [jefatura]: !prev[jefatura],
        }));
    };

    const summary = useMemo(() => {
        return {
            projects: projectAgg.length,
            providers: providerAgg.length,
            committed: totalCommitted,
            requisitors: requisitorAgg.length,
        };
    }, [projectAgg.length, providerAgg.length, requisitorAgg.length, totalCommitted]);

    const tableTotal = useMemo(
        () => groupedJefaturaData.reduce((acc, item) => acc + item.total, 0),
        [groupedJefaturaData]
    );

    return (
        // <div className="min-h-screen w-full bg-slate-100 p-4 md:p-6">
        <div className="grid grid-cols-12 gap-4">

            {/* Filters */}
            <div className="col-span-12 lg:col-span-12 space-y-3">
                <Card className="shadow-sm overflow-hidden p-0">
                    <CardHeader className="bg-blue-500 py-3 gap-0">
                        <CardTitle className="text-base text-white tracking-wide">Filtros Avanzados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 grid gap-4 pb-3 grid-cols-4">
                        {/* Jefatura */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Jefatura</div> */}
                            {/* <Select value={flt.jefatura} onValueChange={flt.setJefatura}>
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Jefatura" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {flt.options.jefaturas.map((g) => (
                                        <SelectItem key={g} value={g}><span className="block truncate">{g}</span></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            {/* <MultiSelectFilter
                                label="Jefatura"
                                icon={Users}
                                options={flt.options.jefaturas}
                                selected={flt.jefatura}
                                onChange={flt.setJefatura}
                                placeholder="Seleccionar"
                            /> */}
                            <div>
                                <MultiSelectFilter
                                    label="Unidad Funcional"
                                    icon={Briefcase}
                                    options={flt.options.unidadFuncionales}
                                    selected={flt.unidadFuncional}
                                    onChange={flt.setUnidadFuncional}
                                    placeholder="Seleccionar"
                                />
                            </div>
                        </div>
                        {/* Año */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Año</div>
                            <Select value={flt.ano} onValueChange={flt.setAno}>
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {flt.options.anos.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            <SelectFilter
                                label="Año"
                                icon={Building2}
                                options={flt.options.anos}
                                value={flt.ano}
                                onChange={flt.setAno}
                                placeholder="Seleccionar"
                            />
                        </div>
                         {/* Proveedor */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Proveedor</div>
                            <Select value={flt.proveedor} onValueChange={flt.setProveedor}>
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {flt.options.proveedores.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            <MultiSelectFilter
                                label="Proveedor"
                                icon={Building2}
                                options={flt.options.proveedores}
                                selected={flt.proveedor}
                                onChange={flt.setProveedor}
                                placeholder="Seleccionar"
                            />
                        </div>
                        {/* Codigo */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Código Proyecto</div>
                            <CodProyectoMultiSelect flt={flt} /> */}
                            <MultiSelectFilter
                                label="Código Proyecto"
                                icon={Building2}
                                options={flt.options.codigo}
                                selected={flt.codProyecto}
                                onChange={flt.setCodProyecto}
                                placeholder="Seleccionar"
                            />
                        </div>
                        {/* Proyecto */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Proyecto</div>
                            <ProyectoMultiSelect flt={flt} /> */}
                            <MultiSelectFilter
                                label="Proyecto"
                                icon={Building2}
                                options={flt.options.proyectos}
                                selected={flt.proyecto}
                                onChange={flt.setProyecto}
                                placeholder="Seleccionar"
                            />
                        </div>
                        {/* Requisitor */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Requisitor</div>
                            <Select value={flt.requisitor} onValueChange={flt.setRequisitor}>
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Requisitor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {flt.options.requisitores.map((c) => (
                                        <SelectItem key={c} value={c}><span className="block truncate">{c}</span></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            <MultiSelectFilter
                                label="Requisitor"
                                icon={Building2}
                                options={flt.options.requisitores}
                                selected={flt.requisitor}
                                onChange={flt.setRequisitor}
                                placeholder="Seleccionar"
                            />
                        </div>
                        {/* Requisitor */}
                        <div>
                            {/* <div className="mb-1 text-xs font-medium">Categoria</div>
                            <Select value={flt.categoria} onValueChange={flt.setCategoria}>
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Requisitor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {flt.options.categorias.map((c) => (
                                        <SelectItem key={c} value={c}><span className="block truncate">{c}</span></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            <MultiSelectFilter
                                label="Categoria"
                                icon={Building2}
                                options={flt.options.categorias}
                                selected={flt.categoria}
                                onChange={flt.setCategoria}
                                placeholder="Seleccionar"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* HEADERS */}
            <div className="col-span-12 lg:col-span-12 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                    <Card className="rounded-3xl border shadow-sm">
                        <CardHeader className="">
                            <CardTitle className="text-center text-xl font-extrabold uppercase text-[#FF4D00]">
                                Proyectos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center text-3xl font-semibold text-slate-800">
                                {integer.format(summary.projects)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border shadow-sm">
                        <CardHeader className="">
                            <CardTitle className="text-center text-xl font-extrabold uppercase text-[#FF4D00]">
                                Contratas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center text-3xl font-semibold text-slate-800">
                                {integer.format(summary.providers)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border shadow-sm">
                        <CardHeader className="">
                            <CardTitle className="text-center text-xl font-extrabold uppercase text-[#FF4D00]">
                                Comprometido (PEN)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center text-3xl font-semibold text-slate-800">
                                {formatMM(summary.committed)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="col-span-12 lg:col-span-12 space-y-4">

                <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm p-0">
                    <CardHeader className="bg-blue-500 py-3 gap-0">
                        <CardTitle className="text-base text-white tracking-wide">Comprometido por Contrata - TOP 15</CardTitle>
                    </CardHeader>
                    {/* <SectionTitle>Comprometido por contrata - Proyectos 2025 - Top 15</SectionTitle> */}
                    <CardContent className="p-1 md:p-2">
                        {/* xl:grid-cols-[minmax(0,1.8fr)_420px] */}
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-1">
                            {/* <div className="h-[390px] rounded-3xl border bg-white p-3 shadow-sm"></div> */}
                            <div className="h-[390px] p-3 ">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={topProviders} margin={{ top: 28, right: 24, left: 4, bottom: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#475569" }}
                                            angle={-22}
                                            textAnchor="end"
                                            height={80}
                                            interval={0}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            tickFormatter={(v) => `${round(v / 1_000_000, 1)}`}
                                            tick={{ fontSize: 12, fill: "#475569" }}
                                            width={74}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tickFormatter={(v) => `${round(v, 0)}%`}
                                            tick={{ fontSize: 12, fill: "#475569" }}
                                            width={50}
                                        />
                                        <Tooltip content={<DashboardTooltip />} />
                                        <Bar yAxisId="left" dataKey="value" radius={[0, 0, 0, 0]} fill={BLUE} maxBarSize={44}>
                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            formatter={(value) => formatMM(value)}
                                            style={{ fill: "#5B6472", fontSize: 12, fontWeight: 500 }}
                                        />
                                        </Bar>
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="percent"
                                            stroke={BLUE_DARK}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: BLUE_DARK }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="col-span-12 lg:col-span-4 space-y-4">

                <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm p-0">
                    {/* <SectionTitle>Comprometido por proyecto - Top 15 - 2025</SectionTitle> */}
                    <CardHeader className="bg-blue-500 py-3 gap-0">
                        <CardTitle className="text-base text-white tracking-wide">Comprometido por Proyecto - TOP 15</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 md:p-2">
                        <div className="h-[560px] p-3">
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topProjects}
                                layout="vertical"
                                margin={{ top: 10, right: 40, left: 0, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                                <XAxis
                                    type="number"
                                    tickFormatter={(v) => `S/ ${round(v / 1_000_000, 1)}`}
                                    tick={{ fontSize: 12, fill: "#475569" }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={140}
                                    tick={{ fontSize: 12, fill: "#475569" }}
                                />
                                <Tooltip content={<DashboardTooltip />} />
                                <Bar dataKey="value" fill={BLUE} radius={[0, 0, 0, 0]}>
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    formatter={(value) => formatMM(value)}
                                    style={{ fill: "#5B6472", fontSize: 12, fontWeight: 500 }}
                                />
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="col-span-12 lg:col-span-8 space-y-4">

                <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm p-0">
 
                    <CardHeader className="bg-blue-500 py-3 gap-0">
                        <CardTitle className="text-base text-white tracking-wide">Comprometido por Jefatura</CardTitle>
                    </CardHeader>

                    <CardContent className="p-1 md:p-2">
                        <div className="h-[560px] px-3">
                            <div className="grid grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.4fr)_180px_150px] border-b bg-slate-100 text-sm font-bold text-slate-700">
                                <div className="px-4 py-3">Jefatura</div>
                                <div className="px-4 py-3">Proveedor</div>
                                <div className="px-4 py-3 text-right">Comprometido</div>
                                <div className="px-4 py-3 text-right">% Comprometido</div>
                            </div>

                            <ScrollArea className="h-[430px]">
                                <div className="divide-y">
                                    {/* {groupedByJefaturaProvider.map((row, idx) => (
                                    <div
                                        key={`${row.jefatura}-${row.proveedor}-${idx}`}
                                        className="grid grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.4fr)_180px_150px] items-center text-sm"
                                    >
                                        <div className="px-4 py-3 font-medium text-slate-700">{row.jefatura}</div>
                                        <div className="px-4 py-3 text-slate-600">{row.proveedor}</div>
                                        <div className="px-4 py-3 text-right font-medium text-slate-800">{money.format(row.value)}</div>
                                        <div className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${Math.min(row.percent, 100)}%`, backgroundColor: row.color }}
                                            />
                                            </div>
                                            <span className="min-w-[72px] text-right font-semibold" style={{ color: row.color }}>
                                            {pct(row.percent)}
                                            </span>
                                        </div>
                                        </div>
                                    </div>
                                    ))} */}

                                    {/* {groupedByJefaturaProvider.length === 0 && (
                                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                                        No hay resultados para los filtros aplicados.
                                    </div>
                                    )} */}

                                    {groupedJefaturaData.map((group, idx) => {
                                        const isOpen = !!expandedJefaturas[group.jefatura];

                                        return (
                                            <div key={`${group.jefatura}-${idx}`} className="border-b last:border-b-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleJefatura(group.jefatura)}
                                                className="grid w-full grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.4fr)_180px_150px] items-center bg-slate-50 text-left text-sm transition-colors hover:bg-slate-100"
                                            >
                                                <div className="flex items-center gap-2 px-4 py-3 font-semibold text-slate-800">
                                                    {isOpen ? (
                                                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                                                    )}
                                                    <span>{group.jefatura}</span>
                                                </div>
                                                <div className="px-4 py-3 text-slate-500">
                                                    {group.providers.length} proveedor{group.providers.length === 1 ? "" : "es"}
                                                </div>
                                                <div className="px-4 py-3 text-right font-semibold text-slate-800">{money.format(group.total)}</div>
                                                    <div className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-200">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{ width: `${Math.min(group.percent, 100)}%`, backgroundColor: group.color }}
                                                            />
                                                        </div>
                                                        <span className="min-w-[72px] text-right font-semibold" style={{ color: group.color }}>
                                                            {pct(group.percent)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="divide-y bg-white">
                                                {group.providers.map((provider, providerIdx) => (
                                                    <div
                                                    key={`${group.jefatura}-${provider.proveedor}-${providerIdx}`}
                                                    className="grid grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.4fr)_180px_150px] items-center text-sm"
                                                    >
                                                    <div className="px-4 py-3 text-slate-400">&nbsp;</div>
                                                    <div className="px-4 py-3 text-slate-600">{provider.proveedor}</div>
                                                    <div className="px-4 py-3 text-right font-medium text-slate-800">{money.format(provider.value)}</div>
                                                    <div className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-3">
                                                        <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                            className="h-full rounded-full"
                                                            style={{ width: `${Math.min(provider.percent, 100)}%`, backgroundColor: provider.color }}
                                                            />
                                                        </div>
                                                        <span className="min-w-[72px] text-right font-semibold" style={{ color: provider.color }}>
                                                            {pct(provider.percent)}
                                                        </span>
                                                        </div>
                                                    </div>
                                                    </div>
                                                ))}
                                                </div>
                                            )}
                                            </div>
                                        );
                                    })}

                                    {groupedJefaturaData.length === 0 && (
                                        <div className="px-4 py-10 text-center text-sm text-slate-500">
                                            No hay resultados para los filtros aplicados.
                                        </div>
                                    )}
                                    

                                </div>
                            </ScrollArea>

                            <div className="grid grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.4fr)_180px_150px] border-t bg-slate-100 text-sm font-bold text-slate-700">
                                <div className="px-4 py-3">Total</div>
                                <div className="px-4 py-3">&nbsp;</div>
                                <div className="px-4 py-3 text-right">{money.format(tableTotal)}</div>
                                <div className="px-4 py-3 text-right">100.00%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="col-span-12 lg:col-span-9 space-y-4">

                <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm p-0">
                    {/* <SectionTitle>Comprometido por requisitor - Top 15</SectionTitle> */}
                    <CardHeader className="bg-blue-500 py-3 gap-0">
                        <CardTitle className="text-base text-white tracking-wide">Comprometido por Requisitor - TOP 15 </CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 md:p-2">
                        {/* <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_300px]"> */}
                            <div className="h-[420px] p-3">
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topRequisitors} margin={{ top: 20, right: 18, left: 8, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                                    <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: "#475569" }}
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
                                    height={90}
                                    />
                                    <YAxis
                                    tickFormatter={(v) => `S/ ${round(v / 1_000_000, 1)}`}
                                    tick={{ fontSize: 12, fill: "#475569" }}
                                    width={70}
                                    />
                                    <Tooltip content={<DashboardTooltip />} />
                                    <Bar dataKey="value" fill={RED} radius={[0, 0, 0, 0]} maxBarSize={48}>
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        formatter={(value) => formatMM(value)}
                                        style={{ fill: "#5B6472", fontSize: 12, fontWeight: 500 }}
                                    />
                                    </Bar>
                                </BarChart>
                                </ResponsiveContainer>
                            </div>

                           
                        {/* </div> */}
                    </CardContent>
                </Card>              
            </div>

            <div className="col-span-12 lg:col-span-3 space-y-4">

                <div className="grid grid-cols-1 gap-4">
                    <Card className="rounded-3xl border shadow-sm">
                        <CardHeader className="">
                            <CardTitle className="text-center text-xl font-extrabold uppercase text-[#FF4D00]">
                                Requisitores
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-2xl border bg-slate-50 px-4 py-5 text-center text-3xl font-semibold text-slate-800">
                                {integer.format(summary.requisitors)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-3xl border shadow-sm">
                    <CardContent className="grid gap-4 px-4">
                        <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-4">
                            <div className="rounded-2xl bg-blue-50 p-3 text-[#123DFF]">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Proveedor líder</p>
                                <p className="font-semibold text-slate-800">{topProviders[0]?.name || "-"}</p>
                                <p className="text-sm text-slate-500">{topProviders[0] ? formatCompact(topProviders[0].value) : "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-4">
                            <div className="rounded-2xl bg-orange-50 p-3 text-[#FF4D00]">
                                <BriefcaseBusiness className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Proyecto líder</p>
                                <p className="font-semibold text-slate-800">{topProjects[0]?.name || "-"}</p>
                                <p className="text-sm text-slate-500">{topProjects[0] ? formatCompact(topProjects[0].value) : "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-4">
                            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Top requisitor</p>
                                <p className="font-semibold text-slate-800">{topRequisitors[0]?.name || "-"}</p>
                                <p className="text-sm text-slate-500">{topRequisitors[0] ? formatCompact(topRequisitors[0].value) : "-"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}