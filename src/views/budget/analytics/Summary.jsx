import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsCapex } from "@/hooks/budget/capex/useProjectsCapex";
import { useSummaryKey } from "@/hooks/budget/capex/useSummaryKey";
import { fmt1, fmtMoney, formatCurrency, toMM } from "@/lib/helpers";
import { ArrowDownRight, ArrowLeft, ArrowRightLeft, Banknote, Briefcase, Building2, DollarSign, FileCheck, Hash, Landmark, RotateCcw, Search, ShieldCheck, User, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

// Columns in header
const columns = [
	// { id: "tipo", label: "Tipo", visible: true },
	{ id: "project_code", label: "Código", visible: true },
	{ id: "project_name", label: "Proyecto", visible: true },
	{ id: "investment_line", label: "Línea de Inversión", visible: true },
	// { id: "gerencia", label: "Gerencia", visible: true },
	{ id: "jefatura", label: "Jefatura", visible: true },
	// { id: "pm_actual", label: "PM", visible: true },
	// { id: "requisitor", label: "Requisitor", visible: true },
	// { id: "solpe_original", label: "SOLPE ORIGINAL", visible: true },
	// { id: "solpe", label: "SOLPE", visible: true },
	// { id: "import_oc", label: "Comprometido", visible: true },
	// { id: "import_ac", label: "Acta", visible: true }
]

// Filters available in ADVANCED FILTERS
const availableFilters = [
	// { id: "tipo", label: "Tipo", icon: Briefcase, type: "select" },
	{ id: "project_code", label: "Código", icon: Hash, type: "text" },
	{ id: "project_name", label: "Proyecto", icon: Briefcase, type: "select" },
	{ id: "investment_line", label: "Línea de Inversión", icon: FileCheck, type: "select" },
	// { id: "gerencia", label: "Gerencia", icon: Building2, type: "select" },
	{ id: "jefatura", label: "Jefatura", icon: Users, type: "select" },
	// { id: "pm_actual", label: "PM", icon: User, type: "select" },
	// { id: "requisitor", label: "Requisitor", icon: User, type: "select" },
	// { id: "categoria", label: "Categoria", icon: DollarSign, type: "select" },
]

const toolbarConfig = {
	filters: { visible: true },
	search: { placeholder: "Buscar por código o nombre" },
	selects: [
		// { key: "fcst", label: "FCST", options: ["2+10","3+12","6+18","9+3"], defaultValue: "6+18" },
		// { key: "mes",  label: "Mes",  options: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"], defaultValue: "Octubre" },
	],
	// Puedes desactivar/ocultar alguno según la tabla:
	// visibleKeys: ["search", "fcst", "mes"]
    visibleKeys: ["search"]
};


function sum(lines, key) {
    return lines.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

function maxQ(lines, key) {
    return lines.reduce((s, r) => Math.max(s, Number(r[key]) || 0), 0);
}

function avg(lines, key) {
    if (!lines.length) return 0;
    const total = lines.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    return total / lines.length;
}

const n = (v) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

export function toExecutiveRows(lines, necesidades) {
  const needMap = new Map();
  for (const it of necesidades ?? []) {
    needMap.set(String(it.llave).trim(), n(it.cotizacion));
  }

  return (lines ?? []).map((r) => {
    const codigo_proy = r.project_code;
    const nombre_proyecto = r.project_name;
    const inversion_subrubro = r.investment_line;

    const llave = r.llave2
    const necesidad = needMap.get(llave) ?? 0;

    const solpe = n(r.solpe_original);
    const comprometido = n(r.importe_rq);

    return {
      codigo_proy,
      nombre_proyecto,
      inversion_subrubro,

      gerencia_responsable: String(r.gerencia ?? "").trim() || "—",
      tipo_proy: r.capex_opex,
      categoria: String(r.categoria ?? "").trim() || "—",
      jefatura: String(r.jefatura ?? "").trim() || "—",

      // Sección 1: comité
      comite_q: n(r.q_comite ?? 0),
      comite_monto: n(r.monto_comite ?? 0),
      driver_comite: n(r.driver_comite ?? 0),

      // Sección 2: oracle
      oracle_q: n(r.q_real ?? 0),
      habilitado_oracle: solpe,
      driver_habilitado: n(r.driver_real ?? 0),
      comprometido,

      // Sección 3: requerimientos
    //   agregar_reserva: n(r.agregar_reserva),
      necesidad,    
      total_consumo: comprometido + necesidad,
      por_reutilizar: n(r.monto_comite ?? 0) - (comprometido + necesidad),
      ptto_reserva: n(r.reserva ?? 0),
      monto_devolver: n(r.monto_comite ?? 0) - (comprometido + necesidad) + n(r.reserva ?? 0),
    //   saldo: solpe - comprometido,
      adicional: n(r.adicional ?? 0)
    };
  });
}


function groupBudgetLinesByProject(rows) {
    const map = new Map();
    for (const r of rows) {
        const key = `${r.codigo_proy}|${r.nombre_proyecto}|${r.gerencia_responsable}|${r.tipo_proy}`;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, {
                key,
                codigo: r.codigo_proy,
                nombre: r.nombre_proyecto,
                gerencia: r.gerencia_responsable,
                tipo: r.tipo_proy,
                categoria: r.categoria,
                jefaturas: r.jefatura ? [r.jefatura] : [],
                lines: [r],
            });
        } else {
            existing.lines.push(r);
            if (r.jefatura && !existing.jefaturas.includes(r.jefatura)) {
                existing.jefaturas.push(r.jefatura);
            }
            // categoría puede variar por línea (Hardware/Servicios). Si quieres, aquí puedes normalizar.
        }
    }
    // ordenar alfabético por código/nombre
    return Array.from(map.values()).sort((a, b) => {
        const x = `${a.codigo} ${a.nombre}`.toLowerCase();
        const y = `${b.codigo} ${b.nombre}`.toLowerCase();
        return x.localeCompare(y);
    });
}


