// Unique Data
export const unique = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>a.localeCompare(b));
export const uniqueNum = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>a-b);

// Format Number
export const formatNumberInt = (v) => (v ?? 0).toLocaleString("es-PE");

// To MM
export const toMM = (n) => n / 1_000_000;
export const fmt1 = (n) => toMM(n).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// To Number
export const toNumber = (value) => {
    if (value == null || value === "") return 0;

    if (typeof value === "number") {
        if (!Number.isFinite(value)) return 0;
        return Math.abs(value) < 1e-6 ? 0 : value;
    }

    const cleaned = String(value)
        .replace(/,/g, "")
        .replace(/\s/g, "");

    const n = Number(cleaned);

    if (!Number.isFinite(n)) return 0;
    return Math.abs(n) < 1e-6 ? 0 : n;
}

export const normalizePercentInput = (value) => {
    if (value === "") return "";

    // Solo permite números y punto decimal
    let cleaned = String(value).replace(/[^\d.]/g, "");

    // Evita más de un punto decimal
    const parts = cleaned.split(".");
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    // Mantener valores tipo 0.5
    if (cleaned.startsWith("0.")) return cleaned;

    // Quitar ceros a la izquierda: 012 -> 12
    cleaned = cleaned.replace(/^0+(?=\d)/, "");

    return cleaned;
};

// Format Currency
export const formatCurrency = (value) => {

	const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return "";

	return new Intl.NumberFormat("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value)
}

export const formatCurrencyWithoutDecimals = (value) => {

	const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return "";

	return new Intl.NumberFormat("es-PE", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value)
}

export const percentajeValue = (value) => {
	return new Intl.NumberFormat("es-PE", {
		style: "percent",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value)
}


export function fmtMoney(
	n,
	opts
) {
	const { maximumFractionDigits = 1, minimumFractionDigits = 1 } = opts ?? {};
	return n.toLocaleString(undefined, { maximumFractionDigits, minimumFractionDigits });
}


const round1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;

export function roundPartsToMatchTotal(valuesMM) {

	const total = round1(valuesMM.reduce((s, v) => s + v, 0)); // total correcto (1 decimal)
	const target = Math.round(total * 10); // tenths

	const floors = valuesMM.map(v => Math.floor(v * 10));
	let sumFloors = floors.reduce((s, v) => s + v, 0);
	let remaining = target - sumFloors;

	const frac = valuesMM
		.map((v, i) => ({ i, frac: v * 10 - floors[i] }))
		.sort((a, b) => b.frac - a.frac);

	const add = new Array(valuesMM.length).fill(0);
	for (let k = 0; k < remaining; k++) add[frac[k].i] += 1;

	return floors.map((f, i) => (f + add[i]) / 10);
}


// export const formatDate = (value) => {
// 	const date = new Date(value)
// 	const options = { year: "numeric", month: "short", day: "numeric" }
// 	return date.toLocaleDateString("es-PE", options)
// }

// export const formatDate = (d) => {

// 	console.log(d)

//     if (!d) return ""
//     const dd = String(d.getDate()).padStart(2, "0")
//     const mm = String(d.getMonth() + 1).padStart(2, "0")
//     const yyyy = d.getFullYear()
//     return `${dd}/${mm}/${yyyy}`
// }

export const toIsoDate = (value) => {
	if (!value) return null;

	const raw = String(value).trim();
	const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

	if (!match) return null;

	const [, dd, mm, yyyy] = match;
	return `${yyyy}-${mm}-${dd}`;
}


// format 2026-01-14T00:00:00.000Z in dd/mm/yyyy
export const formatDDMMYYYY = (value) => {
	const d = value instanceof Date ? value : new Date(value);
	if (isNaN(d.getTime())) return "";

	const dd = String(d.getUTCDate()).padStart(2, "0");
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	const yyyy = d.getUTCFullYear();

	return `${dd}/${mm}/${yyyy}`;
}

export const formatDDMMYYYYHour = (value) => {
	const d = value instanceof Date ? value : new Date(value);
	if (isNaN(d.getTime())) return "";

	const dd = String(d.getUTCDate()).padStart(2, "0");
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	const yyyy = d.getUTCFullYear();
	const hh = String(d.getUTCHours()).padStart(2, "0");
	const mmm = String(d.getUTCMinutes()).padStart(2, "0");
	const ss = String(d.getUTCSeconds()).padStart(2, "0");

	return `${dd}/${mm}/${yyyy} ${hh}:${mmm}:${ss}`;
}

export const formatBytes = (bytes) => {
	if (!Number.isFinite(bytes) || bytes < 0) return "";
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const value = bytes / Math.pow(k, i);
	const digits = i === 0 ? 0 : value < 10 ? 1 : 0;
	return `${value.toFixed(digits)}${sizes[i]}`;
}

// export const toMoney = (value) => {
// 	return new Intl.NumberFormat("es-PE", {
// 		style: "currency",
// 		currency: "PEN",
// 		minimumFractionDigits: 2,
// 		maximumFractionDigits: 2,
// 	}).format(value)
// }

//Filters
const toStr = (v) => (v == null ? "" : String(v));
const lc = (s) => toStr(s).toLowerCase();

export const rowPassesAdvancedFilters = (row, filters = []) => {
	if (!filters.length) return true;

	return filters.every((f) => {
		const v = row?.[f.filterId];

		switch (f.type) {
		case "select":
			// igualdad estricta (ajusta si necesitas case-insensitive)
			return toStr(v) === toStr(f.value);

		case "multiSelect":
			// incluye cualquiera de los seleccionados
			if (!Array.isArray(f.value) || f.value.length === 0) return true;
			return f.value.includes(v);

		case "text":
			if (!f.value) return true;
			return lc(v).includes(lc(f.value));

		case "numberRange": {
			const num = toNumber(v);
			if (Number.isNaN(num)) return false;
			const min = f.value?.min ?? -Infinity;
			const max = f.value?.max ?? +Infinity;
			return num >= min && num <= max;
		}

		case "dateRange": {
			if (!f.value) return true;
			const d = v ? new Date(v) : null;
			if (!d || isNaN(+d)) return false;
			const from = f.value?.from ? new Date(f.value.from) : null;
			const to   = f.value?.to   ? new Date(f.value.to)   : null;
			if (from && d < from) return false;
			if (to   && d > to)   return false;
			return true;
		}

		default:
			// si no reconocemos el tipo, no bloqueamos
			return true;
		}
	});
}