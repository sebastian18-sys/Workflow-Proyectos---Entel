import { MultiSelect } from "@/components/ui/_multiselect";
import MultiSelectFilter from "@/components/ui/_multiselect3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COLORS_FCST, KEY_FCST } from "@/constants/constants";
import { useOpex } from "@/hooks/budget/capex/useOpex";
import { fmt1, toMM, unique } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { ArrowLeft, Briefcase, Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** ===== Utilidades de meses ===== */

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

const MONTHS_COMPLETE = {
	"Ene": "Enero",
	"Feb": "Febrero",
	"Mar": "Marzo",
	"Abr": "Abril",
	"May": "Mayo",
	"Jun": "Junio",
	"Jul": "Julio",
	"Ago": "Agosto",
	"Sep": "Septiembre",
	"Oct": "Octubre",
	"Nov": "Noviembre",
	"Dic": "Diciembre",
	"CF": "CF",
}

/** ===== Helpers ===== */
const num = (v) => {
	if (v == null) return 0;
	if (typeof v === "number") return v;
	const cleaned = String(v).replace(/[^0-9.,-]/g, "");
	const normalized = cleaned.replace(/,/g, "");
	const parsed = Number(normalized);
	return isNaN(parsed) ? 0 : parsed;
};

const monthIndexFromHeader = (header) => {
	if (!header) return null; 
	const h = header.toLowerCase(); //"Dic 24 - AC" "dic 24 - ac"  ------ "Enero - AC" "enero - ac"
	for (const key of Object.keys(MONTH_KEYS)) if (h.includes(key)) return MONTH_KEYS[key];
	return null;
};


function useProjectSeriesAcc(data, selectedFcst) {

    // console.log("DATAAAAAAAAAAAAAAA", data)
    // console.log("SELECTEDFCST", selectedFcst)

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

    // console.log("FCST KEYS", fcstKeys)

    // console.log("fcstKeys", fcstKeys)

    return useMemo(() => {
        const currentMonth = new Date().getMonth() - 1; // 1..12

        // 2) Meses base (mensual, NO acumulado todavía)
        const months = MONTHS_SHORT.map((m) => {
            const base = { label: m, ac: 0, oc: 0 };
            for (let i = 0; i < fcstLabels.length; i++) base[fcstKeys[i]] = 0;
            return base;
        });

        // 3) Acumulador de CF por fcst seleccionado (para el punto "CF")
        // const cfExtra = {};
        // for (const k of fcstKeys) cfExtra[k] = 0;

        // 4) Agregación por (jefatura, proyecto, linea) para poder construir el detalle por mes
        //    Guardamos arrays mensuales para luego sacar acumulados por "monthIdx"
        const groupMap = new Map();
        const getGroup = (j, p) => {
            const key = `${j}||${p}`;
            let g = groupMap.get(key);
            if (!g) {
                g = {
                    estructura: j,
                    subestructura: p,
                    acM: Array(12).fill(0),
                    ocM: Array(12).fill(0),
                    fcstM: Object.fromEntries(fcstKeys.map(k => [k, Array(12).fill(0)])),
                    // cf: Object.fromEntries(fcstKeys.map(k => [k, 0])),
                };
                groupMap.set(key, g);
            }
            return g;
        };

        // 5) Loop principal: suma AC/OC hasta currentMonth, y suma FCST todo el año (como tu gráfica)
        for (const r of data ?? []) {
            const jef = r.estructura || "Sin estructura";
            const proy = r.subestructura || "Sin subestructura";
            const g = getGroup(jef, proy);

            // AC mensual (solo hasta mes actual)
            for (const p of r.amounts?.real?.months ?? []) {
                const idx = monthIndexFromHeader(p.header);
                if (!idx) continue;
                if (idx <= currentMonth) {
                    const v = Number(p.value) || 0;
                    months[idx - 1].ac += v;
                    g.acM[idx - 1] += v;
                }
            }

            // OC mensual (solo hasta mes actual)
            for (const p of r.amounts?.provision?.months ?? []) {
                const idx = monthIndexFromHeader(p.header);

                // console.log("idx", idx)

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

                // console.log("label", label)

                // console.log("LABEL", label)

                const f = r.amounts?.[label];

                const fMonths = f?.months ?? [];
                
                for (const p of fMonths) {
                    const idx = monthIndexFromHeader(p.header);
                    if (!idx) continue;
                    const v = Number(p.value) || 0;
                    months[idx - 1][k] += v;
                    g.fcstM[k][idx - 1] += v;
                }

                // CF total (se agrega al punto "CF")
                // const cf = Number(f?.cf?.total) || 0;
                // cfExtra[k] += cf;
                // g.cf[k] += cf;
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
                if (!byJ.has(g.estructura)) byJ.set(g.estructura, new Map());
                const byP = byJ.get(g.estructura);
                if (!byP.has(g.subestructura)) byP.set(g.subestructura, []);
                byP.get(g.subestructura).push({
                    // linea: g.linea,
                    ac,
                    oc,
                    fcst,
                });

                totals.ac += ac;
                totals.oc += oc;
                for (const k of fcstKeys) totals.fcst[k] += fcst[k];
            }

            // Construye estructura final
            // const tree = [];
            // for (const [jefatura, projMap] of byJ.entries()) {
            //     const projects = [];
            //     for (const [proyecto, lines] of projMap.entries()) {
            //         projects.push({ proyecto, lines });
            //     }
            //     tree.push({ jefatura, projects });
            // }

            // Resumen “cumplimiento” default usando targetKey (puedes cambiarlo en el Dialog)
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
                // tree,
                totals,
                // helper para UI: lista de series disponibles
                series: fcstLabels.map((lbl, i) => ({ label: lbl, key: fcstKeys[i] })),
            };
        };

        // 8) Acumulado global para el gráfico (con keys dinámicas)
        let accAC = 0, accOC = 0;
        const accF = Object.fromEntries(fcstKeys.map(k => [k, 0]));

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
            for (const k of fcstKeys) point[k] = Number(toMM(accF[k]).toFixed(1));

            point.details = {
                month: m.label,
                monthIdx,
                // getter lazy para el dialog
                getBreakdown: () => buildBreakdown(monthIdx),
            };

            return point;
        });

        // 9) Punto CF (solo FCST, AC/OC null como tu código)
        // const cfPoint = { month: "CF", ac: null, oc: null };
        // for (const k of fcstKeys) {
        //     const last = accF[k] || 0;
        //     cfPoint[k] = Number(toMM(last + (cfExtra[k] || 0)).toFixed(1));
        // }
        // cfPoint.details = {
        //     month: "CF",
        //     monthIdx: 13,
        //     getBreakdown: () => buildBreakdown(13),
        // };

        // return [...accumulated, cfPoint];
        return [...accumulated];
    }, [data, fcstLabels.join("|")]); // si prefieres, usa JSON.stringify(fcstLabels)
}


