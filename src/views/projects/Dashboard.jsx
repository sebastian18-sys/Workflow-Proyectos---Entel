import MultiSelectFilter from "@/components/ui/_multiselect3";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIdentifers } from "@/hooks/projects/useIdentifers";
import { toIsoDate, unique } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarRange, Check, ChevronDown, Filter, FolderKanban, Layers3, Search, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


const BAR_COLOR = "#43E7B4";
const LINE_COLOR = "#002EFF";

// TMP
const BAR_RFI_COLOR = "#FD6C98";
const LINE_RFI_COLOR = "#FF3D00";

const CHART_BG = "#ffffff";
const TEXT_MUTED = "#6b7280";

const MONTHS = [
    { key: 0, short: "Ene.", label: "Enero" },
    { key: 1, short: "Feb.", label: "Febrero" },
    { key: 2, short: "Mar.", label: "Marzo" },
    { key: 3, short: "Abr.", label: "Abril" },
    { key: 4, short: "May.", label: "Mayo" },
    { key: 5, short: "Jun.", label: "Junio" },
    { key: 6, short: "Jul.", label: "Julio" },
    { key: 7, short: "Ago.", label: "Agosto" },
    { key: 8, short: "Sep.", label: "Septiembre" },
    { key: 9, short: "Oct.", label: "Octubre" },
    { key: 10, short: "Nov.", label: "Noviembre" },
    { key: 11, short: "Dic.", label: "Diciembre" },
];


function getUniqueOptions(rows, key) {
    return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), "es")
    );
}

function monthIndex(value) {

    // console.log("VALUE", value)
    const iso = toIsoDate(value)
    const d = parseDate(iso);
    return d ? d.getMonth() : null;
}

function toPercent(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
}

function formatNumber(value) {
    return new Intl.NumberFormat("es-PE").format(value ?? 0);
}

function parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}


function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const bar = payload.find((item) => item.dataKey === "realAccumDisplay");
    const line = payload.find((item) => item.dataKey === "fcstAccumDisplay");
    const month = payload?.[0]?.payload?.monthLong || label;

    return (
        <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-sm font-semibold text-slate-800">{month}</p>
            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAR_COLOR }} />
                        Real Acc
                    </div>
                    <span className="font-semibold text-slate-900">{formatNumber(bar?.value ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LINE_COLOR }} />
                        Plan Acc
                    </div>
                    <span className="font-semibold text-slate-900">{formatNumber(line?.value ?? 0)}</span>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, subtitle, accent = "text-[#2b7fff]", icon: Icon }) {
    return (
        <Card className="rounded-[24px] border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-start justify-between">
                <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className={cn("text-3xl font-semibold tracking-tight", accent)}>{value}</p>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                    {Icon ? <Icon className="h-5 w-5 text-[#2b7fff]" /> : null}
                </div>
            </CardContent>
        </Card>
    );
}


function EmptyState() {
    return (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                <Filter className="h-6 w-6 text-[#2b7fff]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Sin datos para los filtros actuales</h3>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
                Ajusta Tipo Proyecto, Proyecto o Sub Proyecto para visualizar la curva acumulada de forecast y avance real.
            </p>
        </div>
    );
}


