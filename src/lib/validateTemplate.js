import * as XLSX from "xlsx";

// const EXPECTED_HEADERS = [
//     "Identificador",
//     "Sitio",
//     "Actividad",
//     "Proveedor",
//     "Sustento",
//     "Acuerdo de compras (PA)",
//     "Cordinador",
//     "Moneda",
//     "Cantidad",
//     "Precio Unitario",
//     "Total Cotización",
//     "Fecha Registro",
//     "Fecha de inicio Servicio",
//     "Fecha Fin de Servicio",
//     "Descripción Adicional",
//     "ID Proyecto",
//     "Proyecto",
//     "Linea de Inversion",
//     "Artículo"
// ];

const EXPECTED_HEADERS = [
    "Identificador",
    // "Sitio",
    "Actividad",
    "Solución",
    "Proveedor",
    "Sustento",
    "Acuerdo de compras (PA)",
    "Coordinador",
    "Moneda",
    "Cantidad",
    "Precio Unitario",
    // "Total Cotización",
    // "Fecha Registro",
    "Fecha de inicio Servicio",
    "Fecha Fin de Servicio",
    // "Descripción Adicional",
    // "ID Proyecto",
    // "Proyecto",
    "Linea de Inversion",
    "Artículo"
];

// Normaliza textos para comparar (mayúsculas/minúsculas, tildes, espacios)
function normalizeHeader(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes
        .replace(/\s+/g, " "); // espacios múltiples -> uno
}

// -------------------------------------------------------------- //
// TEMPLATE TICKETS
// -------------------------------------------------------------- //
export function validateTemplateTickets(workbook, sheetName) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) {
        throw new Error(`No existe la hoja '${sheetName}'.`);
    }

    if (!ws["!ref"]) {
        throw new Error("La hoja no tiene rango de datos.");
    }

    const range = XLSX.utils.decode_range(ws['!ref']);
    range.s.r = 0 // Fila 0
    range.s.c = 1 // Columna B

    // Leer Fila 1 y Columna B
    const headerRow = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        range
    })[0] || [];

    // Tomar exactamente la cantidad esperada
    const actualHeaders = headerRow.slice(0, EXPECTED_HEADERS.length);

    // console.log("ACTUAL HEADERS", actualHeaders)

    // Validar cantidad mínima
    if (actualHeaders.length < EXPECTED_HEADERS.length) {
        throw new Error(
            `Plantilla inválida: faltan columnas. Esperadas ${EXPECTED_HEADERS.length}, encontradas ${actualHeaders.length}.`
        );
    }

    // Comparación posición por posición (estricta en orden)
    const errors = [];
    for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
        const expected = EXPECTED_HEADERS[i];
        const actual = actualHeaders[i] ?? "";

        if (normalizeHeader(actual) !== normalizeHeader(expected)) {
            errors.push(
                `Columna ${i + 1} desde B (${XLSX.utils.encode_col(i + 2)}1): se esperaba '${expected}' y llegó '${actual}'`
            );
        }
    }

    if (errors.length) {
        throw new Error(
            "El archivo no corresponde a la plantilla esperada.\n" + errors.join("\n")
            // "El archivo no corresponde a la plantilla esperada."
        );
    }

    // (Opcional) detectar columnas extra luego de Jefatura (si quieres bloquear)
    const nextColumn = headerRow[EXPECTED_HEADERS.length];
    if (String(nextColumn ?? "").trim() !== "") {
        throw new Error(
            `Plantilla inválida: se detectaron columnas adicionales después de '${EXPECTED_HEADERS[EXPECTED_HEADERS.length - 1]}'.`
        );
    }

    // (Opcional) validar que B1 tenga "Llave" si el formato lo exige
    // const b1 = ws["B1"]?.v ?? "";
    // if (String(b1).trim() && normalizeHeader(b1) !== normalizeHeader("Llave")) {
    //     throw new Error(`Se esperaba 'Llave' en B1, pero se encontró '${b1}'.`);
    // }

    return true;
}