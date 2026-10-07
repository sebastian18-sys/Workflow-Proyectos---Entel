import { useEffect, useMemo, useState } from "react";
import Dropzone from "@/components/drag_drop/drag_drop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, FileDown, Save, Trash2 } from "lucide-react";
import { toast } from "wc-toast";
import * as XLSX from "xlsx";
import { useIdentifers } from "@/hooks/projects/useIdentifers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const NAVS = [
    "Expansiones",
    "Macros",
    "Transporte",
    "Comerciales",
    "Expansiones 3.5",
    "Sitios Nuevos 3.5",
    "GCIR"
];

const TABLE_COLUMNS = [
    { key: "identificador", label: "IDENTIFICADOR", width: "min-w-[170px]" },
    { key: "site", label: "SITE", width: "min-w-[160px]" },
    { key: "idProyecto", label: "ID PROYECTO", width: "min-w-[100px]" },
    { key: "proyecto", label: "PROYECTO", width: "min-w-[220px]" },
    { key: "subProyecto", label: "SUBPROYECTO", width: "min-w-[150px]" },
    { key: "estado", label: "ESTADO", width: "min-w-[150px]" },
    { key: "fechaFcst", label: "FECHA FCST", width: "min-w-[150px]" },
    { key: "fechaReal", label: "FECHA REAL", width: "min-w-[150px]" }
];

const createId = () =>
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const emptyRow = (tipoProyecto) => ({
    id: createId(),
    id_back: null,
    tipoProyecto,
    identificador: "",
    site: "",
    idProyecto: "",
    proyecto: "",
    estado: "",
});

const normalizeRow = (row) => ({
    id: row.id ?? createId(),
    id_back: row.id ?? null,
    tipoProyecto: row.project_type ?? NAVS[0],
    identificador: row.name ?? "",
    site: row.site ?? "",
    idProyecto: row.project_code ?? "",
    proyecto: row.project_name ?? "",
    subProyecto: row.project_sub ?? "",
    estado: row.state ?? "",
    fechaFcst: row.date_fcst ?? "",
    fechaReal: row.date_real ?? ""
});

const isRowEmpty = (row) =>
    TABLE_COLUMNS.every(({ key }) => String(row?.[key] ?? "").trim() === "");

const ensureNavHasEditableTail = (allRows, nav) => {
    const rowsOfNav = allRows.filter((row) => row.tipoProyecto === nav);
    const otherRows = allRows.filter((row) => row.tipoProyecto !== nav);

    const nonEmptyRows = rowsOfNav.filter((row) => !isRowEmpty(row));

    return [...otherRows, ...nonEmptyRows, emptyRow(nav)];
};


