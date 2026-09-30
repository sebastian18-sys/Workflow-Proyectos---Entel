import MultiSelectFilter from "@/components/ui/_multiselect3";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDashboardFilters } from "@/hooks/budget/requirements/useDashboardFilters";
import { useDashboardReq } from "@/hooks/budget/requirements/useDashboardReq";
import { ArrowLeft, BadgeDollarSign, Briefcase, ClipboardList, Clock3, Eye, FilePlus2, Hourglass, Info, ReceiptText, Send, ShoppingCart, SlidersHorizontal, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, LabelList, Line, LineChart, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


const formatMM = (value) =>
	Number(value ?? 0).toLocaleString("es-PE", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});

const formatCount = (value) =>
	Number(value ?? 0).toLocaleString("es-PE");

const RQ_COLORS = {
	pendienteCT: "#93C5FD",      // azul
	observado: "#FDE68A",        // amarillo
	pendienteRQ: "#A78BFA",      // violeta
	pendienteOC: "#FDBA74",      // naranja
};

const PAYMENT_COLORS = {
	pendienteRecepcionar: "#86E0B4", // verde
	pendienteGCIR: "#67D6D3",        // teal
	pendienteMG: "#A5A6F6",          // violeta
};

const formatPct = (value) =>
	`${Number(value ?? 0).toFixed(1)}%`;

const safePct = (value) =>
	Math.max(0, Math.min(Number(value ?? 0), 100));


/** ===== Filtros anidados ===== */
function useRequirementsDashboardFilters() {

	const [unidadFuncional, setUnidadFuncional] = useState([]);
	const [codProyecto, setCodProyecto] = useState([]);
	const [proyecto, setProyecto] = useState([]);
	const [estado, setEstado] = useState([]);
	const [coordinador, setCoordinador] = useState([]);
	const [proveedor, setProveedor] = useState([]);
	const [acuerdoCompras, setAcuerdoCompras] = useState([]);

	const params = useMemo(
		() => ({
			unidad_funcional: unidadFuncional,
			id_proyecto: codProyecto,
			nombre_proyecto: proyecto,
			estado,
			coordinador,
			proveedor,
			acuerdo_compras: acuerdoCompras,
		}),
		[
			unidadFuncional,
			codProyecto,
			proyecto,
			estado,
			coordinador,
			proveedor,
			acuerdoCompras,
		]
	);

	const reset = () => {
		setUnidadFuncional([]);
		setCodProyecto([]);
		setProyecto([]);
		setEstado([]);
		setCoordinador([]);
		setProveedor([]);
		setAcuerdoCompras([]);
	};

	return {
		params,
		unidadFuncional, setUnidadFuncional,
		codProyecto, setCodProyecto,
		proyecto, setProyecto,
		estado, setEstado,
		coordinador, setCoordinador,
		proveedor, setProveedor,
		acuerdoCompras, setAcuerdoCompras,
		reset,
	};
}
// /////////
// KPI
// /////////

function RequirementKpiCard({
	title,
	icon: Icon,
	amount,
	count,
	percentage,
	pendingAmount,
	color = "#2563eb",
	iconClass = "bg-blue-50 text-blue-600",
	hideCount = false,
}) {
	const pct = safePct(percentage);

	return (
		<Card className="overflow-hidden rounded-xl border-slate-200 py-0 shadow-sm">
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex min-w-0 gap-3">
						<div
							className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
						>
							<Icon className="h-5 w-5" />
						</div>

						<div className="min-w-0">
							<p className="truncate uppercase text-sm font-medium text-slate-700">
								{title}
							</p>
							<div className="mt-1 flex items-baseline gap-1">
								<span className="mt-2 text-[26px] font-bold leading-none" style={{ color }}>
									S/ {formatMM(amount)}
								</span>
								<span className="text-xs font-semibold text-slate-400">
									MM
								</span>
							</div>
						</div>
					</div>
					<div className="relative h-[90px] w-[90px] shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<RadialBarChart
								cx="50%"
								cy="50%"
								innerRadius="72%"
								outerRadius="100%"
								barSize={7}
								data={[{ value: pct }]}
								startAngle={90}
								endAngle={-270}
							>
								<PolarAngleAxis
									type="number"
									domain={[0, 100]}
									tick={false}
								/>
								<RadialBar
									dataKey="value"
									background={{ fill: "#e9edf3" }}
									fill={color}
									cornerRadius={10}
								/>
							</RadialBarChart>
						</ResponsiveContainer>
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-lg font-bold text-slate-700">
								{pct.toFixed(0)}%
							</span>
						</div>
					</div>
				</div>

                <div className="mt-1 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    <div className="min-w-0">
                        <p className="truncate text-[13px] tracking-wide text-slate-400">
                            Cantidad
                        </p>
                        <p className="mt-1 truncate text-lg font-bold" style={{ color }}>
                            {hideCount ? "-" : formatCount(count)}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-[13px] tracking-wide text-slate-400">
                            Pendiente
                        </p>
                        <p className="mt-1 truncate text-lg font-bold text-slate-600">
                            {pendingAmount ? formatMM(pendingAmount) : "-"} MM
                        </p>
                    </div>
                </div>

				{/* {pendingAmount != null && (
					<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
						<span className="text-[11px] text-slate-400">
							Pendiente
						</span>

						<span className="text-xs font-bold text-slate-700">
							S/ {formatMM(pendingAmount)} MM
						</span>
					</div>
				)} */}
			</CardContent>
		</Card>
	);
}

// /////////
// STATUS
// /////////
function DonutPercentLabel({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
}) {
	if (!percent || percent <= 0) return null;

	const RADIAN = Math.PI / 180;
	/*
	 * Centro del grosor del donut.
	 */
	const radius =
		Number(innerRadius) +
		(Number(outerRadius) - Number(innerRadius)) * 0.52;

	const x =
		Number(cx) +
		radius * Math.cos(-midAngle * RADIAN);

	const y =
		Number(cy) +
		radius * Math.sin(-midAngle * RADIAN);

	const percentage = percent * 100;

	return (
		<text
			x={x}
			y={y}
			textAnchor="middle"
			dominantBaseline="central"
			fill="#334155"
			fontSize={percentage < 5 ? 9 : 11}
			fontWeight={700}
			pointerEvents="none"
		>
			{percentage.toFixed(0)}%
		</text>
	);
}

function DonutCenter({
	title = "Total pendiente",
	amount = 0,
}) {
	return (
		<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
			<span className="text-[11px] font-medium text-slate-500">
				{title}
			</span>

			<div className="mt-1 flex items-baseline gap-1">
				<span className="text-[22px] font-bold tracking-tight text-slate-900">
					{formatMM(amount)}
				</span>
				<span className="text-[11px] font-semibold text-slate-500">
					MM
				</span>
			</div>
		</div>
	);
}

