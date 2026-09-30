import XlsxPopulate from "xlsx-populate/browser/xlsx-populate";
import { saveAs } from "file-saver";
import { formatDDMMYYYYHour, formatDDMMYYYY } from "./helpers";
import { SKU_DESCRIPCIONES } from "@/constants/maestro_articulos";

const TC = 3.7

const OC_MONTH_HEADERS = [
	"Dic 24 - OC", "Enero - OC", "Febrero - OC", "Marzo - OC", "Abril - OC",
	"Mayo - OC", "Junio - OC", "Julio - OC", "Agosto - OC", "Setiembre - OC",
	"Octubre - OC", "Noviembre - OC", "Diciembre - OC",
];

const AC_MONTH_HEADERS = [
	"Dic 24 - AC", "Enero - AC", "Febrero - AC", "Marzo - AC", "Abril - AC",
	"Mayo - AC", "Junio - AC", "Julio - AC", "Agosto - AC", "Setiembre - AC",
	"Octubre - AC", "Noviembre - AC", "Diciembre - AC",
];

const FACT_MONTH_HEADERS = [
	"Dic 24 - Facturado", "Enero - Facturado", "Febrero - Facturado", "Marzo - Facturado", "Abril - Facturado",
	"Mayo - Facturado", "Junio - Facturado", "Julio - Facturado", "Agosto - Facturado", "Setiembre - Facturado",
	"Octubre - Facturado", "Noviembre - Facturado", "Diciembre - Facturado",
];

const RQ_MONTH_HEADERS = [
	"Dic 24 - RQ", "Enero - RQ", "Febrero - RQ", "Marzo - RQ", "Abril - RQ",
	"Mayo - RQ", "Junio - RQ", "Julio - RQ", "Agosto - RQ", "Setiembre - RQ",
	"Octubre - RQ", "Noviembre - RQ", "Diciembre - RQ",
];

const PLAN_MONTH_HEADERS = [
	"ENERO PLAN", "FEBRERO PLAN", "MARZO PLAN", "ABRIL PLAN",
	"MAYO PLAN", "JUNIO PLAN", "JULIO PLAN", "AGOSTO PLAN",
	"SETIEMBRE PLAN", "OCTUBRE PLAN", "NOVIEMBRE PLAN", "DICIEMBRE PLAN",
];

const PLANCF_MONTH_HEADERS = [
	"ENERO CF PLAN", "FEBRERO CF PLAN", "MARZO CF PLAN", "ABRIL CF PLAN",
];

const FCST111_MONTH_HEADERS = [
	"ENERO FCST 1+11", "FEBRERO FCST 1+11", "MARZO FCST 1+11", "ABRIL FCST 1+11",
	"MAYO FCST 1+11", "JUNIO FCST 1+11", "JULIO FCST 1+11", "AGOSTO FCST 1+11",
	"SETIEMBRE FCST 1+11", "OCTUBRE FCST 1+11", "NOVIEMBRE FCST 1+11", "DICIEMBRE FCST 1+11",
];

const CF111_MONTH_HEADERS = [
	"ENERO CF 1+11", "FEBRERO CF 1+11", "MARZO CF 1+11", "ABRIL CF 1+11"
]

const FCST210_MONTH_HEADERS = [
	"ENERO FCST 2+10", "FEBRERO FCST 2+10", "MARZO FCST 2+10", "ABRIL FCST 2+10", 
	"MAYO FCST 2+10", "JUNIO FCST 2+10", "JULIO FCST 2+10", "AGOSTO FCST 2+10", 
	"SETIEMBRE FCST 2+10", "OCTUBRE FCST 2+10", "NOVIEMBRE FCST 2+10", "DICIEMBRE FCST 2+10",
];

const CF210_MONTH_HEADERS = [
	"ENERO CF 2+10", "FEBRERO CF 2+10", "MARZO CF 2+10", "ABRIL CF 2+10"
]

const FCST312_MONTH_HEADERS = [
	"ENERO FCST 3+9", "FEBRERO FCST 3+9", "MARZO FCST 3+9", "ABRIL FCST 3+9",
	"MAYO FCST 3+9", "JUNIO FCST 3+9", "JULIO FCST 3+9", "AGOSTO FCST 3+9",
	"SETIEMBRE FCST 3+9", "OCTUBRE FCST 3+9", "NOVIEMBRE FCST 3+9", "DICIEMBRE FCST 3+9",
];

const CF312_MONTH_HEADERS = [
	"ENERO CF 3+9", "FEBRERO CF 3+9", "MARZO CF 3+9", "ABRIL CF 3+9"
]

const FCST48_MONTH_HEADERS = [
	"ENERO FCST 4+8", "FEBRERO FCST 4+8", "MARZO FCST 4+8", "ABRIL FCST 4+8",
	"MAYO FCST 4+8", "JUNIO FCST 4+8", "JULIO FCST 4+8", "AGOSTO FCST 4+8",
	"SETIEMBRE FCST 4+8", "OCTUBRE FCST 4+8", "NOVIEMBRE FCST 4+8", "DICIEMBRE FCST 4+8",
];

const CF48_MONTH_HEADERS = [
	"ENERO CF 4+8", "FEBRERO CF 4+8", "MARZO CF 4+8", "ABRIL CF 4+8"
]

const FCST57_MONTH_HEADERS = [
	"ENERO FCST 5+7", "FEBRERO FCST 5+7", "MARZO FCST 5+7", "ABRIL FCST 5+7",
	"MAYO FCST 5+7", "JUNIO FCST 5+7", "JULIO FCST 5+7", "AGOSTO FCST 5+7",
	"SETIEMBRE FCST 5+7", "OCTUBRE FCST 5+7", "NOVIEMBRE FCST 5+7", "DICIEMBRE FCST 5+7",
];

const CF57_MONTH_HEADERS = [
	"ENERO CF 5+7", "FEBRERO CF 5+7", "MARZO CF 5+7", "ABRIL CF 5+7"
]

const FCST618_MONTH_HEADERS = [
	"ENERO FCST 6+6", "FEBRERO FCST 6+6", "MARZO FCST 6+6", "ABRIL FCST 6+6",
	"MAYO FCST 6+6", "JUNIO FCST 6+6", "JULIO FCST 6+6", "AGOSTO FCST 6+6",
	"SETIEMBRE FCST 6+6", "OCTUBRE FCST 6+6", "NOVIEMBRE FCST 6+6", "DICIEMBRE FCST 6+6",
];

const CF618_MONTH_HEADERS = [
	"ENERO CF 6+6", "FEBRERO CF 6+6", "MARZO CF 6+6", "ABRIL CF 6+6"
]

