import XlsxPopulate from "xlsx-populate/browser/xlsx-populate"
// import { saveAs } from "file-saver"

// const STATIC_COLUMNS = [
//     {
//         key: "identificador",
//         label: "Identificador",
//         width: 24
//     },
//     {
//         key: "site",
//         label: "Sitio",
//         width: 28
//     },
//     {
//         key: "macro_project",
//         label: "Proyecto",
//         width: 24
//     },
//     {
//         key: "tower",
//         label: "Torrera",
//         width: 18
//     }
// ]

// const TASK_COLORS = [
//     {
//         strong: "DBEAFE",
//         medium: "EFF6FF",
//         soft: "F8FBFF",
//         text: "1E40AF"
//     },
//     {
//         strong: "EDE9FE",
//         medium: "F5F3FF",
//         soft: "FAF8FF",
//         text: "5B21B6"
//     },
//     {
//         strong: "D1FAE5",
//         medium: "ECFDF5",
//         soft: "F7FEFA",
//         text: "065F46"
//     },
//     {
//         strong: "FFEDD5",
//         medium: "FFF7ED",
//         soft: "FFFBF7",
//         text: "9A3412"
//     },
//     {
//         strong: "CFFAFE",
//         medium: "ECFEFF",
//         soft: "F7FEFF",
//         text: "155E75"
//     }
// ]

// const STATE_STYLE = {
//     fill: "FEF3C7",
//     text: "92400E"
// }

// const BORDER = {
//     top: {
//         style: "thin",
//         color: "CBD5E1"
//     },
//     bottom: {
//         style: "thin",
//         color: "CBD5E1"
//     },
//     left: {
//         style: "thin",
//         color: "CBD5E1"
//     },
//     right: {
//         style: "thin",
//         color: "CBD5E1"
//     }
// }

// function columnName(number) {
//     let n = number
//     let result = ""

//     while (n > 0) {
//         const remainder =
//             (n - 1) % 26

//         result =
//             String.fromCharCode(
//                 65 + remainder
//             ) +
//             result

//         n =
//             Math.floor(
//                 (n - 1) / 26
//             )
//     }

//     return result
// }

// function rangeAddress(
//     startRow,
//     startColumn,
//     endRow,
//     endColumn
// ) {
//     return (
//         `${columnName(startColumn)}${startRow}:` +
//         `${columnName(endColumn)}${endRow}`
//     )
// }

// function mergeRange(
//     sheet,
//     startRow,
//     startColumn,
//     endRow,
//     endColumn
// ) {
//     if (
//         startRow === endRow &&
//         startColumn === endColumn
//     ) {
//         return sheet.cell(
//             startRow,
//             startColumn
//         )
//     }

//     const range =
//         sheet.range(
//             rangeAddress(
//                 startRow,
//                 startColumn,
//                 endRow,
//                 endColumn
//             )
//         )

//     range.merged(true)

//     return range
// }

// function formatDate(value) {
//     if (!value) {
//         return ""
//     }

//     /*
//      * Campo DATE puro: YYYY-MM-DD.
//      * Evitamos timezone.
//      */
//     const dateOnly =
//         String(value).match(
//             /^(\d{4})-(\d{2})-(\d{2})$/
//         )

//     if (dateOnly) {
//         return (
//             `${dateOnly[3]}/` +
//             `${dateOnly[2]}/` +
//             `${dateOnly[1]}`
//         )
//     }

//     const date =
//         new Date(value)

//     if (
//         Number.isNaN(
//             date.getTime()
//         )
//     ) {
//         return String(value)
//     }

//     return new Intl.DateTimeFormat(
//         "es-PE",
//         {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//             timeZone: "UTC"
//         }
//     ).format(date)
// }

// function formatDateTime(value) {
//     if (!value) {
//         return ""
//     }

//     const date =
//         new Date(value)

//     if (
//         Number.isNaN(
//             date.getTime()
//         )
//     ) {
//         return String(value)
//     }

//     return new Intl.DateTimeFormat(
//         "es-PE",
//         {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit"
//         }
//     ).format(date)
// }

// function formatFieldValue(
//     value,
//     field
// ) {
//     if (
//         value === null ||
//         value === undefined ||
//         value === ""
//     ) {
//         return ""
//     }

//     if (field?.type === "DATE") {
//         return formatDate(value)
//     }

//     if (field?.type === "DATETIME") {
//         return formatDateTime(value)
//     }

