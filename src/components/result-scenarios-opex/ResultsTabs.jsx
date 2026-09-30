import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumberInt } from "@/lib/helpers";

// ----------------------------
// Tablas
// ----------------------------
function QAcumuladoTable({ data }) {
    // Fallback por si no tienes formatNumberInt a mano
    const fmt = (n) =>
        typeof n === "number" ? n.toLocaleString("es-PE") : n;

    return (
        <div className="space-y-8">
        {data.map((prog) => {
            // 1) Encabezados (meses)
            const meses = prog.filas.map((f) => String(f.Mes));

            // 2) Claves de escenarios dinámicas (todo excepto "Mes")
            const escenariosAll = prog.filas.length
            ? Object.keys(prog.filas[0]).filter((k) => k !== "Mes")
            : [];

            // 3) Orden: "Inicial" primero y luego los demás en orden natural
            const escenarios = [
                ...escenariosAll.filter((k) => k === "Inicial"),
                ...escenariosAll.filter((k) => k !== "Inicial"),
            ];

            return (
                <div key={prog.programa} className="rounded-2xl border p-4">
                    <div className="mb-3 text-sm font-semibold text-muted-foreground">
                        {prog.programa}
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-40 sticky left-0 bg-white z-10">
                                        Mes
                                    </TableHead>
                                    {meses.map((m) => (
                                    <TableHead key={m} className="whitespace-nowrap">
                                        {m}
                                    </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                            {escenarios.map((esc) => (
                                <TableRow key={esc}>
                                    <TableCell className="font-medium sticky left-0 bg-white z-10">
                                        {esc}
                                    </TableCell>

                                    {prog.filas.map((f, idx) => (
                                        <TableCell key={esc-idx} className="text-right">
                                            {fmt(f[esc])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            );
        })}
        </div>
    );
}

function ResumenMontosTable({ data }) {

	const hasEsc1 = data.filas.some((r) => typeof r.escenario1 === "number");
	const hasEsc2 = data.filas.some((r) => typeof r.escenario2 === "number");
	const hasEsc3 = data.filas.some((r) => typeof r.escenario3 === "number");
	return (
		<div className="overflow-x-auto rounded-2xl border p-4">
		<Table>
			<TableHeader>
			<TableRow>
				<TableHead className="min-w-[180px]">Agrupación</TableHead>
				<TableHead className="text-right">Inicial</TableHead>
				{hasEsc1 && <TableHead className="text-right">Escenario 1</TableHead>}
				{hasEsc2 && <TableHead className="text-right">Escenario 2</TableHead>}
				{hasEsc3 && <TableHead className="text-right">Escenario 3</TableHead>}
				{hasEsc1 && <TableHead className="text-right">Var Esc1 vs Inicial</TableHead>}
				{hasEsc2 && <TableHead className="text-right">Var Esc2 vs Inicial</TableHead>}
				{hasEsc3 && <TableHead className="text-right">Var Esc3 vs Inicial</TableHead>}
			</TableRow>
			</TableHeader>
			<TableBody>
			{data.filas.map((r) => (
				<TableRow key={r.programa}>
                    <TableCell className="font-medium">{r.programa}</TableCell>
                    <TableCell className="text-right">{formatNumberInt(r.inicial)}</TableCell>
                    {hasEsc1 && <TableCell className="text-right">{formatNumberInt(r.escenario1)}</TableCell>}
                    {hasEsc2 && <TableCell className="text-right">{formatNumberInt(r.escenario2)}</TableCell>}
                    {hasEsc3 && <TableCell className="text-right">{formatNumberInt(r.escenario3)}</TableCell>}
                    {hasEsc1 && (
                        <TableCell className="text-right">{formatNumberInt(r.Var_Esc1_vs_Base)}</TableCell>
                    )}
                    {hasEsc2 && (
                        <TableCell className="text-right">{formatNumberInt(r.Var_Esc2_vs_Base)}</TableCell>
                    )}
                    {hasEsc3 && (
                        <TableCell className="text-right">{formatNumberInt(r.Var_Esc3_vs_Base)}</TableCell>
                    )}
				</TableRow>
			))}
			</TableBody>
		</Table>
		</div>
	);
}

function DetallesProgramas({ data }) {
    const MONTH_ORDER = [
        "Ene-26","Feb-26","Mar-26","Abr-26","May-26","Jun-26",
        "Jul-26","Ago-26","Set-26","Oct-26","Nov-26","Dic-26",
    ];

    function getOrderedMonths(filas) {
        // Tomamos todas las llaves tipo mes que existan en las filas
        const all = new Set();
        for (const r of filas) {
            Object.keys(r).forEach((k) => {
                if (k !== "Proyecto") all.add(k);
            });
        }
        // Ordenamos según el MONTH_ORDER y dejamos cualquier otro al final
        const known = MONTH_ORDER.filter((m) => all.has(m));
        const unknown = [...all].filter((m) => !MONTH_ORDER.includes(m)).sort();
        return [...known, ...unknown];
    }

    return (
        <div className="space-y-10">
        {data.map((prog) => (
            <div key={prog.programa} className="rounded-2xl border p-4">
            <div className="mb-3 text-sm font-semibold text-muted-foreground">
                {prog.programa}
            </div>

            {prog.escenarios.map((esc) => {
                const meses = getOrderedMonths(esc.filas);

                return (
                <div key={prog.programa-esc.nombre} className="mb-6">
                    <div className="mb-2 rounded-xl bg-muted p-2 text-sm font-medium">
                    {esc.nombre}
                    </div>

                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[260px]">Proyecto</TableHead>
                                {meses.map((m) => (
                                <TableHead key={m} className="whitespace-nowrap text-right">
                                    {m}
                                </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {esc.filas.map((fila, i) => (
                            <TableRow key={fila.Proyecto-i}>
                                <TableCell className="font-medium">{fila.Proyecto}</TableCell>
                                {meses.map((m) => (
                                    <TableCell key={m} className="text-right">
                                        {formatNumberInt(fila[m])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                </div>
                );
            })}
            </div>
        ))}
        </div>
    );
}

export default function ResultsTabs({ data }) {
    return (
        <Tabs defaultValue="qacc" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="qacc" className="gap-2">
                    <span>Q Acumulados</span>
                </TabsTrigger>
                <TabsTrigger value="resumen" className="gap-2">
                    <span>Resumen Montos</span>
                </TabsTrigger>
                <TabsTrigger value="detalles" className="gap-2">
                    <span>Detalles Q Proyectos</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="qacc" className="mt-6">
                <QAcumuladoTable data={data.Q_Acumulado} />
            </TabsContent>
            <TabsContent value="resumen" className="mt-6">
                <ResumenMontosTable data={data.Resumen_Acumulados} />
            </TabsContent>
            <TabsContent value="detalles" className="mt-6">
                <DetallesProgramas data={data.Detalle_Proyectos} />
            </TabsContent>
        </Tabs>
    );
}