const FCST75_MONTH_HEADERS = [
	"ENERO FCST 7+5", "FEBRERO FCST 7+5", "MARZO FCST 7+5", "ABRIL FCST 7+5",
	"MAYO FCST 7+5", "JUNIO FCST 7+5", "JULIO FCST 7+5", "AGOSTO FCST 7+5",
	"SETIEMBRE FCST 7+5", "OCTUBRE FCST 7+5", "NOVIEMBRE FCST 7+5", "DICIEMBRE FCST 7+5",
];

const CF75_MONTH_HEADERS = [
	"ENERO CF 7+5", "FEBRERO CF 7+5", "MARZO CF 7+5", "ABRIL CF 7+5"
]

const FCST84_MONTH_HEADERS = [
	"ENERO FCST 8+4", "FEBRERO FCST 8+4", "MARZO FCST 8+4", "ABRIL FCST 8+4",
	"MAYO FCST 8+4", "JUNIO FCST 8+4", "JULIO FCST 8+4", "AGOSTO FCST 8+4",
	"SETIEMBRE FCST 8+4", "OCTUBRE FCST 8+4", "NOVIEMBRE FCST 8+4", "DICIEMBRE FCST 8+4",
];

const CF84_MONTH_HEADERS = [
	"ENERO CF 8+4", "FEBRERO CF 8+4", "MARZO CF 8+4", "ABRIL CF 8+4"
]

const FCST913_MONTH_HEADERS = [
	"ENERO FCST 9+3", "FEBRERO FCST 9+3", "MARZO FCST 9+3", "ABRIL FCST 9+3",
	"MAYO FCST 9+3", "JUNIO FCST 9+3", "JULIO FCST 9+3", "AGOSTO FCST 9+3",
	"SETIEMBRE FCST 9+3", "OCTUBRE FCST 9+3", "NOVIEMBRE FCST 9+3", "DICIEMBRE FCST 9+3",
];

const CF913_MONTH_HEADERS = [
	"ENERO CF 9+3", "FEBRERO CF 9+3", "MARZO CF 9+3", "ABRIL CF 9+3"
]

const FCST102_MONTH_HEADERS = [
	"ENERO FCST 10+2", "FEBRERO FCST 10+2", "MARZO FCST 10+2", "ABRIL FCST 10+2",
	"MAYO FCST 10+2", "JUNIO FCST 10+2", "JULIO FCST 10+2", "AGOSTO FCST 10+2",
	"SETIEMBRE FCST 10+2", "OCTUBRE FCST 10+2", "NOVIEMBRE FCST 10+2", "DICIEMBRE FCST 10+2",
];

const CF102_MONTH_HEADERS = [
	"ENERO CF 10+2", "FEBRERO CF 10+2", "MARZO CF 10+2", "ABRIL CF 10+2"
]

const FCST1111_MONTH_HEADERS = [
	"ENERO FCST 11+1", "FEBRERO FCST 11+1", "MARZO FCST 11+1", "ABRIL FCST 11+1",
	"MAYO FCST 11+1", "JUNIO FCST 11+1", "JULIO FCST 11+1", "AGOSTO FCST 11+1",
	"SETIEMBRE FCST 11+1", "OCTUBRE FCST 11+1", "NOVIEMBRE FCST 11+1", "DICIEMBRE FCST 11+1",
];

const CF1111_MONTH_HEADERS = [
	"ENERO CF 11+1", "FEBRERO CF 11+1", "MARZO CF 11+1", "ABRIL CF 11+1"
]

const PROY_HEADERS = [
	"Llave2",
	"CAPEX/OPEX",
	"Tipo",
	"Código Proyecto",
	"Nombre Proyecto",
	"Inversión/SubRubro",
  	"Gerencia",
	"Jefatura Final",
	"PM ACTUAL",
	"Requisitor",
	"FCST a ",
	"Pend. de FCST a ",
	"% cumplimiento FCST",
	"% cumplimiento a ",
	"Forecast",
	"Estado Ptto",
	"SOLPE ORIGINAL",
	"SOLPE",
	...OC_MONTH_HEADERS,
	"Importe OC",
	"Solicitado",
	...AC_MONTH_HEADERS,
	"Importe AC",
	...FACT_MONTH_HEADERS,
	"Importe Facturado",
	...RQ_MONTH_HEADERS,
	"Importe RQ",
	...PLAN_MONTH_HEADERS,
	"TOTAL PLAN",
	...PLANCF_MONTH_HEADERS,
	"TOTAL CF PLAN",
	...FCST111_MONTH_HEADERS,
	"TOTAL FCST 1+11",
	...CF111_MONTH_HEADERS,
	"TOTAL CF 1+11",
	...FCST210_MONTH_HEADERS,
	"TOTAL FCST 2+10",
	...CF210_MONTH_HEADERS,
	"TOTAL CF 2+10",
	...FCST312_MONTH_HEADERS,
	"TOTAL FCST 3+9",
	...CF312_MONTH_HEADERS,
	"TOTAL CF 3+9",
	...FCST48_MONTH_HEADERS,
	"TOTAL FCST 4+8",
	...CF48_MONTH_HEADERS,
	"TOTAL CF 4+8",
	...FCST57_MONTH_HEADERS,
	"TOTAL FCST 5+7",
	...CF57_MONTH_HEADERS,
	"TOTAL CF 5+7",
	...FCST618_MONTH_HEADERS,
	"TOTAL FCST 6+6",
	...CF618_MONTH_HEADERS,
	"TOTAL CF 6+6",
	...FCST75_MONTH_HEADERS,
	"TOTAL FCST 7+5",
	...CF75_MONTH_HEADERS,
	"TOTAL CF 7+5",
	...FCST84_MONTH_HEADERS,
	"TOTAL FCST 8+4",
	...CF84_MONTH_HEADERS,
	"TOTAL CF 8+4",
	...FCST913_MONTH_HEADERS,
	"TOTAL FCST 9+3",
	...CF913_MONTH_HEADERS,
	"TOTAL CF 9+3",
	...FCST102_MONTH_HEADERS,
	"TOTAL FCST 10+2",
	...CF102_MONTH_HEADERS,
	"TOTAL CF 10+2",
	...FCST1111_MONTH_HEADERS,
	"TOTAL FCST 11+1",
	...CF1111_MONTH_HEADERS,
	"TOTAL CF 11+1",
	"Provisión Real",
	"Declaración No Uso",
	"Categoría",
	"Exceso/Por comprometer",
	"Ptto Disponible",
	"Gerencia Sponsor Final",
	"Unidad Funcional",
	"Trimestre Planificado",
	"Trimestre Real"	
];