//     if (field?.type === "CHECKBOX") {
//         return value === true
//             ? "Sí"
//             : "No"
//     }

//     if (Array.isArray(value)) {
//         return value
//             .map(item => {
//                 if (
//                     item &&
//                     typeof item === "object"
//                 ) {
//                     return (
//                         item.name ||
//                         item.filename ||
//                         item.label ||
//                         ""
//                     )
//                 }

//                 return String(item)
//             })
//             .filter(Boolean)
//             .join(", ")
//     }

//     if (
//         typeof value ===
//         "object"
//     ) {
//         return (
//             value.name ||
//             value.filename ||
//             value.label ||
//             JSON.stringify(value)
//         )
//     }

//     return String(value)
// }

// function getTaskRuntime(
//     row,
//     taskCode
// ) {
//     return (
//         row.tasks || []
//     ).find(
//         task =>
//             task.task_code ===
//             taskCode
//     )
// }

// function getSubtaskRuntime(
//     row,
//     taskCode,
//     subtaskKey
// ) {
//     return getTaskRuntime(
//         row,
//         taskCode
//     )?.subtasks?.find(
//         subtask =>
//             subtask.subtask_key ===
//             subtaskKey
//     )
// }

// function getCellValue(
//     row,
//     column
// ) {
//     if (
//         column.kind ===
//         "STATIC"
//     ) {
//         return (
//             row[column.key] ??
//             ""
//         )
//     }

//     const task =
//         getTaskRuntime(
//             row,
//             column.task_code
//         )

//     if (
//         column.kind ===
//         "TASK_START"
//     ) {
//         return formatDate(
//             task?.started_at
//         )
//     }

//     if (
//         column.kind ===
//         "TASK_END"
//     ) {
//         return formatDate(
//             task?.finished_at
//         )
//     }

//     const subtask =
//         getSubtaskRuntime(
//             row,
//             column.task_code,
//             column.subtask_key
//         )

//     if (
//         column.kind ===
//         "SUBTASK_START"
//     ) {
//         return formatDate(
//             subtask?.started_at
//         )
//     }

//     if (
//         column.kind ===
//         "SUBTASK_END"
//     ) {
//         return formatDate(
//             subtask?.finished_at
//         )
//     }

//     if (
//         column.kind ===
//         "SUBTASK_STATE"
//     ) {
//         return (
//             subtask?.state ||
//             ""
//         )
//     }

//     if (
//         column.kind ===
//         "FIELD"
//     ) {
//         return formatFieldValue(
//             subtask
//                 ?.form_data
//                 ?.[column.field_key],
//             column.field
//         )
//     }

//     return ""
// }

// function baseHeaderStyle(
//     fill,
//     fontColor = "334155"
// ) {
//     return {
//         fill,
//         fontColor,
//         bold: true,
//         horizontalAlignment: "center",
//         verticalAlignment: "center",
//         wrapText: true,
//         border: BORDER
//     }
// }

// function dataStyle(fill = "FFFFFF") {
//     return {
//         fill,
//         verticalAlignment: "center",
//         border: BORDER
//     }
// }

// /*
//  * Crea las tres filas de cabecera:
//  *
//  * 1. TASK
//  * 2. Tarea / SUBTASK
//  * 3. Columnas
//  */
// function buildHeaders(
//     sheet,
//     configuration = []
// ) {
//     const columns = []
//     let columnIndex = 1

//     /*
//      * =====================================================
//      * FIJAS
//      * =====================================================
//      */
//     for (
//         const staticColumn
//         of STATIC_COLUMNS
//     ) {
//         mergeRange(
//             sheet,
//             1,
//             columnIndex,
//             3,
//             columnIndex
//         )

//         sheet
//             .cell(
//                 1,
//                 columnIndex
//             )
//             .value(
//                 staticColumn.label
//             )
//             .style(
//                 baseHeaderStyle(
//                     "E2E8F0",
//                     "334155"
//                 )
//             )

//         sheet
//             .column(
//                 columnIndex
//             )
//             .width(
//                 staticColumn.width
//             )

//         columns.push({
//             ...staticColumn,
//             kind: "STATIC",
//             column_index:
//                 columnIndex
//         })

//         columnIndex++
//     }