function CurrentStateTooltip({
	active,
	payload,
}) {
	if (!active || !payload?.length) {
		return null;
	}

	const item = payload[0]?.payload;

	return (
		<div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
			<div className="flex items-center gap-2">
				<span
					className="h-2.5 w-2.5 rounded-full"
					style={{
						backgroundColor:
							item?.color,
					}}
				/>

				<span className="text-xs font-semibold text-slate-700">
					{item?.name}
				</span>
			</div>

			<p className="mt-1 text-xs text-slate-500">
				S/{" "}
				<span className="font-bold text-slate-800">
					{formatMM(item?.value)}
				</span>{" "}
				MM
			</p>

			{item?.count != null && (
				<p className="mt-0.5 text-[10px] text-slate-400">
					{formatCount(item.count)}{" "}
					{item.countLabel}
				</p>
			)}
		</div>
	);
}

function StatusDetailItem({
	label,
	amount,
	count,
	countLabel,
	color,
}) {
	return (
		<div className="min-w-0">
			<div className="flex items-center gap-2">
				<span
					className="h-2.5 w-2.5 shrink-0 rounded-full"
					style={{
						backgroundColor: color,
					}}
				/>

				<span className="truncate text-[11px] font-medium text-slate-600">
					{label}
				</span>
			</div>
			<div className="mt-2 pl-[18px]">
                <div className="flex items-center gap-1">
                    <p className="text-base font-bold text-slate-900">
                        {formatMM(amount)}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-500">
                        MM
                    </span>
                </div>
				{count != null && (
					<p className="mt-1 text-xs text-slate-400">
						{formatCount(count)}{" "}
						{countLabel}
					</p>
				)}
			</div>
		</div>
	);
}

function DetailGroup({
	title,
	children,
	styleProps,
}) {
	return (
		<div className={`min-w-0 ${styleProps}`}>
			<div className="mb-4">
				<p className="text-center text-sm font-semibold text-slate-700">
					{title}
				</p>
				<div className="mt-2 h-px bg-slate-700/80" />
			</div>

			<div className="grid grid-cols-2 gap-x-5 gap-y-3">
				{children}
			</div>
		</div>
	);
}

function StateDonut({
	data,
	total,
}) {
	return (
		<div className="relative mx-auto h-[250px] w-full max-w-[340px]">
			<ResponsiveContainer
				width="100%"
				height="100%"
			>
				<PieChart>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius="57%"
						outerRadius="85%"
						paddingAngle={1.5}
						startAngle={90}
						endAngle={-270}
						stroke="#ffffff"
						strokeWidth={2}
						labelLine={false}
						label={DonutPercentLabel}
						isAnimationActive={false}
					>
						{data.map((entry) => (
							<Cell
								key={entry.key}
								fill={entry.color}
							/>
						))}
					</Pie>
					<Tooltip content={<CurrentStateTooltip />}
					/>
				</PieChart>
			</ResponsiveContainer>
			<DonutCenter
				amount={total}
			/>
		</div>
	);
}


export function CurrentStateDonutCard({
	estadoActual,
}) {
	const rq = estadoActual?.rq ?? {};
	const pago = estadoActual?.pago ?? {};

	// =========================================
	// RQ
	// =========================================
	const rqPendienteCT = Number(rq.pendienteCT?.amountMM ?? 0);
	const rqObservado = Number(rq.observado?.amountMM ?? 0);

	const rqPendienteRQ = Number(rq.pendienteRQ?.amountMM ?? 0);
	const rqPendienteOC = Number(rq.pendienteOC?.amountMM ?? 0);

	const rqGCIR = rqPendienteCT + rqObservado;
	const rqMG = rqPendienteRQ + rqPendienteOC;
	const rqTotal = rqGCIR + rqMG;

	const rqData = [
		{
			key: "pendienteCT",
			name: "Por procesar",
			value: rqPendienteCT,
			count: rq.pendienteCT?.count,
			countLabel: "RQ",
			color: RQ_COLORS.pendienteCT,
		},
		{
			key: "observado",
			name: "Observado",
			value: rqObservado,
			count: rq.observado?.count,
			countLabel: "RQ",
			color: RQ_COLORS.observado,
		},
		{
			key: "pendienteRQ",
			name: "Sin RQ",
			value: rqPendienteRQ,
			count: rq.pendienteRQ?.count,
			countLabel: "RQ",
			color: RQ_COLORS.pendienteRQ,
		},
		{
			key: "pendienteOC",
			name: "Sin OC",
			value: rqPendienteOC,
			count: rq.pendienteOC?.count,
			countLabel: "RQ",
			color: RQ_COLORS.pendienteOC,
		},
	].filter(
		(item) => item.value > 0
	);

	// =========================================
	// PAGO
	// =========================================
	const pendingReception = Number(pago.pendienteRecepcionar?.amountMM ?? 0);
	const pendingGCIR = Number(pago.pendienteGCIR?.amountMM ?? 0);
	const pendingMG = Number(pago.pendienteMG?.amountMM ?? 0);

	const pendingReceptionH1 = Number(pago.pendienteRecepH1?.amountMM ?? 0);
	const pendingReceptionH2 = Number(pago.pendienteRecepH2?.amountMM ?? 0);

	const pendingGCIRH1 = Number(pago.pendienteGCIRH1?.amountMM ?? 0);
	const pendingGCIRH2 = Number(pago.pendienteGCIRH2?.amountMM ?? 0);

	const pendingMGH1 = Number(pago.pendienteMGH1?.amountMM ?? 0);
	const pendingMGH2 = Number(pago.pendienteMGH2?.amountMM ?? 0);

	const pendingTotalReception = pendingReceptionH1 + pendingReceptionH2;

	const paymentGCIR = pendingGCIR;
	const paymentMG = pendingMG;
	const paymentTotal = pendingTotalReception;

	// const paymentGCIR = pendingReception + pendingGCIR;
	// const paymentMG = pendingMG;
	// const paymentTotal = paymentGCIR + paymentMG;

	const paymentData = [
		{
			key: "pendienteRecepcionar",
			name: "Por pagar",
			value: pendingReceptionH1 + pendingReceptionH2,
			count: null,
			countLabel: "",
			color: PAYMENT_COLORS.pendienteRecepcionar,
		},
		{
			key: "pendienteGCIR",
			name: "Por procesar",
			value: pendingGCIRH1 + pendingGCIRH2,
			count: pago.pendienteGCIR?.count,
			countLabel: "CR",
			color: PAYMENT_COLORS.pendienteGCIR,
		},
		{
			key: "pendienteMG",
			name: "Sin CR",
			value: pendingMGH1 + pendingMGH2,
			count: pago.pendienteMG?.count,
			countLabel: "CR",
			color:PAYMENT_COLORS.pendienteMG,
		},
	].filter(
		(item) => item.value > 0
	);

	return (
		<Card className="rounded-xl border-slate-200 py-0 shadow-sm col-span-12 overflow-hidden gap-0 xl:col-span-7">
			<CardHeader className="px-6 pb-1 pt-5">
				<CardTitle className="text-lg font-semibold text-blue-600">
					Estado actual
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6 pb-6 pt-2">
				<div className="grid grid-cols-1 divide-y divide-slate-200 xl:grid-cols-2 xl:divide-x xl:divide-y-0">
					{/* =================================
					    RQ
					================================= */}
					<section className="pb-6 xl:pb-0 xl:pr-8">
						<div className="flex items-center gap-3">
							<span className="h-7 w-1 rounded-full bg-blue-500" />
							<h3 className="text-base font-bold text-slate-800">
								RQ y OC
							</h3>
						</div>
						<StateDonut
							data={rqData}
							total={rqTotal}
						/>
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
							{/* GCIR */}
							<DetailGroup title="Pendiente GCIR">
								<StatusDetailItem
									label="Por procesar"
									amount={rqPendienteCT}
									count={rq.pendienteCT?.count}
									countLabel="RQ"
									color={RQ_COLORS.pendienteCT}
								/>
								<StatusDetailItem
									label="Observado"
									amount={rqObservado}
									count={rq.observado?.count}
									countLabel="RQ"
									color={RQ_COLORS.observado}
								/>
							</DetailGroup>
							{/* MG */}
							<DetailGroup title="Pendiente MG">
								<StatusDetailItem
									label="Sin RQ"
									amount={rqPendienteRQ}
									count={rq.pendienteRQ?.count}
									countLabel="RQ"
									color={RQ_COLORS.pendienteRQ}
								/>
								<StatusDetailItem
									label="Sin OC"
									amount={rqPendienteOC}
									count={rq.pendienteOC?.count}
									countLabel="RQ"
									color={RQ_COLORS.pendienteOC}
								/>
							</DetailGroup>
						</div>
					</section>

					{/* =================================
					    PAGO
					================================= */}
					<section className="pt-6 xl:pl-8 xl:pt-0">
						<div className="flex items-center gap-3">
							<span className="h-7 w-1 rounded-full bg-emerald-500" />
							<h3 className="text-base font-bold text-slate-800">
								Pago
							</h3>
						</div>
						<StateDonut
							data={paymentData}
							total={paymentTotal}
						/>
						{/* className="grid grid-cols-1 gap-8 sm:grid-cols-2" */}
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
							{/* GCIR */}
							<DetailGroup title="Pendiente GCIR">
								<StatusDetailItem
									label="Pagar H1"
									amount={pendingReceptionH1}
									color={PAYMENT_COLORS.pendienteRecepcionar}
								/>
								<StatusDetailItem
									label="Procesar H1"
									amount={pendingGCIRH1}
									// count={pago.pendienteGCIR?.count}
									// countLabel="CR"
									color={PAYMENT_COLORS.pendienteGCIR}
								/>
								<StatusDetailItem
									label="Pagar H2"
									amount={pendingReceptionH2}
									color={PAYMENT_COLORS.pendienteRecepcionar}
								/>
								<StatusDetailItem
									label="Procesar H2"
									amount={pendingGCIRH2}
									// count={pago.pendienteGCIR?.count}
									// countLabel="CR"
									color={PAYMENT_COLORS.pendienteGCIR}
								/>
							</DetailGroup>
							{/* MG */}
							<DetailGroup title="Pendiente MG">
								<StatusDetailItem
									label="Sin CR 1"
									amount={pendingMGH1}
									// count={pago.pendienteMG?.count}
									// countLabel="CR"
									color={PAYMENT_COLORS.pendienteMG}
								/>
								<div></div>
								<StatusDetailItem
									label="Sin CR 2"
									amount={pendingMGH2}
									// count={pago.pendienteMG?.count}
									// countLabel="CR"
									color={PAYMENT_COLORS.pendienteMG}
								/>
							</DetailGroup>
						</div>
					</section>
				</div>
			</CardContent>
		</Card>
	);
}