const CR_HEADERS = [
	"RQ",
	"Nro OC",
	"Nro Línea",
	"Estado OC",
	"Fecha Emisión RQ",
	"Fecha Aprobación RQ",
	"Fecha Emisión OC",
	"Fecha Aprobación OC",
	"Descripción OC",
	"Descripción Adicional",
	"Código Recepción",
	"Fecha Recepción",
	"Código Proyecto",
	"Nombre Proyecto",
	"Inversión/SubRubro",
	"PM ACTUAL",
	"Gerencia Sponsor Final",
	"Acuerdo",
	"Proveedor",
	"Requisitor",
	"Gerencia Requisitor",
	"Gerencia Sponsor",
	"Importe OC",
	"Importe AC",
	"Importe Facturado",
	"Importe RQ"
]

const RQ_HEADERS = [
	"RQ",
    "Nro OC",
    "Estado OC",
    "Fecha Emisión RQ",
    "Fecha Aprobación RQ",
    "Fecha Emisión OC",
    "Fecha Aprobación OC",
    "Fecha Inicio de Proyecto",
    "Fecha de Fin de Proyecto",
    "Tipo",
    "Código Proyecto",
    "Nombre Proyecto",
    "Inversión/SubRubro",
    "Categoría",
    "Acuerdo",
    "Proveedor",
    "Requisitor",
    "PM ACTUAL",
    "Gerencia Requisitor",
    "Gerencia Sponsor",
    "Gerencia Sponsor Final",
	"Importe OC",
    "Importe AC",
    "Importe Facturado",
    "Importe RQ",
    "CR 2026",
    "CR menores 2026",
    "Llave",
    "Provisión Real",
    "Ahorro Real",
    "Declaración No Uso",
    "Jefatura Final",
	"Unidad Funcional",
    "Gerencia",
    "Comentarios",
    "Estado Ptto"
];

const ARRIENDOS_RESUMEN_HEADERS = [
	"Proyecto",
	"Q Real Sitios",
	"Presupuesto Habilitado",
	"Monto Consumido (Soles)",
	"Monto Disponible (Soles)",
	"% Disponible",
];

const ARRIENDOS_HEADERS = [
	"ID Planner",
	"Proyecto",
	"Site",
	"Torrera",
	"Monto Mensual",
	"Moneda",
	"Monto Enero",
	"Monto Febrero",
	"Monto Marzo",
	"Monto Abril",
	"Monto Mayo",
	"Monto Junio",
	"Monto Julio",
	"Monto Agosto",
	"Monto Septiembre",
	"Monto Octubre",
	"Monto Noviembre",
	"Monto Diciembre",
	"Monto Total Moneda",
	"Monto Total Soles"
];

const TICKET_HEADERS = [
	"Ticket",
	"Nombre",
	"Solicitante",
	"Q Sitios",
	"Monto",
	"Estado",
	"Fecha Creación",
];

const TICKET_SITE_HEADERS = [
	"Llave",
	"N°",
	"Identificador",
	"Sitio",
	"Actividad",
	"Solución",
	"Proveedor",
	"Sustento",
	"Acuerdo de compras (PA)",
	"Coordinador",
	"Moneda",
	"Cantidad",
	"Precio Unitario",
	"Total Cotización",
	"Fecha Inicio Servicio",
	"Fecha Fin Servicio",
	"Descripción Adicional",
	"ID Proyecto",
	"Proyecto",
	"Linea de Inversion",
	"Articulo",
	"Jefatura",
	"Unidad Funcional",
	"POC",
	"Estado",
	"Ticket",
	"RQ",
	"OC",
	"Linea OC",
	"Ticket CR_1",
	"CANTIDAD_1",
	"CR_1",
	"PAGO_1",
	"Ticket CR_2",
	"CANTIDAD_2",
	"CR_2",
	"PAGO_2",
	"PAGADO TOTAL",
	"Liquidación",
	"Entregable",
	"% Descuentos",
	"Penalidades SNC",
	"Pendiente de Pago",
	"Fecha Creación",
	"Código Ticket",
	"Fecha Envío MG",
	"Fecha Emisión RQ",
	"Fecha Emisión OC"
	// "Fecha CR 1",
	// "Fecha CR 2"
];

const PA_HEADERS = [
	"PA",
	"Proveedor",
	"Area",
	"Concurso",
	"Importe Acuerdo",
	"Importe Liberado",
	"Importe Solicitado",
	"Fecha Vigencia",
	"Estado Contrato",
	"Estado Final"
]

const GENERATE_CR_HEADERS = [
	"OC",
	"Línea OC",
	"Descripción linea",
	"Monto a pagar de la linea de OC ( Considerar el monto a pagar en la moneda de la OC)",
	"Cantidad",
	"Precio Unitario",
	// "Cantidad a Recepcionar",
];

const TICKET_SETTLEMET_SITE_HEADERS = [
	"Identificador",
	"Sitio",
	"Actividad",
	"Solución",
	"Proveedor",
	"Coordinador",
	"Unidad Funcional",
	"Total Cotizacion",
	"ID Proyecto",
	"Proyecto",
	"Linea de Inversion",
	"RQ",
	"OC",
	"Línea OC",
	"Cantidad OC 1",
	"Pago Hito 1",
	"CR_1",
	"Liquidación",
	"Entregable",
	"% Descuentos",
	"Penalidades SNC"
]


const SETTLEMET_SITE_HISTORY_HEADERS = [
	"Identificador",
	"Sitio",
	"Actividad",
	"Solución",
	"Proveedor",
	"Coordinador",
	"Unidad Funcional",
	"Total Cotizacion",
	"ID Proyecto",
	"Proyecto",
	"Linea de Inversion",
	"RQ",
	"OC",
	"Línea OC",
	"Cantidad OC 1",
	"Pago Hito 1",
	"CR_1",
	"Cantidad OC 2",
	"Pago Hito 2",
	"CR_2",
	"Estado Liquidación",
	"Liquidación",
	"Entregable",
	"% Descuentos",
	"Penalidades"
]

const TICKET_DELIVERABLES_SITE_HEADERS = [
	"Identificador",
	"Sitio",
	"Actividad",
	"Solución",
	"Proveedor",
	"Coordinador",
	"Unidad Funcional",
	"Total Cotizacion",
	"ID Proyecto",
	"Proyecto",
	"Linea de Inversion",
	"RQ",
	"OC",
	"Línea OC",
	"Cantidad OC 1",
	"Pago Hito 1",
	"CR_1",
	"RQ PEXT",
	"ESTADO RQ PEXT",
	"RQ PINT",
	"ESTADO RQ PINT",
	"RQ PINT FO",
	"ESTADO RQ PINT FO",
	"ESTADO ENTREGABLE",
]

const GENERATE_RQ_HEADERS = [
	"Identificador",
	"Sitio",
	"Actividad",
	"Proveedor",
	"Sustento",
	"Acuerdo de compras",
	"Cordinador",
	"Moneda",
	"Cantidad",
	"Precio Unitario",
	"Total Cotizacion",
	"Fecha Registro",
	"Fecha de inicio Servicio",
	"Fecha Fin de Servicio",
	"Descripcion Adicional",
	"ID proyecto",
	"Proyecto",
	"Linea de Inversion",
	"Jefatura",
	"Articulo",
	"TipoSKU",
	"DescripcionArticulo",
	"ID RQ"
];