// function makeMockRows() {
//   const lines = project
//   const necesidades = need.content
//   return toExecutiveRows(lines, necesidades);
// }

function KVs({ items }) {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
        {items.map((it) => (
            <div key={it.k} className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">{it.k}</div>
            <div className="mt-1 break-words text-sm font-medium text-zinc-900">{it.v}</div>
            </div>
        ))}
        </div>
    );
}

function Stat({
    label,
    value,
    hint,
    icon,
    tone = "blue",
}) {
    const toneCls =
        tone === "amber"
        ? "bg-amber-50 border-amber-200"
        : tone === "emerald"
        ? "bg-emerald-50 border-emerald-200"
        : tone === "violet"
        ? "bg-violet-50 border-violet-200"
        : "bg-blue-50 border-blue-200";

    return (
        <div className={`rounded-2xl border ${toneCls} p-4`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                <div className="text-xs text-zinc-600">{label}</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
                {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
                </div>
                {icon ? (
                <div className="rounded-xl border border-white/60 bg-white/60 p-2 text-zinc-700 shadow-sm">{icon}</div>
                ) : null}
            </div>
        </div>
    );
}


export default function Summary() {

    const [query, setQuery] = useState("");
    const [selectedKey, setSelectedKey] = useState(null);

    const { projects } = useProjectsCapex()
    const summaryKey = useSummaryKey()

    const proy_capex = projects.filter(p => p.capex_opex === "CAPEX")
    const proy_real = proy_capex.filter(p => p.tipo === "Proy.") 
    const proy_gcir = proy_real.filter(p => p.gerencia === "GERENCIA DE CONSTRUCCION E INFRAESTRUCTURA DE RED")
    const proy_solpe = proy_gcir.filter(p => p.solpe !== 0)


    const resultData = toExecutiveRows(proy_solpe, summaryKey)
    const groupData = groupBudgetLinesByProject(resultData)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const out = q
            ? groupData.filter((p) => (p.codigo + " " + p.nombre + " " + p.jefatura).toLowerCase().includes(q))
            : groupData;
        if (!selectedKey && out[0]) setSelectedKey(out[0].key);
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupData, query]);


    const selected = useMemo(() => {
    if (!selectedKey) return filtered[0] ?? null;
        return filtered.find((p) => p.key === selectedKey) ?? filtered[0] ?? null;
    }, [filtered, selectedKey]);

    const totals = useMemo(() => {
        if (!selected) return null;

        const lines = selected.lines;
        
        // ✅ Sección 1: Comité
        const comiteMonto = sum(lines, "comite_monto");
        const comiteQ = maxQ(lines, "comite_q");
        const driverComite = sum(lines, "driver_comite");

        // ✅ Sección 2: Oracle
        const oracleMonto = sum(lines, "habilitado_oracle");
        const oracleQ = maxQ(lines, "oracle_q");
        const verHabil = sum(lines, "driver_habilitado");

        const comprometido = sum(lines, "comprometido");
        const reservaProm = avg(lines, "agregar_reserva");

        // ✅ Sección 3: Otros
        const necesidad = sum(lines, "necesidad");
        const total_consumo = sum(lines, "total_consumo");
        const por_reutilizar = sum(lines, "por_reutilizar");
        const ptto_reserva = sum(lines, "ptto_reserva");
        const monto_devolver = sum(lines, "monto_devolver");
        // const porDev = sum(lines, "por_devolver");
        // const saldo = sum(lines, "saldo");

        const avanceComite = comiteMonto > 0 ? comprometido / comiteMonto : 0;
        const avanceOracle = oracleMonto > 0 ? comprometido / oracleMonto : 0;

        return {
            comiteMonto,
            comiteQ,
            driverComite,
            oracleMonto,
            oracleQ,
            verHabil,
            comprometido,
            reservaProm,
            necesidad,
            total_consumo,
            por_reutilizar,
            ptto_reserva,
            monto_devolver,
            // porDev,
            // saldo,
            avanceComite,
            avanceOracle,
        };
    }, [selected]);

    const linesSorted = useMemo(() => {
        if (!selected) return [];
        const arr = [...selected.lines];
        arr.sort((a, b) => (b.comprometido ?? 0) - (a.comprometido ?? 0));
        return arr;
    }, [selected]);


    // const totalResults = filteredData.length
    // const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

    return (
         <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        class="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Resumen</h2>
                </div>

                {/* Main */}
                {/* <div> */}
                    {/* <div className="relative"> */}
                        {/* <div className="rounded-2xl bg-white p-8 relative"> */}

                            {/* <div className="relative"> */}

                                {/* <div className="relative min-h-44"> */}

                                    <div className="contain-inline-size grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">

                                        {/* LEFT */}
                                        <Card className="overflow-hidden">
                                            <CardHeader>
                                                <CardTitle className="mb-3">Proyectos</CardTitle>
                                                <CardDescription className="mb-3">Selecciona un proyecto para ver el resumen.</CardDescription>
                                                <div className="flex w-full flex-col gap-2 md:flex-row">
                                                <div className="relative w-full">
                                                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                                                    <Input
                                                        value={query}
                                                        onChange={(e) => setQuery(e.target.value)}
                                                        className="pl-10"
                                                        placeholder="Buscar Proyecto / Acceso rápido"
                                                    />
                                                </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <ScrollArea className="h-[68vh]">
                                                <div className="space-y-2">
                                                    {filtered.map((p) => {
                                                    const active = p.key === selected?.key;
                                                    const comp = fmt1(sum(p.lines, "comprometido"));
                                                    return (
                                                        <button
                                                        key={p.key}
                                                        onClick={() => setSelectedKey(p.key)}
                                                        className={[
                                                            "w-full rounded-xl border px-3 py-3 text-left transition",
                                                            active ? "border-blue-300 bg-gradient-to-r from-blue-50 to-white" : "border-zinc-200 hover:bg-zinc-50",
                                                        ].join(" ")}
                                                        >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="text-sm flex flex-col font-semibold text-zinc-900 truncate">
                                                                    <span>{p.codigo}</span>
                                                                    <span>{p.nombre}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        </button>
                                                    );
                                                    })}
                                                </div>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>

                                        {/* RIGHT */}
                                        <div className="space-y-6">
                                            {!selected || !totals ? (
                                                <Card>
                                                <CardHeader>
                                                    <CardTitle>Sin selección</CardTitle>
                                                    <CardDescription>Busca y selecciona un proyecto para ver el detalle ejecutivo.</CardDescription>
                                                </CardHeader>
                                                </Card>
                                            ) : (
                                                <>
                                                {/* Header */}
                                                <Card className="overflow-hidden">
                                                    <CardHeader className="">
                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                        <CardTitle className="text-lg">{selected.codigo} — {selected.nombre}
                                                        </CardTitle>
                                                        {/* <CardDescription className="mt-1">
                                                        </CardDescription> */}
                                                        </div>
                                                    </div>
                                                    </CardHeader>
                                                    {/* <Separator /> */}
                                                    {/* <CardContent className="pt-5">
                                                    <KVs
                                                        items={[
                                                        { k: "Código", v: selected.codigo },
                                                        { k: "Jefatura", v: selected.jefatura },
                                                        { k: "Gerencia", v: selected.gerencia },
                                                        { k: "Tipo proy.", v: selected.tipo },
                                                        { k: "Categoría", v: selected.categoria },
                                                        { k: "Líneas", v: `${selected.lines.length} registros` },
                                                        ]}
                                                    />
                                                    </CardContent> */}
                                                </Card>

                                                {/* KPI Row */}
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                    <Stat label="Comité de inversiones (MM)" value={fmt1(totals.comiteMonto)} tone="blue" icon={<Landmark className="h-5 w-5 text-blue-700" />} />
                                                    <Stat label="Habilitado Oracle (MM)" value={fmt1(totals.oracleMonto)} tone="amber" icon={<ShieldCheck className="h-5 w-5 text-amber-700" />} />
                                                    <Stat label="Comprometido (MM)" value={fmt1(totals.comprometido)} tone="emerald" icon={<ArrowRightLeft className="h-5 w-5 text-emerald-700" />} />
                                                    {/* <Stat label="% Reserva (prom.)" value={`${totals.reservaProm.toFixed(1)}%`} tone="violet" icon={<Percent className="h-5 w-5 text-violet-700" />} /> */}
                                                </div>

                                                <Tabs defaultValue="resumen">
                                                    <TabsList>
                                                        <TabsTrigger value="resumen">Visión general</TabsTrigger>
                                                        <TabsTrigger value="lineas">Líneas de inversión</TabsTrigger>
                                                    </TabsList>

                                                    {/* ✅ Tres secciones */}
                                                    <TabsContent value="resumen">
                                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                                        {/* Sección 1: Comité */}
                                                        <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white">
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 mb-3"><Landmark className="h-5 w-5 text-blue-700" /> Comité de Inversiones</CardTitle>
                                                            <CardDescription>Vista general</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <KVs
                                                            items={[
                                                                { k: "Q ", v: totals.comiteQ },
                                                                { k: "Monto (S/)", v: fmtMoney(totals.comiteMonto, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) },
                                                                { k: "Driver comité", v: fmtMoney(totals.driverComite, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) },
                                                            ]}
                                                            />
                                                            {/* <div className="rounded-xl border border-blue-200 bg-white p-3">
                                                            <div className="text-xs text-zinc-500">Comprometido / Comité</div>
                                                            <div className="mt-2"><ProgressBar pct={totals.avanceComite} tone="blue" /></div>
                                                            </div> */}
                                                        </CardContent>
                                                        </Card>

                                                        {/* Sección 2: Oracle */}
                                                        <Card className="border-amber-200 bg-gradient-to-b from-amber-50 to-white">
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center mb-3 gap-2"><ShieldCheck className="h-5 w-5 text-amber-700" />Habilitado Oracle</CardTitle>
                                                            <CardDescription>Vista general</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <KVs
                                                            items={[
                                                                { k: "Q Real", v: totals.oracleQ },
                                                                { k: "Habilitado (S/)", v: fmtMoney(totals.oracleMonto, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) },
                                                                { k: "Driver", v: fmtMoney(totals.verHabil, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) },
                                                                { k: "Comprometido", v: `${fmtMoney(totals.comprometido)}` },
                                                                // { k: "Avance Oracle", v: `${Math.round(totals.avanceOracle * 100)}%` },
                                                            ]}
                                                            />
                                                            {/* <div className="rounded-xl border border-amber-200 bg-white p-3">
                                                            <div className="text-xs text-zinc-500">Comprometido / Oracle</div>
                                                            <div className="mt-2"><ProgressBar pct={totals.avanceOracle} tone="amber" /></div>
                                                            </div> */}
                                                        </CardContent>
                                                        </Card>

                                                        {/* Sección 3: Otros */}
                                                        <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 mb-3"><Wallet className="h-5 w-5 text-emerald-700" /> Requerimientos</CardTitle>
                                                            <CardDescription>Necesidad / Devolver / Saldo (S/)</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-1 gap-3">
                                                            <Stat label="Necesidad" value={formatCurrency(totals.necesidad)} tone="emerald" icon={<ArrowDownRight className="h-4 w-4" />} />
                                                            <Stat label="Total Consumo" value={formatCurrency(totals.total_consumo)} tone="violet" icon={<RotateCcw className="h-4 w-4" />} />
                                                            <Stat label="Por reutilizar" value={formatCurrency(totals.por_reutilizar)} tone="orange" icon={<RotateCcw className="h-4 w-4" />} />
                                                            <Stat label="Ptto Reserva" value={formatCurrency(totals.ptto_reserva)} tone="blue" icon={<Banknote className="h-4 w-4" />} />
                                                            <Stat label="Por devolver" value={formatCurrency(totals.monto_devolver)} tone="gray" icon={<Banknote className="h-4 w-4" />} />
                                                            </div>

                                                            <Separator />

                                                            {/* <div className="space-y-3">
                                                            <Card className="border-zinc-200 shadow-none">
                                                                <CardContent className="p-4">
                                                                <div className="text-sm font-semibold text-zinc-900">Alertas & foco</div>
                                                                <div className="mt-3 space-y-3">
                                                                    <FocusRow label="Reserva alta (>5%)" ok={totals.reservaProm <= 5} value={`${totals.reservaProm.toFixed(1)}%`} />
                                                                    <FocusRow label="Necesidad > 0" ok={totals.necesidad === 0} value={`${fmtMM(totals.necesidad)} MM`} />
                                                                    <FocusRow label="Por devolver > 0" ok={totals.porDev === 0} value={`${fmtMM(totals.porDev)} MM`} />
                                                                    <FocusRow label="Saldo disponible" ok={totals.saldo > 0} value={`${fmtMM(totals.saldo)} MM`} />
                                                                </div>
                                                                </CardContent>
                                                            </Card>
                                                            </div> */}
                                                        </CardContent>
                                                        </Card>
                                                    </div>
                                                    </TabsContent>

                                                    {/* ✅ Multi-líneas */}
                                                    <TabsContent value="lineas">
                                                    <Card>
                                                        <CardHeader>
                                                        <CardTitle>Detalle por línea de inversión</CardTitle>
                                                        {/* <CardDescription>
                                                            Sin tabla ni scroll horizontal: cada línea muestra 3 bloques (Comité / Oracle / Requerimientos).
                                                        </CardDescription> */}
                                                        </CardHeader>

                                                        <CardContent>
                                                        {/* Header tipo “tabla” */}
                                                        <div className="mb-3 hidden xl:grid xl:grid-cols-12 xl:gap-3">
                                                            <div className="col-span-3 rounded-lg border bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">
                                                            Inversión / SubRubro
                                                            </div>

                                                            <div className="col-span-3 rounded-lg border bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                                                            COMITÉ DE INVERSIONES
                                                            </div>

                                                            <div className="col-span-3 rounded-lg border bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                                            HABILITADO ORACLE
                                                            </div>

                                                            <div className="col-span-3 rounded-lg border bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                                                            REQUERIMIENTOS
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {linesSorted.map((l, idx) => {
                                                            // ✅ “scores” para orden y badges
                                                            const comiteMM = toMM(l.comite_monto ?? 0);
                                                            const oracleMM = toMM(l.habilitado_oracle ?? 0);
                                                            const compMM = toMM(l.comprometido ?? 0);

                                                            const necesidadMM = formatCurrency(l.necesidad ?? 0);
                                                            const total_consumoMM = formatCurrency(l.total_consumo ?? 0);
                                                            const por_reutilizarMM = formatCurrency(l.por_reutilizar ?? 0);
                                                            const ptto_reservaMM = formatCurrency(l.ptto_reserva ?? 0);
                                                            const monto_devolverMM = formatCurrency(l.monto_devolver ?? 0);
                                                            // const devolverMM = toMM(l.por_devolver ?? 0);
                                                            const saldoMM = toMM(l.saldo ?? 0);

                                                            return (
                                                                <div
                                                                key={idx}
                                                                className="grid grid-cols-1 gap-3 rounded-2xl border bg-white p-3 shadow-sm xl:grid-cols-12"
                                                                >
                                                                {/* Col 1: Nombre de línea */}
                                                                <div className="xl:col-span-3">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <div className="text-sm font-semibold text-zinc-900 break-words">
                                                                            {l.inversion_subrubro}
                                                                        </div>
                                                                        {/* <div className="mt-1 text-xs text-zinc-500">
                                                                        Q comité: <span className="font-medium text-zinc-700">{l.comite_q ?? 0}</span> · Q oracle:{" "}
                                                                        <span className="font-medium text-zinc-700">{l.oracle_q ?? 0}</span>
                                                                        </div> */}
                                                                    </div>

                                                                    {/* badge resumen (Comprometido) */}
                                                                    {/* <Badge className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                        Comp: {compMM.toFixed(1)} MM
                                                                    </Badge> */}
                                                                    </div>
                                                                </div>

                                                                {/* Col 2: Comité */}
                                                                <div className="xl:col-span-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                    <div className="text-xs font-semibold text-blue-900">Comité</div>
                                                                    <Badge className="bg-white border-blue-200 text-blue-800">
                                                                        {comiteMM.toFixed(1)} MM
                                                                    </Badge>
                                                                    </div>

                                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                                    <div className="rounded-lg bg-white/70 border border-blue-100 p-2">
                                                                        <div className="text-[11px] text-zinc-500">Q Comité</div>
                                                                        <div className="text-sm font-semibold text-zinc-900">
                                                                        {l.comite_q ?? 0}
                                                                        </div>
                                                                    </div>
                                                                    <div className="rounded-lg bg-white/70 border border-blue-100 p-2">
                                                                        <div className="text-[11px] text-zinc-500">Monto (S/)</div>
                                                                        <div className="text-sm font-semibold text-zinc-900">
                                                                        {fmtMoney(l.comite_monto ?? 0, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                                                        </div>
                                                                    </div>
                                                                    <div className="rounded-lg bg-white/70 border border-blue-100 p-2">
                                                                        <div className="text-[11px] text-zinc-500">Driver comité</div>
                                                                        <div className="text-sm font-semibold text-zinc-900">
                                                                        {fmtMoney(l.driver_comite ?? 0, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    </div>
                                                                </div>

                                                                {/* Col 3: Oracle */}
                                                                <div className="xl:col-span-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                    <div className="text-xs font-semibold text-amber-900">Oracle</div>
                                                                    <Badge className="bg-white border-amber-200 text-amber-800">
                                                                        {oracleMM.toFixed(1)} MM
                                                                    </Badge>
                                                                    </div>

                                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                                        <div className="rounded-lg bg-white/70 border border-amber-100 p-2">
                                                                            <div className="text-[11px] text-zinc-500">Q Real</div>
                                                                            <div className="text-sm font-semibold text-zinc-900">
                                                                            {(l.oracle_q ?? 0)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="rounded-lg bg-white/70 border border-amber-100 p-2">
                                                                            <div className="text-[11px] text-zinc-500">Habilitado (S/)</div>
                                                                            <div className="text-sm font-semibold text-zinc-900">
                                                                            {fmtMoney(l.habilitado_oracle ?? 0, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                    </div>

                                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                                        <div className="rounded-lg bg-white/70 border border-amber-100 p-2">
                                                                            <div className="text-[11px] text-zinc-500">Driver</div>
                                                                            <div className="text-sm font-semibold text-zinc-900">
                                                                            {fmtMoney(l.driver_habilitado ?? 0, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                                                            </div>
                                                                        </div>

                                                                        <div className="rounded-lg bg-white/70 border border-amber-100 p-2">
                                                                            <div className="text-[11px] text-zinc-500">Comprometido</div>
                                                                            <div className="text-sm font-semibold text-zinc-900">
                                                                                {fmtMoney(l.comprometido ?? 0, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    
                                                                </div>

                                                                {/* Col 4: Requerimientos */}
                                                                <div className="xl:col-span-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-xs font-semibold text-emerald-900">Requerimientos</div>
                                                                        {/* <Badge className="bg-white border-emerald-200 text-emerald-800">
                                                                            Saldo {saldoMM.toFixed(1)}
                                                                        </Badge> */}
                                                                        </div>

                                                                        <div className="mt-2 space-y-2">
                                                                        <div className="flex items-center justify-between rounded-lg bg-white/70 border border-emerald-100 p-2">
                                                                            <span className="text-xs text-zinc-600">Necesidad</span>
                                                                            <span className="text-sm font-semibold text-zinc-900">{necesidadMM}</span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between rounded-lg bg-white/70 border border-emerald-100 p-2">
                                                                            <span className="text-xs text-zinc-600">Total consumido</span>
                                                                            <span className="text-sm font-semibold text-zinc-900">{total_consumoMM}</span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between rounded-lg bg-white/70 border border-emerald-100 p-2">
                                                                            <span className="text-xs text-zinc-600">Por reutilizar</span>
                                                                            <span className="text-sm font-semibold text-zinc-900">{por_reutilizarMM}</span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between rounded-lg bg-white/70 border border-emerald-100 p-2">
                                                                            <span className="text-xs text-zinc-600">Reserva</span>
                                                                            <span className="text-sm font-semibold text-zinc-900">{ptto_reservaMM}</span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between rounded-lg bg-white/70 border border-emerald-100 p-2">
                                                                            <span className="text-xs text-zinc-600">Por devolver</span>
                                                                            <span className="text-sm font-semibold text-zinc-900">{monto_devolverMM}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                </div>
                                                            );
                                                            })}
                                                        </div>
                                                        </CardContent>
                                                    </Card>
                                                    </TabsContent>
                                                </Tabs>
                                                </>
                                            )}


                                        </div>

                                    </div>

                                {/* </div> */}

                            {/* </div> */}

                        {/* </div> */}
                    {/* </div> */}

                {/* </div> */}

            </div>

        </div>
    )
}