const MONTHS = [
	"dic 25",
	"enero","febrero","marzo","abril","mayo","junio","julio","agosto","setiembre","octubre","noviembre","diciembre",
];

function monthKeyFromHeader(header) {
	if (!header) return null;
	const h = header.toLowerCase();
	for (const m of MONTHS) {
		if (h.includes(m !== "dic 25" ? m.slice(0, 3) : m)) return m;
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
	const solpe = item.solpe;
	const fcstTotal = (item?.forecasts?.[fcstKey]?.fcst?.total ?? 0) + (item?.forecasts?.[fcstKey]?.cf?.total ?? 0);
	const fcstMonths = item?.forecasts?.[fcstKey]?.fcst?.months ?? [];
	const fcstToMonth = sumUntilMonth(fcstMonths, targetMonth);

	// 2) OC y AC
	const ocMonths = item?.amounts?.oc?.months ?? [];
	const acMonths = item?.amounts?.ac?.months ?? [];
	const comprometido = sumUntilMonth(ocMonths, targetMonth);
	const actas = sumUntilMonth(acMonths, targetMonth);

	const porcentajeComprometido = comprometido > 0 ? ((comprometido / fcstTotal) * 100) : 0;
	const porcentajeActas = actas > 0 ? ((actas / fcstTotal) * 100) : 0;
	const porcentajeAvanceProy = (item.avance_proy ?? 0) * 100;


	// 3) Pendiente
	const pendiente = fcstToMonth - actas;
	const pendLiberar = fcstTotal > solpe ? fcstTotal - solpe : 0;

	// 4) % pendiente
	const porcentajePend = fcstToMonth > 0 ? ((actas / fcstToMonth) * 100) : 0;

	return {
		solpe,
		fcstAgosto: fcstToMonth,
		fcstTotal,
		comprometido,
		porcentajeComprometido,
		actas,
		porcentajeActas,
		porcentajeAvanceProy,
		pendLiberar,
		pendMetaAgosto: pendiente,
		porcentajePend: Number(porcentajePend.toFixed(2)),
	};
}

function sumUp(children) {
	const total = children.reduce((acc, c) => {
		acc.fcstTotal += c.fcstTotal || 0;
		acc.solpe += c.solpe || 0;
		acc.fcstAgosto += c.fcstAgosto || 0;
		acc.comprometido += c.comprometido || 0;
		// acc.porcentajeComprometido += c.porcentajeComprometido || 0;
		acc.actas += c.actas || 0;
		acc.pendLiberar += c.pendLiberar || 0;
		// acc.porcentajeActas += c.porcentajeActas || 0;
		acc.pendMetaAgosto += c.pendMetaAgosto || 0;

		// Promedio de avance_proy
		// const avance = Number(c.porcentajeAvanceProy) ;

		// if (Number.isFinite(avance)) {
		// 	acc.sumaAvanceProy += avance;
		// 	acc.cantidadAvanceProy += 1;
		// }

		return acc;
	}, { 
		fcstTotal: 0,
		solpe: 0, 
		fcstAgosto: 0, 
		comprometido: 0,
		// porcentajeComprometido: 0,
		actas: 0, 
		pendLiberar: 0,
		// porcentajeActas: 0,
		pendMetaAgosto: 0,
		sumaAvanceProy: 0,
		cantidadAvanceProy: 0
	});

	return {
		...total,
		porcentajeComprometido: total.solpe > 0 ? Number((total.comprometido / total.fcstTotal) * 100).toFixed(2) : 0,
		porcentajeActas: total.solpe > 0 ? Number((total.actas / total.fcstTotal) * 100).toFixed(2) : 0,
		porcentajePend: total.fcstAgosto > 0 ? Number((100 - (total.actas / total.fcstAgosto) * 100).toFixed(2)) : 0,
		// porcentajeAvanceProy: total.cantidadAvanceProy > 0 ? Number((total.sumaAvanceProy / total.cantidadAvanceProy)).toFixed(2) : 0
	};
}

// Sum Focst
function sumFcst(children) {
	const total = children.reduce((acc, c) => {
		acc.total_old_fcst += c.total_old_fcst || 0;
		acc.total_old_cf += c.total_old_cf || 0;
		acc.total_new_fcst += c.total_new_fcst || 0;
		acc.total_new_cf += c.total_new_cf || 0;
		acc.total_old += c.total_old || 0;
		acc.total_new += c.total_new || 0;
		acc.dif_total_fcst += c.dif_total_fcst || 0;
		
		return acc;
	}, { 
		total_old_fcst: 0,
		total_old_cf: 0,
		total_new_fcst: 0,
		total_new_cf: 0, 
		total_old: 0,
		total_new: 0,
		dif_total_fcst: 0,
	});

	return total
}

export function buildNestedComplianceUFData(
	backendRows,
	opts
) {
	const jMap = new Map();

	for (const it of backendRows) {
		const j = (it.unidad_funcional || "Sin UF").trim();
		const p = (it.project_name || "Sin proyecto").trim();

		if (!jMap.has(j)) jMap.set(j, new Map());
		const pMap = jMap.get(j);
		if (!pMap.has(p)) pMap.set(p, []);
		pMap.get(p).push(it);
	}

	// Construir estructura
	const ufs = [];

	//   for (const [jefatura, pMap] of jMap.entries()) {
	for (const [unidad_funcional, pMap] of jMap.entries()) {
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

		// Agregación a nivel UF
		const aggUF = sumUp(projects);
		ufs.push({
			id: unidad_funcional,
			nombre: unidad_funcional,
			...aggUF,
			projects,
		});
	}

	// Ordenamiento
	ufs.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	for (const pm of ufs) {
		pm.projects.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
		for (const pr of pm.projects) {
		pr.lines.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
		}
	}

	// Total general de todas las UF
	const grandTotal = sumUp(ufs);

	return {
		ufs,
		grandTotal
	};
}

export function buildNestedData(backendRows = [], opts, tipoTrimestre) {
	
	const trimestreMap = new Map();

	console.log("tipoTrimestre", tipoTrimestre)

	const normalizeText = (value, fallback) => {
		const text = String(value ?? "").trim();
		return text || fallback;
	};

	for (const item of backendRows) {
		const trimestre = normalizeText(
			tipoTrimestre === "Q Planificado" ? item.trimestre : item.trimestre_real,
			"Sin trimestre"
		);

		const unidadFuncional = normalizeText(
			item.unidad_funcional,
			"Sin UF"
		);

		const projectName = normalizeText(
			item.project_name,
			"Sin proyecto"
		);

		if (!trimestreMap.has(trimestre)) {
			trimestreMap.set(trimestre, new Map());
		}

		const unidadFuncionalMap = trimestreMap.get(trimestre);

		if (!unidadFuncionalMap.has(unidadFuncional)) {
			unidadFuncionalMap.set(unidadFuncional, new Map());
		}

		const projectMap = unidadFuncionalMap.get(unidadFuncional);

		if (!projectMap.has(projectName)) {
			projectMap.set(projectName, []);
		}

		projectMap.get(projectName).push(item);
	}

	const trimestres = [];

	for (const [trimestre, unidadFuncionalMap] of trimestreMap.entries()) {
		const unidadesFuncionales = [];

		for (
			const [unidadFuncional, projectMap]
			of unidadFuncionalMap.entries()
		) {
			const projects = [];

			for (const [projectName, items] of projectMap.entries()) {
				const lines = items.map((item) => {
					const metrics = computeMetricsByItem(item, opts);

					return {
						id: item._id,
						nombre: normalizeText(
							item.investment_line,
							"Sin línea"
						),
						...metrics,
					};
				});

				// Total del proyecto, sumando sus líneas
				const aggProject = sumUp(lines);

				projects.push({
					id: items[0]?.project_code || projectName,
					nombre: projectName,
					...aggProject,
					lines,
				});
			}

			// Total de la unidad funcional, sumando sus proyectos
			const aggUnidadFuncional = sumUp(projects);

			unidadesFuncionales.push({
				id: unidadFuncional,
				nombre: unidadFuncional,
				...aggUnidadFuncional,
				projects,
			});
		}

		// Total del trimestre, sumando sus unidades funcionales
		const aggTrimestre = sumUp(unidadesFuncionales);

		trimestres.push({
			id: trimestre,
			nombre: trimestre,
			...aggTrimestre,
			unidadesFuncionales,
		});
	}

	// Ordenamiento de trimestres
	trimestres.sort((a, b) =>
		a.nombre.localeCompare(b.nombre, "es", {
			numeric: true,
			sensitivity: "base",
		})
	);

	// Ordenamiento de UF, proyectos y líneas
	for (const trimestre of trimestres) {
		trimestre.unidadesFuncionales.sort((a, b) =>
			a.nombre.localeCompare(b.nombre, "es", {
				numeric: true,
				sensitivity: "base",
			})
		);

		for (const unidadFuncional of trimestre.unidadesFuncionales) {
			unidadFuncional.projects.sort((a, b) =>
				a.nombre.localeCompare(b.nombre, "es", {
					numeric: true,
					sensitivity: "base",
				})
			);

			for (const project of unidadFuncional.projects) {
				project.lines.sort((a, b) =>
					a.nombre.localeCompare(b.nombre, "es", {
						numeric: true,
						sensitivity: "base",
					})
				);
			}
		}
	}

	// Total general de todas las Tri
	const grandTotal = sumUp(trimestres);

	return {
		trimestres,
		grandTotal
	};
}




export function buildForecastHierarchy2(
	backendRows,
	opts = {}
) {
	const jMap = new Map();

	for (const it of backendRows) {
		// const j = (it.jefatura || "Sin jefatura").trim();
		const j = (it.unidad_funcional || "Sin UF").trim();
		const p = (it.nombre_proyecto || "Sin proyecto").trim();

		if (!jMap.has(j)) jMap.set(j, new Map());
		const pMap = jMap.get(j);
		if (!pMap.has(p)) pMap.set(p, []);
		pMap.get(p).push(it);
	}

	// Construir estructura
	const ufsFcst = [];

	//   for (const [jefatura, pMap] of jMap.entries()) {
	for (const [unidad_funcional, pMap] of jMap.entries()) {
		const projects = [];

		for (const [projectName, items] of pMap.entries()) {
			// Lines por investment_line
			const lines = items.map((it) => {
				// const m = computeMetricsByItem(it, opts);
				return {
					id: it._id,
					nombre: it.linea_inversion || "Sin línea",
					// ...m,
					total_old_fcst: it.forecasts?.["old"]?.fcst?.total ?? 0,
					total_old_cf: it.forecasts?.["old"]?.cf?.total ?? 0,
				
					total_new_fcst: it.forecasts?.["new"]?.fcst?.total ?? 0,
					total_new_cf: it.forecasts?.["new"]?.cf?.total ?? 0,

					total_old: (it.forecasts?.["old"]?.fcst?.total ?? 0) + (it.forecasts?.["old"]?.cf?.total ?? 0),
					total_new: (it.forecasts?.["new"]?.fcst?.total ?? 0) + (it.forecasts?.["new"]?.cf?.total ?? 0),

					dif_total_fcst: ((it.forecasts?.["new"]?.fcst?.total ?? 0) + (it.forecasts?.["new"]?.cf?.total ?? 0)) - ((it.forecasts?.["old"]?.fcst?.total ?? 0) + (it.forecasts?.["old"]?.cf?.total ?? 0)),
				};
			});

			// Agregación a nivel proyecto
			const aggProj = sumFcst(lines);
			projects.push({
				id: items[0]?.codigo_proyecto || projectName,
				nombre: projectName,
				...aggProj,
				lines,
			});
		}

		// Agregación a nivel jefatura (PM)
		const aggPM = sumFcst(projects);
		ufsFcst.push({
			// id: jefatura,
			// nombre: jefatura,
			id: unidad_funcional,
			nombre: unidad_funcional,
			...aggPM,
			projects,
		});
	}

	// Ordenamiento
	ufsFcst.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	for (const pm of ufsFcst) {
		pm.projects.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
		for (const pr of pm.projects) {
		pr.lines.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
		}
	}

	// totals
	const grandTotal = sumFcst(ufsFcst);
	
	return { 
		ufsFcst, 
		grandTotal
	};
}