//     /*
//      * =====================================================
//      * TASKS DINÁMICAS
//      * =====================================================
//      */
//     configuration.forEach(
//         (task, taskIndex) => {
//             const palette =
//                 TASK_COLORS[
//                     taskIndex %
//                     TASK_COLORS.length
//                 ]

//             const taskStartColumn =
//                 columnIndex

//             /*
//              * Bloque propio de TASK:
//              * F. Inicio / F. Fin
//              */
//             const taskInfoStart =
//                 columnIndex

//             columns.push({
//                 kind: "TASK_START",
//                 task_code:
//                     task.task_code,
//                 label:
//                     "F. Inicio",
//                 column_index:
//                     columnIndex
//             })

//             sheet
//                 .cell(
//                     3,
//                     columnIndex
//                 )
//                 .value(
//                     "F. Inicio"
//                 )

//             sheet
//                 .column(
//                     columnIndex
//                 )
//                 .width(14)

//             columnIndex++

//             columns.push({
//                 kind: "TASK_END",
//                 task_code:
//                     task.task_code,
//                 label:
//                     "F. Fin",
//                 column_index:
//                     columnIndex
//             })

//             sheet
//                 .cell(
//                     3,
//                     columnIndex
//                 )
//                 .value(
//                     "F. Fin"
//                 )

//             sheet
//                 .column(
//                     columnIndex
//                 )
//                 .width(14)

//             mergeRange(
//                 sheet,
//                 2,
//                 taskInfoStart,
//                 2,
//                 columnIndex
//             )

//             sheet
//                 .cell(
//                     2,
//                     taskInfoStart
//                 )
//                 .value(
//                     "Tarea"
//                 )
//                 .style(
//                     baseHeaderStyle(
//                         palette.medium,
//                         palette.text
//                     )
//                 )

//             /*
//              * SUBTASKS
//              */
//             for (
//                 const subtask
//                 of task.subtasks || []
//             ) {
//                 const subtaskStart =
//                     columnIndex + 1

//                 /*
//                  * Inicio
//                  */
//                 columnIndex++

//                 columns.push({
//                     kind:
//                         "SUBTASK_START",
//                     task_code:
//                         task.task_code,
//                     subtask_key:
//                         subtask.subtask_key,
//                     label:
//                         "F. Inicio",
//                     column_index:
//                         columnIndex
//                 })

//                 sheet
//                     .cell(
//                         3,
//                         columnIndex
//                     )
//                     .value(
//                         "F. Inicio"
//                     )

//                 sheet
//                     .column(
//                         columnIndex
//                     )
//                     .width(14)

//                 /*
//                  * Fin
//                  */
//                 columnIndex++

//                 columns.push({
//                     kind:
//                         "SUBTASK_END",
//                     task_code:
//                         task.task_code,
//                     subtask_key:
//                         subtask.subtask_key,
//                     label:
//                         "F. Fin",
//                     column_index:
//                         columnIndex
//                 })

//                 sheet
//                     .cell(
//                         3,
//                         columnIndex
//                     )
//                     .value(
//                         "F. Fin"
//                     )

//                 sheet
//                     .column(
//                         columnIndex
//                     )
//                     .width(14)

//                 /*
//                  * Estado
//                  */
//                 columnIndex++

//                 columns.push({
//                     kind:
//                         "SUBTASK_STATE",
//                     task_code:
//                         task.task_code,
//                     subtask_key:
//                         subtask.subtask_key,
//                     label:
//                         "Estado",
//                     column_index:
//                         columnIndex
//                 })

//                 sheet
//                     .cell(
//                         3,
//                         columnIndex
//                     )
//                     .value(
//                         "Estado"
//                     )
//                     .style(
//                         baseHeaderStyle(
//                             STATE_STYLE.fill,
//                             STATE_STYLE.text
//                         )
//                     )

//                 sheet
//                     .column(
//                         columnIndex
//                     )
//                     .width(18)

//                 /*
//                  * Campos configurables
//                  */
//                 for (
//                     const field
//                     of subtask.fields || []
//                 ) {
//                     columnIndex++

//                     columns.push({
//                         kind:
//                             "FIELD",
//                         task_code:
//                             task.task_code,
//                         subtask_key:
//                             subtask.subtask_key,
//                         field_key:
//                             field.field_key,
//                         field,
//                         label:
//                             field.label ||
//                             field.field_key,
//                         column_index:
//                             columnIndex
//                     })

//                     sheet
//                         .cell(
//                             3,
//                             columnIndex
//                         )
//                         .value(
//                             field.label ||
//                             field.field_key
//                         )

