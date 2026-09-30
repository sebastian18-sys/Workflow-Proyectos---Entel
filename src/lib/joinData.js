// utils
function sum(lines, key) {
    return lines.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

const n = (v) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

// Match KEYS Acuerdo - PA
export function matchPA(contracts, pas, pa_ticket) {
    const needMap = new Map();
    const paTicketMap = new Map();

    for (const it of pas ?? []) {
        needMap.set(String(it.acuerdo).trim(), n(it.importe_acuerdo));
    }

    for (const it of pa_ticket ?? []) {
        paTicketMap.set(String(it.acuerdo).trim(), n(it.importe_acuerdo));
    }

    return (contracts ?? []).map((r) => {
        const pa = r.pa;
        const proveedor = r.provider;
        const area = r.area;
        const concurso = r.number_contest;
        const fecha_vigencia = r.maxDate;
        const status_fecha = r.status_date;
        const status_final = r.status_final;
        const liberado = needMap.get(pa) ?? 0;
        const habilitado = n(r.amount_agreement);
        const solicitado = paTicketMap.get(pa) ?? 0;
        const pendiente = habilitado - liberado;

        return {
            pa,
            proveedor,
            area,
            concurso,
            fecha_vigencia,
            status_fecha,
            status_final,
            habilitado,
            solicitado,
            liberado,
            pendiente
        };
    });
}