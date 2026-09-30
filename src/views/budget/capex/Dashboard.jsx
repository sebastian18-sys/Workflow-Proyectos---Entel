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
import { ArrowLeft, Briefcase, CalendarDays, Check, ChevronDown, ChevronRight, ChevronsUpDown, CircleDollarSign, Copy, Download, FileText, Info, PoundSterling, SlidersHorizontal, Target, TrendingUp, TriangleAlert, WalletCards } from "lucide-react";
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
	LineChart,
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getAverageWeekReq } from "@/services/capex/getAverageWeekReq";
import { buildNestedData } from "@/lib/transform-data-compliance";
import { Link } from "react-router";

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

const n = (value) => {
  	const parsed = Number(value);
 	return Number.isFinite(parsed) ? parsed : 0;
};

const percentage = (value, total) => (n(total) > 0 ? (n(value) / n(total)) * 100 : 0);
const clampPercentage = (value) => Math.min(100, Math.max(0, n(value)));

const formatMM = (value) =>
	n(value).toLocaleString("es-PE", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});

const selectedFilterCount = (...values) =>
	values.reduce((count, value) => {
		if (Array.isArray(value)) return count + value.length;
		return count + (value ? 1 : 0);
	}, 0);

const getForecastValue = (row, fcst) => {
	const mappedKey = KEY_FCST?.[fcst];

	if (mappedKey && row?.[mappedKey] != null) return row[mappedKey];
	if (row?.[`fcst${fcst}`] != null) return row[`fcst${fcst}`];

	return 0;
};

function formatPct(v) {
	return `${Math.round(n(v))}%`;
}

function calcPct(part, total) {
	const p = n(part);
	const t = n(total);
	if (!t) return 0;
	return (p / t) * 100;
}

/*
 * Color base del heatmap según %CPMT
 * 0%   -> azul muy claro
 * 100% -> violeta intenso
 */
function getHeatColor(pct) {
	const p = Math.max(0, Math.min(100, pct)) / 100;

	// inicio: #EEF4FF
	const start = { r: 238, g: 244, b: 255 };

	// fin: #6D3DF5
	const end = { r: 109, g: 61, b: 245 };

	const r = Math.round(start.r + (end.r - start.r) * p);
	const g = Math.round(start.g + (end.g - start.g) * p);
	const b = Math.round(start.b + (end.b - start.b) * p);

	return `rgb(${r}, ${g}, ${b})`;
}

function getTextColor(pct) {
	return pct >= 55 ? "text-white" : "text-slate-900";
}

function getSoftTextColor(pct) {
	return pct >= 55 ? "text-white/85" : "text-slate-600";
}

function getBadgeClass(pct) {
	return pct >= 55
		? "bg-white/14 border-white/20 text-white"
		: "bg-slate-100 border-slate-200 text-slate-600";
}

function buildMatrixFromQuarterTree(data = []) {

	// console.log("data", data)

	const quarterOrder = data.map((q) => ({
		key: q.id ?? q.nombre,
		label: q.nombre ?? q.id,
	}));

	const ufMap = new Map();

	for (const quarter of data) {
		const quarterKey = quarter.id ?? quarter.nombre;
		const ufChildren = quarter.unidadesFuncionales ?? [];

		for (const uf of ufChildren) {
			const ufKey = uf.id ?? uf.nombre;

			if (!ufMap.has(ufKey)) {
				ufMap.set(ufKey, {
					id: ufKey,
					nombre: uf.nombre ?? uf.id,
					projectCount: 0,
					cells: {},
				});
			}

			const row = ufMap.get(ufKey);

			const fcstTotal = n(uf.fcstTotal);
			const habilitado = n(uf.habilitado ?? uf.solpe); // en tu estructura viene como solpe
			const comprometido = n(uf.comprometido);
			const acta = n(uf.actas);

			const pctCmpt = calcPct(comprometido, fcstTotal);
			// const pctCmpt = calcPct(uf.comprometido, uf.fcstTotal);
			const pctPago = calcPct(acta, fcstTotal);

			row.cells[quarterKey] = {
				fcstTotal,
				habilitado,
				comprometido,
				acta,
				pctCmpt,
				pctPago,
				projectCount: (uf.projects ?? []).length,
			};

			row.projectCount += (uf.projects ?? []).length;
		}
	}

	return {
		quarters: quarterOrder,
		rows: Array.from(ufMap.values()),
	};
}


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
		return { name: j.unidad_funcional, base: toMM(base), target: toMM(target) }
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

function buildMonthGroups(weekly = []) {
    return weekly.reduce((groups, item, index) => {
        const lastGroup = groups[groups.length - 1];

        if (lastGroup?.monthKey === item.monthKey) {
            lastGroup.span += 1;
            lastGroup.endIndex = index;
            return groups;
        }

        groups.push({
            monthKey: item.monthKey,
            monthLabel: item.monthLabel,
            monthYear: item.monthYear,
            startIndex: index,
            endIndex: index,
            span: 1,
        });

        return groups;
    }, []);
}