//                     sheet
//                         .column(
//                             columnIndex
//                         )
//                         .width(
//                             field.type ===
//                             "TEXTAREA"
//                                 ? 28
//                                 : 20
//                         )
//                 }

//                 /*
//                  * Nombre SUBTASK en fila 2
//                  */
//                 mergeRange(
//                     sheet,
//                     2,
//                     subtaskStart,
//                     2,
//                     columnIndex
//                 )

//                 sheet
//                     .cell(
//                         2,
//                         subtaskStart
//                     )
//                     .value(
//                         subtask.subtask_name ||
//                         subtask.name ||
//                         subtask.subtask_key
//                     )
//                     .style(
//                         baseHeaderStyle(
//                             palette.medium,
//                             palette.text
//                         )
//                     )

//                 /*
//                  * Cabeceras nivel 3 de esta SUBTASK.
//                  *
//                  * Estado conserva ámbar,
//                  * las demás usan color TASK.
//                  */
//                 for (
//                     let current =
//                         subtaskStart;
//                     current <=
//                     columnIndex;
//                     current++
//                 ) {
//                     const descriptor =
//                         columns.find(
//                             item =>
//                                 item.column_index ===
//                                 current
//                         )

//                     if (
//                         descriptor?.kind ===
//                         "SUBTASK_STATE"
//                     ) {
//                         continue
//                     }

//                     sheet
//                         .cell(
//                             3,
//                             current
//                         )
//                         .style(
//                             baseHeaderStyle(
//                                 palette.soft,
//                                 palette.text
//                             )
//                         )
//                 }
//             }

//             /*
//              * Nivel 3 del bloque TAREA.
//              */
//             sheet
//                 .range(
//                     rangeAddress(
//                         3,
//                         taskInfoStart,
//                         3,
//                         taskInfoStart + 1
//                     )
//                 )
//                 .style(
//                     baseHeaderStyle(
//                         palette.soft,
//                         palette.text
//                     )
//                 )

//             /*
//              * Nombre TASK: fila 1.
//              */
//             mergeRange(
//                 sheet,
//                 1,
//                 taskStartColumn,
//                 1,
//                 columnIndex
//             )

//             sheet
//                 .cell(
//                     1,
//                     taskStartColumn
//                 )
//                 .value(
//                     task.task_name ||
//                     task.task_code
//                 )
//                 .style(
//                     baseHeaderStyle(
//                         palette.strong,
//                         palette.text
//                     )
//                 )
//         }
//     )

//     return {
//         columns,
//         lastColumn:
//             columnIndex
//     }
// }

// function writeData(
//     sheet,
//     rows,
//     columns
// ) {
//     const startRow = 4

//     rows.forEach(
//         (row, rowIndex) => {
//             const excelRow =
//                 startRow +
//                 rowIndex

//             columns.forEach(
//                 column => {
//                     const cell =
//                         sheet.cell(
//                             excelRow,
//                             column.column_index
//                         )

//                     cell.value(
//                         getCellValue(
//                             row,
//                             column
//                         )
//                     )

//                     if (
//                         column.kind ===
//                         "SUBTASK_STATE"
//                     ) {
//                         cell.style(
//                             dataStyle(
//                                 "FFFBEB"
//                             )
//                         )
//                     } else {
//                         cell.style(
//                             dataStyle()
//                         )
//                     }
//                 }
//             )

//             sheet
//                 .row(
//                     excelRow
//                 )
//                 .height(20)
//         }
//     )
// }

// function sanitizeFileName(value) {
//     return String(
//         value ||
//         "Tracking"
//     )
//         .replace(
//             /[\\/:*?"<>|]/g,
//             "_"
//         )
//         .trim()
// }

// export async function exportTrackingReportToXlsx({
//     configuration = [],
//     items = [],
//     fileName = "Reporte Tracking"
// }) {
//     if (!configuration.length) {
//         throw new Error(
//             "El reporte no contiene configuración de tareas"
//         )
//     }

//     if (!items.length) {
//         throw new Error(
//             "No existen sitios para exportar"
//         )
//     }

//     const workbook =
//         await XlsxPopulate
//             .fromBlankAsync()

//     const sheet =
//         workbook.sheet(0)

//     sheet.name(
//         "Tracking"
//     )