export default function Dashboard() {

    const { identifiers } = useIdentifers()

    // console.log("IDENTIFICADORES", identifiers)

    const matchesMulti = (selected, value) =>
        selected.length === 0 || selected.includes(value);

    const matchesSiteSearch = (search, site) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return String(site ?? "").toLowerCase().includes(q);
    };

    function useFilters(data) {
        const [tipoProyecto, setTipoProyecto] = useState([]);
        const [proyecto, setProyecto] = useState([]);
        const [subProyecto, setSubProyecto] = useState([]);
        const [searchSite, setSearchSite] = useState("");
    
        // Helper: Apply filters
        const apply = (omit) => (d) => {
            const byProyecto = omit === "nombre_proyecto" || matchesMulti(proyecto, d.project_name);
            const byTipoProyecto = omit === "tipo" || matchesMulti(tipoProyecto, d.project_type);
            const bySubProyecto = omit === "sub_proyecto" || matchesMulti(subProyecto, d.project_sub);
            const bySite = omit === "site" || matchesSiteSearch(searchSite, d.site);

            return byProyecto && byTipoProyecto && bySubProyecto && bySite
        };
    
        const options = {
            proyectos: useMemo(() => unique(data.filter(apply("nombre_proyecto")).map(d => d.project_name)), [data, tipoProyecto, subProyecto, searchSite]),
            tipoProyectos: useMemo(() => unique(data.filter(apply("tipo")).map(d => d.project_type)), [data, proyecto, subProyecto, searchSite]),
            subProyectos: useMemo(() => unique(data.filter(apply("sub_proyecto")).map(d => d.project_sub)), [data, proyecto, tipoProyecto, searchSite]),
        };
    
        const filtered = useMemo(() => data.filter(apply("")), [data,  proyecto, subProyecto, tipoProyecto, searchSite]);
    
        return { 
            options, 
            filtered,
            proyecto, setProyecto,
            subProyecto, setSubProyecto,
            tipoProyecto, setTipoProyecto,
            searchSite, setSearchSite
        };
    }

    const flt = useFilters(identifiers);

    // Curva S
    const monthlyData = useMemo(() => {

        const rfiRealMonthly = [111, 233, 170, 90, 90, 54, 106];
        const rfiFcstMonthly = [171, 173, 46, 200, 12, 73, 155];

        const base = MONTHS.map((month, index) => ({
            month: month.short,
            monthLong: month.label,
            realMonthly: 0,
            realAccum: 0,
            realAccumDisplay: null,
            fcstMonthly: 0,
            fcstAccum: 0,
            fcstAccumDisplay: null,

            // RFI
            rfiRealMonthly: rfiRealMonthly[index] ?? 0,
            rfiRealAccum: 0,
            rfiRealAccumDisplay: null,

            rfiFcstMonthly: rfiFcstMonthly[index] ?? 0,
            rfiFcstAccum: 0,
            rfiFcstAccumDisplay: null,
        }));

        const fcstIndices = [];
        const realIndices = [];
        // const rfiRealIndices = [111, 233, 170, 90, 90, 54, 106];
        // const rfiFcstIndices = [171, 173, 46, 200, 12, 73, 155];

        flt.filtered.forEach((row) => {
            const fcstMonth = monthIndex(row.date_fcst);
            const realMonth = monthIndex(row.date_real);

            if (fcstMonth !== null && base[fcstMonth]) {
                base[fcstMonth].fcstMonthly += 1;
                fcstIndices.push(fcstMonth);
            }
            if (realMonth !== null && base[realMonth]) {
                base[realMonth].realMonthly += 1;
                realIndices.push(realMonth);
            }

        });

        const firstFcst = fcstIndices.length ? Math.min(...fcstIndices) : null;
        const lastFcst = fcstIndices.length ? Math.max(...fcstIndices) : null;
        const firstReal = realIndices.length ? Math.min(...realIndices) : null;
        const lastReal = realIndices.length ? Math.max(...realIndices) : null;

        // Último mes disponible para RFI
        const lastRfiReal = rfiRealMonthly.length - 1; // Julio = index 6
        const lastRfiFcst = rfiFcstMonthly.length - 1;

        let runFcst = 0;
        let runReal = 0;

        let runRfiReal = 0;
        let runRfiFcst = 0;

        return base.map((item, index) => {
            runFcst += item.fcstMonthly;
            runReal += item.realMonthly;

            // Datos inventados RFI
            runRfiReal += item.rfiRealMonthly;
            runRfiFcst += item.rfiFcstMonthly;


            const fcstVisible = firstFcst !== null && index >= firstFcst && index <= lastFcst ? runFcst : null;
            const realVisible = firstReal !== null && index >= firstReal && index <= lastReal ? runReal : null;

            const rfiRealVisible = index <= lastRfiReal ? runRfiReal : null;
            const rfiFcstVisible = index <= lastRfiFcst ? runRfiFcst : null;

            return {
                ...item,
                fcstAccum: runFcst,
                realAccum: runReal,
                fcstAccumDisplay: fcstVisible,
                realAccumDisplay: realVisible,

                // RFI
                rfiRealAccum: runRfiReal,
                rfiFcstAccum: runRfiFcst,

                rfiRealAccumDisplay: rfiRealVisible,
                rfiFcstAccumDisplay: rfiFcstVisible,
            };
        });
    }, [flt.filtered]);

    console.log("monthlyData", monthlyData)

    // KPIs
    const totals = useMemo(() => {

        const now = new Date();
        const currentMonth = now.getMonth();

        const currentMonthData = monthlyData[currentMonth] ?? {
            fcstMonthly: 0,
            realMonthly: 0,
            fcstAccum: 0,
            realAccum: 0,
            fcstAccumDisplay: 0,
            realAccumDisplay: 0,

            // rfiAccum: 0,
            // rfiAccumDisplay: 0,
        }; 

        console.log("cmdata", currentMonthData)

        const total = flt.filtered.length;
        const conReal = flt.filtered.filter((row) => row.date_real).length;
        const conFcst = flt.filtered.filter((row) => row.date_fcst).length;
        // const activados = flt.filtered.filter((row) => row.date_real !== " ").length;
        // const activados = flt.filtered.filter((row) => row.state === "Activado").length;
       
        const fcstMesActual = currentMonthData.fcstMonthly ?? 0;
        const realMesActual = currentMonthData.realMonthly ?? 0;

        const fcstAcumuladoActual = currentMonthData.fcstAccumDisplay ?? currentMonthData.fcstAccum ?? 0;
        const realAcumuladoActual = currentMonthData.realAccumDisplay ?? currentMonthData.realAccum ?? 0;

        return {
            total,
            conReal,
            conFcst,
            activados: realAcumuladoActual,

            avanceRealPct: toPercent(conReal, total),
            coberturaFcstPct: toPercent(conFcst, total),

            fcstMesActual,
            realMesActual,
            cumplimientoMesActual: toPercent(realMesActual, fcstMesActual),

            fcstAcumuladoActual,
            realAcumuladoActual,
            cumplimientoAcumuladoActual: toPercent(realAcumuladoActual, fcstAcumuladoActual),
        };
    }, [flt.filtered, monthlyData]);

    // const monthlyTable = useMemo(() => {
    //     return monthlyData.map((row) => ({
    //         mes: row.monthLong,
    //         real_mensual: row.realMonthly,
    //         real_acumulado: row.realAccumDisplay ?? 0,
    //         plan_mensual: row.fcstMonthly,
    //         plan_acumulado: row.fcstAccumDisplay ?? 0,
    //     }));
    // }, [monthlyData]);

    // const resetFilters = () => {
    //     setSelectedTypes([]);
    //     setSelectedProjects([]);
    //     setSelectedSubs([]);
    //     setSearchSite("");
    // };


    return (
        <div className="grid grid-cols-12 gap-5 px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">

            {/* Breadcrumb */}
            <div className="flex gap-4 ">
                <a 
                    href="#" 
                    title="Atrás" 
                    className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                >
                    <ArrowLeft className="h-5 w-5" />
                </a>
                <h2 className="text-2xl font-semibold text-[#2b7fff]">Dashboard</h2>
            </div>

            {/* Main */}
            <div className="col-span-12 space-y-3">

                <div className="grid grid-cols-12 gap-4">

                    <div className="col-span-12 lg:col-span-12 space-y-3">
                        <Card className="shadow-sm overflow-hidden p-0 gap-0">
                            <CardHeader className="relative pt-3">
                                <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">Filtros Avanzados</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 grid gap-4 pb-3 grid-cols-4">

                                <div>
                                    <MultiSelectFilter
                                        label="Tipo Proyecto"
                                        icon={Layers3}
                                        options={flt.options.tipoProyectos}
                                        selected={flt.tipoProyecto}
                                        onChange={flt.setTipoProyecto}
                                        placeholder="Uno o varios tipos"
                                    />
                                </div>
                                <div>
                                    <MultiSelectFilter
                                        label="Proyecto"
                                        icon={FolderKanban}
                                        options={flt.options.proyectos}
                                        selected={flt.proyecto}
                                        onChange={flt.setProyecto}
                                        placeholder="Uno o varios proyectos"
                                    />
                                </div>
                                <div>
                                    <MultiSelectFilter
                                        label="Sub Proyecto"
                                        icon={Target}
                                        options={flt.options.subProyectos}
                                        selected={flt.subProyecto}
                                        onChange={flt.setSubProyecto}
                                        placeholder="Uno o varios sub proy"
                                        // disabled={subOptions.length === 0}
                                    />
                                </div>
                                <div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Search className="h-4 w-4 text-[#2b7fff]" />
                                            Búsqueda rápida
                                        </label>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={flt.searchSite}
                                                onChange={(e) => flt.setSearchSite(e.target.value)}
                                                placeholder="Código, sitio o nombre..."
                                                className="h-11 rounded-2xl border-slate-200 pl-9"
                                                aria-label="Búsqueda rápida"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                
                    {/* ===== Column Contenido ===== */}
                    <div className="col-span-12 lg:col-span-9 space-y-4">

                        <Card className="shadow-sm overflow-hidden p-0 gap-0">
                            <CardHeader className="relative pt-3">
                                <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">Despliegue</CardTitle>
                            </CardHeader>

                            <CardContent className="pb-3">

                            {flt.filtered.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-4">
                                    <div
                                        className="rounded-[24px] p-3 md:p-5"
                                        style={{ backgroundColor: CHART_BG }}
                                    >
                                        <div className="h-[440px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart
                                                    barGap={0}
                                                    data={monthlyData}
                                                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                                >
                                                    <XAxis
                                                        dataKey="month"
                                                        tick={{ fill: "#4b5563", fontSize: 13 }}
                                                        axisLine={{ stroke: "#d7dbe2" }}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        allowDecimals={false}
                                                        tick={{ fill: "#4b5563", fontSize: 13 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(2,46,255,0.04)" }} />
                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                    <Bar
                                                        dataKey="realAccumDisplay"
                                                        name="Real Acc"
                                                        fill={BAR_COLOR}
                                                        radius={[0, 0, 0, 0]}
                                                        barSize={26}
                                                    >
                                                        <LabelList
                                                            dataKey="realAccumDisplay"
                                                            position="center"
                                                            formatter={(value) => (value ? value : "")}
                                                            style={{ fill: TEXT_MUTED, fontSize: 11 }}
                                                        />
                                                    </Bar>
                                                    {flt.tipoProyecto[0] === "Transporte" &&
                                                        <Bar
                                                            dataKey="rfiRealAccumDisplay"
                                                            name="Real RFI"
                                                            fill={BAR_RFI_COLOR}
                                                            radius={[0, 0, 0, 0]}
                                                            barSize={26}
                                                        >
                                                            <LabelList
                                                                dataKey="rfiRealAccumDisplay"
                                                                position="insideBottom"
                                                                formatter={(value) => (value ? value : "")}
                                                                style={{ fill: TEXT_MUTED, fontSize: 11 }}
                                                            />
                                                        </Bar>
                                                    }
                                                    <Line
                                                        type="monotone"
                                                        dataKey="fcstAccumDisplay"
                                                        name="Plan Acc"
                                                        stroke={LINE_COLOR}
                                                        strokeWidth={2.5}
                                                        dot={{ r: 0, strokeWidth: 0, fill: LINE_COLOR, stroke: LINE_COLOR }}
                                                        activeDot={{ r: 4, stroke: LINE_COLOR, fill: LINE_COLOR }}
                                                        connectNulls={false}
                                                    >
                                                        <LabelList
                                                            dataKey="fcstAccumDisplay"
                                                            position="top"
                                                            offset={8}
                                                            formatter={(value) => (value ? value : "")}
                                                            style={{ fill: LINE_COLOR, fontSize: 11 }}
                                                        />
                                                    </Line>
                                                    {flt.tipoProyecto[0] === "Transporte" &&
                                                        <Line
                                                            type="monotone"
                                                            dataKey="rfiFcstAccumDisplay"
                                                            name="RFC RFI"
                                                            stroke={LINE_RFI_COLOR}
                                                            strokeWidth={2}
                                                            dot={{ r: 0 }}
                                                            // strokeDasharray="4 4"
                                                            isAnimationActive={false}
                                                        >
                                                            <LabelList
                                                                dataKey="rfiFcstAccumDisplay"
                                                                position="top"
                                                                fill={LINE_RFI_COLOR}
                                                                fontSize={11}
                                                            />
                                                        </Line>
                                                    }
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* KPIs/Etiquetas (placeholder) */}
                    <div className="col-span-12 lg:col-span-3 space-y-3">

                        <KpiCard
                            title="Total Activados"
                            value={formatNumber(totals.activados)}
                            subtitle="Sitios"
                            icon={Layers3}
                        />

                        <KpiCard
                            title="Meta Mes"
                            value={formatNumber(totals.fcstAcumuladoActual)}
                            subtitle=""
                            icon={FolderKanban}
                        />
                        <KpiCard
                            title="Cumplimiento Mes"
                            value={`${totals.cumplimientoAcumuladoActual}%`}
                            subtitle=""
                            icon={Target}
                        />
                        {/* <KpiCard
                            title="Con Real"
                            value={`${totals.avanceRealPct}%`}
                            subtitle={`${formatNumber(totals.conReal)} con date_real`}
                            icon={Target}
                        /> */}
                        

                    </div>

                </div>

            </div>

        </div>
    )
}