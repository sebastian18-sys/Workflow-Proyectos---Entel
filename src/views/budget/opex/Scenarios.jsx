import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Dropzone from "@/components/drag_drop/drag_drop";
import SimulationIllustration from "@/icons/SimulationIllustration";
import * as XLSX from "xlsx";
import InitTabs from "@/components/init-scenarios-opex/InitTabs";
import { ArrowLeft } from "lucide-react";

const TEMPLATE_URL = "/plantillas/Escenarios_OPEX.xlsx";

export default function Scenarios() {

	const [open, setOpen] = useState(false);
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [dataProcess, setDataProcess] = useState(null);
	const [error, setError] = useState(null);
	const [dataInitTable, setDataInitTable] = useState(null);

	const sheetData = []
	const sheetDataTable = []

	const handleProcess = async () => {
		if (!file) return;
		setError(null);
		setLoading(true);

		try {

			const buffer = await file.arrayBuffer();
			const workbook = XLSX.read(buffer, { type: "array" });

			console.log(workbook.SheetNames)


			for (const sheetName of workbook.SheetNames) {
				console.log(sheetName)
				const ws = workbook.Sheets[sheetName];
				const rows = XLSX.utils.sheet_to_json(ws, {
					header: 1,   // primera fila = encabezados
					defval: "",  // celdas vacías = ""
				});

				if (!rows.length) {
					throw new Error("La hoja está vacía o no tiene datos.");
				}

				// ---- Estructura esperada (según formato):
				const header = rows[0]
				const dataRows = rows.slice(1)

				const startMonthCol = 4; // índice E = 4
				const totalColIndex = header.findIndex((h) =>
					String(h).toLowerCase().includes("total")
				);
				const endMonthCol = totalColIndex > startMonthCol ? totalColIndex : header.length;

				const monthHeaders = header
					.slice(startMonthCol, endMonthCol)
					.map((h) => String(h).trim())
					.filter((h) => h); // sin vacíos

				const parsed = dataRows
					.filter((r) => r[0]) // sólo filas con Proyecto
					.map((r) => {
						const proyecto = String(r[0]).trim();
						const incidencia = String(r[2]).trim();
						const driver = String(r[3]).trim();

						const meses = {};
						let total = 0
						let sumTotal = 0
						monthHeaders.forEach((m, i) => {
							const value = r[startMonthCol + i];
							const num = Number(value || 0);
							meses[m] = isNaN(num) ? 0 : num;
							total += isNaN(num) ? 0 : num * Number(driver) * Number(incidencia);
							sumTotal += Number(total)
						});

						meses.total = total.toFixed(0)
						meses.sumTotal = sumTotal.toFixed(0)

						return {
							programa: sheetName,
							proyecto,
							incidencia,
							driver,
							meses,
						};
					});

				sheetData.push(parsed)

				const tableData = parsed.map((row) => ({
					Proyecto: row.proyecto,
					...row.meses,
				}));

				sheetDataTable.push({ headers: monthHeaders, rows: tableData, programa: sheetName })

			}
			
			setDataProcess(sheetData);
			setDataInitTable(sheetDataTable)
			setOpen(false);

		} catch (e) {
			setError(e?.message || "No se pudo procesar el archivo");
		} finally {
			setLoading(false);
		}

	};

	const showResults = !!dataProcess && !loading;

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

				{/* Breadcrumb */}
				<div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
					<a 
						href="#" 
						title="Atrás" 
						class="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
					>
						<ArrowLeft className="h-5 w-5" />
					</a>
					<h2 className="text-2xl font-semibold text-[#2b7fff]">Escenarios</h2>
				</div>

				{/* Descripción + CTA */}
				<div className="rounded-2xl bg-white p-6 shadow-sm">
					<div className="flex flex-col gap-4 md:flex-row md:items-start">
						<div className="flex-1 space-y-3">
							<h2 className="text-xl font-semibold">Genera escenarios de OPEX por proyectos</h2>
							<p className="text-sm text-muted-foreground">
								Sube el formato de escenarios, presiona <span className="font-medium">“Nuevos Escenarios”</span> y el sistema
								calculará automáticamente los indicadores. Luego podrás navegar las tres vistas: <span className="font-medium">Q Acumulados</span>,
								<span className="font-medium"> Resumen Montos</span> y <span className="font-medium">Detalles Q Proyectos</span>.
							</p>
						</div>
						<div className="flex w-full justify-end md:w-auto">
							<Dialog open={open} onOpenChange={setOpen}>
								<DialogTrigger asChild>
									<Button
										className="rounded-2xl px-5 py-5 text-white"
										style={{ backgroundColor: "#2b7fff" }}
									>
									Nuevos Escenarios
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-2xl">
									<DialogHeader>
										<DialogTitle>Generar escenarios</DialogTitle>
										<DialogDescription>
											Descarga el formato, cárgalo con tus datos y procesa para obtener los resultados.
										</DialogDescription>
									</DialogHeader>

									<div className="space-y-4">
										<a
											href={TEMPLATE_URL}
											download
											className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
										>
											Descargar formato en Excel
										</a>
										<Dropzone onFile={setFile} />
										{file && (
											<div className="text-xs text-muted-foreground">Archivo seleccionado: {file.name}</div>
										)}
										{error && <div className="text-sm text-red-600">{error}</div>}
									</div>

									<DialogFooter>
										<Button variant="outline" onClick={() => setOpen(false)}>
											Cancelar
										</Button>
										<Button
											disabled={!file || loading}
											onClick={handleProcess}
											className="text-white"
											style={{ backgroundColor: "#2b7fff" }}
										>
											{loading ? "Procesando…" : "Procesar"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</div>

					<div className="mt-6">
						{!showResults ? (
							<SimulationIllustration />
						) : (
							<InitTabs dataTable={dataInitTable} dataProcess={dataProcess} />
						)}
					</div>
				</div>
				{/* Loading overlay */}
				{loading && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
						<div className="rounded-2xl bg-white p-6 shadow-lg">
							<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
							<div className="text-sm">Procesando escenarios…</div>
						</div>
					</div>
				)}
			</div>
        </div>
    )
}