function useVariaciones(data) {

    return useMemo(() => {

        const currentMonth = new Date().getMonth() + 1; // 1..12
        // const currentMonth = new Date().getMonth(); // 1..12
        // const currentMonth = new Date().getMonth() - 1; // 1..12
        const sumFcst = (list) => list.reduce((s, it) => s + ((it.amounts?.["Plan"]?.total ?? 0)), 0);
        
        const sumFcstLastMonth = (list) => list.reduce((s, it) => {
            let sumMonth = 0
            for (const m of it.amounts?.["Plan"]?.months ?? []) {
                const idx = monthIndexFromHeader(m.header);
                if (idx >= 0 && idx <= currentMonth) {
                    sumMonth += m.value
                }
            }
            return s + sumMonth
        }, 0);

        const totalAC = data.reduce((s, it) => s + (it.amounts?.real?.total ?? 0), 0);
        const totalOC = data.reduce((s, it) => s + (it.amounts?.provision?.total ?? 0), 0);
        // const totalSolpe = data.reduce((s, it) => s + (Number(it.solpe) ?? 0), 0);

        const totalFcst = sumFcst(data);
        const totalFcstLastMonth = sumFcstLastMonth(data);

        const totals = {
            vsOC: totalAC - totalOC,
            vs618: totalAC - totalFcst,
            oc: totalOC,
            ac: totalAC,
            // solpe: totalSolpe,
            fcst: totalFcst,
            // ptto_disponible: totalSolpe - totalOC,
            fcstLastMonth: totalFcstLastMonth,
            // percentajeVsSolpe: totalSolpe != 0 ? (totalAC / totalSolpe) * 100 : 0,
            percentajeVsOC: totalOC != 0 ? (totalAC / totalOC) * 100 : 0,
            percentajeVsFCST: totalFcst != 0 ? (totalAC / totalFcst) * 100 : 0,
            percentajeVsFcstLastMonth: totalFcstLastMonth != 0 ? (totalAC / totalFcstLastMonth) * 100 : 0
        };

        // por jefatura
        // const map = new Map();
        // for (const r of data) {
        //     const arr = map.get(r.jefatura) || []; arr.push(r); map.set(r.jefatura, arr);
        // }
        // const byJef = Array.from(map.entries()).map(([jef, list]) => {
        //     const ac = list.reduce((s, it) => s + (it.amounts?.ac?.total ?? 0), 0);
        //     const oc = list.reduce((s, it) => s + (it.amounts?.oc?.total ?? 0), 0);
        //     const fcstLastMonth = sumFcstLastMonth(list);
        //     const f618 = sumFcst(list);
        //     return { 
        //         jefatura: jef, 
        //         ac: ac,
        //         oc: oc,
        //         f618: f618,
        //         fcstLastMonth: fcstLastMonth,
        //         vsOC: ac - oc,
        //         cumplComprometido: oc != 0 ? (ac / oc) * 100 : 0,
        //         cumplFcstLastMonth: fcstLastMonth != 0 ? (ac / fcstLastMonth) * 100 : 0,
        //         vs618: ac - fcstLastMonth
        //     };
        // }).sort((a,b) => a.jefatura.localeCompare(b.jefatura));

        return { totals };
    }, [data]);
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
    const [estructura, setEstructura] = useState(["O&M Core", "O&M Sitios"]); // ["Alquiler de sitios"]);
    const [subestructura, setSubestructura] = useState([]); // ["Despliegue red"]);
    const [responsable, setResponsable] = useState([]);
    const [proyecto, setProyecto] = useState([]);

    // Helper: Apply filters
    const apply = (omit) => (d) => {
        // const byEst = omit === "estructura" || estructura === "Todos" || d.estructura === estructura;
        const byEst = omit === "estructura" || matchesFilter(estructura, d.estructura);
        // const bySub = omit === "subestructura" || subestructura === "Todos" || d.subestructura === subestructura;
        const bySub = omit === "subestructura" || matchesFilter(subestructura, d.subestructura);
        // const byProy = omit === "proyecto" || proyecto === "Todos" || d.nombre_proyecto === proyecto;
        const byProy = omit === "proyecto" || matchesFilter(proyecto, d.nombre_proyecto);
        // const byResp = omit === "responsable" || responsable === "Todos" || (d.responsable ?? "") === responsable;
        const byResp = omit === "responsable" || matchesFilter(responsable, d.responsable);
        // const byResp = omit === "responsable" || responsable === "Todos" || (d.responsable ?? "") === responsable;
        return byEst && bySub && byProy && byResp
    };

    const options = {
        estructuras: useMemo(() => unique(data.filter(apply("estructura")).map(d => d.estructura)), [data, subestructura, proyecto, responsable]),
        subestructuras: useMemo(() => unique(data.filter(apply("subestructura")).map(d => d.subestructura)), [data, estructura, proyecto, responsable]),
        proyecto: useMemo(() => unique(data.filter(apply("proyecto")).map(d => d.nombre_proyecto)), [data, estructura, subestructura, responsable]),
        responsables: useMemo(() => unique(data.filter(apply("responsable")).map(d => d.responsable)), [data, estructura, subestructura, proyecto]),
    };

    const filtered = useMemo(() => data.filter(apply("")), [data, estructura, subestructura, proyecto, responsable]);

    return { 
        options, 
        filtered,
        estructura, setEstructura,
        subestructura, setSubestructura,
        proyecto, setProyecto,
        responsable, setResponsable
    };
}

