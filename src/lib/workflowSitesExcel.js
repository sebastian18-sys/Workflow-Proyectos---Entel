import * as XLSX from "xlsx"

export const SITE_EXCEL_COLUMNS = [
    { header: "TIPOLOGIA PROYECTO", key: "project_typology", label: "Tipología Proyecto" },
    { header: "TIPO DE PROYECTO", key: "project_type", label: "Tipo de Proyecto" },
    { header: "MACRO PROYECTO", key: "macro_project", label: "Macro Proyecto" },
    { header: "PROYECTO", key: "sub_project", label: "Proyecto" },
    { header: "ID SOLPE", key: "id_solpe", label: "ID Solpe" },
    { header: "PROYECTO SOLPE", key: "solpe_project", label: "Proyecto Solpe" },
    { header: "NODO NAME", key: "node_site", label: "Nodo Name" },
    { header: "SITE", key: "site", label: "Site" },
    { header: "TORRERA", key: "tower", label: "Torrera" },
    { header: "TIPIFICACION TORRERA", key: "tower_type", label: "Tipificación Torrera" },
    { header: "PLAN / BACKUP", key: "plan_backup", label: "Plan / Backup" },
    { header: "Q FCST ACTIVACION", key: "q_fcst", label: "Q FCST Activación" },
    { header: "MACROZONA", key: "macrozone", label: "Macrozona" },
    { header: "ZONA", key: "zone", label: "Zona" },
    { header: "CLUSTER_COMERCIAL", key: "cluster", label: "Cluster Comercial" },
    { header: "DEPARTAMENTO", key: "departament", label: "Departamento" },
    { header: "PROVINCIA", key: "province", label: "Provincia" },
    { header: "DISTRITO", key: "district", label: "Distrito" },
    { header: "LAT", key: "lat", label: "Lat" },
    { header: "LONG", key: "long", label: "Long" }
]

function normalizeHeader(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\s*\/\s*/g, "/")
        .toUpperCase()
}

function normalizeExpectedHeader(value) {
    return normalizeHeader(value)
}

function text(value) {
    return String(value ?? "").trim()
}

function nullableNumber(value, label, rowNumber) {
    const raw = text(value)
    if (!raw) return null

    const number = Number(raw.replace(",", "."))
    if (!Number.isFinite(number)) {
        throw new Error(`Fila ${rowNumber}: ${label} debe ser numérico`)
    }

    return number
}

export async function parseSitesExcel(file) {
    if (!file) throw new Error("Seleccionar un archivo Excel")

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) throw new Error("El archivo no contiene hojas")

    const ws = workbook.Sheets[sheetName]
    if (!ws?.["!ref"]) throw new Error("La hoja está vacía")

    const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        raw: false
    })

    if (rows.length < 2) {
        throw new Error("La hoja no contiene registros")
    }

    const headers = rows[0].map(normalizeHeader)
    const headerIndex = new Map(headers.map((header, index) => [header, index]))

    const missing = SITE_EXCEL_COLUMNS
        .filter(column => !headerIndex.has(normalizeExpectedHeader(column.header)))
        .map(column => column.header)

    if (missing.length) {
        throw new Error(`Faltan columnas requeridas: ${missing.join(", ")}`)
    }

    const dataRows = rows.slice(1).filter(row =>
        SITE_EXCEL_COLUMNS.some(column => {
            const index = headerIndex.get(normalizeExpectedHeader(column.header))
            return text(row[index]) !== ""
        })
    )

    if (!dataRows.length) {
        throw new Error("El archivo no contiene sitios")
    }

    return dataRows.map((row, index) => {
        const rowNumber = index + 2
        const item = { row_number: rowNumber }

        SITE_EXCEL_COLUMNS.forEach(column => {
            const columnIndex = headerIndex.get(normalizeExpectedHeader(column.header))
            const value = row[columnIndex]

            if (column.key === "lat" || column.key === "long") {
                item[column.key] = nullableNumber(value, column.label, rowNumber)
            } else {
                item[column.key] = text(value)
            }
        })

        return {
            ...item,
            valid: null,
            validation_errors: []
        }
    })
}