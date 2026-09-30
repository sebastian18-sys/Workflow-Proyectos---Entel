import Dropzone from "@/components/drag_drop/drag_drop";
import FileDropzone from "@/components/drag_drop/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEstimations } from "@/hooks/budget/capex/useEstimations";
import { useOpex } from "@/hooks/budget/capex/useOpex";
import { useTickets } from "@/hooks/budget/capex/useTickets";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "wc-toast";
import * as XLSX from "xlsx";

const toNum = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;

    let s = String(v).trim();
    if (!s) return 0;

    // quita espacios
    s = s.replace(/\s/g, "");

    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");

    // si tiene , y . => decide cuál es decimal por el que aparece al final
    if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) {
        // coma decimal, punto miles
        s = s.replace(/\./g, "").replace(",", ".");
        } else {
        // punto decimal, coma miles
        s = s.replace(/,/g, "");
        }
    } else if (lastComma > -1) {
        // solo coma => usualmente decimal
        s = s.replace(/\./g, "").replace(",", ".");
    } else {
        // solo punto o nada => quitar comas miles
        s = s.replace(/,/g, "");
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
};


const buildCols = (headerRow, start, end) =>
    headerRow
        .slice(start, end)
        .map((h, i) => ({ idx: start + i, header: String(h ?? "").trim() }))
        .filter((c) => c.header);

const buildMonths = (row, cols) =>
    cols.map((c) => ({
        header: c.header,          // ej: "Ene Plan"
        value: toNum(row[c.idx]),  // ej: 487342.30
}));