function expandMonths(months, headers) {
	const map = new Map((months ?? []).map(m => [m.header.trim(), Number(m.value) || 0]));
	const out = {};
	headers.forEach(h => { out[h] = map.get(h.trim()) ?? 0; });
	return out;
}

// CAPEX -> Proyectos
export function buildProjectRowForTemplate(p) {

	const oc = expandMonths(p.amounts?.oc?.months, OC_MONTH_HEADERS);
	const ac = expandMonths(p.amounts?.ac?.months, AC_MONTH_HEADERS);
	const fac = expandMonths(p.amounts?.facturado?.months, FACT_MONTH_HEADERS);
	const rq = expandMonths(p.amounts?.rq?.months, RQ_MONTH_HEADERS);

	const plan = expandMonths(p.forecasts?.["Plan"]?.fcst?.months, PLAN_MONTH_HEADERS);
	const plancf = expandMonths(p.forecasts?.["Plan"]?.cf?.months, PLANCF_MONTH_HEADERS);

	const fcst111 = expandMonths(p.forecasts?.["1+11"]?.fcst?.months, FCST111_MONTH_HEADERS);
	const cf111 = expandMonths(p.forecasts?.["1+11"]?.cf?.months, CF111_MONTH_HEADERS);

	const fcst210 = expandMonths(p.forecasts?.["2+10"]?.fcst?.months, FCST210_MONTH_HEADERS);
	const cf210 = expandMonths(p.forecasts?.["2+10"]?.cf?.months, CF210_MONTH_HEADERS);

	const fcst312 = expandMonths(p.forecasts?.["3+9"]?.fcst?.months, FCST312_MONTH_HEADERS);
	const cf312 = expandMonths(p.forecasts?.["3+9"]?.cf?.months, CF312_MONTH_HEADERS);

	const fcst48 = expandMonths(p.forecasts?.["4+8"]?.fcst?.months, FCST48_MONTH_HEADERS);
	const cf48 = expandMonths(p.forecasts?.["4+8"]?.cf?.months, CF48_MONTH_HEADERS);

	const fcst57 = expandMonths(p.forecasts?.["5+7"]?.fcst?.months, FCST57_MONTH_HEADERS);
	const cf57 = expandMonths(p.forecasts?.["5+7"]?.cf?.months, CF57_MONTH_HEADERS);
	
	const fcst618 = expandMonths(p.forecasts?.["6+6"]?.fcst?.months, FCST618_MONTH_HEADERS);
	const cf618 = expandMonths(p.forecasts?.["6+6"]?.cf?.months, CF618_MONTH_HEADERS);

	const fcst75 = expandMonths(p.forecasts?.["7+5"]?.fcst?.months, FCST75_MONTH_HEADERS);
	const cf75 = expandMonths(p.forecasts?.["7+5"]?.cf?.months, CF75_MONTH_HEADERS);

	const fcst84 = expandMonths(p.forecasts?.["8+4"]?.fcst?.months, FCST84_MONTH_HEADERS);
	const cf84 = expandMonths(p.forecasts?.["8+4"]?.cf?.months, CF84_MONTH_HEADERS);

	const fcst913 = expandMonths(p.forecasts?.["9+3"]?.fcst?.months, FCST913_MONTH_HEADERS);
	const cf913 = expandMonths(p.forecasts?.["9+3"]?.cf?.months, CF913_MONTH_HEADERS);

	const fcst102 = expandMonths(p.forecasts?.["10+2"]?.fcst?.months, FCST102_MONTH_HEADERS);
	const cf102 = expandMonths(p.forecasts?.["10+2"]?.cf?.months, CF102_MONTH_HEADERS);

	const fcst1111 = expandMonths(p.forecasts?.["11+1"]?.fcst?.months, FCST1111_MONTH_HEADERS);	
	const cf1111 = expandMonths(p.forecasts?.["11+1"]?.cf?.months, CF1111_MONTH_HEADERS);

	return {
		// ——— columnas generales EXACTAS como el FORMATO
		"Llave2": p.llave2,
		"CAPEX/OPEX": p.capex_opex,
		"Tipo": p.tipo,
		"Código Proyecto": p.project_code,
		"Nombre Proyecto": p.project_name,
		"Inversión/SubRubro": p.investment_line,
		"Gerencia": p.gerencia,
		"Jefatura Final": p.jefatura,
		"PM ACTUAL": p.pm_actual,
		"Requisitor": p.requisitor,
		"FCST a ": p.fcst_mes,
		"Pend. de FCST a ": p.pend_fcst_mes,
		"% cumplimiento FCST": p.fcst_pct,
		"% cumplimiento a ": p.fcst_pct_mes,
		"Forecast": p.fcst_actual,
		"Estado Ptto": p.estado_ptto,
		"SOLPE ORIGINAL": p.solpe_original,
		"SOLPE": p.solpe,
		// ——— bloque OC mensual + total:
		...oc,
		"Importe OC": Number(p.amounts?.oc?.total ?? 0),
		 
		"Solicitado": p.solicitado ?? 0,

		// ——— bloque AC mensual + total:
		...ac,
		"Importe AC": Number(p.amounts?.ac?.total ?? 0),

		// ——— bloque Facturado mensual + total:
		...fac,
		"Importe Facturado": Number(p.amounts?.facturado?.total ?? 0),

		// ——— bloque RQ mensual + total:
		...rq,
		"Importe RQ": Number(p.amounts?.rq?.total ?? 0),

		// ——— 
		...plan,
		"TOTAL PLAN": Number(p.forecasts?.["Plan"].fcst?.total ?? 0),

		...plancf,
		"TOTAL PLAN CF": Number(p.forecasts?.["Plan"]?.cf?.total ?? 0),

		...fcst111,
		"TOTAL FCST 1+11": Number(p.forecasts?.["1+11"]?.fcst?.total ?? 0),

		...cf111,
		"TOTAL CF 1+11": Number(p.forecasts?.["1+11"]?.cf?.total ?? 0),

		// ——— bloque FCST 2+10 mensual + total:
		...fcst210,
		"TOTAL FCST 2+10": Number(p.forecasts?.["2+10"]?.fcst?.total ?? 0),

		...cf210,
		"TOTAL CF 2+10": Number(p.forecasts?.["2+10"]?.cf?.total ?? 0),

		// ——— bloque FCST 3+9 mensual + total:
		...fcst312,
		"TOTAL FCST 3+9": Number(p.forecasts?.["3+9"]?.fcst?.total ?? 0),

		...cf312,
		"TOTAL CF 3+9": Number(p.forecasts?.["3+9"]?.cf?.total ?? 0),

		...fcst48,
		"TOTAL FCST 4+8": Number(p.forecasts?.["4+8"]?.fcst?.total ?? 0),

		...cf48,		
		"TOTAL CF 4+8": Number(p.forecasts?.["4+8"]?.cf?.total ?? 0),

		...fcst57,
		"TOTAL FCST 5+7": Number(p.forecasts?.["5+7"]?.fcst?.total ?? 0),

		...cf57,
		"TOTAL CF 5+7": Number(p.forecasts?.["5+7"]?.cf?.total ?? 0),

		// ——— bloque FCST 6+6 mensual + total:
		...fcst618,
		"TOTAL FCST 6+6": Number(p.forecasts?.["6+6"]?.fcst?.total ?? 0),

		...cf618,
		"TOTAL CF 6+6": Number(p.forecasts?.["6+6"]?.cf?.total ?? 0),

		...fcst75,
		"TOTAL FCST 7+5": Number(p.forecasts?.["7+5"]?.fcst?.total ?? 0),

		...cf75,
		"TOTAL CF 7+5": Number(p.forecasts?.["7+5"]?.cf?.total ?? 0),

		...fcst84,
		"TOTAL FCST 8+4": Number(p.forecasts?.["8+4"]?.fcst?.total ?? 0),

		...cf84,
		"TOTAL CF 8+4": Number(p.forecasts?.["8+4"]?.cf?.total ?? 0),

		// ——— bloque FCST 9+3 mensual + total:		
		...fcst913,
		"TOTAL FCST 9+3": Number(p.forecasts?.["9+3"]?.fcst?.total ?? 0),

		...cf913,
		"TOTAL CF 9+3": Number(p.forecasts?.["9+3"]?.cf?.total ?? 0),

		...fcst102,
		"TOTAL FCST 10+2": Number(p.forecasts?.["10+2"]?.fcst?.total ?? 0),

		...cf102,
		"TOTAL CF 10+2": Number(p.forecasts?.["10+2"]?.cf?.total ?? 0),

		...fcst1111,
		"TOTAL FCST 11+1": Number(p.forecasts?.["11+1"]?.fcst?.total ?? 0),

		...cf1111,
		"TOTAL CF 11+1": Number(p.forecasts?.["11+1"]?.cf?.total ?? 0),

		// ——— bloque Provisión Real mensual + total:
		"Provisión Real": p.provision_real,

		// ——— bloque Declaración No Uso mensual + total:
		"Declaración No Uso": p.declaracion_no_uso,

		// ——— bloque Categoría mensual + total:
		"Categoría": p.categoria,

		"Exceso/Por comprometer": p.exceso_por_comprometer,
		"Ptto Disponible": p.ptto_disponible,
		"Gerencia Sponsor Final": p.gerencia_sponsor_final,
		"Unidad Funcional": p.unidad_funcional,
		"Trimestre Planificado": p.trimestre,
		"Trimestre Real": p.trimestre_real
	};
}


