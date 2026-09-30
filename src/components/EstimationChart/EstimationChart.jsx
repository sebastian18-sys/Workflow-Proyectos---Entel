import { useEstimations } from "@/hooks/budget/capex/useEstimations";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Bar, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toNumber, unique } from "@/lib/helpers";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { MultiSelect } from "../ui/_multiselect";
import { MONTOS_FIJOS_ACTIVIDAD } from "@/constants/montos_fijos_opex";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// const toNumber = (value) => Number(value) || 0;

const toFactor = (value) => {
    // si viene vacío => 1
    if (value === null || value === undefined || value === "") return 1;
    return Number(value) || 0;
};

const sortVersionKeys = (keys = []) => {
    return [...keys].sort((a, b) => {
        if (a === "q_plan") return -1;
        if (b === "q_plan") return 1;

        const aMatch = a.match(/^q_v(\d+)$/);
        const bMatch = b.match(/^q_v(\d+)$/);

        const aNum = aMatch ? Number(aMatch[1]) : 9999;
        const bNum = bMatch ? Number(bMatch[1]) : 9999;

        return aNum - bNum;
    });
};

const getVersionLabel = (key) => {
    if (key === "q_plan") return "Plan";
    if (key === "q_210") return "FCST 2+10";
    if (key === "q_57") return "FCST 5+7";
    const match = key.match(/^q_v(\d+)$/);
    if (match) return `V${match[1]}`;
    return key;
};

const buildAccumulatedQSeriesFromArray = (projects = []) => {
    const safeProjects = Array.isArray(projects) ? projects : [];

    const versionKeys = sortVersionKeys([
        ...new Set(
        safeProjects.flatMap((item) =>
            Object.keys(item?.q_mensuales || {}).filter((k) => /^q_(plan|v\d+)$/.test(k))
        )
        ),
    ]);

    const series = MONTHS.map((month, monthIndex) => {
        const row = { month };

        versionKeys.forEach((versionKey) => {
        let accumulatedTotal = 0;

        safeProjects.forEach((item) => {
            const qArray = item?.q_mensuales?.[versionKey] || [];

            const accumulated = qArray
            .slice(0, monthIndex + 1)
            .reduce((sum, q) => sum + (Number(q?.value) || 0), 0);

            accumulatedTotal += accumulated;
        });

        row[versionKey] = accumulatedTotal;
        });

        return row;
    });

    return { series, versionKeys };
};

const getAmountPerQByFilter = (project, estimacion = "Todos", versionKey) => {

    // const projectId = String(project?._id ?? "");

    // const montoFijoActividad =
    //     MONTOS_FIJOS_ACTIVIDAD?.[projectId]?.[versionKey] ?? [];

    // console.log("montoFijoActividad", montoFijoActividad)

    //  const hasMontoFijoActividad =
    //     montoFijoActividad !== null &&
    //     montoFijoActividad !== undefined &&
    //     montoFijoActividad !== "";

    // const actividad = hasMontoFijoActividad
    //     ? Number(montoFijoActividad)
    //     : toNumber(project?.driver_actividad) *
    //       toFactor(project?.incidencia_actividad);

    // console.log("project", project)

    const actividad =
        toNumber(project?.driver_actividad) * toFactor(project?.incidencia_actividad);

    const energia =
        toNumber(project?.driver_energia) * toFactor(project?.incidencia_energia);

    // console.log("actividad", actividad)

    if (estimacion === "Actividad") return actividad;
    if (estimacion === "Energia") return energia;

    return actividad + energia;
};