export default function Identifiers({
    // initialData = [],
    onSave,
}) {

    const [file, setFile] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataProcess, setDataProcess] = useState(null);
    const [error, setError] = useState(null);
    const { identifiers, updateData } = useIdentifers()

    const sheetData = []

    // ---------------------------------- CON ARCHIVO ----------------------------------------
    // const handleProcess = async () => {
    //     if (!file) return;
    //     setError(null);
    //     setLoading(true);

    //     const fd = new FormData();

    //     try {

    //         const buffer = await file[0].arrayBuffer();
    //         const workbook = XLSX.read(buffer, { type: "array" });
    //         const sheetName = workbook.SheetNames[0]
    //         const ws = workbook.Sheets[sheetName];

    //         const range = XLSX.utils.decode_range(ws['!ref']);
    //         range.s.r = 0 // Fila 1
    //         range.s.c = 0 // Columna A

    //         const rows = XLSX.utils.sheet_to_json(ws, {
    //             header: 1,   // primera fila = encabezados
    //             defval: "",  // celdas vacías = "",
    //             range
    //         });
            
    //         if (!rows.length) {
    //             throw new Error("La hoja está vacía o no tiene datos.");
    //         }

    //         // ---- Estructura esperada (según formato):
    //         const header = rows[1]
    //         const dataRows = rows.slice(2)

    //         const parsed = dataRows
    //             .filter((r) => r[0])
    //             .map((r) => {

    //                 const identificador = String(r[0]).trim();
    //                 const tipo = String(r[1]).trim();
    //                 const site = String(r[2]).trim();
    //                 const id_proyecto = String(r[3]).trim();
    //                 const nombre_proyecto = String(r[4]).trim();
    //                 const sub_proyecto = String(r[5]).trim();
    //                 const estado = String(r[7]).trim();
    //                 const date_fcst = String(r[8]).trim();
    //                 const date_real = String(r[9]).trim();

    //                 return {
    //                     identificador,
    //                     tipo, 
    //                     site,
    //                     id_proyecto,
    //                     nombre_proyecto,
    //                     sub_proyecto,
    //                     estado,
    //                     date_fcst,
    //                     date_real
    //                 };
    //             });

    //         sheetData.push(parsed)
    //         fd.append("parsedSites", sheetData[0]);
    //         // console.log("SHEETDATA", sheetData[0])
    //         setDataProcess(sheetData[0]);
    //         postData(sheetData[0])
    //         toast.success("Datos cargados correctamente")
    //     } catch (e) {
    //         setError(e?.message || "No se pudo procesar el archivo");
    //         toast.error("Error al cargar archivo")
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    // --------------------------------------- CON CAMPOS ------------------------------------------
    const [activeNav, setActiveNav] = useState(NAVS[0]);
    const [saving, setSaving] = useState(false);
    const [selectedRowIds, setSelectedRowIds] = useState([]);

    const [filters, setFilters] = useState({
        identificador: "",
        site: "",
        idProyecto: "",
        proyecto: "",
        subProyecto: "",
        estado: "",
        fechaFcst: "",
        fechaReal: ""
    });

    const [rows, setRows] = useState(() =>
        ensureNavHasEditableTail(identifiers.map(normalizeRow), NAVS[0])
    );

    useEffect(() => {
        setSelectedRowIds([]);
    }, [activeNav]);


    const normalizedIdentifiers = useMemo(() => {
        return (identifiers || []).map((row) => ({
            id: `db-${row.id}`,
            backendId: row.id ?? null,
            tipoProyecto: row.project_type ?? NAVS[0],
            identificador: row.name ?? "",
            site: row.site ?? "",
            idProyecto: row.project_code ?? "",
            proyecto: row.project_name ?? "",
            subProyecto: row.project_sub ?? "",
            estado: row.state ?? "",
            fechaFcst: row.date_fcst ?? "",
            fechaReal: row.date_real ?? ""
        }));
    }, [identifiers]);

    useEffect(() => {
        let next = [...normalizedIdentifiers];

        NAVS.forEach((nav) => {
            next = ensureNavHasEditableTail(next, nav);
        });

        setRows(next);
    }, [normalizedIdentifiers]);

    const matchesFilters = (row, appliedFilters = filters) => {
        return TABLE_COLUMNS.every(({ key }) => {
        const rowValue = String(row[key] ?? "").toLowerCase();
        const filterValue = String(appliedFilters[key] ?? "").toLowerCase().trim();
        return rowValue.includes(filterValue);
        });
    };

    const rowsOfActiveNav = useMemo(
        () => rows.filter((row) => row.tipoProyecto === activeNav),
        [rows, activeNav]
    );

    const dataRowsOfActiveNav = useMemo(
        () => rowsOfActiveNav.filter((row) => !isRowEmpty(row)),
        [rowsOfActiveNav]
    );

    const filteredDataRows = useMemo(() => {
        return dataRowsOfActiveNav.filter((row) => matchesFilters(row));
    }, [dataRowsOfActiveNav, filters]);

    const visibleRows = useMemo(() => {
        return [...filteredDataRows, emptyRow(activeNav)];
    }, [filteredDataRows, activeNav]);

    const visibleSelectableRowIds = useMemo(
        () => filteredDataRows.map((row) => row.id),
        [filteredDataRows]
    );

    const allVisibleSelected =
        visibleSelectableRowIds.length > 0 &&
        visibleSelectableRowIds.every((id) => selectedRowIds.includes(id));

    const someVisibleSelected =
        visibleSelectableRowIds.some((id) => selectedRowIds.includes(id)) &&
        !allVisibleSelected;

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            identificador: "",
            site: "",
            idProyecto: "",
            proyecto: "",
            subProyecto: "",
            estado: "",
            fechaFcst: "",
            fechaReal: ""
        });
    };

    const updateCell = (rowId, key, value) => {
        setRows((prev) => {
            const exists = prev.some((row) => row.id === rowId);

            let next;

            if (exists) {
            next = prev.map((row) =>
                row.id === rowId ? { ...row, [key]: value } : row
            );
            } else {
            next = [...prev, { ...emptyRow(activeNav), id: rowId, [key]: value }];
            }

            return ensureNavHasEditableTail(next, activeNav);
        });
    };

    const toggleRowSelection = (rowId, checked) => {
        setSelectedRowIds((prev) => {
        if (checked) return [...new Set([...prev, rowId])];
        return prev.filter((id) => id !== rowId);
        });
    };

    const toggleSelectAllVisible = (checked) => {
        setSelectedRowIds((prev) => {
        if (checked) {
            return [...new Set([...prev, ...visibleSelectableRowIds])];
        }
        return prev.filter((id) => !visibleSelectableRowIds.includes(id));
        });
    };

    const removeSelectedRows = () => {
        if (selectedRowIds.length === 0) return;

        setRows((prev) => {
        const next = prev.filter((row) => !selectedRowIds.includes(row.id));
        return ensureNavHasEditableTail(next, activeNav);
        });

        setSelectedRowIds([]);
    };

    const removeSingleRow = (rowId) => {
        setRows((prev) => {
        const next = prev.filter((row) => row.id !== rowId);
        return ensureNavHasEditableTail(next, activeNav);
        });

        setSelectedRowIds((prev) => prev.filter((id) => id !== rowId));
    };

    const copyVisibleRows = async () => {
        const header = TABLE_COLUMNS.map((c) => c.label).join("\t");
        const body = filteredDataRows
        .map((row) => TABLE_COLUMNS.map((col) => row[col.key] ?? "").join("\t"))
        .join("\n");

        const text = [header, body].filter(Boolean).join("\n");

        try {
        await navigator.clipboard.writeText(text);
        } catch (error) {
        console.error("No se pudo copiar al portapapeles", error);
        }
    };

    const applyPasteText = (text, startRowIndex = 0, startColIndex = 0) => {
        const parsed = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => line.split("\t"));

        if (!parsed.length) return;

        setRows((prev) => {
        const next = [...prev];

        const currentRowsOfNav = next.filter((row) => row.tipoProyecto === activeNav);
        const currentTailRow =
            currentRowsOfNav.find((row) => isRowEmpty(row)) ?? emptyRow(activeNav);

        const currentFilteredDataRows = currentRowsOfNav
            .filter((row) => !isRowEmpty(row))
            .filter((row) => matchesFilters(row));

        const currentVisibleRows = [...currentFilteredDataRows, currentTailRow];
        const targetRowIds = [];

        parsed.forEach((_, rowOffset) => {
            const targetVisibleRow = currentVisibleRows[startRowIndex + rowOffset];

            if (targetVisibleRow) {
            targetRowIds.push(targetVisibleRow.id);
            } else {
            const newRow = emptyRow(activeNav);
            next.push(newRow);
            currentVisibleRows.push(newRow);
            targetRowIds.push(newRow.id);
            }
        });

        parsed.forEach((pasteRow, rowOffset) => {
            const targetRowId = targetRowIds[rowOffset];
            const rowIndexInNext = next.findIndex((r) => r.id === targetRowId);
            if (rowIndexInNext === -1) return;

            const updatedRow = { ...next[rowIndexInNext] };

            pasteRow.forEach((cellValue, colOffset) => {
            const col = TABLE_COLUMNS[startColIndex + colOffset];
            if (!col) return;
            updatedRow[col.key] = cellValue;
            });

            next[rowIndexInNext] = updatedRow;
        });

        return ensureNavHasEditableTail(next, activeNav);
        });
    };

    const handlePasteBlock = (e, startRowIndex, startColIndex) => {
        const text = e.clipboardData.getData("text/plain");
        if (!text) return;
        if (!text.includes("\t") && !text.includes("\n")) return;

        e.preventDefault();
        applyPasteText(text, startRowIndex, startColIndex);
    };

    const handlePasteIntoZone = (e) => {
        const text = e.clipboardData.getData("text/plain");
        if (!text) return;

        e.preventDefault();
        const startRowIndex = Math.max(visibleRows.length - 1, 0);
        applyPasteText(text, startRowIndex, 0);
    };

    // GUARDAR
    const handleSave = async () => {
        const payload = rows
            .filter((row) => row.tipoProyecto === activeNav && !isRowEmpty(row))
            .map((row) => ({
                ...(row.backendId != null ? { id: row.backendId } : {}),
                name: row.identificador,
                project_type: row.tipoProyecto,
                site: row.site,
                project_code: row.idProyecto,
                project_name: row.proyecto,
                project_sub: row.subProyecto,
                state: row.estado,
                date_fcst: row.fechaFcst,
                date_real: row.fechaReal
            }));

        const fd = {
            rows: payload,
            tipoProyecto: activeNav
        }

        try {
            setSaving(true);

            if (onSave) {
                await onSave(payload, activeNav);
            } else {
                console.log("Guardar cambios:", {
                    tipoProyecto: activeNav,
                    rows: payload,
                });
                await updateData(fd)
                toast.success("Datos guardados correctamente")
            }
        } catch (error) {
            console.error("Error al guardar", error);
            toast.error("Error al guardar")
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col px-4 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">
                {/* Breadcrumb */}
                <div className="flex gap-4 items-center mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Identificadores</h2>
                </div>

                {/* Main CARGA CON EXCEL */}
                {/* <div>
                    <div className="relative">

                        <div className="bg-white relative rounded-lg p-6 mb-6">

                            <div className="mb-6">
                                <div className="mb-3 text-base font-semibold">Archivos requeridos:</div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                                    <Card className="flex-1">
                                        <CardContent>
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="text-sm font-semibold">Formato Identificadores</div>
                                            </div>
                                            <Dropzone 
                                                files={file}
                                                onFilesChange={setFile} 
                                                error={error}
                                                setError={setError}
                                                maxFiles={1}
                                                onFile={setFile}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div className="mb-10 flex justify-end">
                                <Button
                                    disabled={!file || loading}
                                    onClick={handleProcess}
                                    className="text-white cursor-pointer"
                                    style={{ backgroundColor: "#2b7fff" }}
                                >
                                    {loading ? "Procesando…" : "Procesar"}
                                </Button>
                            </div>

                        </div>

                    </div>
                </div> */}

                {/* POR EXCEL GRID */}
                <div>
                    <div className="relative">

                        <div className="bg-white relative rounded-lg p-6 mb-6">
                            
                            <Card className="p-0 rounded-2xl border border-slate-200 shadow-sm">
                                <CardContent className="p-4 md:p-5">
                                    <div className="mb-4 flex flex-col gap-8">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold text-[#2b7fff]">
                                                    Gestión por Tipo de Proyecto
                                                </h2>
                                                <p className="text-sm text-slate-500">
                                                    Filtra, pega desde Excel, edita y guarda cambios.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-slate-200"
                                                    onClick={copyVisibleRows}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copiar vista
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                                    onClick={removeSelectedRows}
                                                    disabled={selectedRowIds.length === 0}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar seleccionadas
                                                </Button>

                                                <Button
                                                    type="button"
                                                    className="bg-[#2b7fff] text-white hover:bg-[#1f6ae6]"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                >
                                                    <Save className="mr-2 h-4 w-4" />
                                                    {saving ? "Guardando..." : "Guardar"}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {NAVS.map((nav) => {
                                            const isActive = activeNav === nav;

                                            return (
                                                <button
                                                key={nav}
                                                type="button"
                                                onClick={() => setActiveNav(nav)}
                                                className={[
                                                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                                                    isActive
                                                    ? "border-[#2b7fff] bg-[#eff6ff] text-[#2b7fff] shadow-sm"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-[#2b7fff]/40 hover:text-[#2b7fff]",
                                                ].join(" ")}
                                                >
                                                {nav}
                                                </button>
                                            );
                                            })}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="border-slate-200 text-slate-600">
                                                Filas con data: {filteredDataRows.length}
                                            </Badge>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-8 px-2 text-slate-500 hover:text-[#2b7fff]"
                                                onClick={clearFilters}
                                            >
                                                Limpiar filtros
                                            </Button>
                                        </div>

                                        <div
                                            tabIndex={0}
                                            onPaste={handlePasteIntoZone}
                                            className="rounded-xl border border-dashed border-[#2b7fff]/40 bg-[#2b7fff]/[0.04] p-4 outline-none transition focus:border-[#2b7fff] focus:ring-2 focus:ring-[#2b7fff]/20"
                                        >
                                            <div className="text-sm font-medium text-[#2b7fff]">
                                            Pega aquí un bloque desde Excel
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                            Se pegará desde la fila vacía final y se crearán nuevas filas automáticamente.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-auto rounded-xl border border-slate-200">
                                    <Table>
                                        <TableHeader className="sticky top-0 z-10 bg-white">
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="w-[52px] border-b border-slate-200">
                                            <div className="flex h-full items-center justify-center pt-2">
                                                <Checkbox
                                                checked={
                                                    allVisibleSelected
                                                    ? true
                                                    : someVisibleSelected
                                                        ? "indeterminate"
                                                        : false
                                                }
                                                onCheckedChange={(checked) =>
                                                    toggleSelectAllVisible(Boolean(checked))
                                                }
                                                />
                                            </div>
                                            </TableHead>

                                            {TABLE_COLUMNS.map((column) => (
                                            <TableHead
                                                key={column.key}
                                                className={`${column.width} border-b border-slate-200 align-top`}
                                            >
                                                <div className="space-y-2 py-2">
                                                <div className="text-xs font-semibold tracking-wide text-[#2b7fff]">
                                                    {column.label}
                                                </div>

                                                <Input
                                                    value={filters[column.key]}
                                                    onChange={(e) => updateFilter(column.key, e.target.value)}
                                                    placeholder={`Filtrar ${column.label.toLowerCase()}`}
                                                    className="h-8 border-slate-200 text-xs focus-visible:ring-[#2b7fff]"
                                                />
                                                </div>
                                            </TableHead>
                                            ))}

                                            <TableHead className="w-[72px] border-b border-slate-200">
                                            <div className="py-2 text-center text-xs font-semibold tracking-wide text-[#2b7fff]">
                                                ACCIÓN
                                            </div>
                                            </TableHead>
                                        </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                        {visibleRows.map((row, rowIndex) => {
                                            const isTail = isRowEmpty(row);

                                            return (
                                            <TableRow key={row.id} className="hover:bg-slate-50/70">
                                                <TableCell className="align-middle">
                                                {!isTail ? (
                                                    <div className="flex items-center justify-center">
                                                    <Checkbox
                                                        checked={selectedRowIds.includes(row.id)}
                                                        onCheckedChange={(checked) =>
                                                        toggleRowSelection(row.id, Boolean(checked))
                                                        }
                                                    />
                                                    </div>
                                                ) : null}
                                                </TableCell>

                                                {TABLE_COLUMNS.map((column, colIndex) => (
                                                <TableCell key={column.key} className="align-top">
                                                    <Input
                                                    value={row[column.key]}
                                                    onChange={(e) =>
                                                        updateCell(row.id, column.key, e.target.value)
                                                    }
                                                    onPaste={(e) =>
                                                        handlePasteBlock(e, rowIndex, colIndex)
                                                    }
                                                    className={[
                                                        "border-slate-200 focus-visible:ring-[#2b7fff]",
                                                        isTail ? "bg-slate-50/50" : "",
                                                    ].join(" ")}
                                                    />
                                                </TableCell>
                                                ))}

                                                <TableCell className="align-middle">
                                                {!isTail ? (
                                                    <div className="flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                                        onClick={() => removeSingleRow(row.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    </div>
                                                ) : null}
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })}
                                        </TableBody>
                                    </Table>
                                    </div>

                                    <div className="mt-3 text-xs text-slate-500">
                                        Siempre se mantiene una fila vacía al final para edición o pegado.
                                    </div>
                                </CardContent>
                                </Card>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    )

}