// CAPEX -> RQ
export function buildRqRowForTemplate(p) {
	
	return {
		"RQ": p.rq,
		"Nro OC": p.nro_oc,
		"Estado OC": p.estado_oc,
		"Fecha Emisión RQ": p.fecha_emision_rq,
		"Fecha Aprobación RQ": p.fecha_aprobacion_rq,
		"Fecha Emisión OC": p.fecha_emision_oc,
		"Fecha Aprobación OC": p.fecha_aprobacion_oc,
		"Fecha Inicio de Proyecto": p.fecha_inicio_proyecto,
		"Fecha de Fin de Proyecto": p.fecha_fin_proyecto,
		"Tipo": p.tipo,
		"Código Proyecto": p.codigo_proyecto,
		"Nombre Proyecto": p.nombre_proyecto,
		"Inversión/SubRubro": p.inversion_subrubro,
		"Categoría": p.categoria,
		"Acuerdo": p.acuerdo,
		"Proveedor": p.proveedor,
		"Requisitor": p.requisitor,
		"PM ACTUAL": p.pm_actual,
		"Gerencia Requisitor": p.gerencia_requisitor,
		"Gerencia Sponsor": p.gerencia_sponsor,
		"Gerencia Sponsor Final": p.gerencia_sponsor_final ?? "",
		"Importe OC": Number(p.importe_oc),
		"Importe AC": Number(p.importe_ac),
		"Importe Facturado": Number(p.importe_facturado),
		"Importe RQ": Number(p.importe_rq),
		"CR 2026": Number(p.cr_2026),
		"CR menores 2026": Number(p.cr_menores_2026),
		"Llave": p.llave,
		"Provisión Real": p.provision_real,
		"Ahorro Real": p.ahorro_real,
		"Declaración No Uso": p.declaracion_no_uso,
		"Jefatura Final": p.jefatura_final,
		"Unidad Funcional": p.unidad_funcional,
		"Gerencia": p.gerencia,
		"Comentarios": p.comentarios,
		"Estado Ptto": p.estado_ptto
	};
}

// CAPEX -> CR
export function buildCrRowForTemplate(p) {
	
	return {
		"RQ": p.rq,
		"Nro OC": p.nro_oc,
		"Nro Línea": p.nro_linea,
		"Estado OC": p.estado_oc,
		"Fecha Emisión RQ": p.fecha_emision_rq,
		"Fecha Aprobación RQ": p.fecha_aprobacion_rq,
		"Fecha Emisión OC": p.fecha_emision_oc,
		"Fecha Aprobación OC": p.fecha_aprobacion_oc,
		"Descripción OC": p.descripcion_oc,
		"Descripción Adicional": p.descripcion_adicional,
		"Código Recepción": p.codigo_recepcion,
		"Fecha Recepción": p.fecha_recepcion,
		"Código Proyecto": p.codigo_proyecto,
		"Nombre Proyecto": p.nombre_proyecto,
		"Inversión/SubRubro": p.inversion_subrubro,
		"PM ACTUAL": p.pm_actual,
		"Gerencia Sponsor Final": p.gerencia_sponsor_final,
		"Acuerdo": p.acuerdo,
		"Proveedor": p.proveedor,
		"Requisitor": p.requisitor,
		"Gerencia Requisitor": p.gerencia_requisitor,
		"Gerencia Sponsor": p.gerencia_sponsor,
		"Importe OC": Number(p.importe_oc),
		"Importe AC": Number(p.importe_ac),
		"Importe Facturado": Number(p.importe_facturado),
		"Importe RQ": Number(p.importe_rq),
	};
}