const buildDualAxisAccumulatedSeriesFromArray = (
    projects = [],
    estimacion = "Todos"
) => {
    const safeProjects = Array.isArray(projects) ? projects : [];

    // console.log("PROJECTS ===========>", safeProjects)

    const versionKeys = sortVersionKeys([
        ...new Set(
        safeProjects.flatMap((item) =>
            Object.keys(item?.q_mensuales || {}).filter((k) =>
                // /^q_(plan|210|v\d+)$/.test(k)
                /^q_(plan|210|57|v\d+)$/.test(k)
            )
        )
        ),
    ]);

    console.log("VERSIONS ===========>", versionKeys)

    const accumulatedQByVersion = Object.fromEntries(
        versionKeys.map((key) => [key, 0])
    );

    const accumulatedAmountByVersion = Object.fromEntries(
        versionKeys.map((key) => [key, 0])
    );

    // const series = MONTHS.map((month, monthIndex) => {
    //     const row = { month };

    //     versionKeys.forEach((versionKey) => {
    //         let monthlyQTotal = 0;
    //         let monthlyAmountTotal = 0;

    //         safeProjects.forEach((project) => {
    //             const qArray = Array.isArray(project?.q_mensuales?.[versionKey])
    //                 ? project.q_mensuales[versionKey]
    //                 : [];

    //             const qValue = toNumber(qArray?.[monthIndex]?.value);

    //             console.log("versionKey", versionKey)

    //             monthlyQTotal += qValue;
    //             monthlyAmountTotal += qValue * getAmountPerQByFilter(project, estimacion, versionKey);
    //         });

    //         accumulatedQByVersion[versionKey] += monthlyQTotal;
    //         accumulatedAmountByVersion[versionKey] += monthlyAmountTotal;

    //         row[`${versionKey}_q_acc`] = Number(
    //             accumulatedQByVersion[versionKey].toFixed(2)
    //         );

    //         row[`${versionKey}_amount_acc`] = Number(
    //             accumulatedAmountByVersion[versionKey].toFixed(2)
    //         );
    //     });

    //     return row;
    // });

    const series = MONTHS.map((month, monthIndex) => {
        const row = { month };
        let totalAmountAct = []

        versionKeys.forEach((versionKey) => {
            let monthlyQTotal = 0;
            let monthlyAmountTotal = 0;

            

            safeProjects.forEach((project) => {
                const qArray = Array.isArray(project?.q_mensuales?.[versionKey])
                    ? project.q_mensuales[versionKey]
                    : [];

                const qValue = toNumber(qArray?.[monthIndex]?.value);

                monthlyQTotal += qValue;

                console.log("qValue", qValue)
                console.log("monthlyQTotal", monthlyQTotal)

                const projectId = String(project?._id ?? "");

                const montoFijoActividad =
                    MONTOS_FIJOS_ACTIVIDAD?.[projectId]?.[versionKey]?.[monthIndex];

                const hasMontoFijoActividad =
                    montoFijoActividad !== null &&
                    montoFijoActividad !== undefined &&
                    montoFijoActividad !== "";

                let amountByProject = 0;

                if (estimacion === "Actividad") {
                    amountByProject = hasMontoFijoActividad
                        ? Number(montoFijoActividad)
                        : qValue * getAmountPerQByFilter(project, "Actividad", versionKey);
                } else if (estimacion === "Energia") {
                    amountByProject =
                        qValue * getAmountPerQByFilter(project, "Energia", versionKey);
                } else {
                    const actividadAmount = hasMontoFijoActividad
                        ? Number(montoFijoActividad)
                        : qValue * getAmountPerQByFilter(project, "Actividad", versionKey);

                    const energiaAmount =
                        qValue * getAmountPerQByFilter(project, "Energia", versionKey);

                    amountByProject = actividadAmount + energiaAmount;
                }

                monthlyAmountTotal += amountByProject;

            });

            accumulatedQByVersion[versionKey] += monthlyQTotal;
            accumulatedAmountByVersion[versionKey] += monthlyAmountTotal;

            row[`${versionKey}_q_acc`] = Number(
                accumulatedQByVersion[versionKey].toFixed(2)
            );

            row[`${versionKey}_amount_acc`] = Number(
                accumulatedAmountByVersion[versionKey].toFixed(2)
            );
        });

        return row;
    });

    return { series, versionKeys };
};


const VERSION_COLORS = {
    q_plan: "#002EFF",
    q_210: "#43E7B4",
    q_57: "#2FCBF1",
    q_v1: "#FF3D00",
    q_v2: "#43E7B4",
    q_v3: "#FD6C98",
    q_v4: "#2FCBF1",
    q_v5: "#696969",
};