//     const {
//         columns,
//         lastColumn
//     } =
//         buildHeaders(
//             sheet,
//             configuration
//         )

//     writeData(
//         sheet,
//         items,
//         columns
//     )

//     /*
//      * Altura cabeceras.
//      */
//     sheet.row(1).height(24)
//     sheet.row(2).height(24)
//     sheet.row(3).height(34)

//     /*
//      * Fuente general.
//      */
//     sheet
//         .range(
//             rangeAddress(
//                 1,
//                 1,
//                 items.length + 3,
//                 lastColumn
//             )
//         )
//         .style({
//             fontFamily: "Arial",
//             fontSize: 10
//         })

//     /*
//      * Reaplicamos bold de headers porque el estilo general
//      * no debe modificar su formato.
//      */
//     sheet
//         .range(
//             rangeAddress(
//                 1,
//                 1,
//                 3,
//                 lastColumn
//             )
//         )
//         .style({
//             bold: true,
//             verticalAlignment:
//                 "center"
//         })

//     const output = await workbook.outputAsync()

//     const blob = new Blob([output], {
//             type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//         }
//     )

//     saveAs(blob, `${sanitizeFileName(fileName)}.xlsx`
//     )
// }

import { saveAs } from "file-saver"

const FIXED_COLUMNS = [
    { key: "identificador", label: "Identificador", width: 25 },
    { key: "site", label: "Sitio", width: 32 },
    { key: "macro_project", label: "Proyecto", width: 28 },
    { key: "tower", label: "Torrera", width: 18 }
]

const TASK_COLORS = [
    {
        strong: "DCEBFF",
        medium: "EFF6FF",
        soft: "F8FBFF",
        text: "123EB1"
    },
    {
        strong: "EDE9FE",
        medium: "F5F3FF",
        soft: "FAF8FF",
        text: "5B21B6"
    },
    {
        strong: "D1FAE5",
        medium: "ECFDF5",
        soft: "F7FEFA",
        text: "047857"
    },
    {
        strong: "FFEDD5",
        medium: "FFF7ED",
        soft: "FFFBF7",
        text: "C2410C"
    },
    {
        strong: "CFFAFE",
        medium: "ECFEFF",
        soft: "F7FEFF",
        text: "155E75"
    }
]

const STATE_COLOR = {
    bg: "FFF2CC",
    text: "9A3412"
}

function excelColumnName(number) {
    let result = ""
    let value = number

    while (value > 0) {
        const remainder = (value - 1) % 26
        result = String.fromCharCode(65 + remainder) + result
        value = Math.floor((value - 1) / 26)
    }

    return result
}

function rangeAddress(row1, col1, row2, col2) {
    return `${excelColumnName(col1)}${row1}:${excelColumnName(col2)}${row2}`
}

/*
 * No hacemos merge de una sola celda y centralizamos todos
 * los merges aquí para evitar cruces accidentales.
 */
function safeMerge(sheet, row1, col1, row2, col2) {
    if (row1 === row2 && col1 === col2) return

    sheet
        .range(rangeAddress(row1, col1, row2, col2))
        .merged(true)
}

function formatDate(value) {
    if (!value) return ""

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return String(value)
    }

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date)
}

function displayValue(value, field) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return ""
    }

    if (
        field?.type === "DATE" ||
        field?.type === "DATETIME"
    ) {
        return formatDate(value)
    }

    if (field?.type === "CHECKBOX") {
        return value === true
            ? "Sí"
            : value === false
                ? "No"
                : ""
    }

    if (Array.isArray(value)) {
        return value.join(", ")
    }

    if (typeof value === "object") {
        return (
            value.name ||
            value.filename ||
            value.label ||
            JSON.stringify(value)
        )
    }

    return value
}

function getTaskRuntime(item, taskCode) {
    return (item.tasks || []).find(
        task =>
            task.task_code === taskCode
    ) || null
}

function getSubtaskRuntime(item, taskCode, subtaskKey) {
    const task =
        getTaskRuntime(
            item,
            taskCode
        )

    return (
        task?.subtasks || []
    ).find(
        subtask =>
            subtask.subtask_key === subtaskKey
    ) || null
}

/*
 * Ancho real del bloque SUBTASK:
 *
 * F.Inicio
 * F.Fin
 * Estado
 * + campos configurados
 */
function getSubtaskWidth(subtask) {
    return 3 + (subtask.fields || []).length
}