// OPEX -> Resumen Arriendos
export function buildArriendosResumenForTemplate(p) {

	const debitoReal = p.cashFlow.filter(f => f.type === "Débito REAL")

	const qSitios = p.cashFlow.length > 0 ? debitoReal.length : 0
	const montoConsumido = p.cashFlow.length > 0 ? debitoReal.reduce((s, it) => s + (it.currency === "Dólares" ? it.annualCost * TC : it.annualCost), 0) : 0
	const montoDisponible = p.budget - montoConsumido
	const porcentajeDisponible = p.budget !== 0 ? montoDisponible / p.budget * 100 : 0

	return {
		"Proyecto": p.projectName,
		"Q Real Sitios": qSitios,
		"Presupuesto Habilitado": p.budget,
		"Monto Consumido (Soles)": montoConsumido,
		"Monto Disponible (Soles)": montoDisponible,
		"% Disponible": porcentajeDisponible.toFixed(1),
	};
}

// OPEX -> Detalles Arriendos
export function buildArriendosRowForTemplate(p) {

	return {
		"ID Planner": p.id,
		"Proyecto": p.projectName,
		"Site": p.subProjectName,
		"Torrera": p.torrera,
		"Monto Mensual": p.monthlyCost,
		"Moneda": p.currency,
		"Monto Enero": 1 > p.initMonth ? p.monthlyCost : null,
		"Monto Febrero": 2 > p.initMonth ? p.monthlyCost : null,
		"Monto Marzo": 3 > p.initMonth ? p.monthlyCost : null,
		"Monto Abril": 4 > p.initMonth ? p.monthlyCost : null,
		"Monto Mayo": 5 > p.initMonth ? p.monthlyCost : null,
		"Monto Junio": 6 > p.initMonth ? p.monthlyCost : null,
		"Monto Julio": 7 > p.initMonth ? p.monthlyCost : null,
		"Monto Agosto": 8 > p.initMonth ? p.monthlyCost : null,
		"Monto Septiembre": 9 > p.initMonth ? p.monthlyCost : null,
		"Monto Octubre": 10 > p.initMonth ? p.monthlyCost : null,
		"Monto Noviembre": 11 > p.initMonth ? p.monthlyCost : null,
		"Monto Diciembre": 12 > p.initMonth ? p.monthlyCost : null,
		"Monto Total Moneda": p.annualCost,
		"Monto Total Soles": p.currency === "Dólares" ? p.annualCost * TC : p.annualCost,
	};
}

// Analytics -> Tickets
export function buildTicketRowForTemplate(p) {
	return {
		"Ticket": p.ticket_code,
		"Nombre": p.ticket_name,
		"Solicitante": p.requester,
		"Q Sitios": p.sites_count,
		"Monto": p.total_cotizacion,
		"Estado": p.state,
		"Fecha Creación": formatDDMMYYYYHour(p.createdAt),
	}
}

// Analytics -> Sites
export function buildTicketSitesRowForTemplate(p) {

	return {
		"Llave": p.llave,
		"N°": p.nro,
		"Identificador": p.identificador,
		"Sitio": p.sitio,
		"Actividad": p.actividad,
		"Solución": p.solucion,
		"Proveedor": p.proveedor,
		"Sustento": p.sustento,
		"Acuerdo de compras (PA)": p.acuerdo_compras,
		"Coordinador": p.coordinador,
		"Moneda": p.moneda,
		"Cantidad": p.cantidad,
		"Precio Unitario": p.precio_unitario,
		"Total Cotización": p.total_cotizacion,
		// "Fecha Registro": p.fecha_registro,
		"Fecha Inicio Servicio": formatDDMMYYYY(p.fecha_inicio_servicio),
		"Fecha Fin Servicio": formatDDMMYYYY(p.fecha_fin_servicio),
		"Descripción Adicional": p.descripcion_adicional,
		"ID Proyecto": p.id_proyecto,
		"Proyecto": p.nombre_proyecto,
		"Linea de Inversion": p.linea_inversion,
		"Articulo": p.articulo,
		"Jefatura": p.jefatura,
		"Unidad Funcional": p.unidad_funcional,
		"POC": p.requester,
		"Estado": p.estado,
		"Ticket": p.ticket_jira,
		"RQ": p.rq,
		"OC": p.oc ?? "",
		"Linea OC": p.linea_oc ?? "",
		"Ticket CR_1": p.ticket_jira_cr_1 ?? "",
		"CANTIDAD_1": p.cantidad_pago ?? "",
		"CR_1": p.cr_list[0] ?? "",
		"PAGO_1": p.importe_ac_list[0] ?? "",
		"Ticket CR_2": p.ticket_jira_cr_2 ?? "",
		"CANTIDAD_2": p.cantidad_pago_pendiente ?? "",
		"CR_2": p.cr_list[1] ?? "",
		"PAGO_2": p.importe_ac_list[1] ?? "",
		"PAGADO TOTAL": p.importe_ac ?? "",
		"Liquidación": p.liquidacion ?? null,
		"Entregable": p.status_deliverable ?? null,
		"% Descuentos": p.descuento ?? null,
		"Penalidades SNC": p.penalidad ?? null,
		"Pendiente de Pago": p.pendiente_pago ?? null,
		// "CANTIDAD_H1": p.cantidad_pago ?? "",
		// "MONTO_H1": p.monto_pago ?? "",
		// "CANTIDAD_H2": p.cantidad_pago_pendiente ?? "",
		// "MONTO_H2": p.monto_pago_pendiente ?? "",
		"Fecha Creación": formatDDMMYYYY(p.fecha_creacion),
		"Código Ticket": p.ticket_code,
		"Fecha Envío MG": formatDDMMYYYY(p.fecha_rq_sendmg ?? ""),
		"Fecha Emisión RQ": formatDDMMYYYY(p.fecha_rq ?? ""),
		"Fecha Emisión OC": formatDDMMYYYY(p.fecha_oc ?? "")

		// "Fecha CR 1": formatDDMMYYYY(p.fecha_recepcion_list?.[0] ?? ""),
		// "Fecha CR 2": formatDDMMYYYY(p.fecha_recepcion_list?.[1] ?? "")

		// "Fecha Envío MG RQ": formatDDMMYYYY(p.fecha_rq_sendmg)	
	}
}

// Analytics -> Sites
export function buildPaRowForTemplate(p) {

	return {
		"PA": p.pa,
		"Proveedor": p.proveedor,
		"Area": p.area,
		"Concurso": p.concurso,
		"Importe Acuerdo": p.habilitado,
		"Importe Liberado": p.liberado,
		"Importe Solicitado": p.solicitado,
		"Fecha Vigencia": formatDDMMYYYY(p.fecha_vigencia),
		"Estado Contrato": p.status_fecha,
		"Estado Final": p.status_final
	}
}

