import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
	LabelList,
	CartesianGrid
} from "recharts";
import { fmt1 } from "@/lib/helpers";

// Utils locales (independientes del dashboard)
const num = (v) => {
	if (v == null) return 0;
	if (typeof v === "number") return v;
	const cleaned = String(v).replace(/[^0-9.,-]/g, "");
	const normalized = cleaned.replace(/,/g, "");
	const parsed = Number(normalized);
	return isNaN(parsed) ? 0 : parsed;
};

function useTop5Bars(data) {
	return useMemo(() => {
		const byProj = new Map();

		for (const r of data) {
			const key = r.project_name;
			if (!key) continue;
			const cur = byProj.get(key) || { solpe: 0, oc: 0, ac: 0 };
			cur.solpe += num(r.solpe ?? r.solpe_original ?? 0);
			cur.oc += r.amounts?.oc?.total ?? 0;
			cur.ac += r.amounts?.ac?.total ?? 0;
			byProj.set(key, cur);
		}

		const rows = Array.from(byProj.entries()).map(([project, v]) => {
			const available = v.solpe - v.oc;
			return {
				project,
				ocMM: Number(fmt1(v.oc)) - Number(fmt1(v.ac)),
				acMM: Number(fmt1(v.ac)),
				availMM: Number(fmt1(available)),
				totalMM: Number(fmt1(v.solpe)),
			};
		});

		rows.sort((a, b) => b.totalMM - a.totalMM);
		return rows.slice(0, 5);
	}, [data]);
}

// Etiqueta total al extremo derecho del stack
const TotalLabel = (props) => {

	const { x, y, width, value } = props; // value = availMM (último segmento)

	if (x == null || y == null || width == null) return null;
	const tx = x + width + 14;
	const ty = y + 18;
	const total = Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })
	return (
		<text x={tx} y={ty} fontSize={12} fill="#111827">
			{total}
		</text>
	);
};

export default function TopProjectsBars({ data, title = "Top 5 Proyectos (MM)" }) {
	const bars = useTop5Bars(data);

	return (
		<Card className="shadow-sm overflow-hidden p-0">
			<CardHeader className="bg-blue-500 py-3 gap-0">
				<CardTitle className="text-base text-white tracking-wide">{title}</CardTitle>
			</CardHeader>
			<CardContent className="h-[360px]">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart layout="vertical" data={bars} margin={{ top: 0, right: 20, left: -20, bottom: 8 }} barCategoryGap={"28%"}>
						<CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
						<YAxis dataKey="project" type="category" width={260} tick={{ fontSize: 12 }} />
						<XAxis
							type="number"
							tickFormatter={(v) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} MM`}
							tick={{ fontSize: 12 }}
						/>
						<Legend wrapperStyle={{ fontSize: 12 }} />
						<Tooltip formatter={(v) => `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} MM`} />

						{/* Comprometido */}
						<Bar dataKey="ocMM" name="Pendiente a ejecutar" stackId="a" fill="#FF3D00">
							<LabelList
								dataKey="ocMM"
								position="insideLeft"
								fill="#fff"
								fontSize={12}
								formatter={(v) => (v > 0 ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "")}
							/>
						</Bar>
						
						{/* Actas */}
						<Bar dataKey="acMM" name="Actas" stackId="a" fill="#002EFF">
							<LabelList
								dataKey="acMM"
								position="insideRight"
								fill="#fff"
								fontSize={12}
								formatter={(v) => (v > 0 ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "")}
							/>
						</Bar>

						{/* Disponible (último segmento del stack) */}
						<Bar dataKey="availMM" name="Ptto disponible" stackId="a" fill="#43E7B4">
							<LabelList content={<TotalLabel />} />
							<LabelList
								dataKey="availMM"
								position="insideRight"
								fill="#fff"
								fontSize={12}
								formatter={(v) => (v > 0 ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "")}
							/>
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}