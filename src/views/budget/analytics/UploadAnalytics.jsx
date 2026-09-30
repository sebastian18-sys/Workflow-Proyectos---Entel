import Dropzone from "@/components/drag_drop/drag_drop";
import FileDropzone from "@/components/drag_drop/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTickets } from "@/hooks/budget/capex/useTickets";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "wc-toast";
import * as XLSX from "xlsx";

export default function UploadAnalytics() {

    const templateHref = "/plantillas/Formato_Solicitud_RQ.xlsx"

    const [open, setOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataProcess, setDataProcess] = useState(null);
    const [error, setError] = useState(null);
    const [dataInitTable, setDataInitTable] = useState(null);
    const [history, setHistory] = useState([]);
    const navigate = useNavigate()
    const { addTickets } = useTickets()

    const sheetData = []
    const sheetDataTable = []

    const handleProcess = async () => {
        if (!file) return;
        setError(null);
        setLoading(true);

        const fd = new FormData();

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
                const header = rows[1]
                const dataRows = rows.slice(2)

                const parsed = dataRows
                    .filter((r) => r[0]) // sólo filas con Proyecto
                    .map((r) => {

                        // const llave = String(r[0]).trim();
                        const nro = String(r[0]).trim();
                        const identificador = String(r[1]).trim();
                        const sitio = String(r[2]).trim();
                        const actividad = String(r[3]).trim();
                        const proveedor = String(r[4]).trim();
                        const sustento = String(r[5]).trim();
                        const acuerdo_compras = String(r[6]).trim();
                        const coordinador = String(r[7]).trim();
                        const moneda = String(r[8]).trim();
                        const cantidad = String(r[9]).trim();
                        const precio_unitario = String(r[10]).trim();
                        const total_cotizacion = String(r[11]).trim();
                        const fecha_registro = String(r[12]).trim();
                        const fecha_inicio_servicio = String(r[13]).trim();
                        const fecha_fin_servicio = String(r[14]).trim();
                        const descripcion_adicional = String(r[15]).trim();
                        const id_proyecto = String(r[16]).trim();
                        const nombre_proyecto = String(r[17]).trim();
                        const linea_inversion = String(r[18]).trim();
                        const articulo = String(r[19]).trim();
                        const jefatura = String(r[20]).trim();
                        // const estado = String(r[21]).trim();
                        // const ticket = String(r[22]).trim();

                        // const proyecto = String(r[0]).trim();
                        // const incidencia = String(r[2]).trim();
                        // const driver = String(r[3]).trim();

                        // const meses = {};
                        // let total = 0
                        // let sumTotal = 0
                        // monthHeaders.forEach((m, i) => {
                        //     const value = r[startMonthCol + i];
                        //     const num = Number(value || 0);
                        //     meses[m] = isNaN(num) ? 0 : num;
                        //     total += isNaN(num) ? 0 : num * Number(driver) * Number(incidencia);
                        //     sumTotal += Number(total)
                        // });

                        // meses.total = total.toFixed(0)
                        // meses.sumTotal = sumTotal.toFixed(0)

                        // console.log("DATE", new Date(fecha_inicio_servicio))

                        return {
                            nro,
                            identificador,
                            sitio,
                            actividad,
                            proveedor,
                            sustento,
                            acuerdo_compras,
                            coordinador,
                            moneda,
                            cantidad,
                            precio_unitario,
                            total_cotizacion,
                            fecha_registro,
                            fecha_inicio_servicio,
                            fecha_fin_servicio,
                            descripcion_adicional,
                            id_proyecto,    
                            nombre_proyecto,
                            linea_inversion,
                            articulo,
                            jefatura,
                            // estado,
                            // ticket
                        };
                    });

                sheetData.push(parsed)

                // const tableData = parsed.map((row) => ({
                //     Proyecto: row.proyecto,
                //     ...row.meses,
                // }));

                // sheetDataTable.push({ headers: monthHeaders, rows: tableData, programa: sheetName })

            }


            const tdata = {
                ticket_name: "SOLICITUD RQ PROY RANCO TDD",
                requester: "ERICK JAPAY",
                requester_email: "erick.japay@entel.pe",
            }


            fd.append("ticketData", JSON.stringify(tdata));
            fd.append("parsedSites", JSON.stringify(sheetData[0]));
            fd.append("file", file);
            
            setDataProcess(sheetData[0]);
            await addTickets(fd)
            toast.success("Datos cargados correctamente")
            // history.push("/budget/capex/tickets")
            // navigate("/budget/analytics/tickets")
            // setDataInitTable(sheetDataTable)
            // setOpen(false);

        } catch (e) {
            setError(e?.message || "No se pudo procesar el archivo");
            toast.error("Error al cargar archivo")
        } finally {
            setLoading(false);
        }

    };

    console.log(dataProcess)
    const showResults = !!dataProcess && !loading;

    console.log(showResults)

    return (
        <div className="bg-white m-8 rounded-2xl space-y-4 p-4 md:p-6">
            <h2 className="mb-4 text-2xl font-semibold text-[#2b7fff]">Carga de datos</h2>
            {/* 1) OBLIGATORIOS con años */}
            <div className="mb-6">
                <div className="mb-3 text-base font-semibold">Archivos requeridos:</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <Card className="flex-1">
                        <CardContent>
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-sm font-semibold">Formato RQ</div>
                            </div>

                            <Dropzone onFile={setFile} />

                            {file && (
                                <div className="text-xs text-muted-foreground">Archivo seleccionado: {file.name}</div>
                            )}
                            {error && <div className="text-sm text-red-600">{error}</div>}

                            <div className="mt-3 flex items-center justify-between">
                                <a href={templateHref} download className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                                    <FileDown className="h-4 w-4" /> Descargar plantilla
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mb-10 flex justify-end">
                <Button
                    disabled={!file || loading}
                    onClick={handleProcess}
                    className="text-white"
                    style={{ backgroundColor: "#2b7fff" }}
                >
                    {loading ? "Procesando…" : "Procesar"}
                </Button>
            </div>

            {/* 3) HISTÓRICO */}
            <Card>
                <CardContent>
                <div className="mb-3 text-base font-semibold">Histórico de cargas</div>
                <div className="overflow-auto rounded-xl border">
                    <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="border-b px-3 py-2 text-left">Usuario</th>
                        <th className="border-b px-3 py-2 text-left">Documento</th>
                        <th className="border-b px-3 py-2 text-left">Archivo</th>
                        <th className="border-b px-3 py-2 text-left">Fecha de carga</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">Aún no hay cargas en esta sesión.</td></tr>
                        ) : history.map((h, i) => (
                        <tr key={i} className="even:bg-gray-50/60">
                            <td className="border-b px-3 py-2">{h.year ?? "—"}</td>
                            <td className="border-b px-3 py-2">{h.doc}</td>
                            <td className="border-b px-3 py-2">{h.filename}</td>
                            <td className="border-b px-3 py-2">{new Date(h.at).toLocaleString()}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </CardContent>
            </Card>
        </div>
    )
}