/*
 * Ancho TASK:
 *
 * 2 columnas propias:
 * F.Inicio + F.Fin
 *
 * + todas sus SUBTASK.
 */
function getTaskWidth(task) {
    return 2 + (task.subtasks || [])
        .reduce(
            (total, subtask) =>
                total + getSubtaskWidth(subtask),
            0
        )
}

function styleHeaderCell(cell, {
    fill,
    color = "334155",
    bold = true
}) {
    cell.style({
        fill,
        fontColor: color,
        bold,
        horizontalAlignment: "center",
        verticalAlignment: "center",
        wrapText: true,
        border: {
            top: {
                style: "thin",
                color: "CBD5E1"
            },
            bottom: {
                style: "thin",
                color: "CBD5E1"
            },
            left: {
                style: "thin",
                color: "CBD5E1"
            },
            right: {
                style: "thin",
                color: "CBD5E1"
            }
        }
    })
}

function styleBodyCell(cell, fill = "FFFFFF") {
    cell.style({
        fill,
        verticalAlignment: "center",
        border: {
            top: {
                style: "thin",
                color: "D8DEE8"
            },
            bottom: {
                style: "thin",
                color: "D8DEE8"
            },
            left: {
                style: "thin",
                color: "D8DEE8"
            },
            right: {
                style: "thin",
                color: "D8DEE8"
            }
        }
    })
}

function buildColumnStructure(configuration = []) {
    const columns = []

    for (const fixed of FIXED_COLUMNS) {
        columns.push({
            kind: "FIXED",
            ...fixed
        })
    }

    for (const task of configuration) {
        columns.push({
            kind: "TASK_START",
            task_code: task.task_code,
            label: "F. Inicio",
            width: 16
        })

        columns.push({
            kind: "TASK_END",
            task_code: task.task_code,
            label: "F. Fin",
            width: 16
        })

        for (const subtask of task.subtasks || []) {
            columns.push({
                kind: "SUBTASK_START",
                task_code: task.task_code,
                subtask_key: subtask.subtask_key,
                label: "F. Inicio",
                width: 16
            })

            columns.push({
                kind: "SUBTASK_END",
                task_code: task.task_code,
                subtask_key: subtask.subtask_key,
                label: "F. Fin",
                width: 16
            })

            columns.push({
                kind: "SUBTASK_STATE",
                task_code: task.task_code,
                subtask_key: subtask.subtask_key,
                label: "Estado",
                width: 17
            })

            for (const field of subtask.fields || []) {
                columns.push({
                    kind: "FIELD",
                    task_code: task.task_code,
                    subtask_key: subtask.subtask_key,
                    field_key: field.field_key,
                    field,
                    label:
                        field.label ||
                        field.field_key,
                    width: 22
                })
            }
        }
    }

    return columns
}

function getCellValue(item, column) {
    switch (column.kind) {
        case "FIXED":
            return item[column.key] ?? ""

        case "TASK_START":
            return formatDate(
                getTaskRuntime(
                    item,
                    column.task_code
                )?.started_at
            )

        case "TASK_END":
            return formatDate(
                getTaskRuntime(
                    item,
                    column.task_code
                )?.finished_at
            )

        case "SUBTASK_START":
            return formatDate(
                getSubtaskRuntime(
                    item,
                    column.task_code,
                    column.subtask_key
                )?.started_at
            )

        case "SUBTASK_END":
            return formatDate(
                getSubtaskRuntime(
                    item,
                    column.task_code,
                    column.subtask_key
                )?.finished_at
            )

        case "SUBTASK_STATE":
            return (
                getSubtaskRuntime(
                    item,
                    column.task_code,
                    column.subtask_key
                )?.state ||
                ""
            )

        case "FIELD": {
            const runtime =
                getSubtaskRuntime(
                    item,
                    column.task_code,
                    column.subtask_key
                )

            return displayValue(
                runtime
                    ?.form_data
                    ?.[column.field_key],
                column.field
            )
        }

        default:
            return ""
    }
}

