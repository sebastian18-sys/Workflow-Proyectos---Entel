import { useEffect, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Briefcase, Check, ChevronDown, ChevronRight, ChevronsUpDown, Copy, Download } from "lucide-react";
import {
	CartesianGrid,
	ComposedChart,
	Line,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
	LabelList,
	BarChart,
	PieChart,
	Pie,
	Cell,
	RadialBarChart,
	PolarAngleAxis,
	RadialBar,
} from "recharts";
import TopProjectsBars from "@/components/TopProjectsBars/TopProjectsBars";
import { MultiSelect } from "@/components/ui/_multiselect";
import { useProjectsCapex } from "@/hooks/budget/capex/useProjectsCapex";
import { fmt1, fmtMoney, formatCurrency, roundPartsToMatchTotal, toMM, unique } from "@/lib/helpers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import useProjectTotalsAcc from "@/hooks/budget/capex/useProjectTotalsAcc";
import { COLORS_FCST, KEY_FCST } from "@/constants/constants";
import useProjectSeriesAcc from "@/hooks/budget/capex/useProjectSeriesAcc";
import { useProvisionesCapex } from "@/hooks/budget/capex/useProvisionesCapex";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardAssign from "@/components/DashboardAssign/DashboardAssign";
import SelectFilter from "@/components/ui/_select3";
import MultiSelectFilter from "@/components/ui/_multiselect3";
import useHtmlToImage from "@/hooks/useHtmlToImage";

/** ===== Utilidades de meses ===== */
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

const monthIndexFromHeader = (header) => {
	if (!header) return null; 
	const h = header.toLowerCase(); //"Dic 24 - AC" "dic 24 - ac"  ------ "Enero - AC" "enero - ac"
	for (const key of Object.keys(MONTH_KEYS)) if (h.includes(key)) return MONTH_KEYS[key];
	return null;
};

/** ===== Helpers ===== */
const num = (v) => {
	if (v == null) return 0;
	if (typeof v === "number") return v;
	const cleaned = String(v).replace(/[^0-9.,-]/g, "");
	const normalized = cleaned.replace(/,/g, "");
	const parsed = Number(normalized);
	return isNaN(parsed) ? 0 : parsed;
};

/** ===== Filas de la tabla (agrupado por proyecto → investment_line) ===== */
function useProjectRows(data, fcsts) {

	const fcstLast = fcsts[fcsts.length - 1]
	const fcstKeys = fcsts.map(fcst => `fcst${fcst}`); // ej: "fcst3+12", "fcst6+18", ...

	return useMemo(() => {

		// Proyectos
		const byProj = new Map();
		for (const r of data) {
			const arr = byProj.get(r.project_name) || []; arr.push(r); byProj.set(r.project_name, arr);
		}

		const rows = [];

		for (const [project_name, items] of byProj.entries()) {
			const project_code = items?.[0]?.project_code
			const sumAC = items.reduce((s, it) => s + (it.amounts?.ac?.total ?? 0), 0);
			const sumOC = items.reduce((s, it) => s + (it.amounts?.oc?.total ?? 0), 0);
			const sumF = (k) => items.reduce((s, it) => s + ((it.forecasts?.[k]?.fcst?.total ?? 0) + (it.forecasts?.[k]?.cf?.total ?? 0)), 0);
			const sumSOLPE = items.reduce((s, it) => s + num(it.solpe ?? it.solpe_original ?? 0), 0);
			const currentMonth = new Date().getMonth() + 1
			const sumSobregiro = items.reduce((s, it) => s + (it.exceso_por_comprometer ?? 0), 0);

			const sumFcstLastMonth = (list) => list.reduce((s, it) => {
				let sumMonth = 0
				for (const m of it.forecasts?.[fcstLast]?.fcst?.months ?? []) {
					const idx = monthIndexFromHeader(m.header);
					if (idx >= 0 && idx <= currentMonth) {
						sumMonth += m.value
					}
				}
				return s + sumMonth
			}, 0);

			const fcstLastMonth = sumFcstLastMonth(items);

			// Build parent object
			const parent = {
				key: project_name,
				project_name,
				project_code,
				solpe: sumSOLPE,
				oc: sumOC,
				ptto_disponible: sumSOLPE - sumOC,
				sobregiro: sumSobregiro,
				ac: sumAC,
				fcstmes: fcstLastMonth,
				pendFcst: fcstLastMonth - sumAC,
				cumplimiento_fcst: sumF("9+3") != 0 ? sumAC / sumF("9+3") * 100 : 0,
				cumplimiento_mes: fcstLastMonth != 0 ? sumAC / fcstLastMonth * 100 : 0,
				children: [],
			};

			// push key in parent from fcsts array
			fcsts.forEach(fcst => {
				parent[`fcst${fcst}`] = sumF(fcst)
			})

			// Agrupar por linea de inversion
			const byLine = new Map();
			for (const it of items) {
				const arr = byLine.get(it.investment_line) || []; arr.push(it); byLine.set(it.investment_line, arr);
			}

			for (const [inv, list] of byLine.entries()) {

				const sumFcstLastMonth = (list) => list.reduce((s, it) => {
					let sumMonth = 0
					for (const m of it.forecasts?.[fcstLast]?.fcst?.months ?? []) {
						const idx = monthIndexFromHeader(m.header);
						if (idx >= 0 && idx <= currentMonth) {
							sumMonth += m.value
						}
					}
					return s + sumMonth
				}, 0);

				
				const solpe_child = list.reduce((s, it) => s + num(it.solpe ?? it.solpe_original ?? 0), 0)
				const oc_child = list.reduce((s, it) => s + (it.amounts?.oc?.total ?? 0), 0)
				const ac_child = list.reduce((s, it) => s + (it.amounts?.ac?.total ?? 0), 0)
				const fcst_child = list.reduce((s, it) => s + ((it.forecasts?.[fcstLast]?.fcst?.total ?? 0) + (it.forecasts?.[fcstLast]?.cf?.total ?? 0)), 0)

				const ptto_disponible_child = solpe_child - oc_child
				const sobregiro_child = list.reduce((s, it) => s + (it.exceso_por_comprometer ?? 0), 0)
				const fcstLastMonth = sumFcstLastMonth(list);

				const cumpl_fcst_child = fcst_child != 0 ? (ac_child / fcst_child) * 100 : 0
				const cumpl_mes_child = fcstLastMonth != 0 ? (ac_child / fcstLastMonth) * 100 : 0
				
				const child = {
					key: `${project_name}__${inv}`,
					project_name: inv,
					solpe: solpe_child,
					oc: oc_child,
					ptto_disponible_child: ptto_disponible_child,
					sobregiro_child: sobregiro_child,
					ac: ac_child,
					fcstmes: fcstLastMonth,
					pendFcst: fcstLastMonth - ac_child,
					
					cumplimiento_fcst_child: cumpl_fcst_child,
					cumplimiento_mes_child: cumpl_mes_child,

					children: [],
				};

				fcsts.forEach(fcst => {
					child[`fcst${fcst}`] = list.reduce((s, it) => s + ((it.forecasts?.[fcst]?.fcst?.total ?? 0) + (it.forecasts?.[fcst]?.cf?.total ?? 0)), 0)
				})

				parent.children.push(child);
		}

			parent.children.sort((a,b)=> b.ac - a.ac);
			rows.push(parent);
		}

		rows.sort((a,b)=> b.ac - a.ac);

		const totals = rows.reduce((acc, r) => {

			acc.solpe     += (r.solpe ?? 0);
			acc.sobregiro += (r.sobregiro ?? 0);
			acc.fcstmes   += (r.fcstmes ?? 0);
			acc.oc        += (r.oc ?? 0);
			acc.ac        += (r.ac ?? 0);
			acc.pendFcst  += (r.pendFcst ?? 0);

			// campos dinámicos (fcsts)
			for (const k of fcstKeys) {
				acc[k] += (r[k] ?? 0);
			}

			return acc

		}, { 
			solpe:0, 
			sobregiro:0, 
			fcstmes:0, 
			oc:0, 
			ac:0,
			pendFcst:0,
			...Object.fromEntries(fcstKeys.map(k => [k, 0])), 
		});

		// Totales
		const totalsRow = {
			key: "__TOTAL__",
			project_name: "TOTAL",
			solpe: totals.solpe,
			oc: totals.oc,
			ptto_disponible: totals.solpe - totals.oc,
			sobregiro: totals.sobregiro,
			ac: totals.ac,
			fcstmes: totals.fcstmes,
			pendFcst: totals.pendFcst,
			cumplimiento_fcst: totals.fcst618 != 0 ? (totals.ac / totals.fcst913) * 100 : 0,
			cumplimiento_mes: totals.fcstmes != 0 ? (totals.ac / totals.fcstmes) * 100 : 0,
			children: [],
		};

		fcsts.forEach(fcst => {
			totalsRow[`fcst${fcst}`] = totals[`fcst${fcst}`]
		})

		return { rows, totalsRow };
	}, [data]);
}

