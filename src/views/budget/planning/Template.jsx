import Dropzone from "@/components/drag_drop/drag_drop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useForecasts } from "@/hooks/budget/planning/useForecasts";
import { FileDown } from "lucide-react";
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

export default function Template() {

    const templateHref = "/plantillas/Formato_Forecast.xlsx"
    
    const [file, setFile] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataProcess, setDataProcess] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate()
    const { forecast, addNewForecast } = useForecasts({ page: 1, limit: 1000})

    const sheetData = []
    const sheetDataTable = []

    console.log("forecast", forecast)

    const handleProcess = async () => {
        if (!file) return;
        setError(null);
        setLoading(true);

        const fd = new FormData();

        try {

            const buffer = await file[0].arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });

            const sheetName = workbook.SheetNames[0]
            const ws = workbook.Sheets[sheetName];

            const range = XLSX.utils.decode_range(ws['!ref']);
            range.s.r = 2 // Fila 1
            range.s.c = 0 // Columna A

            const rows = XLSX.utils.sheet_to_json(ws, {
                header: 1,   // primera fila = encabezados
                defval: "",  // celdas vacías = "",
                range
            });
            
            if (!rows.length) {
                throw new Error("La hoja está vacía o no tiene datos.");
            }

            const header = rows[0] // header OPEX
            const dataRows = rows.slice(1)

            const fcstOldCols = buildCols(header, 8, 20);
            const cfOldCols = buildCols(header, 21, 25);
            const fcstNewCols = buildCols(header, 26, 38);
            const cfNewCols = buildCols(header, 39, 43);
            const fcstCdgCols = buildCols(header, 44, 56);

            const parsed = dataRows
                .filter((r) => r[0]) // sólo filas con Proyecto
                .map((r) => {

                    const llave = String(r[0]).trim();
                    const codigo_proyecto = String(r[1]).trim();
                    const nombre_proyecto = String(r[2]).trim();
                    const linea_inversion = String(r[3]).trim();
                    const cod_line = String(r[4]).trim();
                    const grupo = String(r[5]).trim();
                    const tipo = String(r[6]).trim();
                    const unidad_funcional = String(r[7]).trim();

                    const monthsFcstOld = buildMonths(r, fcstOldCols);
                    const monthsCfOld = buildMonths(r, cfOldCols);
                    const monthsFcstNew = buildMonths(r, fcstNewCols);
                    const monthsCfNew = buildMonths(r, cfNewCols);
                    const monthsFcstCdg = buildMonths(r, fcstCdgCols);
                    // const monthsCfCdg = buildMonths(r, cfCdgCols);
                    // const monthsCdg = toNum(r[57]);

                    const totalFcstOld = toNum(r[20]);
                    const totalCfOld = toNum(r[25]);
                    const totalFcstNew = toNum(r[38]);
                    const totalCfNew = toNum(r[43]);
                    const totalFcstCdg = toNum(r[56]);
                    const totalCfCdg = toNum(r[57]);

                    const diff_cdg = toNum(r[58]);
                    const solpe = toNum(r[59]);
                    const comprometido = toNum(r[60]);
                    const acta = toNum(r[61]);

                    return {
                        llave,
                        codigo_proyecto,
                        nombre_proyecto,
                        linea_inversion,
                        cod_line,
                        grupo,
                        tipo,
                        unidad_funcional,
                        forecasts: {
                            "old": {
                                fcst: {
                                    total: totalFcstOld,
                                    months: monthsFcstOld
                                },
                                cf: {
                                    total: totalCfOld,
                                    months: monthsCfOld
                                }
                            },
                            "new": {
                                fcst: {
                                    total: totalFcstNew,
                                    months: monthsFcstNew
                                },
                                cf: {
                                    total: totalCfNew,
                                    months: monthsCfNew
                                }
                                
                            },
                            "cdg": {
                                fcst: {
                                    total: totalFcstCdg,
                                    months: monthsFcstCdg
                                },
                                cf: {
                                    total: totalCfCdg,
                                    months: []
                                }
                            }
                        },
                        is_closed: false,
                        diff_cdg,
                        solpe,
                        comprometido,
                        acta
                    };
                });

            sheetData.push(parsed)

            fd.append("parsedSites", sheetData[0]);
            console.log("sheetData", sheetData[0]);
            setDataProcess(sheetData[0]);
            await addNewForecast(sheetData[0])
            toast.success("Datos cargados correctamente")

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
            <h2 className="mb-4 text-2xl font-semibold text-[#2b7fff]">Carga de Plantilla</h2>
            <div className="mb-6">
                <div className="mb-3 text-base font-semibold">Archivos requeridos:</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                    <Card className="flex-1">
                        <CardContent>
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-sm font-semibold">Formato FCST</div>
                            </div>
                            <Dropzone 
                                files={file}
                                onFilesChange={setFile} 
                                error={error}
                                setError={setError}
                                maxFiles={1}
                                onFile={setFile}
                            />
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