function clamp01(x) {
    if (!Number.isFinite(x)) return 0
    return Math.max(0, Math.min(1, x))
}

// function toMM(x) {
//   return x / 1_000_000
// }
function fmtMM(x) {
    return toMM(x).toFixed(1)
}

const MoneyCell = ({ value, muted }) => (
  	<span className={muted ? "text-muted-foreground" : undefined}>{fmt1(value)}</span>
);


function useProjectRows(data, fcsts) {

    const fcstKeys = fcsts.map(fcst => `fcst${fcst}`);

    return useMemo(() => {

        // Proyectos
        const byProj = new Map();
        for (const r of data) {
            const arr = byProj.get(r.nombre_proyecto) || []; arr.push(r); byProj.set(r.nombre_proyecto, arr);
        }

        const rows = [];

        for (const [nombre_proyecto, items] of byProj.entries()) {
            const sumAC = items.reduce((s, it) => s + (it.amounts?.real?.total ?? 0), 0);
            const sumOC = items.reduce((s, it) => s + (it.amounts?.provision?.total ?? 0), 0);
            const sumF = (k) => items.reduce((s, it) => s + ((it.amounts?.[k]?.total ?? 0)), 0);
            // const sumSOLPE = items.reduce((s, it) => s + num(it.solpe ?? it.solpe_original ?? 0), 0);
            // const currentMonth = new Date().getMonth() + 1
            // const sumSobregiro = items.reduce((s, it) => s + (it.exceso_por_comprometer ?? 0), 0);

            // const sumFcstLastMonth = (list) => list.reduce((s, it) => {
            //     let sumMonth = 0
            //     for (const m of it.forecasts?.["9+3"]?.fcst?.months ?? []) {
            //         const idx = monthIndexFromHeader(m.header);
            //         if (idx >= 0 && idx <= currentMonth) {
            //             sumMonth += m.value
            //         }
            //     }
            //     return s + sumMonth
            // }, 0);

            // const fcstLastMonth = sumFcstLastMonth(items);

            // Build parent object
            const parent = {
                key: nombre_proyecto,
                nombre_proyecto,
                // solpe: sumSOLPE,
                oc: sumOC,
                // ptto_disponible: sumSOLPE - sumOC,
                // sobregiro: sumSobregiro,
                ac: sumAC,
                // vs618: 0,
                // fcstmes: fcstLastMonth,
                // cumplimiento_fcst: sumF("9+3") != 0 ? sumAC / sumF("9+3") * 100 : 0,
                // cumplimiento_mes: fcstLastMonth != 0 ? sumAC / fcstLastMonth * 100 : 0,
                children: [],
            };

            // console.log("fcsts =============> ", fcsts)

            // // push key in parent from fcsts array
            fcsts.forEach(fcst => {

                // if(fcst === "2+10") {
                //     fcst = "210"
                // }
                
                // if(fcst === "5+7") {
                //     fcst = "57"
                // }
                parent[`fcst${fcst}`] = sumF(fcst)
            })

            // console.log("parent =============> ", parent)

            // // Group by investment_line
            // const byLine = new Map();
            // for (const it of items) {
            //     const arr = byLine.get(it.investment_line) || []; arr.push(it); byLine.set(it.investment_line, arr);
            // }

            // for (const [inv, list] of byLine.entries()) {

            //     const sumFcstLastMonth = (list) => list.reduce((s, it) => {
            //         let sumMonth = 0
            //         for (const m of it.forecasts?.["9+3"]?.fcst?.months ?? []) {
            //             const idx = monthIndexFromHeader(m.header);
            //             if (idx >= 0 && idx <= currentMonth) {
            //                 sumMonth += m.value
            //             }
            //         }
            //         return s + sumMonth
            //     }, 0);

                
            //     const solpe_child = list.reduce((s, it) => s + num(it.solpe ?? it.solpe_original ?? 0), 0)
            //     const oc_child = list.reduce((s, it) => s + (it.amounts?.oc?.total ?? 0), 0)
            //     const ac_child = list.reduce((s, it) => s + (it.amounts?.ac?.total ?? 0), 0)
            //     const fcst_child = list.reduce((s, it) => s + ((it.forecasts?.["9+3"]?.fcst?.total ?? 0) + (it.forecasts?.["9+3"]?.cf?.total ?? 0)), 0)

            //     const ptto_disponible_child = solpe_child - oc_child
            //     const sobregiro_child = list.reduce((s, it) => s + (it.exceso_por_comprometer ?? 0), 0)
            //     const fcstLastMonth = sumFcstLastMonth(list);

            //     const cumpl_fcst_child = fcst_child != 0 ? (ac_child / fcst_child) * 100 : 0
            //     const cumpl_mes_child = fcstLastMonth != 0 ? (ac_child / fcstLastMonth) * 100 : 0
                
            //     const child = {
            //         key: `${project_name}__${inv}`,
            //         project_name: inv,
            //         solpe: solpe_child,
            //         oc: oc_child,
            //         ptto_disponible_child: ptto_disponible_child,
            //         sobregiro_child: sobregiro_child,
            //         ac: ac_child,
                    
            //         cumplimiento_fcst_child: cumpl_fcst_child,
            //         cumplimiento_mes_child: cumpl_mes_child,

            //         // vs618: 0,
            //         children: [],
            //     };

            //     fcsts.forEach(fcst => {
            //         child[`fcst${fcst}`] = list.reduce((s, it) => s + ((it.forecasts?.[fcst]?.fcst?.total ?? 0) + (it.forecasts?.[fcst]?.cf?.total ?? 0)), 0)
            //     })

            //     // child.vs618 = child.ac - child.fcst618;
            //     parent.children.push(child);
            // }

            // parent.children.sort((a,b)=> b.ac - a.ac);
            rows.push(parent);
        }

        rows.sort((a,b)=> b.ac - a.ac);

        const totals = rows.reduce((acc, r) => {

            // acc.solpe     += (r.solpe ?? 0);
            // acc.sobregiro += (r.sobregiro ?? 0);
            // acc.fcstmes   += (r.fcstmes ?? 0);
            acc.oc        += (r.oc ?? 0);
            acc.ac        += (r.ac ?? 0);

            // campos dinámicos (fcsts)
            for (const k of fcstKeys) {
                acc[k] += (r[k] ?? 0);
            }

            return acc

        }, { 
            // solpe:0, 
            // sobregiro:0, 
            // fcstmes:0, 
            oc:0, 
            ac:0,
            ...Object.fromEntries(fcstKeys.map(k => [k, 0])), 
        });

        // In totals iterate fcsts and add to totals
        const totalsRow = {
            key: "__TOTAL__",
            project_name: "TOTAL",
            solpe: totals.solpe,
            oc: totals.oc,
            // ptto_disponible: totals.solpe - totals.oc,
            // sobregiro: totals.sobregiro,
            ac: totals.ac,
            // cumplimiento_fcst: totals.fcst618 != 0 ? (totals.ac / totals.fcst913) * 100 : 0,
            // cumplimiento_mes: totals.fcstmes != 0 ? (totals.ac / totals.fcstmes) * 100 : 0,
            children: [],
        };

        fcsts.forEach(fcst => {

            // if(fcst === "2+10") {
            //     fcst = "210"
            // }
            
            // if(fcst === "5+7") {
            //     fcst = "57"
            // }

            totalsRow[`fcst${fcst}`] = totals[`fcst${fcst}`]
        })

        return { rows, totalsRow };
    }, [data, fcstKeys]);
}


