export default function validatePa(resultPa, dataToInsert, projects = [], solicitado) {

    // console.log("SOLICITADO", solicitado)

    const toCents = (value) => {
        const n = Number(value ?? 0);
        return Number.isFinite(n) ? n : 0;
    };

    const fromCents = (value) => Number(Number(value ?? 0).toFixed(2));

    const norm = (v) => String(v ?? "").trim().toUpperCase();

    const isPaOmitida = (paRaw) => {
        const pa = norm(paRaw);
        return !pa || pa === "NO APLICA";
    };

    const alertRules = {
        PA_NO_ENCONTRADA: {
            tipo: "error",
            bloquea: true,
            grupo: "pa",
            titulo: "PA no encontrada",
            mensaje: (r) => `${r.pa}: PA no encontrada`,
            detalle: () => [],
        },

        PA_BLOQUEADA: {
            tipo: "error",
            bloquea: true,
            grupo: "pa",
            titulo: "PA bloqueada",
            mensaje: (r) => `${r.pa}: PA bloqueada`,
            detalle: (r) => [],
        },

        PA_EXCEDE_HABILITADO: {
            tipo: "error",
            bloquea: true,
            grupo: "pa",
            titulo: "Superación de monto PA",
            mensaje: (r) => `${r.pa}: Superación de monto PA`,
            detalle: (r) => [
                { label: "Habilitado", value: r.habilitado, format: "money" },
                { label: "Liberado", value: r.liberado, format: "money" },
                { label: "En cola", value: r.solicitado_pa, format: "money" },
                { label: "Solicitado", value: r.solicitado_total_archivo, format: "money" },
                { label: "Exceso", value: r.exceso_vs_habilitado, format: "money" },
            ],
        },

        PROJECT_KEY_INVALIDA: {
            tipo: "error",
            bloquea: true,
            grupo: "proyecto",
            titulo: "Llave de proyecto inválida",
            mensaje: () => "Llave de proyecto inválida",
            detalle: (r) => [
                { label: "PA", value: norm(r.acuerdo_compras) || "SIN_PA" },
                { label: "ID Proyecto", value: r.id_proyecto ?? "-" },
                { label: "Línea inversión", value: r.linea_inversion ?? "-" },
            ],
        },

        PROJECT_NO_ENCONTRADO: {
            tipo: "error",
            bloquea: true,
            grupo: "proyecto",
            titulo: "Proyecto no encontrado",
            mensaje: (r) => `No se encontró el proyecto ${r.llave ?? r.llave_proyecto ?? ""}`,
            detalle: (r) => [
                { label: "PA", value: r.pa ?? norm(r.acuerdo_compras) ?? "-" },
                { label: "Llave", value: r.llave ?? r.llave_proyecto ?? "-" },
            ],
        },

        PROJECT_EXCEDE_COMPROMETIDO: {
            tipo: "error",
            bloquea: true,
            grupo: "proyecto",
            titulo: "Superación del comprometido del proyecto",
            mensaje: (r) => `${r.llave}: Superación del comprometido del proyecto`,
            detalle: (r) => [
                { label: "ID Proyecto", value: r.id_proyecto ?? "-" },
                { label: "Nombre Proyecto", value: r.nombre_proyecto ?? "-" },
                { label: "Línea Inversión", value: r.linea_inversion ?? "-" },
                { label: "SOLPE", value: r.solpe, format: "money" },
                { label: "Importe OC", value: r.importe_oc, format: "money" },
                { label: "En Cola", value: r.solicitado_actual, format: "money" },
                { label: "Solicitado Archivo", value: r.solicitado_total_archivo, format: "money" },
                { label: "Exceso", value: r.exceso_vs_solpe, format: "money" },
            ],
        },
    };

    const buildAlert = (codigo, source = {}) => {
        const rule = alertRules[codigo];

        if (!rule) {
            return {
                id: `${codigo}||${source.pa ?? ""}||${source.llave ?? ""}`,
                tipo: "error",
                bloquea: true,
                grupo: "general",
                codigo,
                titulo: label(codigo),
                mensaje: source.mensaje ?? label(codigo),
                entidad: {
                    pa: source.pa ?? null,
                    llave: source.llave ?? source.llave_proyecto ?? null,
                },
                detalle: [],
            };
        }

        const pa = source.pa ?? norm(source.acuerdo_compras) ?? null;
        const llave = source.llave ?? source.llave_proyecto ?? null;

        return {
            id: `${codigo}||${pa ?? ""}||${llave ?? ""}||${source.id_proyecto ?? ""}||${source.linea_inversion ?? ""}`,
            tipo: rule.tipo,
            bloquea: rule.bloquea,
            grupo: rule.grupo,
            codigo,
            titulo: rule.titulo,
            mensaje: rule.mensaje(source),
            entidad: {
                pa,
                llave,
            },
            detalle: rule.detalle(source),
        };
    };

    const uniqueAlerts = (alerts = []) => {
        const map = new Map();

        for (const alert of alerts) {
            if (!map.has(alert.id)) {
                map.set(alert.id, alert);
            }
        }

        return [...map.values()];
    };

    const labels = {
        PA_NO_ENCONTRADA: "PA no encontrada",
        PA_BLOQUEADA: "PA bloqueada",
        PA_EXCEDE_HABILITADO: "Superación de monto PA",
        PROJECT_KEY_INVALIDA: "Llave de proyecto inválida",
        PROJECT_NO_ENCONTRADO: "Proyecto no encontrado",
        PROJECT_EXCEDE_COMPROMETIDO: "Superación del comprometido del proyecto",
    };

    const label = (code) => labels[code] || code;

    // Extrae el prefijo línea de inversión:
    // "2-3-SERVICIO ..." -> "2-3"
    const extraerCodigoLinea = (lineaInversion) => {
        const s = String(lineaInversion ?? "").trim();
        const m = s.match(/^(\d+(?:-\d+)*)/);
        return m ? m[1] : null;
    };

    // Llave de proyecto: id_proyecto + código de línea
    // Ej: M0821 + 2-3 => M08212-3
    const buildProjectKey = (row) => {
        const idProyecto = String(row?.id_proyecto ?? "").trim().toUpperCase();
        const codigoLinea = extraerCodigoLinea(row?.linea_inversion);
        if (!idProyecto || !codigoLinea) return null;
        return `${idProyecto}${codigoLinea}`;
    };

    const buildPaProjectKey = (row) => {
        const llaveProyecto = buildProjectKey(row);
        if (!llaveProyecto) return null;

        // Si PA viene vacío o "NO APLICA", se agrupa como SIN_PA para validar proyecto sin reglas de PA
        const paNorm = norm(row?.acuerdo_compras);
        const paKey = isPaOmitida(paNorm) ? "SIN_PA" : paNorm;

        return `${paKey}||${norm(llaveProyecto)}`;
    };

    // =========================================
    // Índices
    // =========================================
    const paMap = new Map((resultPa || []).map((pa) => [norm(pa.pa), pa]));
    const projectMap = new Map((projects || []).map((p) => [norm(p.llave2), p]));

    // =========================================
    // 1) VALIDACIÓN POR PA (bloqueo total por PA)
    // Regla:
    //  - status_final === OK
    //  - sum(total_cotizacion por PA) + liberado <= habilitado
    // =========================================
    const gruposPA = new Map();

    for (const row of dataToInsert || []) {

        // PA Omitida
        if (isPaOmitida(row.acuerdo_compras)) continue;

        const paCode = norm(row.acuerdo_compras);
        const monto = toCents(row.total_cotizacion);

        if (!gruposPA.has(paCode)) {
        gruposPA.set(paCode, {
            pa: paCode,
            items: [],
            solicitado_total: 0,
            cantidad_items: 0,
        });
        }

        const g = gruposPA.get(paCode);
        g.items.push(row);
        g.solicitado_total += monto;
        g.cantidad_items += 1;
    }

    const paEvalMap = new Map();
    const resumenPAsRechazadas = [];
    const resumenPAsProcesadas = [];

    for (const [paCode, grupo] of gruposPA.entries()) {
        const paInfo = paMap.get(paCode);

        let ok = true;
        const motivos = [];

        let habilitado = 0;
        let liberado = 0;
        let solicitado_pa = 0;
        let status_final = null;
        let status_fecha = null;
        let fecha_vigencia = null;
        let proveedor_pa = null;
        let area = null;
        let concurso = null;

        if (!paInfo) {
            ok = false;
            motivos.push("PA_NO_ENCONTRADA");
        } else {
            habilitado = toCents(paInfo.habilitado);
            liberado = toCents(paInfo.liberado);
            solicitado_pa = toCents(paInfo.solicitado);
            status_final = paInfo.status_final ?? null;
            status_fecha = paInfo.status_fecha ?? null;
            fecha_vigencia = paInfo.fecha_vigencia ?? null;
            proveedor_pa = paInfo.proveedor ?? null;
            area = paInfo.area ?? null;
            concurso = paInfo.concurso ?? null;

            if (String(paInfo.status_final ?? "").toUpperCase() !== "OK") {
                ok = false;
                motivos.push("PA_BLOQUEADA");
            }

            if (grupo.solicitado_total + liberado + solicitado_pa > habilitado) {
                ok = false;
                motivos.push("PA_EXCEDE_HABILITADO");
            }
        }

        const motivosUnicos = [...new Set(motivos)];
        const totalConLiberado = grupo.solicitado_total + liberado;
        // const exceso = Math.max(0, totalConLiberado - habilitado);
        const exceso = liberado - totalConLiberado - solicitado_pa;

        const ev = {
            pa: paCode,
            ok,
            motivos: motivosUnicos,
            motivos_label: motivosUnicos.map(label),
            proveedor_pa,
            area,
            concurso,
            status_final,
            status_fecha,
            fecha_vigencia,
            habilitado: fromCents(habilitado),
            liberado: fromCents(liberado),
            solicitado_actual: fromCents(solicitado_pa),
            solicitado_total_archivo: fromCents(grupo.solicitado_total),
            total_solicitado_mas_liberado: fromCents(totalConLiberado),
            exceso_vs_habilitado: exceso > 0 ? 0 : fromCents(exceso),
            cantidad_items: grupo.cantidad_items,
            resumen: ok
                ? `${paCode} OK`
                : `${paCode} por ${motivosUnicos.map(label).join(" + ")}`
        };

        paEvalMap.set(paCode, ev);
        resumenPAsProcesadas.push({ ...ev, tiene_rechazos: !ok });
        if (!ok) resumenPAsRechazadas.push(ev);
    }

    // =========================================
    // 2) VALIDACIÓN POR PROYECTO (por PA + llave)
    // Regla:
    //  sum(total_cotizacion de ESA PA en ESA llave) + importe_oc <= solpe
    // =========================================
    const gruposProyectoPorPA = new Map();

    for (const row of dataToInsert || []) {
        const paProjectKey = buildPaProjectKey(row);

        const monto = toCents(row.total_cotizacion);
        // Si no se puede armar llave, se rechaza luego por fila
        if (!paProjectKey) continue;

        const paCode = norm(row.acuerdo_compras);
        const llaveProyecto = norm(buildProjectKey(row));

        if (!gruposProyectoPorPA.has(paProjectKey)) {
        gruposProyectoPorPA.set(paProjectKey, {
            key: paProjectKey,      // "PA12489||M08252-7"
            pa: paCode,             // "PA12489"
            llave: llaveProyecto,   // "M08252-7"

            // Datos para mostrar en alerta
            id_proyecto: row.id_proyecto ?? null,
            nombre_proyecto: row.nombre_proyecto ?? row.Nombre_Proyecto ?? null,
            linea_inversion: row.linea_inversion ?? row.Linea_Inversion ?? null,

            items: [],
            solicitado_total: 0,
            cantidad_items: 0,
        });
        }

        const g = gruposProyectoPorPA.get(paProjectKey);
        g.items.push(row);
        g.solicitado_total += monto;
        g.cantidad_items += 1;
    }

    const projectPaEvalMap = new Map();
    const resumenProyectosRechazados = [];
    const resumenProyectosProcesados = [];


    for (const [key, grupo] of gruposProyectoPorPA.entries()) {
        let pInfo = projectMap.get(grupo.llave);

        // const solicitadoProyecto = solicitado.find(s => s.llave === pInfo.llave2)
        const solicitadoProyecto = pInfo
            ? solicitado.find(s => s.llave === pInfo.llave2)
            : null;

        if (pInfo) {
            if (solicitadoProyecto) {
                pInfo.solicitado = solicitadoProyecto.importe_solicitado;
            } else {
                pInfo.solicitado = 0;
            }
        }

        // if (solicitadoProyecto) {
        //     pInfo.solicitado = solicitadoProyecto.importe_solicitado
        // } else {
        //     pInfo.solicitado = 0
        // }

        let ok = true;
        const motivos = [];

        let solpe = 0;
        let importe_oc = 0;
        let solicitado_existente = 0;

        // Si PA no pasó, este grupo tampoco pasa
        // if (!paEv?.ok) {
        //     ok = false;
        //     motivos.push(...(paEv?.motivos || ["PA_NO_ENCONTRADA"]));
        // }

        // Validación contra project
        if (!pInfo || !pInfo?.llave2) {
            ok = false;
            motivos.push("PROJECT_NO_ENCONTRADO");
        } else {
            solpe = toCents(pInfo.solpe);
            importe_oc = toCents(pInfo.importe_oc);
            solicitado_existente = toCents(pInfo.solicitado);

            if (grupo.solicitado_total + importe_oc + solicitado_existente > solpe) {

                ok = false;
                motivos.push("PROJECT_EXCEDE_COMPROMETIDO");
            }
        }

        const motivosUnicos = [...new Set(motivos)];

        const totalComprometido = grupo.solicitado_total + importe_oc;
        // const exceso = Math.max(0, totalComprometido - grupo.solicitado_total - solpe);
        const exceso = (solpe - totalComprometido - solicitado_existente) // AÑADIR LÓGICA -----;

        const ev = {
            key,                  // "PA12489||M08252-7"
            pa: grupo.pa,
            llave: grupo.llave,

            // Datos visibles para usuario
            id_proyecto: grupo.id_proyecto,
            nombre_proyecto: grupo.nombre_proyecto,
            linea_inversion: grupo.linea_inversion,

            ok,
            motivos: motivosUnicos,
            motivos_label: motivosUnicos.map(label),
            solpe: fromCents(solpe),
            importe_oc: fromCents(importe_oc),
            solicitado_actual: fromCents(solicitado_existente),
            solicitado_total_archivo: fromCents(grupo.solicitado_total),
            total_comprometido_resultante: fromCents(totalComprometido),
            exceso_vs_solpe: exceso > 0 ? 0 : fromCents(exceso),
            cantidad_items: grupo.cantidad_items,
            resumen: ok
                ? `${grupo.pa} - ${grupo.llave} OK`
                : `${grupo.pa} - ${grupo.llave} por ${motivosUnicos.map(label).join(" + ")}`,
        };

        projectPaEvalMap.set(key, ev);
        resumenProyectosProcesados.push({ ...ev, tiene_rechazos: !ok });
        if (!ok) resumenProyectosRechazados.push(ev);
    }

    // =========================================
    // 3) RESULTADO FINAL POR FILA
    // Debe pasar:
    //  - validación PA
    //  - validación proyecto por PA+llave
    // =========================================
    const dataFinalInsertar = [];
    const rechazados = [];

    for (const row of dataToInsert || []) {
        // const paCode = norm(row.acuerdo_compras);
        // const llaveProyecto = buildProjectKey(row);
        // const paEv = paEvalMap.get(paCode);

        const paRaw = norm(row.acuerdo_compras);

        const paOmitida = isPaOmitida(paRaw);
        const paKey = paOmitida ? "SIN_PA" : paRaw;

        const paEv = paOmitida ? null : paEvalMap.get(paRaw);

        const llaveProyecto = buildProjectKey(row);

        // Si no se pudo construir llave => rechazo
        if (!llaveProyecto) {

            // const motivos = [
            //     ...(paEv?.ok ? [] : paEv?.motivos || ["PA_NO_ENCONTRADA"]),
            //     "PROJECT_KEY_INVALIDA",
            // ];
            const motivos = [
                ...(paOmitida ? [] : (paEv?.ok ? [] : paEv?.motivos || ["PA_NO_ENCONTRADA"])),
                "PROJECT_KEY_INVALIDA",
            ];
            const motivosUnicos = [...new Set(motivos)];

            rechazados.push({
                ...row,
                llave_proyecto: null,
                motivo_rechazo: motivosUnicos[0],
                motivo_rechazo_label: label(motivosUnicos[0]),
                motivos_rechazo_all: motivosUnicos,
                motivos_rechazo_all_label: motivosUnicos.map(label),
                detalle_pa: paEv
                ? {
                    pa: paEv.pa,
                    habilitado: paEv.habilitado,
                    liberado: paEv.liberado,
                    solicitado_actual: paEv.solicitado_pa,
                    solicitado_total_archivo: paEv.solicitado_total_archivo,
                    total_solicitado_mas_liberado: paEv.total_solicitado_mas_liberado,
                    exceso_vs_habilitado: paEv.exceso_vs_habilitado,
                    status_final: paEv.status_final,
                    status_fecha: paEv.status_fecha,
                }
                : null,
                detalle_proyecto: null,
            });
            continue;
        }

        // const paProjectKey = `${paCode}||${norm(llaveProyecto)}`;
        const paProjectKey = `${paKey}||${norm(llaveProyecto)}`;
        const projectEv = projectPaEvalMap.get(paProjectKey);

        const motivos = [];
        // if (!paEv?.ok) motivos.push(...(paEv?.motivos || ["PA_NO_ENCONTRADA"]));
        if (!paOmitida && !paEv?.ok) motivos.push(...(paEv?.motivos || ["PA_NO_ENCONTRADA"]));
        if (!projectEv?.ok) motivos.push(...(projectEv?.motivos || ["PROJECT_NO_ENCONTRADO"]));

        const motivosUnicos = [...new Set(motivos)];

        if (motivosUnicos.length === 0) {
            dataFinalInsertar.push({
                ...row,
                llave_proyecto: llaveProyecto, // útil para debug/UI
            });
        } else {

            rechazados.push({
                ...row,
                llave_proyecto: llaveProyecto,
                motivo_rechazo: motivosUnicos[0],
                motivo_rechazo_label: label(motivosUnicos[0]),
                motivos_rechazo_all: motivosUnicos,
                motivos_rechazo_all_label: motivosUnicos.map(label),
                detalle_pa: paEv
                ? {
                    pa: paEv.pa,
                    habilitado: paEv.habilitado,
                    liberado: paEv.liberado,
                    solicitado_total_archivo: paEv.solicitado_total_archivo,
                    solicitado_actual: paEv.solicitado_pa,
                    total_solicitado_mas_liberado: paEv.total_solicitado_mas_liberado,
                    exceso_vs_habilitado: paEv.exceso_vs_habilitado,
                    status_final: paEv.status_final,
                    status_fecha: paEv.status_fecha,
                    }
                : null,
                detalle_proyecto: projectEv
                ? {
                    pa: projectEv.pa,
                    llave: projectEv.llave,
                    solpe: projectEv.solpe,
                    importe_oc: projectEv.importe_oc,
                    solicitado_actual: projectEv.solicitado_existente,
                    solicitado_total_archivo: projectEv.solicitado_total_archivo,
                    total_comprometido_resultante: projectEv.total_comprometido_resultante,
                    exceso_vs_solpe: projectEv.exceso_vs_solpe,
                    }
                : null,
            });
        }
    }

    // =========================================
    // 4) Alertas / Resúmenes compactos para UI
    // =========================================
    // Alertas por PA.
    const alertasPA = uniqueAlerts(
        resumenPAsRechazadas.flatMap((r) =>
            (r.motivos || []).map((codigo) => buildAlert(codigo, r))
        )
    );


    // const alertasPA = resumenPAsRechazadas.map((r) => ({
    //     tipo: "warning",
    //     codigo: r.motivos[0] || "PA_INVALIDA",
    //     pa: r.pa,
    //     mensaje: r.resumen,
    //     detalle: {
    //         habilitado: r.habilitado,
    //         liberado: r.liberado,
    //         solicitado_total_archivo: r.solicitado_total_archivo,
    //         total_solicitado_mas_liberado: r.total_solicitado_mas_liberado,
    //         exceso_vs_habilitado: r.exceso_vs_habilitado,
    //         status_final: r.status_final,
    //         status_fecha: r.status_fecha,
    //     },
    // }));

    // Alertas por proyecto agrupado.
    // Ejemplo: proyecto no encontrado o supera comprometido.
    const alertasProyectoResumen = resumenProyectosRechazados.flatMap((r) =>
        (r.motivos || []).map((codigo) => buildAlert(codigo, r))
    );

    // Alertas de llave inválida.
    // Estas no siempre aparecen en resumenProyectosRechazados porque se rechazan por fila
    // cuando no se puede construir la llave.
    const alertasLlaveInvalida = rechazados
        .filter((r) => r.motivos_rechazo_all?.includes("PROJECT_KEY_INVALIDA"))
        .map((r) => buildAlert("PROJECT_KEY_INVALIDA", r));

    const alertasProyecto = uniqueAlerts([
        ...alertasProyectoResumen,
        ...alertasLlaveInvalida,
    ]);

    // Warnings no bloqueantes.
    // Por ahora queda vacío, pero aquí puedes agregar reglas futuras que sí permitan registrar.
    const warnings = [];

    // Errores bloqueantes.
    // Estos mantienen tu comportamiento actual: si hay rechazados, no registra.
    const errors = uniqueAlerts([
        ...alertasPA,
        ...alertasProyecto,
    ]).filter((a) => a.bloquea);

    // const alertasProyecto = resumenProyectosRechazados.map((r) => ({
    //     tipo: "warning",
    //     codigo: r.motivos[0] || "PROJECT_EXCEDE_COMPROMETIDO",
    //     pa: r.pa,
    //     llave: r.llave,
    //     // mensaje: `${r.pa} - ${r.llave}: ${r.motivos[0]}`,
    //     mensaje: r.resumen,
    //     detalle: {
    //         solpe: r.solpe,
    //         importe_oc: r.importe_oc,
    //         solicitado_total_archivo: r.solicitado_total_archivo,
    //         total_comprometido_resultante: r.total_comprometido_resultante,
    //         exceso_vs_solpe: r.exceso_vs_solpe
    //     },
    // }));

    // Opcional: ordenar resúmenes para salida consistente
    resumenPAsRechazadas.sort((a, b) => a.pa.localeCompare(b.pa));
    resumenPAsProcesadas.sort((a, b) => a.pa.localeCompare(b.pa));

    resumenProyectosRechazados.sort((a, b) => {
        const k1 = `${a.pa}||${a.llave}`;
        const k2 = `${b.pa}||${b.llave}`;
        return k1.localeCompare(k2);
    });

    resumenProyectosProcesados.sort((a, b) => {
        const k1 = `${a.pa}||${a.llave}`;
        const k2 = `${b.pa}||${b.llave}`;
        return k1.localeCompare(k2);
    });

    // =========================================
    // Return final
    // =========================================
    return {
        // ✅ Registros válidos para insertar
        dataFinalInsertar,

        // ❌ Registros rechazados (detalle por fila)
        rechazados,

        // 📌 Resumen por PA
        resumenPAsRechazadas,
        resumenPAsProcesadas,

        // 📌 Resumen por proyecto (PA + llave)
        resumenProyectosRechazados,
        resumenProyectosProcesados,

        // ⚠️ Alertas para UI
        alertasPA,
        alertasProyecto,

        // Nueva estructura escalable
        alertas: {
            errors,
            warnings,
        },
    };

}