/** ====== Árbol Cumplimiento ====== */
function ComplianceTree({
	detail,
	complianceKey,
}) {

	const filteredTree = buildComplianceTreeSorted(detail, complianceKey)

	// console.log("detail", detail)
	// console.log("complianceKey", complianceKey)
	// console.log("filteredTree", filteredTree)

	const [openJ, setOpenJ] = useState({})
	const [openP, setOpenP] = useState({})

	return (
		<div className="space-y-3">
		{filteredTree.map((j) => {
			const jKey = `j:${j.unidad_funcional}`
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
					<div className="text-base text-gray-500 font-semibold">{j.unidad_funcional}</div>
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
					const pKey = `p:${j.unidad_funcional}:${p.proyecto}`
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
			const jKey = `j:${j.unidad_funcional}`
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
					<div className="text-base text-gray-500 font-semibold">{j.unidad_funcional}</div>
				</div>
				<Badge className={deltaBadgeClass(delta)}>{delta > 0 ? "+" : ""}{fmtMM(delta)}</Badge>
				</CollapsibleTrigger>

				<CollapsibleContent className="px-4 pb-4">
				<div className="space-y-3">
					{j.projects.map((p) => {
					const pKey = `p:${j.unidad_funcional}:${p.proyecto}`
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
									<div className="text-sm text-zinc-500">Variación por UF (MM)</div>
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


function RadialProgress({ 
	value, 
	label, 
	subLabel,
	color = "#10b981",
	size = 140 
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
			<span className="text-2xl font-bold" style={{ color }}>
				{value.toFixed(1)}%
			</span>
			</div>
		</div>
		<div className="mt-2 text-center">
			<p className="text-sm font-medium text-foreground">{label}</p>
			<p className="text-xs font-bold text-muted-foreground">{subLabel}</p>
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

/** Etiqueta con borde para líneas CON COLISION */
const LineBadge2 = (props) => {
    const { x, y, value, offsetY = -22 } = props;

    if (x == null || y == null || value == null) return null;

    const text = Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    });

    const padX = 4;
    const width = text.length * 6 + padX * 2;
    const height = 16;
    const rx = 4;

    const tx = x - width / 2;
    const centerY = y + offsetY;
    const ty = centerY - height / 2;

    return (
        <g>
            <rect
                x={tx}
                y={ty}
                width={width}
                height={height}
                rx={rx}
                ry={rx}
                stroke="#d1d5db"
                fill="#ffffff"
            />
            <text
                x={x}
                y={centerY + 3}
                textAnchor="middle"
                fontSize={10}
                fill="#111827"
            >
                {text}
            </text>
        </g>
    );
};

const LABEL_HEIGHT = 16;
const LABEL_GAP = 2;
const COLLISION_PX = LABEL_HEIGHT + LABEL_GAP;

const DEFAULT_OFFSET = -14;

// offsets utilizandos en colision
const STACK_OFFSETS = [
    -14,  // arriba, cerca de la línea
     14,  // abajo, cerca de la línea
    -32,  // segundo nivel arriba
     32,  // segundo nivel abajo
    -50,
     50,
    -68,
     68,
];

function buildFcstLabelOffsets({
    series,
    selectedFcst,
    keyFcst,
    chartHeight = 440,
    marginTop = 20,
    marginBottom = 8,
}) {
    const fcstKeys = selectedFcst
        .map((fcst) => keyFcst[fcst])
        .filter(Boolean);

    const result = {};

    if (!fcstKeys.length) return result;

    const allValues = series.flatMap((row) =>
        fcstKeys
            .map((k) => Number(row[k]))
            .filter((v) => Number.isFinite(v))
    );

    const minValue = 0;
    const maxValue = Math.max(...allValues, 0);
    const innerHeight = chartHeight - marginTop - marginBottom;
    const denom = maxValue - minValue || 1;

    const toYPx = (value) =>
        marginTop + innerHeight - ((value - minValue) / denom) * innerHeight;

    series.forEach((row, rowIndex) => {
        const points = fcstKeys
            .map((key) => {
                const value = Number(row[key]);
                if (!Number.isFinite(value)) return null;

                return {
                    key,
                    value,
                    yPx: toYPx(value),
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.yPx - b.yPx); // de arriba hacia abajo

        const rowOffsets = {};

        if (points.length === 0) {
            result[rowIndex] = rowOffsets;
            return;
        }

        let cluster = [points[0]];

        const flushCluster = () => {
            if (cluster.length === 1) {
                // no colisiona
                rowOffsets[cluster[0].key] = DEFAULT_OFFSET;
            } else {
                // colisión: escalonar
                cluster.forEach((item, idx) => {
                    rowOffsets[item.key] =
                        STACK_OFFSETS[idx] ?? (idx % 2 === 0
                            ? -(22 + Math.floor(idx / 2) * 18)
                            : 18 + Math.floor(idx / 2) * 18);
                });
            }
            cluster = [];
        };

        for (let i = 1; i < points.length; i++) {
            const prev = cluster[cluster.length - 1];
            const curr = points[i];

            // Si las posiciones de los puntos están muy cerca,
            if (Math.abs(curr.yPx - prev.yPx) < COLLISION_PX) {
                cluster.push(curr);
            } else {
                flushCluster();
                cluster = [curr];
            }
        }

        flushCluster();
        result[rowIndex] = rowOffsets;
    });

    return result;
}



/** Celda dinero (en MM, 1 decimal) */
const MoneyCell = ({ value, muted }) => (
  	<span className={muted ? "text-muted-foreground" : undefined}>{fmt1(value)}</span>
);

function ForecastSelector({ options, selected, onChange }) {
	const selectedValues = Array.isArray(selected) ? selected : [];

	const toggle = (forecast) => {
		const isSelected = selectedValues.includes(forecast);
		const next = isSelected
			? selectedValues.filter((item) => item !== forecast)
			: [...selectedValues, forecast];

		onChange(next);
	};

	return (
		<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
		{options.map((option) => {
			const value = option.value;
			const active = selectedValues.includes(value);
			const color = COLORS_FCST[value] ?? "#696969";

			return (
				<button
					key={option.key}
					type="button"
					onClick={() => toggle(value)}
					className="flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition hover:-translate-y-px hover:shadow-sm"
					style={{
						borderColor: active ? color : "#E2E8F0",
						backgroundColor: active ? `${color}18` : "#FFFFFF",
						color: active ? color : "#64748B",
					}}
				>
					<span
						className="flex h-4 w-4 items-center justify-center rounded-full border"
						style={{
							borderColor: color,
							backgroundColor: active ? color : "transparent",
						}}
					>
						{active ? <Check className="h-3 w-3 text-white" /> : null}
					</span>
					{option.label}
				</button>
			);
		})}
		</div>
	);
}

function KpiRingCard({
	title,
	subtitle,
	value,
	primaryLabel,
	primaryValue,
	secondaryLabel,
	secondaryValue,
	color,
	icon: Icon,
}) {
	const safeValue = clampPercentage(value);

	return (
		<Card className="min-w-0 overflow-hidden rounded-xl border-slate-200 py-0 shadow-sm">
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-slate-700">{title}</p>
						{/* <p className="mt-1 truncate text-[11px] text-slate-400">{subtitle}</p> */}
						<p className="mt-3 text-[26px] font-bold leading-none" style={{ color }}>
							{fmt1(value)} MM
						</p>
					</div>

					<div
						// className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full p-[6px]"
						// style={{
							// background: `conic-gradient(${color} ${safeValue * 3.6}deg, #E5E7EB 0deg)`,
						// }}
					>
						{/* <div className="flex h-full w-full items-center justify-center rounded-full bg-white"> */}
							<Icon className="h-9 w-9" style={{ color }} />
						{/* </div> */}
					</div>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
					<div className="min-w-0">
						<p className="truncate text-[13px] tracking-wide text-slate-400">
							{primaryLabel}
						</p>
						<p className="mt-1 truncate text-lg font-bold" style={{ color }}>
							{formatMM(primaryValue)}%
						</p>
					</div>
					<div className="min-w-0">
						<p className="truncate text-[13px] tracking-wide text-slate-400">
							{secondaryLabel}
						</p>
						<p className="mt-1 truncate text-lg font-bold text-slate-600">
							{fmt1(secondaryValue)} MM
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function AgingOcCard({ data }) {

	const ranges = data?.ranges ?? []
	const maxAmount = Math.max(...ranges.map((item) => n(item.amountMM)), 1);

	const colors = {
		"0_10": "#4F9F45",
		"11_15": "#F7B500",
		"16_20": "#F59E0B",
		"over_21": "#DC2626",
	}

	return (
		<Card className="rounded-xl border-slate-200 gap-0 py-0 shadow-sm">
			<CardHeader className="relative pt-3">
				<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
					Aging de OC
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 px-5 pb-5 pt-5">
				{ranges.map((item) => (
					<div key={item.key} className="grid grid-cols-[82px_1fr_auto] items-center gap-3">
						<span className="text-xs font-semibold text-slate-600">{item.label}</span>
						<div className="h-3 overflow-hidden rounded-sm bg-slate-100">
							<div
								className="h-full rounded-sm"
								style={{
									width: `${(n(item.amountMM) / maxAmount) * 100}%`,
									backgroundColor: colors[item.key],
								}}
							/>
						</div>
						<span className="min-w-[108px] text-right text-xs font-semibold text-slate-700">
							S/ {formatMM(item.amountMM)} MM ({item.percentage}%)
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function ExecutionProgress({ value, compact = false }) {
	const current = clampPercentage(value);

	const colorRange = current > 90  ? "bg-emerald-500" : current > 70 ? "bg-amber-500" : "bg-red-500";

	return (
		<div className={`flex items-center gap-2 ${compact ? "min-w-[125px]" : "min-w-[165px]"}`}>
			<div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
				<div
					className={`h-full rounded-full ${colorRange}`}
					style={{ width: `${current}%` }}
				/>
			</div>
			<span className="w-12 text-right text-xs font-bold text-slate-600">
				{formatMM(current)}%
			</span>
		</div>
	);
}

function ForecastSolpeVarianceCard({ solpe, fcst }) {
	const solpeValue = n(solpe);
	const fcstValue = n(fcst);

	const variance = fcstValue - solpeValue;
	const absoluteVariance = Math.abs(variance);

	const isReturn = variance < 0;
	const isRequest = variance > 0;

	const statusLabel = isReturn
		? "Devolución Total"
		: isRequest
			? "Pendiente Habilitación"
			: "Sin variación";

	const variancePercentage =
		solpeValue > 0 ? (variance / solpeValue) * 100 : 0;

	/*
	* Se añade un pequeño margen para que el marcador SOLPE
	* no quede pegado al extremo derecho.
	*/
	const chartMaximum = Math.max(solpeValue, fcstValue, 1);

	const fcstWidth = Math.min(
		100,
		(fcstValue / chartMaximum) * 100
	);

	const solpePosition = Math.min(
		100,
		(solpeValue / chartMaximum) * 100
	);

	const fcstPosition = Math.min(
		100,
		(fcstValue / chartMaximum) * 100
	);

	const varianceClass = isReturn
		? "text-orange-600"
		: isRequest
		? "text-emerald-700" 
		: "text-slate-700";

	const greenWidth = isRequest
		? solpePosition
		: fcstPosition;

	const additionalWidth = isRequest
		? Math.max(fcstPosition - solpePosition, 0)
		: 0;

	const markerPosition = isRequest
		? solpePosition
		: fcstPosition;

	return (
		<Card className="overflow-hidden rounded-xl border-slate-200 py-2 gap-2 shadow-sm">
			<CardHeader className="pt-2">
				<CardTitle className="text-sm font-medium text-slate-500">Variaciones FCST vs SOLPE</CardTitle>
			</CardHeader>

			<CardContent className="px-5">
				{/* Resultado principal */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-medium text-slate-500">
							{statusLabel}
						</p>
						<div className={`mt-1 text-3xl font-semibold ${varianceClass}`}>
							{variance > 0 ? "+" : variance < 0 ? "-" : ""}
							{fmt1(absoluteVariance)}
							<span className="ml-1 text-sm font-medium text-slate-400">
								MM
							</span>
						</div>
					</div>
					<div
						className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${varianceClass}`}
					>
						{variancePercentage > 0 ? "+" : ""}
						{formatMM(variancePercentage)}%
					</div>
				</div>

				{/* Bullet chart */}
				<div className="mt-6">
					<div className="mb-2 flex items-center justify-between text-[12px]">
						{/* <span className="font-medium text-slate-500">
							FCST Total
						</span> */}
					</div>
					<div className="relative h-5 rounded-full bg-slate-100">
						{/* Barra FCST */}
						{/* <div
							className="absolute inset-y-0 left-0 rounded-full bg-slate-700 transition-all duration-300"
							style={{
								width: `${fcstWidth}%`,
							}}
						/> */}
						<div
							className="absolute left-0 top-0 h-5 bg-emerald-500 transition-all duration-300"
							style={{
								width: `${greenWidth}%`,
								borderTopLeftRadius: "9999px",
								borderBottomLeftRadius: "9999px",
								borderTopRightRadius: isReturn ? "9999px" : 0,
								borderBottomRightRadius: isReturn ? "9999px" : 0,
							}}
						/>

						{isRequest && additionalWidth > 0 && (
							<div
								className="absolute top-0 h-5 bg-slate-950 transition-all duration-300"
								style={{
									left: `${solpePosition}%`,
									width: `${additionalWidth}%`,
									borderTopRightRadius: "9999px",
									borderBottomRightRadius: "9999px",
								}}
							/>
						)}

						{/* Marcador SOLPE */}
						{/* <div
							className="absolute -top-1 h-7 w-[2px] bg-slate-950"
							style={{
								left: isReturn ? `${fcstPosition}%` : `${solpePosition}%`,
							}}
						>
							<span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-bold text-slate-500">
								{isReturn ? fmt1(fcstValue) : fmt1(solpeValue)} MM
							</span>
						</div> */}
						{/* Marcador de SOLPE */}
						<div
							className="absolute -top-1 h-7 w-[2px] bg-slate-950"
							style={{
								left: `${markerPosition}%`,
								transform: "translateX(-1px)",
							}}
						>
							<span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-bold text-slate-500">
								{isReturn ? fmt1(fcstValue) : fmt1(solpeValue)} MM
							</span>
						</div>
					</div>

					<div className="mt-2 flex items-center justify-between text-[12px] text-slate-400">
						<span>0</span>
						<span>{fmt1(chartMaximum)} MM</span>
					</div>
				</div>

				{/* Valores comparativos */}
				<div className="mt-4 grid grid-cols-2 divide-x border-t border-slate-100 pt-4">
					<div className="pr-4">
						<p className="text-[10px] uppercase tracking-wide text-slate-400">
							SOLPE
						</p>
						<p className="mt-1 text-sm font-bold text-slate-700">
						{fmt1(solpeValue)} MM
						</p>
					</div>

					<div className="pl-4">
						<p className="text-[10px] uppercase tracking-wide text-slate-400">
							FCST total
						</p>
						<p className="mt-1 text-sm font-bold text-slate-700">
						{fmt1(fcstValue)} MM
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function WeeklyAmountTooltip({ active, payload, label }) {
	if (!active || !payload?.length) return null;

	return (
		<div className="rounded-lg border bg-white px-3 py-2 shadow-lg">
			<p className="mb-1 text-xs font-semibold text-slate-700">
				Semana {label}
			</p>

			<p className="text-xs text-slate-500">
				Monto:
				<span className="ml-1 font-semibold text-slate-800">
					S/ {Number(payload[0]?.value ?? 0).toFixed(1)} MM
				</span>
			</p>

			{payload[0]?.payload?.count != null && (
				<p className="mt-0.5 text-[11px] text-slate-400">
					{payload[0].payload.count} registros
				</p>
			)}
		</div>
	);
}

function MonthGroupAxis({ data }) {
    const monthGroups = buildMonthGroups(data);

    if (!data?.length) return null;

    return (
        <div
            className="mt-1 grid px-[5px]"
            style={{
                gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
            }}
        >
            {monthGroups.map((group) => (
                <div
                    key={group.monthKey}
                    className="relative flex min-w-0 justify-center pt-3"
                    style={{
                        gridColumn: `span ${group.span}`,
                    }}
                >
                    {/* Línea horizontal */}
                    <span className="absolute left-1 right-1 top-1 border-t border-slate-300" />

                    {/* Límite izquierdo */}
                    <span className="absolute left-1 top-0 h-3 border-l border-slate-300" />

                    {/* Límite derecho */}
                    <span className="absolute right-1 top-0 h-3 border-r border-slate-300" />

                    <span className="text-[10px] font-medium text-slate-500">
                        {group.monthLabel}
                    </span>
                </div>
            ))}
        </div>
    );
}


function WeeklyVelocityCard({ weeklyAmountTrend }) {

	const weekly = weeklyAmountTrend?.weekly ?? [];
	const summary = weeklyAmountTrend?.summary ?? {};

	const averageOC = Number(summary.averageWeeklyOCMM ?? 0);
	const averagePayment = Number(summary.averageWeeklyPaymentMM ?? 0);

	const commitmentData = weekly.map((item) => ({
		weekLabel: item.weekLabel,
		monthKey: item.monthKey,
		monthLabel: item.monthLabel,
		monthYear: item.monthYear,
		value: Number(item.ocAmountMM ?? 0),
		count: Number(item.ocCount ?? 0),
		isCurrentWeek: item.isCurrentWeek,
	}));

	const paymentData = weekly.map((item) => ({
		weekLabel: item.weekLabel,
		monthKey: item.monthKey,
		monthLabel: item.monthLabel,
		monthYear: item.monthYear,
		value: Number(item.paymentAmountMM ?? 0),
		count: Number(item.paymentCount ?? 0),
		isCurrentWeek: item.isCurrentWeek,
	}));

	return (
		<Card className="overflow-hidden rounded-xl gap-0 border-slate-200 py-0 shadow-sm">
			<CardHeader className="relative pt-3">
				<div className="flex items-center justify-between gap-3">
					<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
						Evolución de Comprometido / Pagos
					</CardTitle>
					<span className="text-[10px] text-slate-400">
						Últimas {weekly.length || 7} semanas
					</span>
				</div>
			</CardHeader>

			<CardContent className="px-5 pb-5 pt-5">
				<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
					{/* COMPROMISO */}
					<div className="min-w-0">
						<p className="text-xs font-medium text-slate-600">
							Comprometido (OC) - Promedio
						</p>
						<div className="mt-2 flex items-baseline gap-1.5">
							<span className="text-2xl font-bold text-blue-700">
								S/ {formatMM(averageOC)}
							</span>
							<span className="text-sm font-bold text-blue-700">
								MM
							</span>
						</div>
						<div className="mt-2 h-[88px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={commitmentData}
									margin={{
										top: 8,
										right: 5,
										bottom: 12,
										left: 5,
									}}
								>
									<XAxis
										dataKey="weekLabel"
										axisLine={false}
										tickLine={false}
										interval={0}
										tick={{
											fontSize: 9,
											fill: "#94a3b8",
										}}
										dy={5}
									/>
									<YAxis hide domain={["auto", "auto"]} />
									<Tooltip
										cursor={{
											stroke: "#cbd5e1",
											strokeDasharray: "3 3",
										}}
										content={<WeeklyAmountTooltip />}
									/>
									<Line
										type="monotone"
										dataKey="value"
										stroke="#155EEF"
										strokeWidth={2}
										dot={{
											r: 2.2,
											fill: "#155EEF",
											strokeWidth: 0,
										}}
										activeDot={{
											r: 4,
											fill: "#155EEF",
											stroke: "#ffffff",
											strokeWidth: 2,
										}}
										isAnimationActive={false}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
						<MonthGroupAxis data={commitmentData} />
					</div>
					{/* VS */}
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
						vs
					</div>
					{/* PAGO */}
					<div className="min-w-0">
						<p className="text-xs font-medium text-slate-600">
							Pago (Actas) - Promedio
						</p>
						<div className="mt-2 flex items-baseline gap-1.5">
							<span className="text-2xl font-bold text-emerald-700">
								S/ {formatMM(averagePayment)}
							</span>
							<span className="text-sm font-bold text-emerald-700">
								MM
							</span>
						</div>
						<div className="mt-2 h-[88px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={paymentData}
									margin={{
										top: 8,
										right: 5,
										bottom: 12,
										left: 5,
									}}
								>
									<XAxis
										dataKey="weekLabel"
										axisLine={false}
										tickLine={false}
										interval={0}
										tick={{
											fontSize: 9,
											fill: "#94a3b8",
										}}
										dy={5}
									/>
									<YAxis hide domain={["auto", "auto"]} />
									<Tooltip
										cursor={{
											stroke: "#cbd5e1",
											strokeDasharray: "3 3",
										}}
										content={<WeeklyAmountTooltip />}
									/>
									<Line
										type="monotone"
										dataKey="value"
										stroke="#15803D"
										strokeWidth={2}
										dot={{
											r: 2.2,
											fill: "#15803D",
											strokeWidth: 0,
										}}
										activeDot={{
											r: 4,
											fill: "#15803D",
											stroke: "#ffffff",
											strokeWidth: 2,
										}}
										isAnimationActive={false}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
						<MonthGroupAxis data={paymentData} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/* =========================
   Celda
========================= */

function HeatCell({ cell }) {
	const pctCmpt = n(cell?.pctCmpt);
	const pctPago = n(cell?.pctPago);
	const fcstTotal = fmtMM(cell?.fcstTotal);
	const comprometido = fmtMM(cell?.comprometido);
	const actas = fmtMM(cell?.acta);
	const habilitado = fmtMM(cell?.habilitado);

	const bg = getHeatColor(pctCmpt);
	const textColor = getTextColor(pctCmpt);
	const softText = getSoftTextColor(pctCmpt);
	const badgeClass = getBadgeClass(pctCmpt);

	return (
		<div
			className="relative flex min-h-[98px] min-w-0 flex-col justify-between rounded-none border border-white/70 p-4"
			style={{ backgroundColor: bg }}
		>
			{/* Top */}
			<div className="flex items-start justify-center">
				<div
					className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-semibold ${badgeClass}`}
				>	
					<span>CPMT:</span>
					<span>{comprometido}</span>
					<span>({formatPct(pctCmpt)})</span>
				</div>
			</div>

			{/* Center */}
			<div className="text-center">
				<div className={`text-[21px] leading-none font-bold tracking-tight ${textColor}`}>
					{formatMM(fcstTotal)}
				</div>
			</div>

			{/* Bottom */}
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					{/* <span className={`min-w-[52px] text-xs font-medium ${softText}`}>
						%Pago
					</span> */}
					<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/35">
						<div
							className="h-full rounded-full bg-blue-600"
							style={{ width: `${Math.max(0, Math.min(100, pctPago))}%` }}
						/>
					</div>

					<span className={`text-[9px] font-semibold ${textColor}`}>
						{actas}
						{" "} 
						({formatPct(pctPago)})
					</span>
				</div>

				{/* <div className="text-right">
					<span className={`text-xs ${softText}`}>
						Hab. {formatMM(habilitado)}
					</span>
				</div> */}
			</div>
		</div>
	);
}

/* =========================
   Componente principal
========================= */

export function ComplianceUFQuarterHeatmap({ data = [], tipoTrimestre, setTipoTrimestre }) {
	const { quarters, rows } = useMemo(() => {
		return buildMatrixFromQuarterTree(data);
	}, [data]);

	// console.log("q", quarters)
	// console.log("rows", rows)

	return (
		<Card className="rounded-2xl border border-slate-200 gap-0 shadow-sm py-0">
			<CardHeader className="px-6 pt-5 pb-2 flex justify-between">
				<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
					Indicadores
				</CardTitle>
				<div className="flex items-center gap-3">
					<Select value={tipoTrimestre} onValueChange={setTipoTrimestre}>
						<SelectTrigger className="w-[180px] bg-white border-zinc-200">
							<SelectValue placeholder="Q" />
						</SelectTrigger>
						<SelectContent>
							{/* {series.map((s) => ( */}
							<SelectItem key="Q Planificado" value="Q Planificado">
								Q Planificado
							</SelectItem>
							<SelectItem key="Q Real" value="Q Real">
								Q Real
							</SelectItem>
							{/* ))} */}
						</SelectContent>
					</Select>
					<Link to="/budget/capex/leadership" className="underline">
						Ver detalles
					</Link> 
				</div>
			</CardHeader>

			<CardContent className="px-6 pb-6 pt-2">
				{/* Leyenda */}
				<div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3">
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-slate-600">
							Comprometido
						</span>
						{/* <Info className="h-4 w-4 text-slate-400" /> */}
						<span className="text-sm text-slate-500">0%</span>
						<div className="h-3 w-20 rounded-md bg-gradient-to-r from-[#EEF4FF] to-[#6D3DF5]" />
						<span className="text-sm text-slate-500">100%</span>
					</div>

					<div className="flex items-center gap-6 text-sm text-slate-700">
						<div className="flex items-center gap-2">
							<div className="flex p-1 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
								Forecast
							</div>
							<span>(MM)</span>
						</div>

						<div className="flex items-center gap-2">
							<div className="h-1.5 w-8 rounded-full bg-blue-600" />
							<span>%Pago</span>
						</div>

						{/* <div className="flex items-center gap-2">
							<div className="h-3 w-3 rounded-full bg-slate-400" />
							<span>Hab. (millones)</span>
						</div> */}
					</div>
				</div>

				{/* Header grid */}
				<div
					className="grid overflow-hidden rounded-2xl border border-slate-200"
					style={{
						gridTemplateColumns: `140px repeat(${quarters.length}, minmax(0, 1fr))`,
					}}
				>
					{/* Header */}
					<div className="border-b border-slate-200 bg-white px-6 py-4 text-left text-[12px] font-bold text-slate-700">
						UF
					</div>

					{quarters.map((q) => (
						<div
							key={q.key}
							className="border-b border-l border-slate-200 bg-white px-4 py-4 text-center text-[12px] font-bold text-slate-700"
						>
							{q.label}
						</div>
					))}

					{/* Rows */}
					{rows.map((row) => (
						<>
							<div className="flex items-center border-b border-slate-200 bg-white px-6 py-5">
								<div className="flex items-center gap-2">
									<span className="text-[12px] font-bold text-slate-700">
										{row.nombre}
									</span>

									{/* opcional: cantidad de proyectos */}
									{/* <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-100 px-1.5 text-[11px] font-semibold text-violet-700">
										{row.projectCount}
									</span> */}
								</div>
							</div>

							{quarters.map((q) => {
								const cell = row.cells[q.key] ?? {
									fcstTotal: 0,
									habilitado: 0,
									comprometido: 0,
									acta: 0,
									pctCmpt: 0,
									pctPago: 0,
								};

								return <HeatCell key={`${row.id}-${q.key}`} cell={cell} />;
							})}
						</>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

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
	const [selectedFcst, setSelectedFcst] = useState(["6+6", "7+5"]);

	// Data
	let { projects } = useProjectsCapex()
	
	projects = projects.filter(p => p.capex_opex === "CAPEX")
	
	const flt = useFilters(projects);
	const series = useProjectSeriesAcc(flt.filtered, selectedFcst);
	const { rows, totalsRow } = useProjectRows(flt.filtered, selectedFcst);
	const variaciones = useVariaciones(flt.filtered, selectedFcst);
	const totals = useProjectTotalsAcc(flt.filtered, selectedFcst);

	const fcst = roundPartsToMatchTotal([toMM(totals.fcstHW), toMM(totals.fcstSV)]);
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

	const variationTotals = variaciones?.totals ?? {};
	const totalSolpe = n(variationTotals.solpe);
	const totalOc = n(variationTotals.oc);
	const totalAc = n(variationTotals.ac);
	const totalFcst = n(variationTotals.fcst);
	const totalFcstLast = n(variationTotals.fcstLastMonth);

	const available = Math.max(0, totalSolpe - totalOc);
	const pendingOc = Math.max(0, totalOc - totalAc);
	const pendingFcstTotal = Math.max(0, totalFcst - totalAc);
	const pendingFcstLast = Math.max(0, totalFcstLast - totalAc);
	const returnRisk = Math.max(0, totalSolpe - totalFcst);

	const executionPct = percentage(totalAc, totalSolpe);
	const commitmentPct = percentage(totalOc, totalSolpe);
	const paidPct = percentage(totalAc, totalOc);
	const forecastPct = percentage(totalAc, totalFcst);
	const forecastPctLast = percentage(totalAc, totalFcstLast);
	const returnRiskPct = percentage(returnRisk, totalSolpe);

	const advancedFiltersCount = selectedFilterCount(
		flt.codProyecto,
		flt.proyecto,
		flt.pm,
		flt.categoria,
	);

	const flowData = [
		{
			category: "FCST",
			hardware: n(fcst[0]),
			servicios: n(fcst[1]),
			total: n(fcst[0]) + n(fcst[1]),
		},
		{
			category: "SOLPE",
			hardware: n(solpe[0]),
			servicios: n(solpe[1]),
			total: n(solpe[0]) + n(solpe[1]),
		},
		{
			category: "Comprometido",
			hardware: n(oc[0]),
			servicios: n(oc[1]),
			total: n(oc[0]) + n(oc[1]),
		},
		{
			category: "Acta",
			hardware: n(ac[0]),
			servicios: n(ac[1]),
			total: n(ac[0]) + n(ac[1]),
		},
	];

	const flowMax = Math.max(...flowData.map((item) => item.total), 1);

	const chartHeight = 440;
	const chartMargin = { top: 20, right: 24, bottom: 8, left: 0 };

	const fcstLabelOffsets = useMemo(() => {
		return buildFcstLabelOffsets({
			series,
			selectedFcst,
			keyFcst: KEY_FCST,
			chartHeight,
			marginTop: chartMargin.top,
			marginBottom: chartMargin.bottom,
		});
	}, [series, selectedFcst]);


	// let { provisiones, averageReq } = useProvisionesCapex({ limit: 20000, unidad_funcional: flt.unidadFuncional[0], nombre_proyecto: flt.proyecto[0] })
	// provisiones = calculatePriviones(provisiones)
	// const { weeklyAmountTrend, ocAging } = averageReq

	const [tipoTrimestre, setTipoTrimestre] = useState("Q Real");

	const targetMonth = "Agosto";
	const fcstKey = "7+5"
	// const tipoTrimestre = "Q Real"

	const triData = useMemo(
		() => buildNestedData(flt.filtered, { targetMonth, fcstKey }, tipoTrimestre),
		[flt.filtered, targetMonth, fcstKey, tipoTrimestre]
	);

	const { trimestres: mockNestedData, grandTotal } = triData

	// console.log("mockNestedData", mockNestedData)

    return (

        <div className="grid grid-cols-12 gap-5 px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            
			{/* Breadcrumb */}
			<div className="flex gap-4 w-[400px]">
				<a 
					href="#" 
					title="Atrás" 
					className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
				>
					<ArrowLeft className="h-5 w-5" />
				</a>
				<h2 className="text-2xl font-semibold text-[#2b7fff]">Dashboard CAPEX</h2>
			</div>

			{/* Main */}
			<div className="col-span-12 space-y-3">
				<Tabs className="" defaultValue="General">
					<TabsList className="mb-2 h-auto rounded-xl bg-white p-1 shadow-sm">
						<TabsTrigger value="General" className="cursor-pointer rounded-lg px-8 py-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">General</TabsTrigger>
						<TabsTrigger value="Asignacion" className="cursor-pointer rounded-lg px-8 py-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Asignación por contrata</TabsTrigger>
					</TabsList>
					<TabsContent value="General" className="space-y-4">
					{/* <div className="grid grid-cols-12 gap-4"> */}
						{/* Filtros principales en una sola línea; secundarios en Sheet */}
						<Card className="overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm">
							<CardContent className="p-3">
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_180px_auto]">
								<MultiSelectFilter
									label="Gerencia Responsable"
									icon={Briefcase}
									options={flt.options.gerencias}
									selected={flt.gerencia}
									onChange={flt.setGerencia}
									placeholder="Todas"
								/>

								<MultiSelectFilter
									label="Gerencia Sponsor"
									icon={Briefcase}
									options={flt.options.gerenciasSponsor}
									selected={flt.gerenciaSponsor}
									onChange={flt.setGerenciaSponsor}
									placeholder="Todos"
								/>

								<MultiSelectFilter
									label="Unidad Funcional"
									icon={Briefcase}
									options={flt.options.unidadFuncionales}
									selected={flt.unidadFuncional}
									onChange={flt.setUnidadFuncional}
									placeholder="Todas"
								/>

								<SelectFilter
									label="Año"
									icon={CalendarDays}
									options={flt.options.anos}
									value={flt.ano}
									onChange={flt.setAno}
									placeholder="Seleccionar"
								/>

								<Sheet>
									<SheetTrigger asChild>
									<Button
										type="button"
										variant="outline"
										className="h-full min-h-[58px] rounded-xl border-slate-200 px-4 text-xs font-semibold shadow-none"
									>
										<SlidersHorizontal className="mr-2 h-4 w-4 text-blue-500" />
										Más filtros
										{advancedFiltersCount > 0 ? (
										<Badge className="ml-2 rounded-full bg-blue-500 text-white">
											{advancedFiltersCount}
										</Badge>
										) : null}
									</Button>
									</SheetTrigger>

									<SheetContent className="w-full overflow-y-auto sm:max-w-md">
									<SheetHeader>
										<SheetTitle>Filtros avanzados</SheetTitle>
										<SheetDescription>
										Código, proyecto, PM y categoría se desplazan a este panel para liberar espacio vertical.
										</SheetDescription>
									</SheetHeader>

									<div className="mt-6 px-4 space-y-4">
										<MultiSelectFilter
											label="Código Proyecto"
											icon={Briefcase}
											options={flt.options.codigo}
											selected={flt.codProyecto}
											onChange={flt.setCodProyecto}
											placeholder="Seleccionar"
										/>
										<MultiSelectFilter
											label="Proyecto"
											icon={Briefcase}
											options={flt.options.proyectos}
											selected={flt.proyecto}
											onChange={flt.setProyecto}
											placeholder="Seleccionar"
										/>
										<MultiSelectFilter
											label="PM"
											icon={Briefcase}
											options={flt.options.pms}
											selected={flt.pm}
											onChange={flt.setPm}
											placeholder="Seleccionar"
										/>
										<MultiSelectFilter
											label="Categoría"
											icon={Briefcase}
											options={flt.options.categorias}
											selected={flt.categoria}
											onChange={flt.setCategoria}
											placeholder="Seleccionar"
										/>
									</div>
									</SheetContent>
								</Sheet>
								</div>
							</CardContent>
						</Card>

						{/* KPI superiores */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
							<KpiRingCard
								title="FORECAST TOTAL"
								subtitle="FCST / SOLPE"
								value={totalFcst}
								primaryLabel="% Pagado"
								primaryValue={forecastPct}
								secondaryLabel="Pendiente"
								secondaryValue={pendingFcstTotal}
								color="#7C3AED"
								icon={CircleDollarSign}
							/>
							<KpiRingCard
								title="HABILITADO"
								subtitle="Acta (AC) / SOLPE"
								value={totalSolpe}
								primaryLabel="% Pagado"
								primaryValue={executionPct}
								secondaryLabel="Pendiente"
								secondaryValue={totalSolpe - totalAc}
								color="#059669"
								icon={TrendingUp}
							/>
							<KpiRingCard
								title="COMPROMETIDO"
								subtitle="OC / SOLPE"
								value={totalOc}
								primaryLabel="OC / SOLPE"
								primaryValue={commitmentPct}
								secondaryLabel="Disponible"
								secondaryValue={available}
								color="#F05A0B"
								icon={FileText}
							/>
							<KpiRingCard
								title="ACTAS"
								subtitle="AC / OC"
								value={totalAc}
								primaryLabel="% Pagado"
								primaryValue={paidPct}
								secondaryLabel="Por pagar"
								secondaryValue={pendingOc}
								color="#0F6BDC"
								icon={WalletCards}
							/>
							
							<KpiRingCard
								title="META DEL MES"
								subtitle="Presupuesto sin ejecutar"
								value={totalFcstLast}
								primaryLabel="% Pagado"
								primaryValue={forecastPctLast} 
								secondaryLabel="Pendiente"
								secondaryValue={pendingFcstLast}
								color="#F59E0B"
								icon={Target}
							/>
						</div>

						{/* Gráfica principal + resúmenes laterales */}
						<div className="grid grid-cols-12 gap-4">
							<Card className="col-span-12 overflow-hidden rounded-xl border-slate-200 p-0 gap-0 shadow-sm xl:col-span-9">
								<CardHeader className="relative pt-3">
									<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
										Evolución acumulada (MM)
									</CardTitle>
									<div className="absolute right-3 top-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleCopyChart}
											disabled={isExporting}
											title="Copiar gráfica"
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>

								{/* Selector FCST compacto */}
								<div className=" px-5 py-3">
									<div className="flex gap-4 w-full sm:w-[340px]">
										<div className="mb-1.5 flex items-center justify-between gap-3">
											<p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
												Forecasts visibles  
											</p>
										</div>
										<MultiSelect
											options={forecasts}
											selected={selectedFcst}
											onChange={setSelectedFcst}
											placeholder="Seleccionar forecast"
										/>
									</div>
								</div>

								<CardContent className="px-3 pb-3 pt-2 sm:px-5">
								<div ref={chartExportRef} className="h-[440px] w-full bg-white">
									<ResponsiveContainer width="100%" height="100%">
									<ComposedChart
										data={series}
										margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
										onClick={handleChartClick}
									>
										<CartesianGrid strokeDasharray="3 3" stroke="#fffff" vertical={false} />
										<XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} />
										<YAxis
											tickFormatter={(value) =>
												n(value).toLocaleString(undefined, { maximumFractionDigits: 1 })
											}
											tick={{ fontSize: 12, fill: "#64748B" }}
										/>
										<Tooltip trigger="click" content={<ChartTooltip />} />
										<Legend wrapperStyle={{ fontSize: 12 }} />

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
												formatter={(value) =>
													n(value).toLocaleString(undefined, { maximumFractionDigits: 1 })
												}
												fill="#FFFFFF"
												fontSize={10}
												fontWeight={600}
											/>
										</Bar>
										<Line
											type="monotone"
											dataKey="oc"
											name="Comprometido (OC)"
											stroke="#FF3D00"
											strokeWidth={2}
											dot={{ r: 0 }}
											isAnimationActive={!exportMode}
										>
											<LabelList content={<LineBadge />} />
										</Line>
										{/* {selectedFcst.map((fcst) => (
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
										>
											<LabelList content={<LineBadge />} />
										</Line>
										))} */}
										{selectedFcst.map((fcst) => {
											const dataKey = KEY_FCST[fcst];

											return (
												<Line
													key={fcst}
													type="monotone"
													dataKey={dataKey}
													name={`${fcst !== "Plan" ? "FCST " : ""}${fcst}`}
													stroke={COLORS_FCST[fcst]}
													strokeWidth={2}
													dot={{ r: 0 }}
													strokeDasharray="4 4"
													isAnimationActive={!exportMode}
												>
													<LabelList
														content={(props) => (
															<LineBadge2
																{...props}
																offsetY={
																	fcstLabelOffsets?.[props.index]?.[dataKey] ?? -22
																}
															/>
														)}
													/>
												</Line>
											);
										})}
									</ComposedChart>
									</ResponsiveContainer>
								</div>
								</CardContent>

								<FcstDetailsDialog
									open={sheetOpen}
									onOpenChange={setSheetOpen}
									detail={detail}
								/>
							</Card>

							<div className="col-span-12 space-y-4 xl:col-span-3">
								<ForecastSolpeVarianceCard
									solpe={totalSolpe}
									fcst={totalFcst}
								/>
								{/* 2) Variaciones Totales (ajusta a filtros) */}
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
												label="Meta Mes"
												subLabel={`${fmt1(variaciones.totals.fcstLastMonth)} MM`}
												color="#10b981"
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
						{/* SOLPE / Comprometido / Acta con lectura visual tipo waterfall */}
						<div className="grid grid-cols-12 gap-4">
							<Card className="overflow-hidden rounded-xl gap-0 border-slate-200 p-0 shadow-sm xl:col-span-6 col-span-12">
								<CardHeader className="relative pt-3">
									<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
										Ejecución Presupuestal (S/ MM)
									</CardTitle>
								</CardHeader>
								<CardContent className="h-full px-3 pb-3 pt-2 sm:px-6">
									<ResponsiveContainer width="100%" height="100%">
										<ComposedChart
											data={flowData}
											margin={{ top: 20, right: 0, bottom: -10, left: -10 }}
											barCategoryGap="56%"
										>
										<CartesianGrid strokeDasharray="3 3" stroke="#E9EEF5" vertical={false} />
											<XAxis
												dataKey="category"
												axisLine={false}
												tickLine={false}
												tick={{ fill: "#1F2937", fontSize: 13, fontWeight: 600 }}
											/>
											<YAxis
												// domain={[0, flowMax * 1.2]}
												axisLine={false}
												tickLine={false}
												tick={{ fill: "#6B7280", fontSize: 12 }}
											/>
											<Tooltip
												formatter={(value, name) => [`${formatMM(value)} MM`, name]}
												cursor={{ fill: "rgba(0,0,0,.03)" }}
												contentStyle={{
												backgroundColor: "white",
												border: "1px solid #E5E7EB",
												borderRadius: 8,
												}}
											/>
											<Legend verticalAlign="bottom" height={34} iconType="line" />
					
											<Bar
												dataKey="hardware"
												stackId="budget"
												fill="#FF3D00"
												name="Hardware"
												barSize={92}
											>
												<LabelList
													dataKey="hardware"
													position="center"
													fill="#FFFFFF"
													fontSize={12}
													fontWeight={700}
													formatter={formatMM}
												/>
											</Bar>
					
											<Bar
												dataKey="servicios"
												stackId="budget"
												fill="#002EFF"
												name="Servicios"
												barSize={92}
												radius={[4, 4, 0, 0]}
											>
												<LabelList
													dataKey="servicios"
													position="center"
													fill="#FFFFFF"
													fontSize={12}
													fontWeight={700}
													formatter={formatMM}
												/>
												<LabelList
													dataKey="total"
													position="top"
													fill="#1F2937"
													fontSize={13}
													fontWeight={700}
													offset={10}
													formatter={formatMM}
												/>
											</Bar>
					
											{/* Une los totales y da el efecto de recorrido tipo waterfall. */}
											<Line
												type="linear"
												dataKey="total"
												name="Flujo total"
												stroke="#64748B"
												strokeWidth={1.5}
												strokeDasharray="5 5"
												dot={false}
												activeDot={false}
												isAnimationActive={false}
											/>
										</ComposedChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
							{/* Nuevas gráficas: velocidad y aging */}
							<div className="grid grid-cols-1 gap-4 xl:grid-cols-1 xl:col-span-6 col-span-12">
								{/* <WeeklyVelocityCard weeklyAmountTrend={weeklyAmountTrend} /> */}
								{/* <AgingOcCard data={ocAging} /> */}
								<ComplianceUFQuarterHeatmap 
									data={mockNestedData} 
									tipoTrimestre={tipoTrimestre}
									setTipoTrimestre={setTipoTrimestre}
								/>
							</div>

						</div>

						{/* Tabla: proyecto + ejecutado + barra de avance + despliegue de línea */}
						<Card className="overflow-hidden rounded-xl border-slate-200 gap-0 p-0 shadow-sm">
							<CardHeader className="relative pt-3">
								<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
									Detalle por Proyecto (MM)
								</CardTitle>
							</CardHeader>

							<CardContent className="p-0">
								<div className="max-h-[590px] overflow-auto">
									<Table className="min-w-[1260px]">
										<TableHeader className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur">
											<TableRow className="border-b-2 hover:bg-slate-50/95">
												<TableHead className="w-8" />
												<TableHead className="w-[90px] text-[10px] font-bold uppercase text-slate-500">
													ID
												</TableHead>
												<TableHead className="min-w-[330px] text-[10px] font-bold uppercase text-slate-500">
													Proyecto / Línea de inversión
												</TableHead>
												<TableHead className="w-[80px] text-right text-[10px] font-bold uppercase text-slate-500">
													SOLPE
												</TableHead>
												<TableHead className="w-[105px] text-right text-[10px] font-bold uppercase text-slate-500">
													Comprometido
												</TableHead>
												{selectedFcst.map((fcst) => (
												<TableHead
													key={fcst}
													className="w-[82px] text-right text-[10px] font-bold uppercase text-slate-500"
												>
													FCST {fcst}
												</TableHead>
												))}
												<TableHead className="w-[85px] text-right text-[10px] font-bold uppercase text-slate-500">
													Meta Mes
												</TableHead>
												<TableHead className="w-[105px] text-right text-[10px] font-bold uppercase text-slate-500">
													Ejecutado (MM)
												</TableHead>
												<TableHead className="w-[190px] text-[10px] font-bold uppercase text-slate-500">
													Ejecución %
												</TableHead>
												{/* <TableHead className="w-[100px] text-right text-[10px] font-bold uppercase text-slate-500">
													Pend. FCST
												</TableHead> */}
											</TableRow>
										</TableHeader>

										<TableBody>
											{rows.map((row) => {
												const children = Array.isArray(row.children) ? row.children : [];
												const expanded = open.has(row.key);
												const rowExecutionPct = percentage(row.ac, row.fcstmes);

												return (
												<>
													<TableRow className="border-b border-slate-100 hover:bg-blue-50/40">
														<TableCell className="p-1 text-center">
															{children.length > 0 ? (
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-7 w-7 rounded-full"
																onClick={() => toggle(row.key)}
															>
																{expanded ? (
																	<ChevronDown className="h-4 w-4" />
																) : (
																	<ChevronRight className="h-4 w-4" />
																)}
															</Button>
															) : null}
														</TableCell>

														<TableCell className="py-3 text-xs font-bold text-blue-950">
															{row.project_code}
														</TableCell>
														<TableCell className="py-3 text-xs font-semibold text-slate-800">
															<span className="block whitespace-normal leading-5">
																{row.project_name}
															</span>
														</TableCell>
														<TableCell className="py-3 text-right">
															<MoneyCell value={row.solpe} />
														</TableCell>
														<TableCell className="py-3 text-right">
															<MoneyCell value={row.oc} />
														</TableCell>
														{selectedFcst.map((fcst) => (
															<TableCell key={fcst} className="py-3 text-right">
															<MoneyCell value={getForecastValue(row, fcst)} />
															</TableCell>
														))}

														<TableCell className="py-3 text-right">
															<MoneyCell value={row.fcstmes} />
														</TableCell>
														<TableCell className="py-3 text-right text-sm font-bold text-emerald-700">
															{fmt1(row.ac)}
														</TableCell>
														<TableCell className="py-3">
															<ExecutionProgress value={rowExecutionPct} />
														</TableCell>
														{/* <TableCell
															className={`py-3 text-right ${
																n(row.pendFcst) < 0 ? "text-emerald-600" : "text-slate-800"
															}`}
														>
															<MoneyCell value={row.pendFcst} />
														</TableCell> */}
													</TableRow>

													{expanded
													? children.map((child) => {
														const childExecutionPct = percentage(child.ac, child.fcstmes);

														return (
															<TableRow
																key={child.key}
																className="border-b border-slate-100 bg-slate-50/60 hover:bg-slate-100"
															>
																<TableCell />
																<TableCell className="relative py-3">
																	<span className="absolute left-5 top-0 h-full border-l border-dashed border-slate-300" />
																</TableCell>
																<TableCell className="py-3 pl-7 text-xs text-slate-500">
																	<span className="relative block whitespace-normal leading-5 before:absolute before:-left-5 before:top-2 before:h-px before:w-3 before:bg-slate-300">
																	{child.linea_inversion || child.project_name}
																	</span>
																</TableCell>
																<TableCell className="py-3 text-right">
																	<MoneyCell value={child.solpe} muted />
																</TableCell>
																<TableCell className="py-3 text-right">
																	<MoneyCell value={child.oc} muted />
																</TableCell>
																<TableCell className="py-3 text-right text-xs font-semibold text-emerald-700/80">
																	{fmt1(child.ac)}
																</TableCell>
																{selectedFcst.map((fcst) => (
																	<TableCell key={fcst} className="py-3 text-right">
																	<MoneyCell value={getForecastValue(child, fcst)} muted />
																	</TableCell>
																))}
																<TableCell className="py-3 text-right">
																	<MoneyCell value={child.fcstmes} muted />
																</TableCell>
																<TableCell className="py-3">
																	<ExecutionProgress value={childExecutionPct} compact />
																</TableCell>
																{/* <TableCell
																	className={`py-3 text-right ${
																	n(child.pendFcst) < 0
																		? "text-emerald-600"
																		: "text-slate-500"
																	}`}
																>
																	<MoneyCell value={child.pendFcst} muted />
																</TableCell> */}
															</TableRow>
														);
														})
													: null}
												</>
												);
											})}

											<TableRow className="sticky bottom-0 z-30 border-t-2 bg-white border-slate-200">
												<TableCell />
												<TableCell className="py-3 text-xs font-bold ">TOTAL</TableCell>
												<TableCell />
												<TableCell className="py-3 text-right text-xs font-bold ">
													{fmt1(totalsRow.solpe)}
												</TableCell>
												<TableCell className="py-3 text-right text-xs font-bold ">
													{fmt1(totalsRow.oc)}
												</TableCell>
												{selectedFcst.map((fcst) => (
												<TableCell key={fcst} className="py-3 text-right text-xs font-bold ">
													{fmt1(getForecastValue(totalsRow, fcst))}
												</TableCell>
												))}
												<TableCell className="py-3 text-right text-xs font-bold ">
													{fmt1(totalsRow.fcstmes)}
												</TableCell>
												<TableCell className="py-3 text-right text-sm font-bold text-emerald-300">
													{fmt1(totalsRow.ac)}
												</TableCell>
												<TableCell className="py-3">
													<ExecutionProgress value={percentage(totalsRow.ac, totalsRow.fcstmes)} />
												</TableCell>
												{/* <TableCell className="py-3 text-right text-xs font-bold ">
													{fmt1(totalsRow.pendFcst)}
												</TableCell> */}
											</TableRow>
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					{/* </div> */}
					</TabsContent>

					<TabsContent value="Asignacion">
						<DashboardAssign />
					</TabsContent>
				</Tabs>
			</div>	
		</div>
    )
}