/** Etiqueta con borde para líneas */
const LineBadge = (props) => {
	const { x, y, value } = props; 
	if (x == null || y == null) return null;
	const text = (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
	const padX = 4, padY = 2; 
	const width = text.length * 6 + padX * 2; 
	const height = 16;
	const rx = 4; 
	const tx = x - width / 2; 
	const ty = (y) - height - 6; // sobre el punto
	return (
		<g>
			<rect x={tx} y={ty} width={width} height={height} rx={rx} ry={rx} stroke="#d1d5db" fill="#ffffff" />
			<text x={x} y={ty + height/2 + 3} textAnchor="middle" fontSize={10} fill="#111827">{text}</text>
		</g>
	);
};


function ChartTooltip({ active, payload, label }) {

	if (!active || !payload?.length) return null;
	const p = Object.fromEntries(payload.map((x) => [x.name, x.value]));

	return (
		<div className="rounded-xl border bg-white/95 p-3 text-xs shadow">
			<div className="mb-1 font-medium">{label}</div>
            <div>Plan: <strong>{(p["Plan"] ?? p.Plan)?.toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div>
			<div>Comprometido: <strong>{(p["Comprometido"] ?? p.ac)?.toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div>
			{/* <div>Provisión: <strong>{(p["Provisión"] ?? p.oc)?.toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div> */}
		</div>
	);
}


export default function DashboardOpex() {

    const forecasts = [
		{ key: "plan", label: "Plan", value: "Plan" },
		{ key: "fcst111", label: "1+11", value: "1+11" },
		{ key: "fcst210", label: "2+10", value: "2+10" },
		{ key: "fcst39", label: "3+9", value: "3+9" },
		{ key: "fcst48", label: "4+8", value: "4+8" },
		{ key: "fcst57", label: "5+7", value: "5+7" },
		{ key: "fcst618", label: "6+6", value: "6+6" },
		{ key: "fcst75", label: "7+5", value: "7+5" },
		{ key: "fcst84", label: "8+4", value: "8+4" },
		{ key: "fcst913", label: "9+3", value: "9+3" },
		{ key: "fcst102", label: "10+2", value: "10+2" },
		{ key: "fcst1111", label: "11+1", value: "11+1" },
	] 

    let { opex } = useOpex()

    // console.log("OPEX", opex)

    const [selectedFcst, setSelectedFcst] = useState(["Plan", "5+7"]);

    const flt = useFilters(opex);

    // console.log("FLT", flt)

    const series = useProjectSeriesAcc(flt.filtered, selectedFcst);
    const variaciones = useVariaciones(flt.filtered);

    const { rows, totalsRow } = useProjectRows(flt.filtered, selectedFcst);

    console.log("ROWS", rows)

    // console.log("SERIES", series)
    // console.log("VARIACIONES", variaciones)

    const [openPP, setOpenPP] = useState(false);


    return (
        
        <div className="grid grid-cols-12 gap-5 px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            
				{/* Left filters */}
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

                {/* Filters */}
				<div className="col-span-12 lg:col-span-12 space-y-3">
					<Card className="shadow-sm overflow-hidden p-0">
						<CardHeader className="bg-blue-500 py-3 gap-0">
							<CardTitle className="text-base text-white tracking-wide">Filtros Avanzados</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 grid gap-4 pb-3 grid-cols-4">
							{/* Estructura */}
							<div>
                                <MultiSelectFilter
                                    label="Estructura"
                                    icon={Briefcase}
                                    options={flt.options.estructuras}
                                    selected={flt.estructura}
                                    onChange={flt.setEstructura}
                                    placeholder="Seleccionar"	
                                />
							</div>
							{/* Subestructura */}
							<div>
                                <MultiSelectFilter
                                    label="Subestructura"
                                    icon={Briefcase}
                                    options={flt.options.subestructuras}
                                    selected={flt.subestructura}
                                    onChange={flt.setSubestructura}
                                    placeholder="Seleccionar"	
                                />
							</div>
							{/* Proyecto */}
							<div>
                                <MultiSelectFilter
                                    label="Proyecto"
                                    icon={Briefcase}
                                    options={flt.options.proyecto}
                                    selected={flt.proyecto}
                                    onChange={flt.setProyecto}
                                    placeholder="Seleccionar"	
                                />
							</div>
							{/* Responsable */}
							<div>
                                <MultiSelectFilter
                                    label="Responsable"
                                    icon={Briefcase}
                                    options={flt.options.responsables}
                                    selected={flt.responsable}
                                    onChange={flt.setResponsable}
                                    placeholder="Seleccionar"	
                                />
							</div>
						</CardContent>
					</Card>
				</div>

                {/* ===== Column Contenido ===== */}
                <div className="col-span-12 lg:col-span-12 space-y-4">
                    <Card className="shadow-sm overflow-hidden p-0">
                        <CardHeader className="bg-blue-500 py-3 gap-0">
                            <CardTitle className="text-base text-white tracking-wide">Resumen General (Acumulado) — MM</CardTitle>
                            
                        </CardHeader>
                        <div className="px-6">
                            <div className="mb-1 text-xs font-medium">FCST</div>
                            <MultiSelect
                                options={forecasts}
                                selected={selectedFcst}
                                onChange={setSelectedFcst}
                                placeholder="Seleccionar FCST"
                            />
                        </div>
                        <CardContent className="h-[480px] pb-3">
                            
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart 
                                    data={series} 
                                    margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
                                    // onClick={handleChartClick}
                                >
                                    {/* None CartesianGrid */}
                                    <CartesianGrid strokeDasharray="3 3" stroke="#fffff" />
                                    {/* <CartesianGrid strokeDasharray="" /> */}
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 })} tick={{ fontSize: 12 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />

                                    {/* Barras: AC (azul #002EFF) con etiqueta al centro */}
                                    <Bar 
                                        dataKey="ac" 
                                        name="Comprometido" 
                                        barSize={26} 
                                        fill="#002EFF"
                                    >
                                        <LabelList 
                                            dataKey="ac" 
                                            position="center" 
                                            formatter={(v) => v.toLocaleString(undefined,{maximumFractionDigits:1})} 
                                            className="text-[10px]" 
                                            fill="#ffffff"
                                        />
                                    </Bar>

                                    {/* Línea OC (naranja #FF3D00) con badges */}
                                    {/* <Line 
                                        type="monotone" 
                                        dataKey="oc" 
                                        name="Provisión" 
                                        stroke="#FF3D00" 
                                        strokeWidth={2} 
                                        dot={{ r: 2 }}
                                        // onClick={(d) => openWithRow(d?.payload)}
                                    >
                                        <LabelList content={<LineBadge />} />
                                    </Line> */}

                                    {/* Líneas punteadas FCST con badges */}
                                    {selectedFcst.map((fcst) => (
                                        <Line 
                                            key={fcst}
                                            type="monotone" 
                                            dataKey={KEY_FCST[fcst]}
                                            name={`${fcst !== "Plan" ? "FCST " : ""}${fcst}`}
                                            stroke={COLORS_FCST[fcst]}
                                            strokeWidth={2} 
                                            dot={{ r: 2 }} 
                                            strokeDasharray="4 4"
                                            // onClick={(d) => openWithRow(d?.payload)}
                                        >
                                            <LabelList content={<LineBadge />} />
                                        </Line>
                                    ))}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>

                        {/* MODAL */}
                        {/* <FcstDetailsDialog open={sheetOpen} onOpenChange={setSheetOpen} detail={detail} /> */}

                        {/* </Dialog> */}
                    </Card>

                    {/* Tabla */}
                <Card className="shadow-sm overflow-hidden p-0">	
                    <CardHeader className="py-3 bg-blue-500 gap-0">
                        <CardTitle className="text-base text-white tracking-wide">Detalle por Proyecto (MM)</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="max-h-[560px] overflow-auto border-t">
                            <Table className=" w-full">
                                <TableHeader className="sticky top-0 z-40 bg-gray-100 border-b backdrop-blur">
                                    <TableRow className="">
                                        <TableHead className="sticky top-0 z-40 text-[#101828] uppercase">Proyecto</TableHead>
                                        {/* <TableHead className="sticky top-0 z-40 text-right text-[#101828] uppercase">SOLPE</TableHead> */}

                                        {selectedFcst.map((fcst) => (
                                            <TableHead key={fcst} className="sticky top-0 z-40 text-right text-[#101828] uppercase">{fcst}</TableHead>
                                        ))}

                                        {/* <TableHead className="sticky top-0 z-40 text-right text-[#101828] uppercase">Provisión</TableHead> */}
                                        <TableHead className="sticky top-0 z-40 text-right text-[#101828] uppercase">Comprometido</TableHead>
                                        {/* <TableHead className="sticky top-0 z-40 text-right text-[#101828] uppercase">Sobregiro</TableHead> */}
                                        {/* <TableHead className="sticky top-0 z-40 text-right text-[#101828] uppercase">Ptto Disponible</TableHead> */}
                                        
                                        {/* <TableHead className="sticky top-0 z-40 text-right text-[#101828] uppercase">Cumplimiento FCST Mes</TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <>
                                            <TableRow className="hover:bg-muted/40">
                                                
                                                <TableCell className=" font-medium"><span className="block truncate min-w-[220px]">{r.nombre_proyecto}</span></TableCell>
                                                {/* <TableCell className=" text-right"><MoneyCell value={r.solpe} /></TableCell> */}

                                                {selectedFcst.map((fcst) => (
                                                    <TableCell key={fcst} className=" text-right"><MoneyCell value={r[`fcst${fcst}`]} /></TableCell>
                                                ))}

                                                {/* <TableCell className=" text-right"><MoneyCell value={r.oc} /></TableCell>							 */}
                                                <TableCell className=" text-right"><MoneyCell value={r.ac} /></TableCell>
                                                {/* <TableCell className={` text-right ${r.sobregiro < 0 ? "text-red-600" : "text-black"}`}><MoneyCell value={r.sobregiro} /></TableCell>
                                                <TableCell className={` text-right ${r.ptto_disponible < 0 ? "text-red-600" : "text-black"}`}><MoneyCell value={r.ptto_disponible} /></TableCell> */}
                                                
                                                {/* <TableCell className=" text-right">
                                                    <span className={r.cumplimiento_mes < 0 ? "text-red-600" : "text-emerald-600"}>
                                                        {r.cumplimiento_mes.toFixed(1)} %
                                                    </span>
                                                </TableCell> */}
                                            </TableRow>
                                        </>
                                    ))}
                                    {/* Totales */}
                                    {/* TOTAL ROW FIXED VERTICAL SCROLL IN TABLE */}
                                    <TableRow className="font-semibold"></TableRow>
                            
                                    <TableRow className="font-semibold">
                                        {/* <TableCell /> */}
                                        <TableCell>TOTAL</TableCell>
                                        {/* <TableCell className="text-right">{fmt1(totalsRow.solpe)}</TableCell> */}
                                        
                                        {selectedFcst.map((fcst) => (
                                            <TableCell key={fcst} className="text-right">{fmt1(totalsRow[`fcst${fcst}`])}</TableCell>
                                        ))}

                                        {/* <TableCell className="text-right">{fmt1(totalsRow.oc)}</TableCell> */}
                                        
                                        <TableCell className="text-right">{fmt1(totalsRow.ac)}</TableCell>
                                        {/* <TableCell className="text-right">{fmt1(totalsRow.sobregiro)}</TableCell> */}
                                        {/* <TableCell className="text-right">{fmt1(totalsRow.ptto_disponible)}</TableCell> */}

                                        {/* <TableCell className="text-right">{(totalsRow.cumplimiento_mes).toFixed(1)} %</TableCell> */}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}