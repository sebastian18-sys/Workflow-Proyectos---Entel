import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
} from "recharts";
import { fmt1, roundPartsToMatchTotal, toMM } from "@/lib/helpers";
import useProjectTotalsAcc from "@/hooks/budget/capex/useProjectTotalsAcc";
import useProjectSeriesAcc from "@/hooks/budget/capex/useProjectSeriesAcc";
import { COLORS_FCST, KEY_FCST } from "@/constants/constants";

// ===== Etiqueta con borde para líneas
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

export default function ProjectSheet({
	open,
	onOpenChange,
	projectName,
	records,
	extra,
	selectedFcst = ["4+8"]
}) {
	// const series = useProjectSeries(records);
	const series = useProjectSeriesAcc(records, selectedFcst);

	// console.log("SERIES", series)

	const totals = useProjectTotalsAcc(records);

	const solpe = roundPartsToMatchTotal([toMM(totals.solpeHW), toMM(totals.solpeSV)]);
	const oc = roundPartsToMatchTotal([toMM(totals.ocHW), toMM(totals.ocSV)]);
	const ac = roundPartsToMatchTotal([toMM(totals.acHW), toMM(totals.acSV)]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
		{/* <SheetContent side="right" className="w-[900px] sm:w-[1160px] lg:w-[1280px] xl:w-[1480px] max-w-[98vw]"> */}
		<SheetContent side="right" className="w-[40vw] sm:w-[100vw] lg:W-[100vw] xl:max-w-[40vw]">
			<SheetHeader>
				<SheetTitle>{projectName ?? "Proyecto"}</SheetTitle>
				<SheetDescription>Resumen y proyección acumulada (MM).</SheetDescription>
			</SheetHeader>

			<div className="h-[400px]">
				<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={[
						{ category: 'SOLPE', hardware: solpe[0], servicios: solpe[1] !== 0 ? solpe[1] : "", total: (solpe[0] + solpe[1]).toFixed(1) },
						{ category: 'Comprometido', hardware: oc[0], servicios: oc[1] !== 0 ? oc[1] : "", total: (oc[0] + oc[1]).toFixed(1) },
						{ category: 'Acta', hardware: ac[0], servicios: ac[1] !== 0 ? fmt1(totals.acSV) : "", total: (ac[0] + ac[1]).toFixed(1) },
					]}	
					margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
				>
					<CartesianGrid strokeDasharray="3 3" opacity={0.15}  />
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
			</div>


			{/* Chart */}
			<div className="mt-4 h-[360px]">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart data={series} margin={{ top: 20, right: 24, bottom: 8, left: 0 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#fffff" />
						<XAxis dataKey="month" tick={{ fontSize: 12 }} />
						<YAxis tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 })} tick={{ fontSize: 12 }} />
						<Tooltip formatter={(v) => `${v} M`} />
						<Legend wrapperStyle={{ fontSize: 12 }} />

						{/* Barras AC */}
						<Bar dataKey="ac" name="Acta (AC)" barSize={22} fill="#002EFF">
							<LabelList dataKey="ac" position="center" fill="#ffffff" className="text-[10px]" />
						</Bar>

						{/* OC */}
						<Line type="monotone" dataKey="oc" name="Comprometido (OC)" stroke="#FF3D00" strokeWidth={2} dot={{ r: 2 }}>
							<LabelList content={<LineBadge />} />
						</Line>

						{/* FCST */}
						{/* <Line type="monotone" dataKey="fcst312" name="Plan" stroke="#43E7B4" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 4">
							<LabelList content={<LineBadge />} />
						</Line> */}

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
			</div>

			{/* Slot para añadir más información desde el NAV o el Dashboard */}
			{extra ? <div className="mt-4">{extra}</div> : null}
		</SheetContent>
		</Sheet>
	);
}