// ///////
// LIQUIDACIONES OLD
// ///////
function SettlementsFunnelCard({ liquidaciones }) {
	const pending = Number(liquidaciones?.pendienteLiquidar?.amountMM ?? 0);
	const liquidatedCurrent = Number(liquidaciones?.liquidado?.amountMM ?? 0);
	const paid = Number(liquidaciones?.pagado?.amountMM ?? 0);

	const totalToSettle = pending;
	const totalLiquidated = liquidatedCurrent + paid;
	const liquidatedPct = totalToSettle > 0
        ? (totalLiquidated / totalToSettle) * 100
        : 0;

	const paidPct = totalLiquidated > 0
        ? (paid / totalLiquidated) * 100
        : 0;

	const data = [
		{
			name: "Total a liquidar",
			value: totalToSettle,
			fill: "#2563eb",
		},
		{
			name: "Liquidado",
			value: totalLiquidated,
			fill: "#7c3aed",
		},
		{
			name: "Pagado",
			value: paid,
			fill: "#059669",
		},
	];

	return (
		<Card className="rounded-xl border-slate-200 py-0 shadow-sm col-span-12 space-y-4 xl:col-span-5">
			<CardHeader className="px-5 pb-0 pt-4">
				<CardTitle className="text-lg font-semibold text-blue-600">
					Evolución de Liquidaciones - (Hito 2)
				</CardTitle>
				<p className="text-[11px] text-slate-400">
					Transformación del monto pendiente hasta pago
				</p>
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-5 px-5 pb-5 pt-2 lg:grid-cols-[1.1fr_1fr]">
				{/* Funnel */}
				<div className="h-[250px]">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<FunnelChart>
							<Funnel
								data={data}
								dataKey="value"
								nameKey="name"
								isAnimationActive
							>
								{data.map((entry, index) => (
									<Cell
										key={entry.name}
										fill={entry.fill}
										stroke="none"
									/>
								))}

								<LabelList
									position="right"
									dataKey="name"
									fill="#475569"
									stroke="none"
									fontSize={11}
								/>
							</Funnel>
						</FunnelChart>
					</ResponsiveContainer>
				</div>
				{/* Métricas */}
				<div className="flex flex-col justify-center">
					<div className="grid grid-cols-3 divide-x divide-slate-200">
						<div className="pr-3">
							<p className="text-[10px] uppercase text-slate-400">
								Por liquidar
							</p>
							<p className="mt-1 text-lg font-bold text-blue-600">
								S/ {formatMM(totalToSettle)}
							</p>
							<p className="text-[10px] text-slate-400">
								MM
							</p>
						</div>
						<div className="px-3">
							<p className="text-[10px] uppercase text-slate-400">
								Liquidado
							</p>
							<p className="mt-1 text-lg font-bold text-violet-600">
								S/ {formatMM(totalLiquidated)}
							</p>
							<p className="text-[10px] text-slate-400">
								{liquidatedPct.toFixed(1)}%
							</p>
						</div>
						<div className="pl-3">
							<p className="text-[10px] uppercase text-slate-400">
								Pagado
							</p>
							<p className="mt-1 text-lg font-bold text-emerald-600">
								S/ {formatMM(paid)}
							</p>
							<p className="text-[10px] text-slate-400">
								{paidPct.toFixed(1)}% del liquidado
							</p>
						</div>
					</div>
					<div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
						<div className="flex items-center justify-between">
							<span className="text-xs text-slate-500">
								Pendiente liquidar
							</span>
							<span className="text-xs font-bold text-slate-800">
								S/ {formatMM(pending - totalLiquidated)} MM
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-slate-500">
								Liquidado pendiente de pago
							</span>
							<span className="text-xs font-bold text-slate-800">
								S/ {formatMM(liquidatedCurrent)} MM
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ///////
// LIQUIDACIONES NEW
// ///////
function LiquidationFlow({
	totalAPagar,
	pendienteLiquidar,
	porProcesar,
	enviadoMG,
}) {
	const total =
		Number(totalAPagar?.amountMM ?? 0);

	const pending =
		Number(pendienteLiquidar?.amountMM ?? 0);

	const processing =
		Number(porProcesar?.amountMM ?? 0);

	const sentMG =
		Number(enviadoMG?.amountMM ?? 0);


	const pendingPct =
		total > 0
			? (pending / total) * 100
			: 0;

	const processingPct =
		total > 0
			? (processing / total) * 100
			: 0;

	const mgPct =
		total > 0
			? (sentMG / total) * 100
			: 0;


	return (
		<div className="rounded-xl border border-slate-200 bg-white p-5">

			<p className="mb-5 text-xs font-bold uppercase tracking-wide text-blue-600">
				Flujo de liquidaciones
			</p>
			<div className="grid grid-cols-[1.7fr_34px_1.7fr_34px_1fr_34px_.8fr] items-center gap-2">
				{/* =====================
				    TOTAL
				===================== */}
				<FlowBlock
					title="Total a pagar"
					amount={total}
					percentage={100}
					className="bg-blue-600"
				/>
				<FlowArrow />
				{/* =====================
				    PENDIENTE
				===================== */}
				<FlowBlock
					title="Pendiente liquidar"
					amount={pending}
					percentage={pendingPct}
					className="bg-violet-600"
				/>
				<FlowArrow />
				{/* =====================
				    PROCESANDO
				===================== */}
				<FlowBlock
					title="Por procesar"
					amount={processing}
					percentage={processingPct}
					className="bg-violet-500"
				/>
				<FlowArrow />
				{/* =====================
				    MG
				===================== */}
				<FlowBlock
					title="Enviado MG"
					amount={sentMG}
					percentage={mgPct}
					className="bg-teal-600"
				/>
			</div>

			{/* =====================================
			    RELACIÓN POR PROCESAR / MG
			===================================== */}
			<div className="mt-4 grid grid-cols-[1.7fr_34px_1.7fr_34px_1fr_34px_.8fr]">
				<div />
				<div />
				<div />
				<div />
				<div className="col-span-3">
					<div className="relative h-8">
						<div className="absolute left-0 right-[12%] top-0 border-t border-dashed border-teal-500" />
						<div className="absolute left-0 top-0 h-3 border-l border-dashed border-teal-500" />
						<div className="absolute right-[12%] top-0 h-3 border-r border-dashed border-teal-500" />
						<div className="pt-3 text-center text-[10px] font-medium text-teal-600">
							Enviado MG está incluido dentro de Por procesar
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function FlowBlock({
	title,
	amount,
	percentage,
	className,
}) {
	return (
		<div className="min-w-0">

			<p className="mb-2 truncate text-center text-[11px] font-semibold text-slate-600">
				{title}
			</p>

			<div
				className={`
					flex
					h-[120px]
					flex-col
					items-center
					justify-center
					rounded-lg
					px-2
					text-white
					shadow-sm
					${className}
				`}
			>
				<div className="flex items-center gap-1">
					<div className="whitespace-nowrap text-[18px] font-bold tracking-tight">
						{formatMM(amount)}
					</div>
					<span className="text-sm font-medium text-white/90">
						MM
					</span>
				</div>
				<div className="mt-1 text-sm font-medium text-white/90">
					{formatPct(percentage)}
				</div>
			</div>

		</div>
	);
}


function FlowArrow() {
	return (
		<div className="flex justify-center">
			<span
				className="
					h-5
					w-5
					rotate-45
					border-r-[3px]
					border-t-[3px]
					border-slate-400
				"
			/>
		</div>
	);
}

function UFMetric({
	value,
	max,
	colorClass,
	textClass,
	percentage,
}) {
	const width =
		max > 0
			? Math.min(100, (value / max) * 100)
			: 0;

	return (
		<div className="min-w-[115px]">
			<div className="flex items-center justify-between gap-2">
				<span className={`text-[12px] font-bold ${textClass}`}>
					S/ {formatMM(value)} MM
				</span>
				{percentage != null && (
					<span className="text-[10px] text-slate-400">
						{formatPct(percentage)}
					</span>
				)}
			</div>
			<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
				<div
					className={`h-full rounded-full ${colorClass}`}
					style={{
						width: `${width}%`,
					}}
				/>
			</div>
		</div>
	);
}

function LiquidationsByUF({
	data = [],
	totalAPagar = 0,
}) {
	const maxTotal = Math.max(
		...data.map(
			(item) =>
				Number(
					item.totalAPagar?.amountMM ?? 0
				)
		),
		1
	);

	const maxPending = Math.max(
		...data.map(
			(item) =>
				Number(
					item.pendienteLiquidar?.amountMM ?? 0
				)
		),
		1
	);

	const maxProcessing = Math.max(
		...data.map(
			(item) =>
				Number(
					item.porProcesar?.amountMM ?? 0
				)
		),
		1
	);

	const maxMG = Math.max(
		...data.map(
			(item) =>
				Number(
					item.enviadoMG?.amountMM ?? 0
				)
		),
		1
	);


	return (
		<div className="overflow-hidden rounded-xl border border-slate-200">
			<div className="border-b border-slate-200 px-5 py-3">
				<p className="text-xs font-bold uppercase tracking-wide text-blue-600">
					Liquidaciones por Unidad Funcional
				</p>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-slate-50/60">
							<th className="min-w-[140px] px-4 py-3 text-left text-[11px] font-semibold text-slate-600">
								Unidad Funcional
							</th>
							<th className="min-w-[150px] px-4 py-3 text-left">
								<div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
									<WalletCards className="h-4 w-4 text-blue-600" />
									Total a pagar
								</div>
							</th>
							<th className="min-w-[150px] px-4 py-3 text-left">
								<div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
									<Clock3 className="h-4 w-4 text-violet-600" />
									Pendiente liquidar
								</div>
							</th>
							<th className="min-w-[150px] px-4 py-3 text-left">
								<div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
									<Hourglass className="h-4 w-4 text-teal-600" />
									Por procesar
								</div>
							</th>
							<th className="min-w-[150px] px-4 py-3 text-left">
								<div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
									<Send className="h-4 w-4 text-blue-500" />
									Enviado MG
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item) => {
							const total = Number(item.totalAPagar?.amountMM ?? 0);
							const pending = Number(item.pendienteLiquidar?.amountMM ?? 0);
							const processing = Number(item.porProcesar?.amountMM ?? 0);
							const mg = Number(item.enviadoMG?.amountMM ?? 0);
							const totalPct =
								totalAPagar > 0
									? (total / totalAPagar) * 100
									: 0;

							const pendingPct =
								total > 0
									? (pending / total) * 100
									: 0;

							const processingPct =
								total > 0
									? (processing / total) * 100
									: 0;

							const mgPct =
								processing > 0
									? (mg / processing) * 100
									: 0;


							return (
								<tr
									key={item.unidad_funcional}
									className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
								>
									<td className="px-4 py-3">
										<p className="text-[12px] font-semibold text-slate-700">
											{item.unidad_funcional}
										</p>
									</td>
									<td className="px-4 py-3">
										<UFMetric
											value={total}
											max={maxTotal}
											percentage={totalPct}
											colorClass="bg-blue-600"
											textClass="text-blue-600"
										/>
									</td>
									<td className="px-4 py-3">
										<UFMetric
											value={pending}
											max={maxPending}
											percentage={pendingPct}
											colorClass="bg-violet-600"
											textClass="text-violet-600"
										/>
									</td>
									<td className="px-4 py-3">
										<UFMetric
											value={processing}
											max={maxProcessing}
											percentage={processingPct}
											colorClass="bg-teal-600"
											textClass="text-teal-600"
										/>
									</td>
									<td className="px-4 py-3">
										<UFMetric
											value={mg}
											max={maxMG}
											percentage={mgPct}
											colorClass="bg-blue-500"
											textClass="text-blue-500"
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function LiquidationEvolutionCard({
	liquidaciones,
}) {
	const totalAPagar = liquidaciones?.totalAPagar ?? {};
	const pendienteLiquidar = liquidaciones?.pendienteLiquidar ?? {};
	const porProcesar = liquidaciones?.porProcesar ?? {};
	const enviadoMG = liquidaciones?.enviadoMG ?? {};
	const porUnidadFuncional = liquidaciones?.porUnidadFuncional ?? [];

	return (
		<Card className="rounded-xl border-slate-200 py-0 shadow-sm col-span-12 space-y-4 gap-0 xl:col-span-5">
			<CardHeader className="px-5 pb-1 pt-5">
				<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
					Evolución de Liquidaciones - (Hito 2)
				</CardTitle>
				<p className="text-[11px] text-slate-400">
					Vista ejecutiva del monto pendiente hasta gestión MG
				</p>
			</CardHeader>
			<CardContent className="space-y-4 px-5 pb-5 pt-3">
				{/* ==================================
				    FLUJO
				================================== */}
				<LiquidationFlow
					totalAPagar={totalAPagar}
					pendienteLiquidar={pendienteLiquidar}
					porProcesar={porProcesar}
					enviadoMG={enviadoMG}
				/>
				{/* ==================================
				    UNIDAD FUNCIONAL
				================================== */}
				<LiquidationsByUF
					data={porUnidadFuncional}
					totalAPagar={Number(totalAPagar?.amountMM ?? 0)}
				/>
				{/* ==================================
				    NOTA
				================================== */}
				<div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
					<Info className="h-3.5 w-3.5" />
					<span>
						Enviado MG es un subconjunto de Por procesar.
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

// LIQUIDACIONS V3
const COLORS = {
	total: "#2563EB",
	pending: "#7C3AED",
	processing: "#10B981",
	mg: "#2563EB",
	track: "#E2E8F0",
};

function KPIBox({
	title,
	amount,
	percentage,
	color = "#2563EB",
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
			<div className="text-[11px] font-medium text-slate-500">
				{title}
			</div>

			<div className="mt-1 flex items-baseline gap-1">
				<span
					className="text-[15px] font-bold leading-none"
					style={{ color }}
				>
					S/ {formatMM(amount)} MM
				</span>
			</div>

			<div
				className="mt-2 text-[11px] font-semibold"
				style={{ color }}
			>
				{formatPct(percentage)} del total
			</div>

			<div
				className="mt-3 h-[2px] w-full rounded-full"
				style={{ backgroundColor: color }}
			/>
		</div>
	);
}

function UFBarRow({
	label,
	totalAPagar,
	pendienteLiquidar,
	porProcesar,
	enviadoMG,
	grandTotal,
}) {
	const total = Number(totalAPagar ?? 0);
	const pending = Number(pendienteLiquidar ?? 0);
	const processing = Number(porProcesar ?? 0);
	const mg = Number(enviadoMG ?? 0);

	const processingWithoutMG = Math.max(processing - mg, 0);

	const shareOfGrandTotal =
		grandTotal > 0 ? (total / grandTotal) * 100 : 0;

	const pendingWidth =
		total > 0 ? (pending / total) * 100 : 0;

	const processingWithoutMGWidth =
		total > 0
			? (processingWithoutMG / total) * 100
			: 0;

	const mgWidth =
		total > 0 ? (mg / total) * 100 : 0;

	return (
		<div className="grid grid-cols-[1.35fr_2.2fr_.75fr_.75fr_.75fr_.75fr] items-center gap-3 border-t border-slate-200 py-3">
			{/* UF */}
			<div className="min-w-0">
				<div className="text-[12px] font-semibold text-slate-700">
					{label}
				</div>
				<div className="mt-1 text-[10px] text-slate-400">
					{formatPct(shareOfGrandTotal)} del total
				</div>
			</div>

			{/* Barra */}
			<div>
				<div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
					{/* Total track visual */}
					<div className="absolute inset-0 bg-slate-200" />

					{/* Pendiente liquidar */}
					<div
						className="absolute left-0 top-0 h-full"
						style={{
							width: `${pendingWidth}%`,
							backgroundColor: COLORS.pending,
						}}
					/>

					{/* Por procesar sin MG */}
					<div
						className="absolute top-0 h-full"
						style={{
							left: `${pendingWidth}%`,
							width: `${processingWithoutMGWidth}%`,
							backgroundColor: COLORS.processing,
						}}
					/>

					{/* Enviado MG */}
					<div
						className="absolute top-0 h-full"
						style={{
							left: `${pendingWidth + processingWithoutMGWidth}%`,
							width: `${mgWidth}%`,
							backgroundColor: COLORS.mg,
						}}
					/>
				</div>

				<div className="mt-1 flex items-center gap-3 text-[9px] text-slate-400">
					<div className="flex items-center gap-1">
						<span
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: COLORS.pending }}
						/>
						Pend.
					</div>

					<div className="flex items-center gap-1">
						<span
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: COLORS.processing }}
						/>
						Proc.
					</div>

					<div className="flex items-center gap-1">
						<span
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: COLORS.mg }}
						/>
						MG
					</div>
				</div>
			</div>

			{/* Total */}
			<div className="text-right">
				<div className="text-[12px] font-bold text-slate-700">
					{formatMM(total)}
				</div>
			</div>

			{/* Pendiente */}
			<div className="text-right">
				<div className="text-[12px] font-bold text-violet-600">
					{formatMM(pending)}
				</div>
			</div>

			{/* Procesar */}
			<div className="text-right">
				<div className="text-[12px] font-bold text-emerald-600">
					{formatMM(processing)}
				</div>
			</div>

			{/* MG */}
			<div className="text-right">
				<div className="text-[12px] font-bold text-blue-600">
					{formatMM(mg)}
				</div>
			</div>
		</div>
	);
}

function LiquidationTooltip({
	active,
	payload,
}) {
	if (!active || !payload?.length) return null;

	const row = payload[0]?.payload;

	return (
		<div className="min-w-[220px] rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
			<p className="mb-2 text-xs font-bold text-slate-700">
				{row?.unidad_funcional}
			</p>
			<div className="space-y-1.5 text-[11px]">
				<div className="flex justify-between gap-5">
					<span className="text-slate-500">
						Total a pagar
					</span>
					<span className="font-bold text-blue-600">
						S/ {formatMM(row?.totalAPagar)} MM
					</span>
				</div>
				<div className="flex justify-between gap-5">
					<span className="text-slate-500">
						Pendiente liquidar
					</span>
					<span className="font-semibold text-violet-600">
						S/ {formatMM(row?.pendienteLiquidar)} MM
					</span>
				</div>
				<div className="flex justify-between gap-5">
					<span className="text-slate-500">
						Por procesar
					</span>
					<span className="font-semibold text-violet-500">
						S/ {formatMM(row?.porProcesar)} MM
					</span>
				</div>
				<div className="flex justify-between gap-5">
					<span className="text-slate-500">
						Enviado MG
					</span>
					<span className="font-semibold text-teal-600">
						S/ {formatMM(row?.enviadoMG)} MM
					</span>
				</div>
			</div>
		</div>
	);
}

/* =====================================================
   LABEL TOTAL
===================================================== */
function TotalLabel(props) {
	const {
		x,
		y,
		width,
		height,
		value,
	} = props;

	return (
		<text
			x={x + width + 7}
			y={y + height / 2}
			dominantBaseline="middle"
			fill="#334155"
			fontSize={10}
			fontWeight={700}
		>
			S/ {formatMM(value)} MM
		</text>
	);
}

/* =====================================================
   MAIN
===================================================== */

export function LiquidationEvolutionCompact({
	liquidaciones,
}) {
	const total = Number(liquidaciones?.totalAPagar?.amountMM ?? 0);
	const pending = Number(liquidaciones?.pendienteLiquidar?.amountMM ?? 0);
	const processing = Number(liquidaciones?.porProcesar?.amountMM ??0);
	const mg = Number(liquidaciones?.enviadoMG?.amountMM ?? 0);

	const pendingPct = total > 0
		? (pending / total) * 100
		: 0;

	const processingPct = total > 0
		? (processing / total) * 100
		: 0;

	const mgPct =total > 0
		? (mg / total) * 100
		: 0;

	const totalAPagar = liquidaciones?.totalAPagar ?? {};
	const porUnidadFuncional = liquidaciones?.porUnidadFuncional ?? [];

	const rows = (liquidaciones?.porUnidadFuncional ?? [])
		.map((item) => ({
			unidad_funcional: item.unidad_funcional,
			totalAPagar: Number(item.totalAPagar?.amountMM ?? 0),
			pendienteLiquidar: Number(
				item.pendienteLiquidar?.amountMM ?? 0
			),
			porProcesar: Number(item.porProcesar?.amountMM ?? 0),
			enviadoMG: Number(item.enviadoMG?.amountMM ?? 0),
		}))
		.sort((a, b) => b.totalAPagar - a.totalAPagar);


	/* =================================================
	   DATA UF

	   MG está dentro de Por procesar,
	   entonces para evitar duplicarlo:
	   
	   processingWithoutMG =
	       porProcesar - enviadoMG
	================================================= */
	const chartData =
		(
			liquidaciones?.porUnidadFuncional ?? []
		)
			.map((item) => {
				const totalAPagar = Number(item.totalAPagar?.amountMM ?? 0);
				const pendienteLiquidar = Number(item.pendienteLiquidar?.amountMM ?? 0);
				const porProcesar = Number(item.porProcesar?.amountMM ?? 0);
				const enviadoMG = Number(item.enviadoMG?.amountMM ?? 0);

				return {
					unidad_funcional: item.unidad_funcional,
					totalAPagar,
					pendienteLiquidar,
					porProcesar,
					enviadoMG,
					porProcesarSinMG:
						Math.max(
							porProcesar -
								enviadoMG,
							0
						),
				};
			})
			.sort(
				(a, b) =>
					b.totalAPagar -
					a.totalAPagar
			);

	return (
		<Card className="h-full rounded-xl border-slate-200 py-0 shadow-sm col-span-12 gap-0 space-y-4 gap-0 xl:col-span-5">
			<CardHeader className="px-5 pb-2 pt-4">
				<CardTitle className="text-lg font-semibold text-blue-600">
					Evolución de Liquidaciones - (Hito 2)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 px-5 pb-4">
				{/* KPIs */}
				<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
					<KPIBox
						title="Total a pagar"
						amount={total}
						percentage={100}
						color={COLORS.total}
					/>

					<KPIBox
						title="Pendiente liquidar"
						amount={pending}
						percentage={pendingPct}
						color={COLORS.pending}
					/>

					<KPIBox
						title="Por procesar"
						amount={processing}
						percentage={processingPct}
						color={COLORS.processing}
					/>

					<KPIBox
						title="Enviado MG"
						amount={mg}
						percentage={mgPct}
						color={COLORS.mg}
					/>
				</div>

				{/* Ranking */}
				<div className="rounded-xl border border-slate-200 bg-white">
					<LiquidationsByUF
						data={porUnidadFuncional}
						totalAPagar={Number(totalAPagar?.amountMM ?? 0)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}



// 
// WEEKLY VELOCIY
// 
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

function buildMonth2Groups(weekly = []) {
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


function MonthGroupAxis({ data }) {
    const monthGroups = buildMonth2Groups(data);

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

// //////
// THROUGHPUT
// //////
function ThroughputTooltip({ active, payload, label }) {
	if (!active || !payload?.length) return null;

	const row = payload[0]?.payload;

	return (
		<div className="min-w-[190px] rounded-lg border bg-white p-3 shadow-lg">
			<p className="mb-2 text-xs font-bold text-slate-700">
				Semana {label}
			</p>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-5">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-blue-500" />
						<span className="text-xs text-slate-500">
							RQ
						</span>
					</div>

					<span className="text-xs font-semibold text-slate-800">
						S/ {Number(row?.rqAmountMM ?? 0).toFixed(1)} MM
					</span>
				</div>

				<div className="flex items-center justify-between gap-5">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-orange-500" />
						<span className="text-xs text-slate-500">
							OC
						</span>
					</div>

					<span className="text-xs font-semibold text-slate-800">
						S/ {Number(row?.ocAmountMM ?? 0).toFixed(1)} MM
					</span>
				</div>

				<div className="flex items-center justify-between gap-5">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-emerald-500" />
						<span className="text-xs text-slate-500">
							Pago
						</span>
					</div>

					<span className="text-xs font-semibold text-slate-800">
						S/ {Number(row?.paymentAmountMM ?? 0).toFixed(1)} MM
					</span>
				</div>
			</div>

			<div className="mt-2 border-t pt-2 text-[10px] text-slate-400">
				RQ: {row?.rqCount ?? 0} · OC: {row?.ocCount ?? 0} · Pagos:{" "}
				{row?.paymentCount ?? 0}
			</div>

			{row?.isCurrentWeek && (
				<p className="mt-1 text-[10px] font-medium text-amber-600">
					Semana actual parcial
				</p>
			)}
		</div>
	);
}

function buildMonthGroups(data = []) {
    return data.reduce((groups, item, index) => {
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

function ThroughputMonthAxis({ data = [] }) {
	if (!data.length) return null;

	const groups = buildMonthGroups(data);

	return (
		<div
			// className="grid px-[42px] pr-[14px]"
            className="mt-1 grid px-[5px]"
			style={{
				gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
			}}
		>
			{groups.map((group) => (
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

export function WeeklyThroughputCard({ data = [] }) {
	return (
		<Card className="overflow-hidden rounded-xl gap-0 border-slate-200 py-0 shadow-sm">
			<CardHeader className="flex flex-row items-center justify-between px-5 pb-0 pt-4">
				<div>
					<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
						Ejecución semanal
					</CardTitle>

					<p className="mt-0.5 text-[10px] text-slate-400">
						Monto procesado por etapa — últimas 7 semanas
					</p>
				</div>

				<div className="flex items-center gap-4 text-[10px]">
					<div className="flex items-center gap-1.5">
						<span className="h-2 w-2 rounded-full bg-blue-500" />
						<span className="text-slate-500">RQ</span>
					</div>

					<div className="flex items-center gap-1.5">
						<span className="h-2 w-2 rounded-full bg-orange-500" />
						<span className="text-slate-500">OC</span>
					</div>

					<div className="flex items-center gap-1.5">
						<span className="h-2 w-2 rounded-full bg-emerald-500" />
						<span className="text-slate-500">Pago</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-4 pb-4 pt-3">
				<div className="h-[235px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={data}
							margin={{
								top: 28,
								right: 10,
								left: -18,
								bottom: 5,
							}}
							barCategoryGap="28%"
							barGap={2}
						>
							<CartesianGrid
								vertical={false}
								stroke="#eef2f7"
								strokeDasharray="3 3"
							/>

							<XAxis
								dataKey="weekLabel"
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 10,
									fill: "#64748b",
								}}
								dy={5}
							/>

							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 10,
									fill: "#94a3b8",
								}}
							/>

							<Tooltip
								cursor={{ fill: "#f8fafc" }}
								content={<ThroughputTooltip />}
							/>

							<Bar
								dataKey="rqAmountMM"
								name="RQ"
								fill="#3b82f6"
								radius={[3, 3, 0, 0]}
								maxBarSize={18}
							>
								<LabelList
									dataKey="rqAmountMM"
									position="top"
									formatter={(value) =>
										value > 0
											? Number(value).toFixed(1)
											: ""
									}
									style={{
										fontSize: 10,
										fontWeight: 600,
										fill: "#3b82f6",
									}}
								/>
							</Bar>

							<Bar
								dataKey="ocAmountMM"
								name="OC"
								fill="#f97316"
								radius={[3, 3, 0, 0]}
								maxBarSize={18}
							>
								<LabelList
									dataKey="ocAmountMM"
									position="top"
									formatter={(value) =>
										value > 0
											? Number(value).toFixed(1)
											: ""
									}
									style={{
										fontSize: 10,
										fontWeight: 600,
										fill: "#f97316",
									}}
								/>
							</Bar>

							<Bar
								dataKey="paymentAmountMM"
								name="Pago"
								fill="#10b981"
								radius={[3, 3, 0, 0]}
								maxBarSize={18}
							>
								<LabelList
									dataKey="paymentAmountMM"
									position="top"
									formatter={(value) =>
										value > 0
											? Number(value).toFixed(1)
											: ""
									}
									style={{
										fontSize: 10,
										fontWeight: 600,
										fill: "#10b981",
									}}
								/>
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<ThroughputMonthAxis data={data} />
			</CardContent>
		</Card>
	);
}

// ///////
// DELAY
// ///////
function DelayTooltipValue({ value }) {
	return (
		<span className="font-semibold text-slate-700">
			S/ {Number(value ?? 0).toFixed(1)} MM
		</span>
	);
}

export function DelayCard({
	title,
	subtitle,
	data,
	color = "#3b82f6",
}) {
	const ranges = data?.ranges ?? [];
	const total = Number(data?.totalAmountMM ?? 0);

	const maxAmount = Math.max(
		...ranges.map((item) => Number(item.amountMM ?? 0)),
		1
	);

	return (
		<Card className="overflow-hidden rounded-xl gap-0 border-slate-200 py-0 shadow-sm">
			<CardHeader className="px-4 pb-2 pt-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
							{title}
						</CardTitle>
						{/* {subtitle && (
							<p className="mt-1 text-[10px] text-slate-400">
								{subtitle}
							</p>
						)} */}
					</div>
					<div className="rounded-md bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-400">
						Últimas 7 semanas
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-4 pb-4">
				{/* Headers */}
				<div className="mb-2 grid grid-cols-[85px_1fr_75px_52px] items-center gap-2 border-b border-slate-100 pb-2">
					<span className="text-[9px] font-medium uppercase text-slate-400">
						Rango
					</span>
					<span />
					<span className="text-right text-[9px] font-medium uppercase text-slate-400">
						Monto
					</span>
					<span className="text-right text-[9px] font-medium uppercase text-slate-400">
						%
					</span>
				</div>
				<div className="space-y-3">
					{ranges.map((range) => {
						const amount = Number(range.amountMM ?? 0);
						/*
						 * Visualmente usamos el máximo del grupo para
						 * aprovechar todo el ancho disponible.
						 */
						const width =
							maxAmount > 0
								? (amount / maxAmount) * 100
								: 0;

						return (
							<div
								key={range.key}
								className="grid grid-cols-[85px_1fr_75px_52px] items-center gap-2"
							>
								<span className="whitespace-nowrap text-[11px] font-medium text-slate-600">
									{range.label}
								</span>
								<div className="h-2 overflow-hidden rounded-full bg-slate-100">
									<div
										className="h-full rounded-full transition-all duration-300"
										style={{
											width: `${width}%`,
											backgroundColor: color,
										}}
									/>
								</div>
								<span className="text-right text-[11px] font-semibold text-slate-700">
									{amount.toFixed(1)} MM
								</span>
								<span className="text-right text-[11px] font-bold text-slate-700">
									{Number(
										range.percentage ?? 0
									).toFixed(1)}
									%
								</span>
							</div>
						);
					})}
				</div>

				{/* Total */}
				<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
					<span className="text-[11px] font-semibold text-slate-500">
						Total procesado
					</span>
					<span className="text-sm font-bold text-slate-900">
						S/ {total.toFixed(1)} MM
					</span>
				</div>
			</CardContent>
		</Card>
	);
}


export default function DashboardReq() {

    const flt = useRequirementsDashboardFilters();
    const { options, loading: loadingOptions } = useDashboardFilters(flt.params);

    // console.log("options", options)

    const { dashboardData } = useDashboardReq({ 
        page: 1, 
        limit: 20000,
        ...flt.params,
    })

    // console.log("dashboardData", dashboardData)

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
                <h2 className="text-2xl font-semibold text-[#2b7fff]">Dashboard Requerimientos</h2>
            </div>

            {/* Main */}
			<div className="col-span-12 space-y-3">
                <Card className="overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm">
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_180px_auto]">
                        <MultiSelectFilter
                            label="Unidad Funcional"
                            icon={Briefcase}
                            options={options?.unidadFuncionales ?? []}
                            selected={flt.unidadFuncional ?? []}
                            onChange={flt.setUnidadFuncional}
                            placeholder="Todas"
                        />

                        <MultiSelectFilter
                            label="Código Proyecto"
                            icon={Briefcase}
                            options={options?.codigosProyecto ?? []}
                            selected={flt.codProyecto ?? []}
                            onChange={flt.setCodProyecto}
                            placeholder="Todos"
                        />

                        <MultiSelectFilter
                            label="Proyecto"
                            icon={Briefcase}
                            options={options?.proyectos ?? []}
                            selected={flt.proyecto ?? []}
                            onChange={flt.setProyecto}
                            placeholder="Todas"
                        />

                        <MultiSelectFilter
                            label="Coordinador"
                            icon={Briefcase}
                            options={options?.coordinadores ?? []}
                            value={flt.coordinador ?? []}
                            onChange={flt.setCoordinador}
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
                                {/* {advancedFiltersCount > 0 ? (
                                <Badge className="ml-2 rounded-full bg-blue-500 text-white">
                                    {advancedFiltersCount}
                                </Badge>
                                ) : null} */}
                            </Button>
                            </SheetTrigger>

                            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                            <SheetHeader>
                                <SheetTitle>Filtros avanzados</SheetTitle>
                                <SheetDescription>
                                Proveedor y Acuerdo se desplazan a este panel para liberar espacio vertical.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 px-4 space-y-4">
                                <MultiSelectFilter
                                    label="Proveedores"
                                    icon={Briefcase}
                                    options={options?.proveedores ?? []}
                                    selected={flt.proveedor ?? []}
                                    onChange={flt.setProveedor}
                                    placeholder="Seleccionar"
                                />
                                <MultiSelectFilter
                                    label="Acuerdo Compras"
                                    icon={Briefcase}
                                    options={options?.acuerdos ?? []}
                                    selected={flt.acuerdoCompras ?? []}
                                    onChange={flt.setAcuerdoCompras}
                                    placeholder="Seleccionar"
                                />
                            </div>
                            </SheetContent>
                        </Sheet>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <RequirementKpiCard
                        title="Ingresados"
                        icon={FilePlus2}
                        amount={dashboardData?.kpis?.ingresados?.amountMM}
                        count={dashboardData?.kpis?.ingresados?.count}
                        percentage={100}
                        color="#2563eb"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <RequirementKpiCard
                        title="RQ Generadas"
                        icon={ClipboardList}
                        amount={dashboardData?.kpis?.rq?.amountMM}
                        count={dashboardData?.kpis?.rq?.count}
                        percentage={dashboardData?.kpis?.rq?.percentage}
                        pendingAmount={dashboardData?.kpis?.rq?.pendingAmountMM}
                        color="#7c3aed"
                        iconClass="bg-violet-50 text-violet-600"
                    />

                    <RequirementKpiCard
                        title="OC Generadas"
                        icon={ShoppingCart}
                        amount={dashboardData?.kpis?.oc?.amountMM}
                        count={dashboardData?.kpis?.oc?.count}
                        percentage={dashboardData?.kpis?.oc?.percentage}
                        pendingAmount={dashboardData?.kpis?.oc?.pendingAmountMM}
                        color="#f97316"
                        iconClass="bg-orange-50 text-orange-600"
                    />

                    <RequirementKpiCard
                        title="Recepción / Pago"
                        icon={WalletCards}
                        amount={dashboardData?.kpis?.recepcion?.amountMM}
                        percentage={dashboardData?.kpis?.recepcion?.percentage}
                        pendingAmount={dashboardData?.kpis?.recepcion?.pendingAmountMM}
                        hideCount
                        color="#059669"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* <CurrentStateCard estadoActual={dashboardData?.estadoActual} /> */}
                    <CurrentStateDonutCard estadoActual={dashboardData?.estadoActual} />
                    {/* <SettlementsFunnelCard liquidaciones={dashboardData?.liquidaciones} /> */}
					<LiquidationEvolutionCompact liquidaciones={dashboardData?.liquidaciones} />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <WeeklyVelocityCard weeklyAmountTrend={dashboardData?.weeklyEvolution} />
                    <WeeklyThroughputCard data={dashboardData?.throughput?.weekly ?? []} />
                </div>

                {/* ================================
                    DELAYS
                ================================ */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <DelayCard
                        title="Aging GCIR"
                        subtitle="Tiempo de gestión inicial"
                        data={dashboardData?.delays?.envioMG}
                        color="#3b82f6"
                    />
                    <DelayCard
                        title="Aging RQ"
                        subtitle="Tiempo de generación de RQ"
                        data={dashboardData?.delays?.generacionRQ}
                        color="#8b5cf6"
                    />
                    <DelayCard
                        title="Aging OC"
                        subtitle="Tiempo de generación de OC"
                        data={dashboardData?.delays?.generacionOC}
                        color="#f97316"
                    />
                </div>
            </div>
        </div>
    )
}