const getLineColor = (key, index) => {
    if (VERSION_COLORS[key]) return VERSION_COLORS[key];
    const fallback = ["#2b7fff", "#43E7B4", "#FF3D00", "#10b981", "#8b5cf6", "#f59e0b"];
    return fallback[index % fallback.length];
};

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const p = Object.fromEntries(payload.map((x) => [x.name, x.value]));

    return (
        <div className="rounded-xl border bg-white/95 p-3 text-xs shadow">
            <div className="mb-1 font-medium">{label}</div>
            <div>Total: <strong>{(p["Total"] ?? p.total)?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong></div>
            {Object.entries(p).map(([key, value]) => (
                <div key={key} className="mt-1 text-xs text-zinc-500">{key}: <strong>{(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div>
            ))}
        </div>
    );
};

/** ===== Filtros anidados ===== */
function useFilters(data) {
    const [tipo, setTipo] = useState("Todos");
    const [estimacion, setEstimacion] = useState("Todos"); 

    // Helper: Apply filters
    const apply = (omit) => (d) => {
        const byTip = omit === "tipo" || tipo === "Todos" || d.tipo === tipo;
        // const byVar = omit === "variacion" || variacion.length === 0 || variacion.includes(d.q_values[0].header);
        return byTip
    };

    const options = {
        tipos: useMemo(() => unique(data.filter(apply("tipo")).map(d => d.tipo)), [data]),
        // variaciones: useMemo(() => unique(data.filter(apply("q_mensuales")).map(d => Object.values(d))), [data]),
        estimaciones: ["Todos", "Actividad", "Energia"], // fijo
    };

    const filtered = useMemo(() => data.filter(apply("")), [data, tipo]);

    return { 
        options, 
        filtered,
        tipo, setTipo,
        estimacion, setEstimacion
    };
}

const formatNumber = (value, decimals = 0) =>
    Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });

    const formatCompactAmount = (value) => {
    const n = Number(value) || 0;

    if (Math.abs(n) >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(n) >= 1_000) {
        return `${(n / 1_000).toFixed(0)}K`;
    }

    return formatNumber(n, 0);
};