export function buildSettlementSitesRowForTemplate(p) {

	return {
		"Identificador": p.identificador,
		"Sitio": p.sitio,
		"Actividad": p.actividad,
		"Solución": p.solucion,
		"Proveedor": p.proveedor,
		// "Sustento": p.sustento,
		// "Acuerdo de compras (PA)": p.acuerdo_compras,
		"Coordinador": p.coordinador,
		"Unidad Funcional": p.unidad_funcional,
		// "Moneda": p.moneda,
		// "Cantidad": p.cantidad,
		// "Precio Unitario": p.precio_unitario,
		"Total Cotizacion": p.total_cotizacion,
		// "Fecha Registro": p.fecha_registro,
		// "Fecha Inicio Servicio": formatDDMMYYYY(p.fecha_inicio_servicio),
		// "Fecha Fin Servicio": formatDDMMYYYY(p.fecha_fin_servicio),
		// "Descripción Adicional": p.descripcion_adicional,
		"ID Proyecto": p.id_proyecto,
		"Proyecto": p.nombre_proyecto,
		"Linea de Inversion": p.linea_inversion,
		// "Articulo": p.articulo,
		// "Jefatura": p.jefatura,
		// "POC": p.requester,
		// "Estado": p.estado,
		// "Ticket": p.ticket_jira,
		"RQ": p.rq,
		"OC": p.oc ?? "",
		"Línea OC": p.linea_oc ?? "",
		"Cantidad OC 1": p.cantidad_pago ?? "",
		"Pago Hito 1": p.monto_pago ?? "",
		"CR_1": p.cr_list[0] ?? "",

		"Liquidación": p.liquidacion ?? null,
		"Entregable": p.status_deliverable ?? "",
		"% Descuentos": p.descuento ?? null,
		"Penalidades SNC": p.penalidad ?? null,
		// "PAGADO": p.importe_ac ?? "",
		// "Fecha Creación": formatDDMMYYYY(p.fecha_creacion),
		// "Código Ticket": p.ticket_code
	}
}


export function buildSettlementSitesHistoryRowForTemplate(p) {

	return {
		"Identificador": p.identificador,
		"Sitio": p.sitio,
		"Actividad": p.actividad,
		"Solución": p.solucion,
		"Proveedor": p.proveedor,
		"Coordinador": p.coordinador,
		"Unidad Funcional": p.unidad_funcional,
		"Total Cotizacion": p.total_cotizacion,
		"ID Proyecto": p.id_proyecto,
		"Proyecto": p.nombre_proyecto,
		"Linea de Inversion": p.linea_inversion,
		"RQ": p.rq,
		"OC": p.oc ?? "",
		"Línea OC": p.linea_oc ?? "",
		"Cantidad OC 1": p.cantidad_pago ?? "",
		"Pago Hito 1": p.monto_pago ?? "",
		"CR_1": p.cr_list[0] ?? "",
		"Cantidad OC 2": p.cantidad_pago_pendiente ?? "",
		"Pago Hito 2": p.monto_pago_pendiente ?? "",
		"CR_2": p.cr_list[1] ?? "",
		"Estado Liquidación": p.status_settlement ?? "",

		"Liquidación": p.liquidacion ?? null,
		"Entregable": p.status_deliverable ?? "",
		"% Descuentos": p.descuento ?? null,
		"Penalidades": p.penalidad ?? null,
		// "PAGADO": p.importe_ac ?? "",
		// "Fecha Creación": formatDDMMYYYY(p.fecha_creacion),
		// "Código Ticket": p.ticket_code
	}
}


export function buildDeliverablesSitesRowForTemplate(p) {

	return {
		"Identificador": p.identificador,
		"Sitio": p.sitio,
		"Actividad": p.actividad,
		"Solución": p.solucion,
		"Proveedor": p.proveedor,
		// "Sustento": p.sustento,
		// "Acuerdo de compras (PA)": p.acuerdo_compras,
		"Coordinador": p.coordinador,
		"Unidad Funcional": p.unidad_funcional,
		// "Moneda": p.moneda,
		// "Cantidad": p.cantidad,
		// "Precio Unitario": p.precio_unitario,
		"Total Cotizacion": p.total_cotizacion,
		// "Fecha Registro": p.fecha_registro,
		// "Fecha Inicio Servicio": formatDDMMYYYY(p.fecha_inicio_servicio),
		// "Fecha Fin Servicio": formatDDMMYYYY(p.fecha_fin_servicio),
		// "Descripción Adicional": p.descripcion_adicional,
		"ID Proyecto": p.id_proyecto,
		"Proyecto": p.nombre_proyecto,
		"Linea de Inversion": p.linea_inversion,
		// "Articulo": p.articulo,
		// "Jefatura": p.jefatura,
		// "POC": p.requester,
		// "Estado": p.estado,
		// "Ticket": p.ticket_jira,
		"RQ": p.rq,
		"OC": p.oc ?? "",
		"Línea OC": p.linea_oc ?? "",
		"Cantidad OC 1": p.cantidad_pago ?? "",
		"Pago Hito 1": p.monto_pago ?? "",
		"CR_1": p.cr ?? "",
		"RQ PEXT": p.rq_pext ?? "",
		"ESTADO RQ PEXT": p.status_rq_pext ?? "",
		"RQ PINT": p.rq_pint ?? "",
		"ESTADO RQ PINT": p.status_rq_pint ?? "",
		"RQ PINT FO": p.rq_pint_fo ?? "",
		"ESTADO RQ PINT FO": p.status_rq_pint_fo ?? "",
		"ESTADO ENTREGABLE": p.status_deliverable ?? ""
		// "PAGADO": p.importe_ac ?? "",
		// "Fecha Creación": formatDDMMYYYY(p.fecha_creacion),
		// "Código Ticket": p.ticket_code
	}
}


// Gneración de CR
export function buildGenerateCrRowForTemplate(p) {

	// console.log("P ====================> ", p)

	return {
		"OC": p.oc,
		"Línea OC": p.linea_oc,
		"Descripción linea": p.descripcion_adicional,
		"Monto a pagar de la linea de OC ( Considerar el monto a pagar en la moneda de la OC)": p.total_pago_h1,
		// "Cantidad": (p.cantidad_h1 / 100),
		"Cantidad": p.cantidad,
		"Precio Unitario": p.monto
	}
}

export function buildGenerateCrH2RowForTemplate(p) {
	
	return {
		"OC": p.oc,
		"Línea OC": p.linea_oc,
		"Descripción linea": p.descripcion_adicional,
		"Monto a pagar de la linea de OC ( Considerar el monto a pagar en la moneda de la OC)": p.total_pago_h2,
		"Cantidad": p.cantidad,
		// "Cantidad": (p.cantidad_h2 / 100),
		"Precio Unitario": p.monto
	}
}