// LABELS
function useVariaciones(data, selectedFcst) {

	const fcst = selectedFcst[selectedFcst.length - 1]

	return useMemo(() => {

		const currentMonth = new Date().getMonth() + 1; // 1..12
		const sumFcst = (list) => list.reduce((s, it) => s + ((it.forecasts?.[fcst]?.fcst?.total ?? 0) + (it.forecasts?.[fcst]?.cf?.total ?? 0)), 0);
		
		const sumFcstLastMonth = (list) => list.reduce((s, it) => {
			let sumMonth = 0
			for (const m of it.forecasts?.[fcst]?.fcst?.months ?? []) {
				const idx = monthIndexFromHeader(m.header);
				if (idx >= 0 && idx <= currentMonth) {
					sumMonth += m.value
				}
			}
			return s + sumMonth
		}, 0);

		const totalAC = data.reduce((s, it) => s + (it.amounts?.ac?.total ?? 0), 0);
		const totalOC = data.reduce((s, it) => s + (it.amounts?.oc?.total ?? 0), 0);
		const totalSolpe = data.reduce((s, it) => s + (Number(it.solpe) ?? 0), 0);

		const totalFcst = sumFcst(data);
		const totalFcstLastMonth = sumFcstLastMonth(data);

		const totals = {
			vsOC: totalAC - totalOC,
			vs618: totalAC - totalFcst,
			oc: totalOC,
			ac: totalAC,
			solpe: totalSolpe,
			fcst: totalFcst,
			ptto_disponible: totalSolpe - totalOC,
			fcstLastMonth: totalFcstLastMonth,
			percentajeVsSolpe: totalSolpe != 0 ? (totalAC / totalSolpe) * 100 : 0,
			percentajeVsOC: totalOC != 0 ? (totalAC / totalOC) * 100 : 0,
			percentajeVsFCST: totalFcst != 0 ? (totalAC / totalFcst) * 100 : 0,
			percentajeVsFcstLastMonth: totalFcstLastMonth != 0 ? (totalAC / totalFcstLastMonth) * 100 : 0
		};

		// por jefatura --- UNIDAD FUNCIONAL
		const map = new Map();

		for (const r of data) {
			const arr = map.get(r.unidad_funcional) || []; arr.push(r); map.set(r.unidad_funcional, arr);
		}

		const byJef = Array.from(map.entries()).map(([jef, list]) => {
			const ac = list.reduce((s, it) => s + (it.amounts?.ac?.total ?? 0), 0);
			const oc = list.reduce((s, it) => s + (it.amounts?.oc?.total ?? 0), 0);
			const fcstLastMonth = sumFcstLastMonth(list);
			const f618 = sumFcst(list);
			return { 
				unidad_funcional: jef, 
				ac: ac,
				oc: oc,
				f618: f618,
				fcstLastMonth: fcstLastMonth,
				vsOC: ac - oc,
				cumplComprometido: oc != 0 ? (ac / oc) * 100 : 0,
				cumplFcstLastMonth: fcstLastMonth != 0 ? (ac / fcstLastMonth) * 100 : 0,
				vs618: ac - fcstLastMonth
			};
		}).sort((a,b) => a.unidad_funcional.localeCompare(b.unidad_funcional));

		return { totals, byJef };
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
	const [gerencia, setGerencia] = useState(["GERENCIA DE CONSTRUCCION E INFRAESTRUCTURA DE RED"]);
	const [gerenciaSponsor, setGerenciaSponsor] = useState([]);
	const [jefatura, setJefatura] = useState([]);
	const [unidadFuncional, setUnidadFuncional] = useState([]);
	const [ano, setAno] = useState("2026");
	const [codProyecto, setCodProyecto] = useState([]);
	const [proyecto, setProyecto] = useState([]);
	const [pm, setPm] = useState([]);
	const [categoria, setCategoria] = useState([]);

	// Helper: Apply filters
	const apply = (omit) => (d) => {
		const byGer = omit === "gerencia" || matchesFilter(gerencia, d.gerencia);
		const byGerSponsor = omit === "gerenciaSponsor" || matchesFilter(gerenciaSponsor, d.gerencia_sponsor_final);
		// const byJef = omit === "jefatura" || matchesFilter(jefatura, d.jefatura);
		const byUFuncional = omit === "unidadFuncional" || matchesFilter(unidadFuncional, d.unidad_funcional);
		const byAno = omit === "ano" || ano === "Todos" || (ano === "CARRYOVER" ? d.tipo === "CARRYOVER" : d.tipo === "Proy.");
		const byCodProy = omit === "codigo" || matchesFilter(codProyecto, d.project_code);
		const byProy = omit === "proyecto" || matchesFilter(proyecto, d.project_name);
		const byPm = omit === "pm" || matchesFilter(pm, d.pm_actual);
		const byCat = omit === "categoria" || matchesFilter(categoria, d.categoria);
		return byGer && byGerSponsor && byUFuncional && byAno && byCodProy && byProy && byPm && byCat;
	};

	const options = {
		gerencias: useMemo(() => unique(data.filter(apply("gerencia")).map(d => d.gerencia)), [data, gerenciaSponsor, unidadFuncional, ano, codProyecto, proyecto, pm, categoria]),
		gerenciasSponsor: useMemo(() => unique(data.filter(apply("gerenciaSponsor")).map(d => d.gerencia_sponsor_final)), [data, gerencia, unidadFuncional, ano, codProyecto, proyecto, pm, categoria]),
		// jefaturas: useMemo(() => unique(data.filter(apply("jefatura")).map(d => d.jefatura)), [data, gerencia, gerenciaSponsor, ano, codProyecto, proyecto, pm, categoria]),
		unidadFuncionales: useMemo(() => unique(data.filter(apply("unidadFuncional")).map(d => d.unidad_funcional)), [data, gerencia, gerenciaSponsor, ano, codProyecto, proyecto, pm, categoria]),
		anos: ["Todos", "CARRYOVER", "2026"],
		codigo: useMemo(() => unique(data.filter(apply("codigo")).map(d => d.project_code)), [data, gerencia, gerenciaSponsor, unidadFuncional, ano, proyecto, pm, categoria]),
		proyectos: useMemo(() => unique(data.filter(apply("proyecto")).map(d => d.project_name)), [data, gerencia, gerenciaSponsor, unidadFuncional, ano, codProyecto, pm, categoria]),
		pms: useMemo(() => unique(data.filter(apply("pm")).map(d => d.pm_actual)), [data, gerencia, gerenciaSponsor, unidadFuncional, ano, codProyecto, proyecto, categoria]),
		categorias: useMemo(() => unique(data.filter(apply("categoria")).map(d => d.categoria)), [data, gerencia, gerenciaSponsor, unidadFuncional, ano, codProyecto, proyecto, pm]),
	};

	const filtered = useMemo(() => data.filter(apply("")), [data, gerencia, gerenciaSponsor, unidadFuncional, ano, codProyecto, proyecto, pm, categoria]);

	return { 
		options, 
		filtered,
		gerencia, setGerencia,
		gerenciaSponsor, setGerenciaSponsor,
		// jefatura, setJefatura,
		unidadFuncional, setUnidadFuncional,
		ano, setAno,
		codProyecto, setCodProyecto,
		proyecto, setProyecto,
		pm, setPm,
		categoria, setCategoria 
	};
}

/** ===== Tooltip ===== */
function ChartTooltip({ active, payload, label }) {

	if (!active || !payload?.length) return null;
	const p = Object.fromEntries(payload.map((x) => [x.name, x.value]));

	return (
		// <div className="rounded-xl border bg-white/95 p-3 text-xs shadow">
		// 	<div className="mb-1 font-medium">{label}</div>
		// 	<div>Acta (AC): <strong>{(p["Acta (AC)"] ?? p.ac)?.toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div>
		// 	<div>Comprometido (OC): <strong>{(p["Comprometido (OC)"] ?? p.oc)?.toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div>
		// 	<div>Plan: <strong>{(p["FCST Plan"] ?? p.Plan)?.toLocaleString(undefined, { maximumFractionDigits: 1 })} M</strong></div>
		// </div>
		<></>
	);
}

function ProvisionesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload ?? {};

    return (
        <div className="rounded-2xl border bg-white p-3 shadow-xl min-w-[220px]">
        <p className="mb-2 text-sm font-semibold text-slate-900">{label || data.category}</p>
        {typeof data.value === "number" && (
            <p className="text-sm text-slate-700">Monto: <span className="font-semibold">{formatCurrency(data.value)}</span></p>
        )}
        {typeof data.data === "string" && (
            <p className="text-sm text-slate-700">En MM: <span className="font-semibold">{data.data}</span></p>
        )}
        </div>
    );

}

const DeltaTagLabel = ({ x, y, width, height, payload, delta, fmt1 }) => {
	if (!Number.isFinite(delta) || delta === 0) return null

	const text = delta > 0 ? `-${fmt1(delta)}` : `+ ${fmt1(Math.abs(delta))}`

	// lo anclamos al final del tramo SOLPE (pendiente)
	const cx = x + width - 50 // extremo derecho del bar "pendiente"
	const cy = y + height / 2

	const boxH = 22
	const boxW = Math.max(30, text.length * 7 + 18) // ancho aproximado
	const left = cx - boxW / 2
	const top = cy - boxH / 2

	return (
		<g transform={`translate(${left}, ${top})`}>
			<rect
				width={boxW}
				height={boxH}
				rx={8}
				ry={8}
				fill="rgba(255,255,255,0.85)"
				stroke="#d1d5db"
			/>
			<text
				x={boxW / 2}
				y={boxH / 2}
				textAnchor="middle"
				dominantBaseline="middle"
				fontSize={12}
				fontWeight={600}
				fill="#374151"
			>
				{text}
			</text>
		</g>
	)
}



function clamp01(x) {
	if (!Number.isFinite(x)) return 0
	return Math.max(0, Math.min(1, x))
}

function fmtMM(x) {
  	return toMM(x).toFixed(1)
}

function deltaBadgeClass(delta) {
	if (delta < 0) return "bg-rose-600 text-white"
	if (delta > 0) return "bg-emerald-600 text-white"
	return "bg-zinc-700 text-white"
}

function deltaPendBadge(delta) {
	if (delta > 0) return "bg-red-100 text-zinc-500"
	if (delta < 0) return "bg-emerald-100 text-zinc-500"
	return "bg-zinc-100 text-zinc-500"
}

function KPI({ label, value }) {
	return (
		<div className="rounded-2xl border border-zinc-200 bg-white p-4">
			<div className="text-xs text-zinc-500">{label}</div>
			<div className="mt-1 text-2xl text-gray-500 font-semibold">{value}</div>
		</div>
	)
}


function buildVariationsTreeSorted(detail, baseKey, targetKey) {
	const tree = detail.tree
		.map((j) => {
			const projects = j.projects
				.map((p) => {
				const lines = p.lines
					.map((l) => {
					const b = l.fcst[baseKey] ?? 0
					const t = l.fcst[targetKey] ?? 0
					const d = t - b
					return { ...l, __base: b, __target: t, __delta: d, __abs: Math.abs(d) }
					})
					.filter((l) => l.__delta !== 0)
					.sort((a, b) => b.__abs - a.__abs) // líneas por |Δ| desc

				const baseP = lines.reduce((s, l) => s + l.__base, 0)
				const targetP = lines.reduce((s, l) => s + l.__target, 0)
				const deltaP = targetP - baseP

				return { ...p, lines, __base: baseP, __target: targetP, __delta: deltaP, __abs: Math.abs(deltaP) }
				})
				.filter((p) => p.lines.length > 0)
				.sort((a, b) => b.__abs - a.__abs) // proyectos por |Δ| desc

			const baseJ = projects.reduce((s, p) => s + p.__base, 0)
			const targetJ = projects.reduce((s, p) => s + p.__target, 0)
			const deltaJ = targetJ - baseJ

			return { ...j, projects, __base: baseJ, __target: targetJ, __delta: deltaJ, __abs: Math.abs(deltaJ) }
		})
		.filter((j) => j.projects.length > 0)
		.sort((a, b) => b.__abs - a.__abs) // jefaturas por |Δ| desc

	return tree
}


function buildComplianceTreeSorted(detail, complianceKey) {

	const tree = detail.tree
		.map((j) => {
		const projects = j.projects
			.map((p) => {
			const lines = p.lines
				.map((l) => {
				const meta = l.fcst[complianceKey] ?? 0
				const ac = l.ac ?? 0
				//   const pend = Math.max(meta - ac, 0)
				const pend = meta - ac
				const pct = meta > 0 ? ac / meta : 0
				return { ...l, __meta: meta, __ac: ac, __pend: pend, __pct: pct }
				})
				// .filter((l) => l.__pend > 0)
				.sort((a, b) => b.__pend - a.__pend) // líneas por pend desc

			const metaP = lines.reduce((s, l) => s + l.__meta, 0)
			const acP = lines.reduce((s, l) => s + l.__ac, 0)
			// const pendP = Math.max(metaP - acP, 0)
			const pendP = metaP - acP
			const pctP = metaP > 0 ? acP / metaP : 0

			return { ...p, lines, __meta: metaP, __ac: acP, __pend: pendP, __pct: pctP }
			})
			// .filter((p) => p.lines.length > 0)
			.sort((a, b) => b.__pend - a.__pend) // proyectos por pend desc

		const metaJ = projects.reduce((s, p) => s + p.__meta, 0)
		const acJ = projects.reduce((s, p) => s + p.__ac, 0)
		// const pendJ = Math.max(metaJ - acJ, 0)
		const pendJ = metaJ - acJ
		const pctJ = metaJ > 0 ? acJ / metaJ : 0

		return { ...j, projects, __meta: metaJ, __ac: acJ, __pend: pendJ, __pct: pctJ }
		})
		// .filter((j) => j.projects.length > 0)
		.sort((a, b) => b.__pend - a.__pend) // jefaturas por pend desc

	return tree
}


/** ====== totales por jefatura/proyecto usando keys seleccionadas ====== */
function buildAgg(detail, complianceKey, baseKey, targetKey) {
	// Cumplimiento (meta vs AC)
	const metaTotal = detail.totals.fcst[complianceKey] ?? 0
	const ejecutadoTotal = detail.totals.ac ?? 0
	const pendienteTotal = Math.max(metaTotal - ejecutadoTotal, 0)
	const avancePctTotal = metaTotal > 0 ? clamp01(ejecutadoTotal / metaTotal) : 0

	// Variación
	const baseTotal = detail.totals.fcst[baseKey] ?? 0
	const targetTotal = detail.totals.fcst[targetKey] ?? 0
	const deltaTotal = targetTotal - baseTotal
	const deltaPctTotal = baseTotal !== 0 ? deltaTotal / baseTotal : null

	// Para barras por jefatura (base vs target)
	const byJ = detail.tree.map((j) => {
		let base = 0, target = 0
		for (const p of j.projects) {
			for (const l of p.lines) {
				base += l.fcst[baseKey] ?? 0
				target += l.fcst[targetKey] ?? 0
			}
		}
		return { name: j.jefatura, base: toMM(base), target: toMM(target) }
	})

	return {
		cumplimiento: { metaTotal, ejecutadoTotal, pendienteTotal, avancePctTotal },
		variacion: { baseTotal, targetTotal, deltaTotal, deltaPctTotal },
		chartByJ: byJ,
	}
}


function calculatePriviones(data) {
	const SCALE = 100;



	const totals = data.reduce(
		(acc, it) => {
			const prov = it.provision_real;
			const rq = it.importe_rq;
			const fact = it.importe_facturado;

			const ejecutado = prov - (rq - fact);
			const devuelto = (it.estado_oc === "Cerrada" || it.estado_co === "Cerrada para Recepción") && (Math.round(ejecutado) === 0) ? it.provision_real : 0

			acc.provision_int += prov;
			acc.ejecutado_int += ejecutado;
			acc.devuelto += devuelto;

			return acc;
		},
		{ provision_int: 0, ejecutado_int: 0, devuelto: 0 }
	);

	const totalProvisionesMM = fmt1(totals.provision_int);
	const totalEjecutadoMM = fmt1(totals.ejecutado_int);
	const totalDevueltoMM = fmt1(totals.devuelto);
	const totalProvisiones = totals.provision_int;
	const totalEjecutado = totals.ejecutado_int;
	const totalDevuelto = totals.devuelto;

	return {
		totalProvisiones,
		totalProvisionesMM,
		totalEjecutado,
		totalEjecutadoMM,
		totalEjecutadoPerc: totalEjecutadoMM / totalProvisionesMM * SCALE,
		totalDevuelto,
		totalDevueltoMM
	};

}


/** ====== Árbol Cumplimiento ====== */
function ComplianceTree({
	detail,
	complianceKey,
}) {

	const filteredTree = buildComplianceTreeSorted(detail, complianceKey)

	const [openJ, setOpenJ] = useState({})
	const [openP, setOpenP] = useState({})

	return (
		<div className="space-y-3">
		{filteredTree.map((j) => {
			const jKey = `j:${j.jefatura}`
			const jOpen = openJ[jKey] ?? false

			// totales jefatura
			let meta = 0, ac = 0
			for (const p of j.projects) {
			for (const l of p.lines) {
				meta += l.fcst[complianceKey] ?? 0
				ac += l.ac ?? 0
			}
			}
			const pend = Math.max(meta - ac, 0)

			const pct = meta > 0 ? clamp01(ac / meta) : 0

			return (
			<Collapsible
				key={jKey}
				open={jOpen}
				onOpenChange={(v) => setOpenJ((s) => ({ ...s, [jKey]: v }))}
				className="rounded-2xl border border-zinc-200 bg-white"
			>
				<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3">
				<div className="flex items-center gap-2">
					{jOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
					<div className="text-base text-gray-500 font-semibold">{j.jefatura}</div>
				</div>

				<div className="flex items-center gap-3">
					
					<div className="hidden md:block w-56">
						
						<Progress value={pct * 100} className="h-2 [&>*]:bg-blue-300" />
						
					</div>
					<div className="mt-1 text-xs text-zinc-500 text-right">{(pct * 100).toFixed(1)}%</div>
					<Badge className="bg-red-100 text-zinc-500 hover:bg-white">
						Pend: {fmtMM(pend)}
					</Badge>
				</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="px-4 pb-4">
				<div className="space-y-3">
					{j.projects.map((p) => {
					const pKey = `p:${j.jefatura}:${p.proyecto}`
					const pOpen = openP[pKey] ?? false

					let metaP = 0, acP = 0
					for (const l of p.lines) {
						metaP += l.fcst[complianceKey] ?? 0
						acP += l.ac ?? 0
					}
					// const pendP = Math.max(metaP - acP, 0)
					const pendP = metaP - acP
					const pctP = metaP > 0 ? clamp01(acP / metaP) : 0

					return (
						<Collapsible
							key={pKey}
							open={pOpen}
							onOpenChange={(v) => setOpenP((s) => ({ ...s, [pKey]: v }))}
							className="rounded-xl border border-zinc-200 bg-white/4"
						>
							<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2">
								<div className="flex items-center gap-2">
									{pOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
									<div className="text-sm">{p.proyecto}</div>
								</div>
								<div className="flex items-center gap-2">
									{/* <div className="hidden lg:block w-40">
										<Progress value={pctP * 100} className="h-2" />
									</div> */}
									{/* <Badge className="bg-red-100 text-zinc-500 hover:bg-white">
										Pend: {fmtMM(pendP)}
									</Badge> */}
									<Badge className={deltaPendBadge(pendP)}>
										Pend: {fmtMM(pendP)}
									</Badge>
								</div>
							</CollapsibleTrigger>

							<CollapsibleContent className="px-3 pb-3">
								<div className="rounded-xl border border-zinc-200 overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-zinc-200">
											<TableHead className="text-zinc-700">Línea</TableHead>
											<TableHead className="text-right text-zinc-700">Meta (MM)</TableHead>
											<TableHead className="text-right text-zinc-700">Comprometido (MM)</TableHead>
											<TableHead className="text-right text-zinc-700">Ejecutado (MM)</TableHead>
											<TableHead className="text-right text-zinc-700">Pend. (MM)</TableHead>
											<TableHead className="text-right text-zinc-700">% Av</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
									{p.lines.map((l) => {
										const metaL = l.fcst[complianceKey] ?? 0
										const ocL = l.oc ?? 0
										const acL = l.ac ?? 0
										const pendL = Math.max(metaL - acL, 0)
										const pctL = metaL > 0 ? clamp01(acL / metaL) : 0
										return (
										<TableRow key={l.linea} className="border-zinc-200">
											<TableCell className="font-medium">{l.linea}</TableCell>
											<TableCell className="text-right">{fmtMM(metaL)}</TableCell>
											<TableCell className="text-right">{fmtMM(ocL)}</TableCell>
											<TableCell className="text-right">{fmtMM(acL)}</TableCell>
											<TableCell className="text-right">{fmtMM(pendL)}</TableCell>
											<TableCell className="text-right">{(pctL * 100).toFixed(1)}%</TableCell>
										</TableRow>
										)
									})}
									</TableBody>
								</Table>
								</div>
							</CollapsibleContent>
						</Collapsible>
					)
					})}
				</div>
				</CollapsibleContent>
			</Collapsible>
			)
		})}
		</div>
	)
}

/** ====== Árbol Variaciones ====== */
function VariationsTree({
	detail,
	baseKey,
	targetKey,
}) {

	const filteredTree = buildVariationsTreeSorted(detail, baseKey, targetKey)
	const [openJ, setOpenJ] = useState({})
	const [openP, setOpenP] = useState({})

	return (
		<div className="space-y-3">
		{filteredTree.map((j) => {
			const jKey = `j:${j.jefatura}`
			const jOpen = openJ[jKey] ?? false

			let base = 0, target = 0
			for (const p of j.projects) {
			for (const l of p.lines) {
				base += l.fcst[baseKey] ?? 0
				target += l.fcst[targetKey] ?? 0
			}
			}
			const delta = target - base

			return (
			<Collapsible
				key={jKey}
				open={jOpen}
				onOpenChange={(v) => setOpenJ((s) => ({ ...s, [jKey]: v }))}
				className="rounded-2xl border border-zinc-200 bg-white"
			>
				<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3">
				<div className="flex items-center gap-2">
					{jOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
					<div className="text-base text-gray-500 font-semibold">{j.jefatura}</div>
				</div>
				<Badge className={deltaBadgeClass(delta)}>{delta > 0 ? "+" : ""}{fmtMM(delta)}</Badge>
				</CollapsibleTrigger>

				<CollapsibleContent className="px-4 pb-4">
				<div className="space-y-3">
					{j.projects.map((p) => {
					const pKey = `p:${j.jefatura}:${p.proyecto}`
					const pOpen = openP[pKey] ?? false

					let baseP = 0, targetP = 0
					for (const l of p.lines) {
						baseP += l.fcst[baseKey] ?? 0
						targetP += l.fcst[targetKey] ?? 0
					}
					const deltaP = targetP - baseP

					return (
						<Collapsible
						key={pKey}
						open={pOpen}
						onOpenChange={(v) => setOpenP((s) => ({ ...s, [pKey]: v }))}
						className="rounded-xl border border-zinc-200 bg-white/4"
						>
						<CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2">
							<div className="flex items-center gap-2">
							{pOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
							<div className="text-sm">{p.proyecto}</div>
							</div>
							<Badge className={deltaBadgeClass(deltaP)}>{deltaP > 0 ? "+" : ""}{fmtMM(deltaP)}</Badge>
						</CollapsibleTrigger>

						<CollapsibleContent className="px-3 pb-3">
							<div className="rounded-xl border border-zinc-200 overflow-x-auto">
							<Table>
								<TableHeader>
								<TableRow className="border-zinc-200">
									<TableHead className="text-zinc-700">Línea</TableHead>
									<TableHead className="text-right text-zinc-700">Base (MM)</TableHead>
									<TableHead className="text-right text-zinc-700">Target (MM)</TableHead>
									<TableHead className="text-right text-zinc-700">Δ (MM)</TableHead>
									<TableHead className="text-right text-zinc-700">%Δ</TableHead>
								</TableRow>
								</TableHeader>
								<TableBody>
								{p.lines.map((l) => {
									const b = l.fcst[baseKey] ?? 0
									const t = l.fcst[targetKey] ?? 0
									const d = t - b
									const dp = b !== 0 ? d / b : null
									return (
									<TableRow key={l.linea} className="border-zinc-200">
										<TableCell className="font-medium">{l.linea}</TableCell>
										<TableCell className="text-right">{fmtMM(b)}</TableCell>
										<TableCell className="text-right">{fmtMM(t)}</TableCell>
										<TableCell className="text-right">
										<Badge className={deltaBadgeClass(d)}>{d > 0 ? "+" : ""}{fmtMM(d)}</Badge>
										</TableCell>
										<TableCell className="text-right">{dp == null ? "-" : `${(dp * 100).toFixed(1)}%`}</TableCell>
									</TableRow>
									)
								})}
								</TableBody>
							</Table>
							</div>
						</CollapsibleContent>
						</Collapsible>
					)
					})}
				</div>
				</CollapsibleContent>
			</Collapsible>
			)
		})}
		</div>
	)
}


function FcstDetailsDialog({ open, onOpenChange, detail }) {

	const series = detail?.series ?? []

	// defaults
	const defaultComplianceKey = series[series.length - 1]?.key ?? series[0]?.key ?? "plan"
	
	const [complianceKey, setComplianceKey] = useState(defaultComplianceKey)

	const defaultBaseKey = detail?.baseKey ?? (series.find(s => s.key === "plan")?.key ?? series[0]?.key ?? "plan")
	const defaultTargetKey = detail?.targetKey ?? (series[1]?.key ?? series[0]?.key ?? defaultBaseKey)
	const [baseKey, setBaseKey] = useState(defaultBaseKey)
	const [targetKey, setTargetKey] = useState(defaultTargetKey)

	// re-sync cuando cambia el mes (detail)
	useEffect(() => {
		const dComp = series[series.length - 1]?.key ?? series[0]?.key ?? "plan"
		setComplianceKey(dComp)

		const dBase = detail?.baseKey ?? (series.find(s => s.key === "plan")?.key ?? series[0]?.key ?? "plan")
		const dTarget = detail?.targetKey ?? (series[1]?.key ?? series[0]?.key ?? dBase)
		setBaseKey(dBase)
		setTargetKey(dTarget)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detail?.monthIdx])

	const agg = useMemo(() => {
		if (!detail) return null
		return buildAgg(detail, complianceKey, baseKey, targetKey)
	}, [detail, complianceKey, baseKey, targetKey])

	const comp = agg?.cumplimiento
	const vari = agg?.variacion
	const chartByJ = agg?.chartByJ ?? []

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-7xl p-0 overflow-hidden">
				<div className="bg-white text-zinc-900">
					<DialogHeader className="p-6 ">
						<div className="flex items-start justify-between gap-4">
							<div>
								<DialogTitle className="text-2xl text-[#2b7fff]">Detalle {MONTHS_COMPLETE[detail?.monthLabel ?? detail?.monthIdxLabel ?? "—"]}</DialogTitle>
							</div>
						</div>
					</DialogHeader>

					<Separator className="bg-zinc-200" />

					<ScrollArea className="h-[78vh]">
						<div className="p-6">
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{/* ===== LEFT: CUMPLIMIENTO ===== */}
							<div className="space-y-4">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<div className="text-lg font-semibold text-blue-400 mb-4"> Cumplimiento del FCST</div>
								</div>

								<Select value={complianceKey} onValueChange={setComplianceKey}>
								<SelectTrigger className="h-10 w-[180px] bg-white border-zinc-200">
									<SelectValue placeholder="FCST" />
								</SelectTrigger>
								<SelectContent>
									{series.map((s) => (
									<SelectItem key={s.key} value={s.key}>
										{s.label}
									</SelectItem>
									))}
								</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
								<KPI label="Meta (MM)" value={comp ? fmtMM(comp.metaTotal) : "-"} />
								<KPI label="Ejecutado (MM)" value={comp ? fmtMM(comp.ejecutadoTotal) : "-"} />
								<KPI label="Pendiente (MM)" value={comp ? fmtMM(comp.pendienteTotal) : "-"} />
								<KPI label="% Avance" value={comp ? `${(comp.avancePctTotal * 100).toFixed(1)}%` : "-"} />
							</div>

							<div className="rounded-2xl border border-zinc-200 bg-white p-4">
								<div className="flex items-center justify-between text-sm text-zinc-700">
								<span>Avance total</span>
								<span className="text-zinc-500">
									{comp ? `${fmtMM(comp.ejecutadoTotal)} / ${fmtMM(comp.metaTotal)}` : "-"}
								</span>
								</div>
								<Progress value={(comp?.avancePctTotal ?? 0) * 100} className="mt-3 h-3 [&>*]:bg-blue-500"/>
							</div>

							{detail ? <ComplianceTree detail={detail} complianceKey={complianceKey} /> : null}
							</div>

							{/* ===== RIGHT: VARIACIONES ===== */}
							<div className="space-y-4">
							<div className="space-y-1">
								<div className="text-lg font-semibold text-blue-400 mb-8">Variaciones del FCST</div>
							</div>

							<div className="grid grid-cols-1 gap-3 md:grid-cols-1">
								{/* comparacion */}
								<div className="rounded-2xl border border-zinc-200 bg-white p-4">
									<div className="text-sm text-zinc-500 mb-3">Comparación</div>

									<div className="flex gap-2">
										<Select value={baseKey} onValueChange={setBaseKey}>
										<SelectTrigger className="h-10 bg-white border-zinc-200">
											<SelectValue placeholder="Base" />
										</SelectTrigger>
										<SelectContent>
											{series.map((s) => (
											<SelectItem key={s.key} value={s.key}>
												{s.label}
											</SelectItem>
											))}
										</SelectContent>
										</Select>

										<Select value={targetKey} onValueChange={setTargetKey}>
										<SelectTrigger className="h-10 bg-white border-zinc-200">
											<SelectValue placeholder="Target" />
										</SelectTrigger>
										<SelectContent>
											{series.map((s) => (
											<SelectItem key={s.key} value={s.key}>
												{s.label}
											</SelectItem>
											))}
										</SelectContent>
										</Select>
										<Badge className="bg-white text-zinc-500 hover:bg-white">Δ total (MM)</Badge>
										<Badge className={deltaBadgeClass(vari?.deltaTotal ?? 0) }>
											{(vari?.deltaTotal ?? 0) > 0 ? "+" : ""}
											{vari ? fmtMM(vari.deltaTotal) : "-"}
										</Badge>
									</div>

								</div>

								{/* chart */}
								<div className="rounded-2xl border border-zinc-200 bg-white p-4">
									<div className="text-sm text-zinc-500">Variación por jefatura (MM)</div>
									<div className="mt-3 h-72 w-full">
										<ResponsiveContainer width="100%" height="100%">
										<BarChart data={chartByJ} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
											<CartesianGrid strokeDasharray="3 3" opacity={0.15} />
											<XAxis dataKey="name" tick={{ fontSize: 11 }} />
											<YAxis tick={{ fontSize: 11 }} />
											{/* <Tooltip
												contentStyle={{
													background: "#fff",
													border: "1px solid rgba(255,255,255,0.12)",
													color: "white",
												}}
											/> */}
											<Legend />
											<Bar 
												dataKey="target" 
												name={series.find(s => s.key === targetKey)?.label ?? "Target"} 
												radius={[2, 2, 0, 0]}
												fill={COLORS_FCST[series.find(s => s.key === targetKey)?.label]} 
											>
												<LabelList
													dataKey="target"
													position="top"
													fill="#000"
													fontSize={12}
													fontWeight={600}
													formatter={(value) => `${(value).toFixed(1)}`}
												/>
											</Bar>
											<Bar 
												dataKey="base" 
												name={series.find(s => s.key === baseKey)?.label ?? "Base"} 
												radius={[2, 2, 0, 0]} 
												fill={COLORS_FCST[series.find(s => s.key === baseKey)?.label]}
											>
												<LabelList
													dataKey="base"
													position="top"
													fill="#000"
													fontSize={12}
													fontWeight={600}
													formatter={(value) => `${(value).toFixed(1)}`}
												/>
											</Bar>
										</BarChart>
										</ResponsiveContainer>
									</div>
								</div>
							</div>

							{detail ? <VariationsTree detail={detail} baseKey={baseKey} targetKey={targetKey} /> : null}
							</div>
						</div>
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
			</Dialog>
	)
}

function ToolTipSummaryBar({ active, labelTotal, total, labelAvance, avance }) {

  if (!active) return null

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
		<div className="space-y-1.5">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
					<span className="text-sm text-muted-foreground">{labelAvance}</span>
				</div>
				<span className="text-sm font-medium text-foreground">{fmt1(avance)} MM</span>
			</div>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
					<span className="text-sm text-muted-foreground">{labelTotal}</span>
				</div>
				<span className="text-sm font-medium text-foreground">{fmt1(total)} MM</span>
			</div>
		</div>
    </div>
  )
}

function RadialProgress({ 
	value, 
	label, 
	subLabel,
	color = "#10b981",
	size = 120 
}) {

	const data = [{ value: Math.min(value, 100), fill: color }]
	
	return (
		<div className="flex flex-col items-center">
		<div style={{ width: size, height: size }} className="relative">
			<ResponsiveContainer width="100%" height="100%">
				<RadialBarChart
					cx="50%"
					cy="50%"
					innerRadius="70%"
					outerRadius="100%"
					barSize={10}
					data={data}
					startAngle={90}
					endAngle={-270}
				>
					<PolarAngleAxis
					type="number"
					domain={[0, 100]}
					angleAxisId={0}
					tick={false}
					/>
					<RadialBar
					background={{ fill: "#e5e7eb" }}
					dataKey="value"
					cornerRadius={5}
					angleAxisId={0}
					/>
				</RadialBarChart>
			</ResponsiveContainer>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
			<span className="text-xl font-bold" style={{ color }}>
				{value.toFixed(1)}%
			</span>
			</div>
		</div>
		<div className="mt-2 text-center">
			<p className="text-sm font-medium text-foreground">{label}</p>
			<p className="text-xs text-muted-foreground">{subLabel}</p>
		</div>
		</div>
	)
}

function SemiRadialProgress({ 
	value, 
	label, 
	subLabel,
	color = "#10b981",
	size = 120 
}) {

	const remaining = 100 - value
	const data = [
		{ name: "avance", value: value },
		{ name: "restante", value: remaining <= 0 ? 0.0001 : remaining }, // evita bugs visuales
	]
	
	return (
		<div className="flex flex-col items-center">
			<div style={{ width: size, height: size }} className="relative">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							innerRadius={45}
							outerRadius={60}
							barSize={10}
							data={data}
							dataKey="value"
							cx="50%"
							cy="70%"
							startAngle={180}
							endAngle={0}
							paddingAngle={0}
							
						>
							<Cell fill={color} />
							<Cell fill="#e5e7eb" />
						</Pie>
					</PieChart>
				</ResponsiveContainer>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-xl font-bold" style={{ color }}>
					{value.toFixed(1)}%
				</span>
				</div>
			</div>
			<div className="text-center">
				<p className="text-sm font-medium text-muted-foreground">{label}</p>
				<p className="text-xs text-muted-foreground">{subLabel}</p>
			</div>
		</div>
	)
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

/** Celda dinero (en MM, 1 decimal) */
const MoneyCell = ({ value, muted }) => (
  	<span className={muted ? "text-muted-foreground" : undefined}>{fmt1(value)}</span>
);


export default function DashboardCapex() {

	// Options MULTISELECT
	const forecasts = [
		{ key: "plan", label: "Plan", value: "Plan" },
		{ key: "fcst111", label: "1+11", value: "1+11" },
		{ key: "fcst210", label: "2+10", value: "2+10" },
		{ key: "fcst39", label: "3+9", value: "3+9" },
		{ key: "fcst48", label: "4+8", value: "4+8" },
		{ key: "fcst57", label: "5+7", value: "5+7" },
		{ key: "fcst66", label: "6+6", value: "6+6" },
		{ key: "fcst75", label: "7+5", value: "7+5" },
		{ key: "fcst84", label: "8+4", value: "8+4" },
		{ key: "fcst913", label: "9+3", value: "9+3" },
		{ key: "fcst102", label: "10+2", value: "10+2" },
		{ key: "fcst1111", label: "11+1", value: "11+1" },
	] 

	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedRow, setSelectedRow] = useState(null);
	const [detail, setDetail] = useState(null);

	function openFromIndex(idx) {
		if (idx == null) return;
		const i = Number(idx);
		const row = series?.[i];

		if (!row) return;
		setSelectedRow(row);
		setDetail(row.details.getBreakdown());
		setSheetOpen(true);
	}

	const handleChartClick = (e) => {
		openFromIndex(e?.activeTooltipIndex);
	};

	// Selected Forecasts
	const [selectedFcst, setSelectedFcst] = useState(["5+7", "6+6"]);

	// Data
	let { projects } = useProjectsCapex()
	let provisiones = useProvisionesCapex()

	projects = projects.filter(p => p.capex_opex === "CAPEX")
	provisiones = calculatePriviones(provisiones)

	// console.log("projects", projects)

	const flt = useFilters(projects);
	const series = useProjectSeriesAcc(flt.filtered, selectedFcst);

	// console.log("series", series)

	const { rows, totalsRow } = useProjectRows(flt.filtered, selectedFcst);

	const variaciones = useVariaciones(flt.filtered, selectedFcst);
	const totals = useProjectTotalsAcc(flt.filtered);

	const solpe = roundPartsToMatchTotal([toMM(totals.solpeHW), toMM(totals.solpeSV)]);

	const oc = roundPartsToMatchTotal([toMM(totals.ocHW), toMM(totals.ocSV)]);
	const ac = roundPartsToMatchTotal([toMM(totals.acHW), toMM(totals.acSV)]);

	const [openPP, setOpenPP] = useState(false);
	const [openCP, setOpenCP] = useState(false);
	const [open, setOpen] = useState(new Set());

  	const toggle = (k) => setOpen((prev) => { 
		const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); 
		return n; 
	});

	const { chartExportRef, isExporting, exportMode, handleDownloadChart, handleCopyChart } = useHtmlToImage();

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

			<div className="col-span-12 space-y-3">
				<Tabs className="" defaultValue="General">
					<TabsList className="mb-4">
						<TabsTrigger value="General" className="py-4 px-10 my-2 cursor-pointer">General</TabsTrigger>
						<TabsTrigger value="Asignacion" className="py-4 px-10 my-2 cursor-pointer">Asignación por contrata</TabsTrigger>
					</TabsList>


					<TabsContent value="General">
		
					<div className="grid grid-cols-12 gap-4">
						{/* Filters */}
						<div className="col-span-12 lg:col-span-12 space-y-3">
							<Card className="shadow-sm overflow-hidden p-0">
								<CardHeader className="bg-blue-500 py-3 gap-0">
									<CardTitle className="text-base text-white font-bold tracking-wide">Filtros Avanzados</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 grid gap-4 pb-3 grid-cols-4">
									{/* Gerencia Requisitor */}
									<div>
										<MultiSelectFilter
											label="Gerencia Responsable"
											icon={Briefcase}
											options={flt.options.gerencias}
											selected={flt.gerencia}
											onChange={flt.setGerencia}
											placeholder="Seleccionar"	
										/>
									</div>
									{/* Gerencia Sponsor */}
									<div>
										<MultiSelectFilter
											label="Gerencia Sponsor"
											icon={Briefcase}
											options={flt.options.gerenciasSponsor}
											selected={flt.gerenciaSponsor}
											onChange={flt.setGerenciaSponsor}
											placeholder="Seleccionar"	
										/>
									</div>
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
									{/* Año */}
									<div>
										<SelectFilter
											label="Año"
											icon={Briefcase}
											options={flt.options.anos}
											value={flt.ano}
											onChange={flt.setAno}
											placeholder="Seleccionar"
										/>
									</div>
									{/* Codigo */}
									<div>
										<MultiSelectFilter
											label="Código Proyecto"
											icon={Briefcase}
											options={flt.options.codigo}
											selected={flt.codProyecto}
											onChange={flt.setCodProyecto}
											placeholder="Seleccionar"
										/>
									</div>
									{/* Proyecto */}
									<div>
										<MultiSelectFilter
											label="Proyecto"
											icon={Briefcase}
											options={flt.options.proyectos}
											selected={flt.proyecto}
											onChange={flt.setProyecto}
											placeholder="Seleccionar"
										/>
									</div>
									{/* PM */}
									<div>
										<MultiSelectFilter
											label="PM"
											icon={Briefcase}
											options={flt.options.pms}
											selected={flt.pm}
											onChange={flt.setPm}
											placeholder="Seleccionar"
										/>
									</div>
									{/* Categoría */}
									<div>
										<MultiSelectFilter
											label="Categoría"
											icon={Briefcase}
											options={flt.options.categorias}
											selected={flt.categoria}
											onChange={flt.setCategoria}
											placeholder="Seleccionar"
										/>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* ===== Column Contenido ===== */}
						<div  className="col-span-12 lg:col-span-9 space-y-4">
							<Card className="shadow-sm overflow-hidden p-0">
								<CardHeader className="bg-blue-500 py-3 gap-0 relative inset-0 transition-opacity group-hover:opacity-100">
									<CardTitle className="text-base text-white tracking-wide">Resumen General (Acumulado) — MM</CardTitle>
									<div className="absolute right-3 top-2 flex gap-2 opacity-100 transition-all group-hover:opacity-100">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleCopyChart}
											disabled={isExporting}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
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
								<CardContent className="h-[440px] pb-3">
									
									<ResponsiveContainer ref={chartExportRef} width="100%" height="100%">
										<ComposedChart 
											data={series} 
											margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
											onClick={handleChartClick}
										>
											<CartesianGrid strokeDasharray="3 3" stroke="#fffff" />
											<XAxis dataKey="month" tick={{ fontSize: 12 }} />
											<YAxis tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 })} tick={{ fontSize: 12 }} />
											<Tooltip trigger="click" content={<ChartTooltip />} />
											<Legend wrapperStyle={{ fontSize: 12 }} />

											{/* Barras: AC (azul #002EFF) con etiqueta al centro */}
											<Bar 
												dataKey="ac" 
												name="Acta (AC)" 
												barSize={26} 
												fill="#002EFF"
												isAnimationActive={!exportMode}
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
											<Line 
												type="monotone" 
												dataKey="oc" 
												name="Comprometido (OC)" 
												stroke="#FF3D00" 
												strokeWidth={2} 
												dot={{ r: 0 }}
												isAnimationActive={!exportMode}
												// onClick={(d) => openWithRow(d?.payload)}
											>
												<LabelList content={<LineBadge />} />
											</Line>

											{/* Líneas punteadas FCST con badges */}
											{selectedFcst.map((fcst) => (
												<Line 
													key={fcst}
													type="monotone" 
													dataKey={KEY_FCST[fcst]}
													name={`${fcst !== "Plan" ? "FCST " : ""}${fcst}`}
													stroke={COLORS_FCST[fcst]}
													strokeWidth={2} 
													dot={{ r: 0 }} 
													strokeDasharray="4 4"
													isAnimationActive={!exportMode}
													// onClick={(d) => openWithRow(d?.payload)}
												>
													<LabelList content={<LineBadge />} />
												</Line>
											))}
										</ComposedChart>
									</ResponsiveContainer>
								</CardContent>

								{/* MODAL */}
								<FcstDetailsDialog open={sheetOpen} onOpenChange={setSheetOpen} detail={detail} />

							</Card>

							{/* Pass Data APPLY WITH FILTERS */}
							<TopProjectsBars data={flt.filtered} />

							{/* Bars */}
							<div className="flex flex-1 gap-4 flex-col md:flex-row">
								<Card className="shadow-sm w-full overflow-hidden p-0">
									<CardHeader className="bg-blue-500 py-3 gap-0">
										<CardTitle className="text-base text-white tracking-wide">Ejecución Presupuestal (S/ MM)</CardTitle>
									</CardHeader>
									<CardContent className="h-[360px]">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												data={[
													{ category: 'SOLPE', hardware: solpe[0], servicios: solpe[1] ? solpe[1] : "", total: (solpe[0] + solpe[1]).toFixed(1) },
													{ category: 'Comprometido', hardware: oc[0], servicios: oc[1] !== 0 ? oc[1] : "", total: (oc[0] + oc[1]).toFixed(1) },
													{ category: 'Acta', hardware: ac[0], servicios: ac[1] !== 0 ? ac[1] : "", total: (ac[0] + ac[1]).toFixed(1) },
												]}
												margin={{ top: 40, right: -30, left: -30, bottom: 20 }}
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
													barSize={100}
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
													barSize={100}
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
											</BarChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>
								
							</div>

							{/* Tabla */}
							<Card className="shadow-sm overflow-hidden p-0">	
								<CardHeader className="py-3 bg-blue-500 gap-0">
									<CardTitle className="text-base text-white tracking-wide">Detalle por Proyecto (MM)</CardTitle>
								</CardHeader>
								<CardContent className="pb-3">
									<div className="max-h-[560px] overflow-auto border-t">
										<Table className="w-full">
											<TableHeader className="sticky top-0 z-40 bg-white border-b-2 backdrop-blur">
												<TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
													<TableHead className="sticky top-0 z-40 w-7" />
													<TableHead className="sticky top-0 z-40 text-[#64748B] uppercase">ID</TableHead>
													<TableHead className="sticky top-0 z-40 text-[#64748B] uppercase">Proyecto</TableHead>
													<TableHead className="sticky top-0 z-40 text-right text-[#64748B] uppercase">SOLPE</TableHead>

													{selectedFcst.map((fcst) => (
														<TableHead key={fcst} className="sticky top-0 z-40 text-right text-[#64748B] uppercase">FCST {fcst}</TableHead>
													))}

													<TableHead className="sticky top-0 z-40 text-right text-[#64748B] uppercase">FCST Mes</TableHead>

													<TableHead className="sticky top-0 z-40 text-right text-[#64748B] uppercase">Comprometido</TableHead>
													<TableHead className="sticky top-0 z-40 text-right text-[#64748B] uppercase">Acta</TableHead>

													<TableHead className="sticky top-0 z-40 text-right text-[#64748B] uppercase">Pend FCST Mes</TableHead>

												</TableRow>
											</TableHeader>
											<TableBody>
												{rows.map((r) => (
													<>
														<TableRow className="hover:bg-muted/40">
															<TableCell className=" p-0 text-center">
																{r.children.length > 0 ? (
																	<Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggle(r.key)}>
																	{open.has(r.key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
																	</Button>
																) : null}
															</TableCell>

															<TableCell className=" font-medium text-slate-800"><span className="block whitespace-normal min-w-[80px]">{r.project_code}</span></TableCell>
															<TableCell className=" font-medium text-slate-800"><span className="block whitespace-normal min-w-[420px]">{r.project_name}</span></TableCell>
															
															<TableCell className=" text-center"><MoneyCell value={r.solpe} /></TableCell>

															{selectedFcst.map((fcst) => (
																<TableCell key={fcst} className=" text-center"><MoneyCell value={r[`fcst${fcst}`]} /></TableCell>
															))}

															<TableCell className=" text-center"><MoneyCell value={r.fcstmes} /></TableCell>

															<TableCell className=" text-center"><MoneyCell value={r.oc} /></TableCell>							
															<TableCell className=" text-center"><MoneyCell value={r.ac} /></TableCell>

															<TableCell className={` text-center ${r.pendFcst < 0 ? "text-emerald-600" : "text-black"}`}><MoneyCell value={r.pendFcst} /></TableCell>

														</TableRow>

														{open.has(r.key) && r.children.map((c) => (
															<TableRow key={c.key} className="hover:bg-muted/30">
																<TableCell />
																<TableCell />
																<TableCell className="pl-6 text-sm text-muted-foreground"><span className="block truncate max-w-[580px]">{c.project_name}</span></TableCell>
																<TableCell className="text-center"><MoneyCell value={c.solpe} muted /></TableCell>
																
																{selectedFcst.map((fcst) => (
																	<TableCell key={fcst} className="text-center"><MoneyCell value={c[`fcst${fcst}`]} muted /></TableCell>
																))}

																<TableCell className="text-center"><MoneyCell value={c.fcstmes} muted /></TableCell>

																<TableCell className="text-center"><MoneyCell value={c.oc} muted /></TableCell>
																<TableCell className="text-center"><MoneyCell value={c.ac} muted /></TableCell>
																
																<TableCell className="text-center"><MoneyCell value={c.pendFcst} muted /></TableCell>

															</TableRow>
														))}
													</>
												))}
												{/* Totales */}
												{/* TOTAL ROW FIXED VERTICAL SCROLL IN TABLE */}
												<TableRow className="font-semibold"></TableRow>
										
												<TableRow className="font-semibold">
													<TableCell />
													<TableCell>TOTAL</TableCell>
													<TableCell />
													<TableCell className="text-center">{fmt1(totalsRow.solpe)}</TableCell>
													
													{selectedFcst.map((fcst) => (
														<TableCell key={fcst} className="text-center">{fmt1(totalsRow[`fcst${fcst}`])}</TableCell>
													))}

													<TableCell className="text-center">{fmt1(totalsRow.fcstmes)}</TableCell>

													<TableCell className="text-center">{fmt1(totalsRow.oc)}</TableCell>
													
													<TableCell className="text-center">{fmt1(totalsRow.ac)}</TableCell>

													<TableCell className="text-center">{fmt1(totalsRow.pendFcst)}</TableCell>

												</TableRow>
											</TableBody>
										</Table>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* KPIs/Etiquetas (placeholder) */}
						<div className="col-span-12 lg:col-span-3 space-y-3">
							<Card className="shadow-sm">
								<CardHeader>
									<CardTitle className="text-sm font-medium text-slate-500">Presupuesto Ejecutado (MM)</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col text-sm gap-3">
									<div className="flex items-center justify-between">
										<span className={variaciones.totals.solpe < 0 ? "text-red-600" : "text-5xl text-emerald-600"}>{(variaciones.totals.percentajeVsSolpe).toFixed(1)} %</span>
									</div>
									{/* Barra de progreso con Recharts */}
									<div className="mt-2 h-8 w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												layout="vertical"
												data={[
													{ 
														name: "Progreso",
														ejecutado: variaciones.totals.ac,
														pendiente: variaciones.totals.solpe - variaciones.totals.ac,
														reduccion: variaciones.totals.solpe - variaciones.totals.fcst,
														incremento: variaciones.totals.fcst - variaciones.totals.solpe
													}
												]}
												margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
												barCategoryGap={0}
											>
											<XAxis type="number" domain={[0, variaciones.totals.solpe]} hide />
											<YAxis type="category" dataKey="name" hide />
											<Tooltip 
												content={<ToolTipSummaryBar labelTotal="SOLPE" total={variaciones.totals.solpe} labelAvance="Ejecutado" avance={variaciones.totals.ac} />} 
											/>
											<Bar
												dataKey="ejecutado"
												stackId="stack"
												fill="#10b981"
												radius={[6, 0, 0, 6]}
												className="cursor-pointer"
											>
												<LabelList
													dataKey="ejecutado"
													position="center"
													fill="#fff"
													fontSize={12}
													fontWeight={600}
													formatter={(value) => `${fmt1(value)}`}
												/>
											</Bar>
											<Bar
												dataKey="pendiente"
												stackId="stack"
												fill="#e5e7eb"
												radius={[0, 6, 6, 0]}
											>
												<LabelList
													dataKey="pendiente"
													position="center"
													fill="#6b7280"
													fontSize={12}
													fontWeight={500}
													formatter={(value) => `${fmt1(value + variaciones.totals.ac)}`}
												/>
												<LabelList
													dataKey="pendiente"
													position="insideRight"
													content={(value) => (
														<DeltaTagLabel
															{...value}
															delta={variaciones.totals.solpe - variaciones.totals.fcst}
															fmt1={fmt1}
														/>
													)}				
												/>
											</Bar>

											{(variaciones.totals.solpe - variaciones.totals.fcst) > 0 && (
												<Bar dataKey="reduccion" stackId="stack" fill="#7c2d12" radius={[0, 6, 6, 0]} />
											)}

											</BarChart>
										</ResponsiveContainer>

									</div>
									{/* Leyenda */}
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<span className="h-3 w-3 rounded-sm bg-emerald-500" />
											<span className="text-muted-foreground">Ejecutado</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="h-3 w-3 rounded-sm bg-gray-200" />
											<span className="text-muted-foreground">SOLPE</span>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* 2) Variaciones Totales (ajusta a filtros) */}
							<Card className="shadow-sm">
								<CardHeader className="">
									<CardTitle className="text-sm font-medium text-slate-500">Variaciones Comprometido (MM)</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm">

									{/* Gráfico de dona con información central */}
									<div className="flex lg:flex-col 2xl:flex-row flex-col items-center gap-4">
										<div className="relative h-32 w-32">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={[
															{ name: "Comprometido", value: variaciones.totals.oc, fill: "#FF3D00" },
															{ name: "Disponible", value: variaciones.totals.ptto_disponible, fill: "#e5e7eb" },
														]}
														cx="50%"
														cy="50%"
														innerRadius={36}
														outerRadius={52}
														paddingAngle={2}
														dataKey="value"
														strokeWidth={0}
													>
													{[
														{ name: "Comprometido", value: variaciones.totals.oc, fill: "#FF3D00" },
														{ name: "Disponible", value: variaciones.totals.ptto_disponible, fill: "#e5e7eb" },
													].map((entry, index) => (
														<Cell key={`cell-${index}`} fill={entry.fill} />
													))}
													</Pie>
												</PieChart>
											</ResponsiveContainer>
											{/* Texto central */}
											<div className="absolute inset-0 flex flex-col items-center justify-center">
												<span className="text-lg font-bold text-foreground">{fmt1(variaciones.totals.solpe)}</span>
												<span className="text-xs text-muted-foreground">SOLPE</span>
											</div>
										</div>

										{/* Leyenda del gráfico de dona */}
										<div className="flex-1 space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="h-3 w-3 rounded-full bg-[#FF3D00]" />
													<span className="text-sm text-muted-foreground">OC</span>
												</div>
												<span className="text-sm font-semibold text-foreground">{fmt1(variaciones.totals.oc)}</span>
											</div>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="h-3 w-3 rounded-full bg-gray-200" />
													<span className="text-sm text-muted-foreground">Disponible</span>
												</div>
												<span className="text-sm font-semibold text-foreground">{fmt1(variaciones.totals.ptto_disponible)}</span>
											</div>
										</div>
									</div>

									{/* Separador */}
									<div className="border-t" />

									{/* Sección de ejecución del comprometido */}
									<div className="space-y-3">
										<div className="flex items-baseline justify-between">
											<span className="text-sm text-sm font-medium text-slate-500 text-foreground">Ejecución del Comprometido</span>
											<span className="text-xl text-emerald-600">{(variaciones.totals.percentajeVsOC).toFixed(1)} %</span>
										</div>

										{/* Barra de progreso */}
										<div className="h-8 w-full">
											<ResponsiveContainer width="100%" height="100%">
											<BarChart
												layout="vertical"
												data={[
													{
														name: "Ejecución",
														ejecutado: variaciones.totals.ac,
														pendiente: variaciones.totals.oc - variaciones.totals.ac
													}
												]}
												margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
												barCategoryGap={0}
											>
												<XAxis type="number" domain={[0, 100]} hide />
												<YAxis type="category" dataKey="name" hide />
												<Tooltip
													cursor={false}
													content={<ToolTipSummaryBar labelTotal="Comprometido" total={variaciones.totals.oc} labelAvance="Ejecutado" avance={variaciones.totals.ac}  />}
												/>
												<Bar dataKey="ejecutado" stackId="stack" fill="#10b981" radius={[6, 0, 0, 6]} className="cursor-pointer">
													<LabelList
														dataKey="ejecutado"
														position="center"
														fill="#fff"
														fontSize={12}
														fontWeight={600}
														formatter={(value) => `${fmt1(value)}`}
													/>
												</Bar>
												<Bar dataKey="pendiente" stackId="stack" fill="#e5e7eb" radius={[0, 6, 6, 0]} className="cursor-pointer">
													<LabelList
														dataKey="pendiente"
														position="center"
														fill="#6b7280"
														fontSize={12}
														fontWeight={500}
														formatter={(value) => `${fmt1(value + variaciones.totals.ac)}`}
													/>
												</Bar>

											</BarChart>
											</ResponsiveContainer>
										</div>

										{/* Leyenda de la barra */}
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-2">
											<span className="h-3 w-3 rounded-sm bg-emerald-500" />
											<span className="text-muted-foreground">Ejecutado</span>
											<span className="font-medium text-foreground">{fmt1(variaciones.totals.ac)}</span>
											</div>
											<div className="flex items-center gap-2">
											<span className="h-3 w-3 rounded-sm bg-[#e5e7eb]" />
											<span className="text-muted-foreground">Pendiente</span>
											<span className="font-medium text-red-500">{fmt1(variaciones.totals.vsOC)}</span>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* 3) Varaciones FCST */}
							<Card className="shadow-sm">
								<CardHeader className="">
									<CardTitle className="text-sm font-medium text-slate-500">Cumplimiento Ejecución Presupuestal (MM)</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm">
									{/* Gráficos radiales */}
									<div className="flex lg:flex-col 2xl:flex-row flex-col items-center justify-around">
										<RadialProgress
											value={variaciones.totals.percentajeVsFCST}
											label="FCST Total"
											subLabel={`${fmt1(variaciones.totals.fcst)} MM`}
											color="#3b82f6"
										/>
										<RadialProgress
											value={variaciones.totals.percentajeVsFcstLastMonth}
											label="FCST Mes"
											subLabel={`${fmt1(variaciones.totals.fcstLastMonth)} MM`}
											color="#10b981"
										/>
									</div>
								</CardContent>
							</Card>

							{/* 3) Variaciones por Jefatura */}
							<Card className="shadow-sm">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium text-slate-500">Variaciones por Unidad Funcional (%)</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4 text-sm">
										{variaciones.byJef.map((j) => (
											<div className="space-y-2" key={j.unidad_funcional}>
												<div className="text-center bg-[#696969] py-1 rounded-lg text-white font-medium mb-3">{j.unidad_funcional || "(sin jefatura)"}</div>
												<div>Ejecutado: <span className="font-medium">{fmt1(j.ac)} MM</span></div>
												{/* Gráficos radiales */}
												<div className="flex lg:flex-col 2xl:flex-row flex-col items-center justify-around">
													<SemiRadialProgress
														value={j.cumplComprometido}
														label="Comprometido"
														subLabel={`${fmt1(j.oc)} MM`}
														color="#FF3D00"
													/>
													<SemiRadialProgress
														value={j.cumplFcstLastMonth}
														label="FCST Mes"
														subLabel={`${fmt1(j.fcstLastMonth)} MM`}
														color="#10b981"
													/>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
					</TabsContent>

					<TabsContent value="Asignacion">
						<DashboardAssign />
					</TabsContent>
				</Tabs>
			</div>	
		</div>
    )
}