export default function EstimationChart() {

    const { opexEstimacion } = useEstimations();
    const varsOptions = []

    // Selected Forecasts
	const [variacion, setVariacion] = useState(["q_plan", "q_57"]);
    const [estimationView, setEstimationView] = useState("Todos"); 

    console.log("OPEX ESTIMACIONES", opexEstimacion)
    // console.log("obk", Object.keys(opexEstimacion?.[0]?.q_mensuales ?? []))

    Object.keys(opexEstimacion?.[0]?.q_mensuales ?? []).forEach(q => {
        varsOptions.push({
            key: q,
            label: getVersionLabel(q),
            value: q
        })
    })

    const flt = useFilters(opexEstimacion);

    // const { series, versionKeys } = buildAccumulatedQSeriesFromArray(flt.filtered);

    // const { series, versionKeys } = useMemo(
    //     () => buildDualAxisSeriesFromArray(flt.filtered),
    //     [flt.filtered]
    // );

    const { series, versionKeys } = useMemo(
        () => buildDualAxisAccumulatedSeriesFromArray(flt.filtered, flt.estimacion),
        [flt.filtered, flt.estimacion]
    );

    console.log("OPEX", versionKeys)
    console.log("VarOp", varsOptions)
    console.log("SERIES", series)
    console.log("VARIACION", variacion)

    return (
        <>
            {/* Filtros */}
            <div className="col-span-12 lg:col-span-12 space-y-3 mb-6">
                <Card className="">
                    <CardHeader>
                        <CardTitle className="text-base">Filtros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 grid gap-4 grid-cols-1 md:grid-cols-5">
                        {/* Proyecto */}
                        <div>
                            <div className="mb-1 text-xs font-medium">Tipo</div>
                            <Select value={flt.tipo} onValueChange={flt.setTipo}>
                                <SelectTrigger className="h-8 w-full">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos</SelectItem>
                                    {flt.options.tipos.map((g) => (
                                        <SelectItem key={g} value={g}><span className="block truncate">{g}</span></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estimacion */}
                        <div>
                            <div className="mb-1 text-xs font-medium">Estimación</div>
                            <Select value={flt.estimacion} onValueChange={flt.setEstimacion}>
                                <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder="Estimación" />
                                </SelectTrigger>
                                <SelectContent>
                                {flt.options.estimaciones.map((e) => (
                                    <SelectItem key={e} value={e}>
                                    <span className="block truncate">{e}</span>
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Version */}
                        <div>
                            <div className="mb-1 text-xs font-medium">Versión</div>
                            <MultiSelect
                                options={varsOptions}
                                selected={variacion}
                                onChange={setVariacion}
                                placeholder="Seleccionar Version"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* <Card>
                <CardContent className="h-[380px] pb-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={series}
                            margin={{ top: 10, right: 24, bottom: 8, left: 0 }}
                        >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) =>
                            Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })
                            }
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />

                        {versionKeys.map((versionKey, index) => (
                            <Line
                            key={versionKey}
                            type="monotone"
                            dataKey={versionKey}
                            name={getVersionLabel(versionKey)}
                            stroke={getLineColor(versionKey, index)}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            >
                            <LabelList
                                dataKey={versionKey}
                                position="top"
                                formatter={(v) =>
                                Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                }
                            />
                            </Line>
                        ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card> */}
            <Card>
                <CardContent className="h-[420px] pb-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={series}
                            margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
                            barCategoryGap="18%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />

                            {/* Eje izquierdo: Q acumulado */}
                            <YAxis
                                yAxisId="left"
                                width={60}
                                tick={{ fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => formatNumber(v, 0)}
                                label={{
                                    value: "Q acumulado",
                                    angle: -90,
                                    position: "insideLeft",
                                    style: { textAnchor: "middle" },
                                }}
                            />

                            {/* Eje derecho: Monto acumulado */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                width={70}
                                tick={{ fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => formatCompactAmount(v)}
                                label={{
                                    value: "Monto acumulado",
                                    angle: 90,
                                    position: "insideRight",
                                    style: { textAnchor: "middle" },
                                }}
                            />

                            <Tooltip
                                formatter={(value, name, item) => {
                                    const key = String(item?.dataKey || "");
                                    const isAmount = key.includes("_amount_acc");

                                    return [
                                    isAmount ? formatNumber(value, 0) : formatNumber(value, 0),
                                    name,
                                    ];
                                }}
                                labelFormatter={(label) => `Mes: ${label}`}
                            />

                            <Legend wrapperStyle={{ fontSize: 12 }} />

                            {/* Barras: Q acumulado */}
                            {variacion.map((versionKey, index) => {
                                const color = getLineColor(versionKey, index);
                                return (
                                    <Bar
                                        key={`${versionKey}_bar`}
                                        yAxisId="left"
                                        dataKey={`${versionKey}_q_acc`}
                                        name={`${getVersionLabel(versionKey)} Q acum.`}
                                        fill={color}
                                        stroke={color}
                                        fillOpacity={0.82}
                                        radius={[0, 0, 0, 0]}
                                        maxBarSize={18}
                                    />
                                );
                            })}

                            {/* Líneas: Monto acumulado */}
                            {variacion.map((versionKey, index) => {
                                const color = getLineColor(versionKey, index);

                                return (
                                    <Line
                                        key={`${versionKey}_line`}
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey={`${versionKey}_amount_acc`}
                                        name={`${getVersionLabel(versionKey)} Monto acum.`}
                                        stroke={color}
                                        strokeWidth={2.5}
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 5 }}
                                    >
                                    <LabelList
                                        dataKey={`${versionKey}_amount_acc`}
                                        position="top"
                                        formatter={(v) => formatCompactAmount(v)}
                                    />
                                    </Line>
                                );
                            })}
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
    )
}