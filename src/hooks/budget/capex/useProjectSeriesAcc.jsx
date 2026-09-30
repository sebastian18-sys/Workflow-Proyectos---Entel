import { toMM } from "@/lib/helpers";
import { useMemo } from "react";

const MONTHS_SHORT = [
	"Ene","Feb","Mar","Abr","May","Jun","Jul",
	"Ago","Sep","Oct","Nov","Dic",
]

const MONTH_KEYS = {
	"dic 25": 1,
	"ene": 1,
	"enero": 1,
	"feb": 2,
	"febrero": 2,
	"mar": 3,
	"marzo": 3,
	"abr": 4,
	"abril": 4,
	"may": 5,
	"mayo": 5,
	"jun": 6,
	"junio": 6,
	"jul": 7,
	"julio": 7,
	"ago": 8,
	"agosto": 8,
	"sep": 9,
	"set": 9,
	"sept": 9,
	"setiembre": 9,
	"septiembre": 9,
	"oct": 10,
	"octubre": 10,
	"nov": 11,
	"noviembre": 11,
	"dic": 12,
	"diciembre": 12,
}

const monthIndexFromHeader = (header) => {
	if (!header) return null; 
	const h = header.toLowerCase(); //"Dic 24 - AC" "dic 24 - ac"  ------ "Enero - AC" "enero - ac"
	for (const key of Object.keys(MONTH_KEYS)) if (h.includes(key)) return MONTH_KEYS[key];
	return null;
};