export default function UploadOpex() {

    const templateHref = "/plantillas/Formato_Plan_OPEX.xlsx"

    const [open, setOpen] = useState(false);
    const [file, setFile] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataProcess, setDataProcess] = useState(null);
    const [error, setError] = useState(null);
    const [dataInitTable, setDataInitTable] = useState(null);
    const [history, setHistory] = useState([]);
    const navigate = useNavigate()
    // const { addTickets } = useTickets()
    const { opex, addData } = useOpex()
    const { postEstimation } = useEstimations()

    const sheetData = []
    const sheetDataTable = []

    console.log("OPEX", opex)

    const handleProcess = async () => {
        if (!file) return;
        setError(null);
        setLoading(true);

        const fd = new FormData();

        try {

            const buffer = await file[0].arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });

            const sheetName = workbook.SheetNames[0]
            // console.log(workbook.SheetNames)


            // for (const sheetName of workbook.SheetNames) {
                console.log(sheetName)
                const ws = workbook.Sheets[sheetName];

                const range = XLSX.utils.decode_range(ws['!ref']);
                range.s.r = 1 // Fila 1
                range.s.c = 0 // Columna A

                const rows = XLSX.utils.sheet_to_json(ws, {
                    header: 1,   // primera fila = encabezados
                    defval: "",  // celdas vacías = "",
                    range
                });
                
                if (!rows.length) {
                    throw new Error("La hoja está vacía o no tiene datos.");
                }

                // ---- Estructura esperada (según formato):
                // ========================================================================
                const header = rows[0] // header OPEX
                // ========================================================================
                // const header = rows[1] // header ESTIMACION

                const dataRows = rows.slice(1)

                // ====================== ESTIMACIONES ====================================
                // const planCols = buildCols(header, 8, 20);
                // const fcst210 = buildCols(header, 20, 32);
                // const fcst57 = buildCols(header, 32, 44);
                // ========================================================================

                // ====================== OPEX TOTAL ======================================
                const planCols = buildCols(header, 8, 20);
                const fcst210 = buildCols(header, 21, 33);
                const fcst57 = buildCols(header, 34, 46);
                const comp = buildCols(header, 47, 59);

                // const provisionCols = buildCols(header, 20, 32);
                // const realCols = buildCols(header, 33, 45);

                // const planHeaders = planCols.map((c) => c.header);
                // const provisionHeaders = provisionCols.map((c) => c.header);
                // const realHeaders = realCols.map((c) => c.header);

                // =================================ESTIMACIONES =================================
                // const parsed = dataRows
                //     .filter((r) => r[0]) // sólo filas con Proyecto
                //     .map((r) => {

                //         // const llave = String(r[0]).trim();
                //         const tipo = String(r[0]).trim();
                //         const proyecto = String(r[1]).trim();
                //         const proyecto_sitio = String(r[2]).trim();
                //         const categoria = String(r[3]).trim();
                //         const incidencia_actividad = String(r[4]).trim();
                //         const driver_actividad = String(r[5]).trim();
                //         const incidencia_energia = String(r[6]).trim();
                //         const driver_energia = String(r[7]).trim();

                //         const monthsPlan = buildMonths(r, planCols);
                //         const months210 = buildMonths(r, fcst210);
                //         const months57 = buildMonths(r, fcst57);
                //         // const monthsProvision = buildMonths(r, provisionCols);
                //         // const monthsReal = buildMonths(r, realCols);

                //         // const totalPlan = toNum(r[19]);
                //         // const totalProvision = toNum(r[32]);
                //         // const totalReal = toNum(r[45]);

                //         return {
                //             tipo,
                //             proyecto,
                //             proyecto_sitio,
                //             categoria,
                //             incidencia_actividad,
                //             driver_actividad,
                //             incidencia_energia,
                //             driver_energia,
                //             q_mensuales: {
                //                 q_plan: monthsPlan,
                //                 q_210: months210,
                //                 q_57: months57
                //             },
                //         };
                //     });
                // ==================================================================

                // =================================OPEX TOTAL =================================
                const parsed = dataRows
                    .filter((r) => r[0]) // sólo filas con Proyecto
                    .map((r) => {

                        // const llave = String(r[0]).trim();
                        const estructura = String(r[0]).trim();
                        const subestructura = String(r[1]).trim();
                        const nombre_proyecto = String(r[2]).trim();
                        const codigo_proyecto = String(r[3]).trim();
                        const flexfield = String(r[4]).trim();
                        const unidad_funcional = String(r[5]).trim();
                        const responsable = String(r[6]).trim();
                        const tipo_proyecto = String(r[7]).trim();

                        const monthsPlan = buildMonths(r, planCols);
                        const months210 = buildMonths(r, fcst210);
                        const months57 = buildMonths(r, fcst57);
                        const monthsComp = buildMonths(r, comp);
                        // const monthsProvision = buildMonths(r, provisionCols);
                        // const monthsReal = buildMonths(r, realCols);

                        const totalPlan = toNum(r[20]);
                        const total210 = toNum(r[33]);
                        const total57 = toNum(r[46]);
                        const totalComp = toNum(r[59]);

                        return {
                            estructura,
                            subestructura,
                            nombre_proyecto,
                            codigo_proyecto,
                            flexfield,
                            unidad_funcional,
                            responsable,
                            tipo_proyecto,
                            amounts: {
                                "Plan": {
                                    total: totalPlan,
                                    months: monthsPlan
                                },
                                "2+10": {
                                    total: total210,
                                    months: months210
                                },
                                "5+7": {
                                    total: total57,
                                    months: months57
                                },
                                real: {
                                    total: totalComp,
                                    months: monthsComp
                                }
                            },
                        };
                    });
                // ==================================================================

                sheetData.push(parsed)

                // const tableData = parsed.map((row) => ({
                //     Proyecto: row.proyecto,
                //     ...row.meses,
                // }));

                // sheetDataTable.push({ headers: monthHeaders, rows: tableData, programa: sheetName })

            // }

            // fd.append("parsedSites", JSON.stringify(sheetData[0]));
            // console.log("parsed", parsed)
            // console.log("sd", sheetData[0])

            fd.append("parsedSites", sheetData[0]);

            console.log("sheetData", sheetData[0]);

            setDataProcess(sheetData[0]);

            // ====================== OPEX TOTAL ======================================
            await addData(sheetData[0])

            // ====================== ESTIMACIONES ====================================
            // await postEstimation(sheetData[0])
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
                                <div className="text-sm font-semibold">Formato OPEX</div>
                            </div>

                            <Dropzone 
                                files={file}
                                onFilesChange={setFile} 
                                error={error}
                                setError={setError}
                                maxFiles={1}
                                onFile={setFile}
                            />

                            {/* {file && (
                                <div className="text-xs text-muted-foreground">Archivo seleccionado: {file.name}</div>
                            )}
                            {error && <div className="text-sm text-red-600">{error}</div>} */}

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
        </div>
    )
}