export async function exportTrackingReportToXlsx({
    configuration = [],
    items = [],
    workflow = {},
    fileName = "Reporte Tracking"
}) {
    const module =
        await import(
            "xlsx-populate/browser/xlsx-populate"
        )

    const XlsxPopulate =
        module.default ||
        module

    const workbook =
        await XlsxPopulate
            .fromBlankAsync()

    const sheet =
        workbook.sheet(0)

    sheet.name("Tracking")

    /*
     * =====================================================
     * FILAS
     * =====================================================
     *
     * ROW 1 = TASK
     * ROW 2 = Tarea / SUBTASK
     * ROW 3 = columnas finales
     * ROW 4+ = datos
     * =====================================================
     */
    const TASK_ROW = 1
    const SUBTASK_ROW = 2
    const FIELD_ROW = 3
    const DATA_START_ROW = 4

    /*
     * =====================================================
     * COLUMNAS FIJAS
     * =====================================================
     */
    let currentCol = 1

    for (const fixed of FIXED_COLUMNS) {
        const col = currentCol

        safeMerge(
            sheet,
            TASK_ROW,
            col,
            FIELD_ROW,
            col
        )

        const cell =
            sheet.cell(
                TASK_ROW,
                col
            )

        cell.value(
            fixed.label
        )

        styleHeaderCell(
            cell,
            {
                fill: "E2E8F0",
                color: "1E293B"
            }
        )

        sheet
            .column(col)
            .width(fixed.width)

        currentCol += 1
    }

    /*
     * =====================================================
     * TASKS
     * =====================================================
     *
     * MUY IMPORTANTE:
     *
     * end = start + width - 1
     * next = end + 1
     *
     * Esto evita el solapamiento que estaba rompiendo OOEE.
     * =====================================================
     */
    configuration.forEach(
        (task, taskIndex) => {
            const colors =
                TASK_COLORS[
                    taskIndex %
                    TASK_COLORS.length
                ]

            const taskStartCol =
                currentCol

            const taskWidth =
                getTaskWidth(task)

            const taskEndCol =
                taskStartCol +
                taskWidth -
                1

            /*
             * NIVEL 1: TASK
             */
            safeMerge(
                sheet,
                TASK_ROW,
                taskStartCol,
                TASK_ROW,
                taskEndCol
            )

            const taskHeader =
                sheet.cell(
                    TASK_ROW,
                    taskStartCol
                )

            taskHeader.value(
                task.task_name ||
                task.task_code
            )

            styleHeaderCell(
                taskHeader,
                {
                    fill: colors.strong,
                    color: colors.text
                }
            )

            /*
             * NIVEL 2:
             * bloque "Tarea"
             */
            const taskRuntimeStart =
                taskStartCol

            const taskRuntimeEnd =
                taskRuntimeStart + 1

            safeMerge(
                sheet,
                SUBTASK_ROW,
                taskRuntimeStart,
                SUBTASK_ROW,
                taskRuntimeEnd
            )

            const runtimeHeader =
                sheet.cell(
                    SUBTASK_ROW,
                    taskRuntimeStart
                )

            runtimeHeader.value(
                "Tarea"
            )

            styleHeaderCell(
                runtimeHeader,
                {
                    fill: colors.medium,
                    color: colors.text
                }
            )

            /*
             * NIVEL 3:
             * fechas TASK
             */
            const taskStartHeader =
                sheet.cell(
                    FIELD_ROW,
                    taskRuntimeStart
                )

            taskStartHeader.value(
                "F. Inicio"
            )

            styleHeaderCell(
                taskStartHeader,
                {
                    fill: colors.soft,
                    color: colors.text
                }
            )

            const taskEndHeader =
                sheet.cell(
                    FIELD_ROW,
                    taskRuntimeEnd
                )

            taskEndHeader.value(
                "F. Fin"
            )

            styleHeaderCell(
                taskEndHeader,
                {
                    fill: colors.soft,
                    color: colors.text
                }
            )

            sheet
                .column(taskRuntimeStart)
                .width(16)

            sheet
                .column(taskRuntimeEnd)
                .width(16)

            /*
             * Primer SUBTASK comienza EXACTAMENTE
             * después de las 2 columnas propias de TASK.
             */
            let subtaskCol =
                taskRuntimeEnd + 1

            for (
                const subtask
                of task.subtasks || []
            ) {
                const subtaskStartCol =
                    subtaskCol

                const subtaskWidth =
                    getSubtaskWidth(
                        subtask
                    )

                const subtaskEndCol =
                    subtaskStartCol +
                    subtaskWidth -
                    1

                /*
                 * NIVEL 2: SUBTASK
                 */
                safeMerge(
                    sheet,
                    SUBTASK_ROW,
                    subtaskStartCol,
                    SUBTASK_ROW,
                    subtaskEndCol
                )

                const subtaskHeader =
                    sheet.cell(
                        SUBTASK_ROW,
                        subtaskStartCol
                    )

                subtaskHeader.value(
                    subtask.subtask_name ||
                    subtask.name ||
                    subtask.subtask_key
                )

                styleHeaderCell(
                    subtaskHeader,
                    {
                        fill:
                            colors.medium,
                        color:
                            colors.text
                    }
                )

                /*
                 * NIVEL 3:
                 * columnas fijas SUBTASK
                 */
                let fieldCol =
                    subtaskStartCol

                const startCell =
                    sheet.cell(
                        FIELD_ROW,
                        fieldCol
                    )

                startCell.value(
                    "F. Inicio"
                )

                styleHeaderCell(
                    startCell,
                    {
                        fill:
                            colors.soft,
                        color:
                            colors.text
                    }
                )

                sheet
                    .column(fieldCol)
                    .width(16)

                fieldCol += 1

                const endCell =
                    sheet.cell(
                        FIELD_ROW,
                        fieldCol
                    )

                endCell.value(
                    "F. Fin"
                )

                styleHeaderCell(
                    endCell,
                    {
                        fill:
                            colors.soft,
                        color:
                            colors.text
                    }
                )

                sheet
                    .column(fieldCol)
                    .width(16)

                fieldCol += 1

                const stateCell =
                    sheet.cell(
                        FIELD_ROW,
                        fieldCol
                    )

                stateCell.value(
                    "Estado"
                )

                styleHeaderCell(
                    stateCell,
                    {
                        fill:
                            STATE_COLOR.bg,
                        color:
                            STATE_COLOR.text
                    }
                )

                sheet
                    .column(fieldCol)
                    .width(17)

                fieldCol += 1

                /*
                 * CAMPOS DINÁMICOS
                 */
                for (
                    const field
                    of subtask.fields || []
                ) {
                    const fieldCell =
                        sheet.cell(
                            FIELD_ROW,
                            fieldCol
                        )

                    fieldCell.value(
                        field.label ||
                        field.field_key
                    )

                    styleHeaderCell(
                        fieldCell,
                        {
                            fill:
                                colors.soft,
                            color:
                                colors.text
                        }
                    )

                    sheet
                        .column(fieldCol)
                        .width(
                            field.type ===
                            "TEXTAREA"
                                ? 30
                                : 22
                        )

                    fieldCol += 1
                }

                /*
                 * La siguiente SUBTASK empieza justo
                 * después del final de esta.
                 */
                subtaskCol =
                    subtaskEndCol + 1
            }

            /*
             * La siguiente TASK empieza justo
             * después de esta TASK.
             */
            currentCol =
                taskEndCol + 1
        }
    )

    /*
     * =====================================================
     * DATA
     * =====================================================
     */
    const flatColumns =
        buildColumnStructure(
            configuration
        )

    items.forEach(
        (item, itemIndex) => {
            const row =
                DATA_START_ROW +
                itemIndex

            flatColumns.forEach(
                (column, index) => {
                    const col =
                        index + 1

                    const cell =
                        sheet.cell(
                            row,
                            col
                        )

                    cell.value(
                        getCellValue(
                            item,
                            column
                        )
                    )

                    const fill =
                        column.kind ===
                        "SUBTASK_STATE"
                            ? "FFFBEB"
                            : "FFFFFF"

                    styleBodyCell(
                        cell,
                        fill
                    )
                }
            )
        }
    )

    /*
     * =====================================================
     * GENERAL
     * =====================================================
     */
    sheet.row(TASK_ROW).height(26)
    sheet.row(SUBTASK_ROW).height(28)
    sheet.row(FIELD_ROW).height(38)

    /*
     * Congelar:
     * 3 filas superiores + 4 columnas metadata.
     */
    sheet.freezePanes(
        FIXED_COLUMNS.length,
        FIELD_ROW
    )

    /*
     * =====================================================
     * OUTPUT
     * =====================================================
     */
    const output =
        await workbook.outputAsync()

    const blob =
        new Blob(
            [output],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        )

    const workflowName =
        workflow.workflow_code
            ? ` ${workflow.workflow_code}`
            : ""

    const version =
        workflow.workflow_version
            ? ` v${workflow.workflow_version}`
            : ""

    saveAs(
        blob,
        `${fileName}${workflowName}${version}.xlsx`
    )
}