export default function useProjectSeriesAcc(data, selectedFcst) {

    // 1) Normaliza y crea mapping label -> key (dataKey para recharts)
    const fcstLabels = useMemo(() => {
        const arr = (selectedFcst ?? []).map(String).map(s => s.trim()).filter(Boolean);
        // unique manteniendo orden
        return [...new Set(arr)];
    }, [selectedFcst]);

    const keyOf = (label) => {
        if (String(label).toLowerCase() === "plan") return "plan";
        return `fcst_${String(label).replace(/\s+/g, "").replace("+", "_")}`; // "1+11" => "fcst_1_11"
    };

    const fcstKeys = useMemo(() => fcstLabels.map(keyOf), [fcstLabels]);

    return useMemo(() => {
        const currentMonth = new Date().getMonth() + 1; // 1..12

        // 2) Meses base (mensual, NO acumulado todavía)
        const months = MONTHS_SHORT.map((m) => {
            const base = { label: m, ac: 0, oc: 0 };
            for (let i = 0; i < fcstLabels.length; i++) base[fcstKeys[i]] = 0;
            return base;
        });

        // 3) Acumulador de CF por fcst seleccionado (para el punto "CF")
        const cfExtra = {};
        for (const k of fcstKeys) cfExtra[k] = 0;

        // Último mes con data real por cada FCST
        const lastMonthByFcst = Object.fromEntries(fcstKeys.map(k => [k, 0]));

        // Último mes global con data real para cortar el eje X
        let lastMonthWithData = 0;

        // 4) Agregación por (jefatura, proyecto, linea) para poder construir el detalle por mes
        //    Guardamos arrays mensuales para luego sacar acumulados por "monthIdx"
        const groupMap = new Map();
        const getGroup = (j, p, l) => {
            const key = `${j}||${p}||${l}`;
            let g = groupMap.get(key);
            if (!g) {
                g = {
                    unidad_funcional: j,
                    proyecto: p,
                    linea: l,
                    acM: Array(12).fill(0),
                    ocM: Array(12).fill(0),
                    fcstM: Object.fromEntries(fcstKeys.map(k => [k, Array(12).fill(0)])),
                    cf: Object.fromEntries(fcstKeys.map(k => [k, 0])),
                };
                groupMap.set(key, g);
            }
            return g;
        };

        // 5) Loop principal: suma AC/OC hasta currentMonth, y suma FCST todo el año (como tu gráfica)
        for (const r of data ?? []) {
            const jef = r.unidad_funcional || "Sin UF";
            const proy = r.project_name || "Sin proyecto";
            const lin = r.investment_line || "Sin línea";
            const g = getGroup(jef, proy, lin);

            // AC mensual (solo hasta mes actual)
            for (const p of r.amounts?.ac?.months ?? []) {
                const idx = monthIndexFromHeader(p.header);
                if (!idx) continue;
                if (idx <= currentMonth) {
                    const v = Number(p.value) || 0;
                    months[idx - 1].ac += v;
                    g.acM[idx - 1] += v;
                }
            }

            // OC mensual (solo hasta mes actual)
            for (const p of r.amounts?.oc?.months ?? []) {
                const idx = monthIndexFromHeader(p.header);
                if (!idx) continue;
                if (idx <= currentMonth) {
                const v = Number(p.value) || 0;
                months[idx - 1].oc += v;
                g.ocM[idx - 1] += v;
                }
            }

            // FCST seleccionados (todo el año)
            for (let i = 0; i < fcstLabels.length; i++) {
                const label = fcstLabels[i];
                const k = fcstKeys[i];
                const f = r.forecasts?.[label];
                const fMonths = f?.fcst?.months ?? [];

                for (const p of fMonths) {
                    // const idx = monthIndexFromHeader(p.header);
                    // if (!idx) continue;
                    // const v = Number(p.value) || 0;
                    // months[idx - 1][k] += v;
                    // g.fcstM[k][idx - 1] += v;

                    // CHANGE 0405
                    const idx = monthIndexFromHeader(p.header);
                    if (!idx) continue;

                    const v = Number(p.value) || 0;
                    months[idx - 1][k] += v;
                    g.fcstM[k][idx - 1] += v;

                    if (v !== 0) {
                        lastMonthByFcst[k] = Math.max(lastMonthByFcst[k], idx);
                    }

                }

                // CF total (se agrega al punto "CF")
                const cf = Number(f?.cf?.total) || 0;
                cfExtra[k] += cf;
                g.cf[k] += cf;
            }
        }

        // 6) Prefijos acumulados por grupo (para calcular rápido por monthIdx)
        const groups = Array.from(groupMap.values()).map((g) => {
            const acP = [];
            const ocP = [];
            let sA = 0, sO = 0;
            for (let i = 0; i < 12; i++) {
                sA += g.acM[i]; acP[i] = sA;
                sO += g.ocM[i]; ocP[i] = sO;
            }

            const fcstP = {};
            for (const k of fcstKeys) {
                const arr = g.fcstM[k];
                const pref = [];
                let s = 0;
                for (let i = 0; i < 12; i++) { s += arr[i]; pref[i] = s; }
                fcstP[k] = pref; // pref[11] = total año (sin CF)
            }

            return { ...g, acP, ocP, fcstP };
        });

        // 7) Builder del árbol detalle para un mes (lazy)
        // monthIdx: 1..12  |  13 => "CF"
        const buildBreakdown = (monthIdx) => {
            const isCF = monthIdx === 13;
            const uptoActual = Math.min(monthIdx, currentMonth); // para AC/OC: no hay futuro
            const uptoFcst = Math.min(monthIdx, 12);            // para FCST: se acumula hasta ese mes
            const ixA = Math.max(uptoActual - 1, 0);
            const ixF = Math.max(uptoFcst - 1, 0);
            const monthLabel = months[monthIdx - 1].label;

            // default comparación: base = Plan si existe, si no el primero
            const baseLabel = fcstLabels.includes("Plan") ? "Plan" : (fcstLabels[0] ?? "Plan");
            const baseKey = keyOf(baseLabel);

            // target default: segundo si existe, si no el primero
            const targetLabel = fcstLabels[1] ?? fcstLabels[0] ?? baseLabel;
            const targetKey = keyOf(targetLabel);

            const byJ = new Map();

            // Totales generales del mes
            const totals = {
                ac: 0,
                oc: 0,
                fcst: Object.fromEntries(fcstKeys.map(k => [k, 0])),
                // resumen cumplimiento/variación por defaults (para header rápido)
                cumplimiento: { meta: 0, ejecutado: 0, pendiente: 0, avancePct: 0, key: targetKey },
                variacion: { baseKey, targetKey, delta: 0, deltaPct: null },
            };

            for (const g of groups) {
                const ac = monthIdx <= currentMonth ? (g.acP[ixA] ?? 0) : (g.acP[currentMonth - 1] ?? 0);
                const oc = monthIdx <= currentMonth ? (g.ocP[ixA] ?? 0) : (g.ocP[currentMonth - 1] ?? 0);

                const fcst = {};
                for (const k of fcstKeys) {
                    const v = isCF
                        ? (g.fcstP[k][11] ?? 0) + (g.cf[k] ?? 0)
                        : (g.fcstP[k][ixF] ?? 0);
                    fcst[k] = v;
                }

                // Inserta en árbol jefatura -> proyecto -> linea
                if (!byJ.has(g.unidad_funcional)) byJ.set(g.unidad_funcional, new Map());
                const byP = byJ.get(g.unidad_funcional);
                if (!byP.has(g.proyecto)) byP.set(g.proyecto, []);
                byP.get(g.proyecto).push({
                    linea: g.linea,
                    ac,
                    oc,
                    fcst,
                });

                totals.ac += ac;
                totals.oc += oc;
                for (const k of fcstKeys) totals.fcst[k] += fcst[k];
            }

            // estructura final
            const tree = [];
            for (const [unidad_funcional, projMap] of byJ.entries()) {
                const projects = [];
                for (const [proyecto, lines] of projMap.entries()) {
                    projects.push({ proyecto, lines });
                }
                tree.push({ unidad_funcional, projects });
            }

            // Resumen “cumplimiento” default usando targetKey
            const meta = totals.fcst[targetKey] ?? 0;
            const ejecutado = totals.ac ?? 0;
            const pendiente = Math.max(meta - ejecutado, 0);
            const avancePct = meta > 0 ? (ejecutado / meta) : 0;
            totals.cumplimiento = { key: targetKey, meta, ejecutado, pendiente, avancePct };

            // Resumen “variación” default base vs target
            const base = totals.fcst[baseKey] ?? 0;
            const targ = totals.fcst[targetKey] ?? 0;
            const delta = targ - base;
            const deltaPct = base !== 0 ? (delta / base) : null;
            totals.variacion = { baseKey, targetKey, delta, deltaPct };

            return {
                monthLabel,
                monthIdx,
                isCF,
                baseLabel,
                targetLabel,
                baseKey,
                targetKey,
                tree,
                totals,
                // helper para UI: lista de series disponibles
                series: fcstLabels.map((lbl, i) => ({ label: lbl, key: fcstKeys[i] })),
            };
        };

        // 8) Acumulado global
        let accAC = 0, accOC = 0;

        const accF = Object.fromEntries(fcstKeys.map(k => [k, 0]));

        // console.log("accF", accF)

        const accumulated = months.map((m, i) => {
            const monthIdx = i + 1;

            if (monthIdx <= currentMonth) {
                accAC += m.ac;
                accOC += m.oc;
            }

            for (const k of fcstKeys) accF[k] += (m[k] || 0);

            const point = {
                month: m.label,
                ac: monthIdx <= currentMonth ? Number(toMM(accAC).toFixed(1)) : null,
                oc: monthIdx <= currentMonth ? Number(toMM(accOC).toFixed(1)) : null,
            };

            // solo keys seleccionadas
            // CHANGE 0405
            // for (const k of fcstKeys) point[k] = Number(toMM(accF[k]).toFixed(1));
            // for (const k of fcstKeys) {
            //     point[k] =
            //         monthIdx <= lastMonthByFcst[k]
            //             ? Number(toMM(accF[k]).toFixed(1))
            //             : null;
            // }
            for (const k of fcstKeys) {
                const hasCF = (cfExtra[k] || 0) !== 0;
                const hasDataUntilThisMonth = monthIdx <= lastMonthByFcst[k];

                point[k] =
                    hasDataUntilThisMonth || hasCF
                        ? Number(toMM(accF[k]).toFixed(1))
                        : null;
            }

            point.details = {
                month: m.label,
                monthIdx,
                // getter lazy para el dialog
                getBreakdown: () => buildBreakdown(monthIdx),
            };

            return point;
        });

        // 9) Punto CF (solo FCST, AC/OC null como tu código)
        const cfPoint = { month: "CF", ac: null, oc: null };
        // for (const k of fcstKeys) {
        //     const last = accF[k] || 0;
        //     cfPoint[k] = Number(toMM(last + (cfExtra[k] || 0)).toFixed(1));
        // }

        // CHANGE 0405
        for (const k of fcstKeys) {
            const cf = cfExtra[k] || 0;
            const last = accF[k] || 0;

            cfPoint[k] =
                cf !== 0
                    ? Number(toMM(last + cf).toFixed(1))
                    : null;
        }

        cfPoint.details = {
            month: "CF",
            monthIdx: 13,
            getBreakdown: () => buildBreakdown(13),
        };

        // console.log("accumulated", accumulated)
        // console.log("cfPoint", cfPoint)

        return [...accumulated, cfPoint];

        // CHANGE 0405
        // Corta los meses hasta el último mes con data real
        // const chartMonths = accumulated.slice(0, Math.max(lastMonthWithData, 1));

        // // Solo mostrar CF si realmente agrega valor distinto al último acumulado
        // const shouldShowCF = fcstKeys.some((k) => {
        //     const last = Number(toMM(accF[k] || 0).toFixed(1));
        //     const withCF = Number(toMM((accF[k] || 0) + (cfExtra[k] || 0)).toFixed(1));

        //     return withCF !== last;
        // });

        // if (!shouldShowCF) {
        //     return chartMonths;
        // }

        // return [...chartMonths, cfPoint];

    }, [data, fcstLabels.join("|")]);
}