export function buildGenerateRQRowForTemplate(p) {
	
	return {
		"Identificador": p.identificador,
		"Sitio": p.sitio,
		"Actividad": p.actividad,
		"Proveedor": p.proveedor,
		"Sustento": p.sustento,
		"Acuerdo de compras": p.acuerdo_compras,
		"Cordinador": p.coordinador,
		"Moneda": p.moneda,
		"Cantidad": p.cantidad,
		"Precio Unitario": p.precio_unitario,
		"Total Cotizacion": p.total_cotizacion,
		"Fecha Registro": formatDDMMYYYY(p.fecha_creacion),
		"Fecha de inicio Servicio": formatDDMMYYYY(p.fecha_inicio_servicio),
		"Fecha Fin de Servicio": formatDDMMYYYY(p.fecha_fin_servicio),
		"Descripcion Adicional": p.descripcion_adicional,
		"ID proyecto": p.id_proyecto,
		"Proyecto": p.nombre_proyecto,
		"Linea de Inversion": p.linea_inversion,
		"Jefatura": p.jefatura,
		"Articulo": p.articulo,
		"TipoSKU": "Servicios",
		"DescripcionArticulo": SKU_DESCRIPCIONES[p.articulo],
		"ID RQ": p.nro
	}
}


// Fila donde empiezan los datos en cada hoja (1-based).
const START_ROWS = {
	proyectos: 6,
	cr: 5, 
	rq: 4,
	arriendos: 3,
	tickets: 3,
	tickets_site: 2,
	pa: 3,
	generate_cr: 9,
	settlement_site: 3,
	deliverables: 3,
	generate_rq: 2
};


function normalizeHeaders(headers) {
  	return headers.map(h => (typeof h === "string" ? h : h.key));
}


/** Convierte valores a tipos adecuados para Excel (número, fecha, string). */
function normalizeValue(v) {
	if (v == null) return null;

	// número
	if (typeof v === "number") return v;

	// fechas en ISO o yyyy-mm-dd -> Date
	if (typeof v === "string") {
		const iso = /^\d{4}-\d{2}-\d{2}/.test(v);
		if (iso) {
			const d = new Date(v);
			if (!isNaN(d.getTime())) return d;
		}
		// intenta número en string
		const asNum = Number(v);
		if (!isNaN(asNum) && v.trim() !== "") return asNum;
		return v;
	}

	if (v instanceof Date) return v;

	// booleans y otros
	return v;
}


function buildMatrix(dataArray, headers) {
  const keys = normalizeHeaders(headers);
  return dataArray.map(row => keys.map(k => normalizeValue(row?.[k])));
}

function writeJsonToSheetXPP(
	wb,
	sheetName,
	data,
	headers,
	startRow1Based,
	startCol = 1
) {

	if (!data || data.length === 0) return;

	const ws = wb.sheet(sheetName);
	const matrix = buildMatrix(data, headers);
	const numRows = matrix.length;
	const numCols = normalizeHeaders(headers).length;

	if (!ws) throw new Error(`No existe la hoja: ${sheetName}`);

	ws
		.range(startRow1Based, startCol, startRow1Based + numRows - 1, startCol + numCols - 1)
		.value(matrix);
	
}

// CAPEX -> Proyectos
export async function exportProjectsToXlsx(opts) {

	
	
	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	console.log("OPTS", dataFinal)

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);

	// Dividir data por hoja
	writeJsonToSheetXPP(wb, "Proyectos", dataFinal, PROY_HEADERS, START_ROWS.proyectos);
	// writeJsonToSheetXPP(wb, "CR - Detalles", cr, CR_HEADERS, START_ROWS.cr);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		// type: "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	saveAs(blob, `${fileName}.xlsx`);
}

// CAPEX -> RQ
export async function exportRQtoXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "RQ Agrupado", dataFinal, RQ_HEADERS, START_ROWS.rq);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	saveAs(blob, `${fileName}.xlsx`);

}

// CAPEX -> CR
export async function exportCRtoXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "CR - Detalles", dataFinal, CR_HEADERS, START_ROWS.cr);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	saveAs(blob, `${fileName}.xlsx`);

}

// OPEX -> Arriendos
export async function exportArriendosToXlsx(opts) {
	
	const { templatePath, data, data2, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);

	// Dividir data por hoja
	writeJsonToSheetXPP(wb, "Resumen", data2, ARRIENDOS_RESUMEN_HEADERS, START_ROWS.arriendos);
	writeJsonToSheetXPP(wb, "Detalles", data, ARRIENDOS_HEADERS, START_ROWS.arriendos);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	saveAs(blob, `${fileName}.xlsx`);
}

// Analytics -> Tickets
export async function exportTicketToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "Tickets", dataFinal, TICKET_HEADERS, START_ROWS.tickets);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	saveAs(blob, `${fileName}.xlsx`);

}

// Analytics -> Sites
export async function exportTicketSitesToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "Sitios", dataFinal, TICKET_SITE_HEADERS, START_ROWS.tickets_site, 2);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});	

	saveAs(blob, `${fileName}.xlsx`);
}

// Analytics -> PA
export async function exportPaToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "PA", dataFinal, PA_HEADERS, START_ROWS.pa);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});	

	saveAs(blob, `${fileName}.xlsx`);
}

export async function exportGenerateCrToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte", download = true, returnFile = true } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "Formato", dataFinal, GENERATE_CR_HEADERS, START_ROWS.generate_cr, 2);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	if(download) {
		saveAs(blob, `${fileName}.xlsx`);
	}

	// Retornar File si lo necesitas para FormData
	if (returnFile) {
		return new File(
			[blob],
			`${fileName}.xlsx`,
			{
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				lastModified: Date.now(),
			}
		);
	}

	// O al menos retornar el blob
	return blob;
}

// Analytics -> PA
export async function exportSettlementToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "Pendientes Pago", dataFinal, TICKET_SETTLEMET_SITE_HEADERS, START_ROWS.settlement_site, 2);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});	

	saveAs(blob, `${fileName}.xlsx`);
}

export async function exportSettlementHistoryToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "Pendientes Pago", dataFinal, SETTLEMET_SITE_HISTORY_HEADERS, START_ROWS.settlement_site, 2);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});	

	saveAs(blob, `${fileName}.xlsx`);
}

// Analizar Entregables
export async function exportDeliverablesToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "Entregables", dataFinal, TICKET_DELIVERABLES_SITE_HEADERS, START_ROWS.deliverables, 2);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});	

	saveAs(blob, `${fileName}.xlsx`);
}

// Generar Formato RQ
export async function exportRQTemplateToXlsx(opts) {

	const { templatePath, dataFinal, fileName = "reporte" } = opts;

	// Cargar la plantilla
	const resp = await fetch(templatePath);
	const buf = await resp.arrayBuffer();

	// Read
	const wb = await XlsxPopulate.fromDataAsync(buf);
	writeJsonToSheetXPP(wb, "BASE", dataFinal, GENERATE_RQ_HEADERS, START_ROWS.generate_rq, 1);

	// Write
	const out = await wb.outputAsync();

	// Download
	const blob = new Blob([out], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});	

	saveAs(blob, `${fileName}.xlsx`);
}