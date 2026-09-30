const MONTHS = [
	"dic 24",
	"enero","febrero","marzo","abril","mayo","junio","julio","agosto","setiembre","octubre","noviembre","diciembre",
];

function monthKeyFromHeader(header) {
	if (!header) return null;
	const h = header.toLowerCase();
	// encontramos el primer mes que aparezca en el header
	for (const m of MONTHS) {
		if (h.includes(m !== "dic 24" ? m.slice(0, 3) : m)) return m;
	}
	return null;
}

function idxMonth(targetMonth) {
	const t = targetMonth.toLowerCase();
	const alias = t === "septiembre" ? "setiembre" : t; // normaliza “septiembre”
	return MONTHS.indexOf(alias);
}

function sumUntilMonth(
	entries = [],
	targetMonth
) {
	const targetIdx = idxMonth(targetMonth);
	if (targetIdx < 0) return 0;

	return entries.reduce((acc, { header, value }) => {
		const k = monthKeyFromHeader(header);
		if (k == null) return acc;
		const kIdx = MONTHS.indexOf(k);
		return kIdx >= 0 && kIdx <= targetIdx ? acc + (Number(value) || 0) : acc;
	}, 0);
}

function computeMetricsByItem(item, opts) {
	const { targetMonth, fcstKey } = opts;

	// 1) FCST
	const fcstMonths = item?.forecasts?.[fcstKey]?.fcst?.months ?? [];
	const fcstToMonth = sumUntilMonth(fcstMonths, targetMonth);

	// 2) OC y AC
  const solpe = item.solpe;
	const ocMonths = item?.amounts?.oc?.months ?? [];
	const acMonths = item?.amounts?.ac?.months ?? [];
	const comprometido = sumUntilMonth(ocMonths, targetMonth);
	const actas = sumUntilMonth(acMonths, targetMonth);

	// 3) Pendiente
	const pendiente = fcstToMonth - actas;

	// 4) % pendiente
	const porcentajePend = fcstToMonth > 0 ? ((actas / fcstToMonth) * 100) : 0;

	return {
    solpe,
		fcstAgosto: fcstToMonth,
		comprometido,
		actas,
		pendMetaAgosto: pendiente,
		porcentajePend: Number(porcentajePend.toFixed(2)),
	};
}

function sumUp(children) {
	const total = children.reduce((acc, c) => {
    acc.solpe += c.solpe || 0;
		acc.fcstAgosto += c.fcstAgosto || 0;
		acc.comprometido += c.comprometido || 0;
		acc.actas += c.actas || 0;
		acc.pendMetaAgosto += c.pendMetaAgosto || 0;
		return acc;
	}, { solpe: 0, fcstAgosto: 0, comprometido: 0, actas: 0, pendMetaAgosto: 0 });

	return {
		...total,
		porcentajePend: total.fcstAgosto > 0 ? Number((100 - (total.actas / total.fcstAgosto) * 100).toFixed(2)) : 0
	};
}

export function buildNestedData(
  backendRows,
  opts
) {
  const jMap = new Map();

  for (const it of backendRows) {
    const j = (it.pm_actual || "Sin PM").trim();
    const p = (it.project_name || "Sin proyecto").trim();

    if (!jMap.has(j)) jMap.set(j, new Map());
    const pMap = jMap.get(j);
    if (!pMap.has(p)) pMap.set(p, []);
    pMap.get(p).push(it);
  }

  // Construir estructura
  const pms = [];

  for (const [pm_actual, pMap] of jMap.entries()) {
    const projects = [];

    for (const [projectName, items] of pMap.entries()) {
      // Lines por investment_line
      const lines = items.map((it) => {
        const m = computeMetricsByItem(it, opts);
        return {
          id: it._id,
          nombre: it.investment_line || "Sin línea",
          ...m,
        };
      });

      // Agregación a nivel proyecto
      const aggProj = sumUp(lines);
      projects.push({
        id: items[0]?.project_code || projectName,
        nombre: projectName,
        ...aggProj,
        lines,
      });
    }

    // Agregación a nivel pm_actual (PM)
    const aggPM = sumUp(projects);
    pms.push({
      id: pm_actual,
      nombre: pm_actual,
      ...aggPM,
      projects,
    });
  }

  // Ordenamiento
  pms.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  for (const pm of pms) {
    pm.projects.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    for (const pr of pm.projects) {
      pr.lines.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
  }

  return pms;
}