import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useEstimations } from '@/hooks/budget/capex/useEstimations';
import { fmtMoney, formatCurrency } from '@/lib/helpers';
import { MONTOS_FIJOS_ACTIVIDAD } from '@/constants/montos_fijos_opex';
// import { useEstimations } from '@/lib/use-estimations';


const getVersionLabel = (versionKey) => {
    if (versionKey === "q_plan") return "PLAN";
    if (versionKey === "q_210") return "FCST 2+10";
    if (versionKey === "q_57") return "FCST 5+7";
    const match = versionKey.match(/^q_v(\d+)$/);
    if (match) return `V${match[1]}`;
    return versionKey.toUpperCase();
};


//  className={`text-center font-bold text-sm border-l border-b ${getVersionHeaderClass(versionKey, index)}`}
const getVersionHeaderClass = (versionKey, index) => {
    if (versionKey === "q_plan") {
        return "bg-slate-100 text-slate-800 border-slate-200";
    }

    if (versionKey === "q_210") {
        return "bg-slate-100 text-slate-800 border-slate-200";
    }

    if (versionKey === "q_57") {
        return "bg-slate-100 text-slate-800 border-slate-200";
    }

    const variants = [
        "bg-blue-50 text-blue-800 border-blue-200",
        "bg-emerald-50 text-emerald-800 border-emerald-200",
        "bg-amber-50 text-amber-800 border-amber-200",
        "bg-violet-50 text-violet-800 border-violet-200",
        "bg-rose-50 text-rose-800 border-rose-200",
    ];

    return variants[(index - 1) % variants.length];
};

const getVersionSubHeaderClass = (versionKey, index) => {
    if (versionKey === "q_plan") {
        return "bg-slate-50 text-slate-700";
    }

    if (versionKey === "q_210") {
        return "bg-slate-50 text-slate-700";
    }

    if (versionKey === "q_57") {
        return "bg-slate-50 text-slate-700";
    }

    const variants = [
        "bg-blue-50/60 text-blue-700",
        "bg-emerald-50/60 text-emerald-700",
        "bg-amber-50/60 text-amber-700",
        "bg-violet-50/60 text-violet-700",
        "bg-rose-50/60 text-rose-700",
    ];

    return variants[(index - 1) % variants.length];
};


const initializeEstimations = (data) => {
    return data.flatMap(project => {

        const calculateMontosAct = (qs, project) => {
            return qs.map(q => q * project.driver_actividad * project.incidencia_actividad);
        };

        const calculateMontosEne = (qs, project) => {
            return qs.map(q => q * project.driver_energia * project.incidencia_energia);
        };

        // console.log("qE", qsEnergia)
        const qs = project.q_mensuales.q_plan.map(q => q.value)

        return [
            {
                projectId: project._id,
                type: 'energia',
                // qs: qsEnergia,
                qs: qs,
                montos: calculateMontosEne(qs, project),
            },
            {
                projectId: project._id,
                type: 'actividad',
                qs: qs,
                montos: calculateMontosAct(qs, project),
            }
        ];
    });
};

// agg by proyecto y tipo, sum qs and montos




export function EstimationsTable() {

    const { opexEstimacion, state, getEstimation } = useEstimations();

    // console.log("OPEX ESTIMACIONES", opexEstimacion)
    // console.log("STATE ESTIMACIONES", state)

    const estimaciones = initializeEstimations(opexEstimacion)
    // console.log("ESTIMACIONES", estimaciones)

    // const agg = grouped(opexEstimacion)
    // console.log("AGG", agg)

    const sortVersionKeys = (keys = []) => {
        return [...keys].sort((a, b) => {
            if (a === "q_plan") return -1;
            if (b === "q_plan") return 1;

            const aMatch = a.match(/^q_v(\d+)$/);
            const bMatch = b.match(/^q_v(\d+)$/);

            const aNum = aMatch ? Number(aMatch[1]) : 9999;
            const bNum = bMatch ? Number(bMatch[1]) : 9999;

            return aNum - bNum;
        });
    };

    // Montos Fijos
    const getMontoActividad = (project, versionKey, item, index) => {

        // console.log("versionKey", versionKey)

        const projectId = String(project?._id ?? "");

        // console.log("projectId", projectId)

        const montoFijo =
            MONTOS_FIJOS_ACTIVIDAD?.[projectId]?.[versionKey]?.[index];

        // Respeta 0 como monto fijo válido
        if (
            montoFijo !== null &&
            montoFijo !== undefined &&
            montoFijo !== ""
        ) {
            return Number(montoFijo);
        }

        return (
            (Number(item?.value) || 0) *
            (Number(project?.driver_actividad) || 0) *
            (Number(project?.incidencia_actividad) || 0)
        );
    };

    const grouped = Object.values(
        opexEstimacion.reduce((acc, project) => {
            const key = `${project.proyecto}__${project.tipo}`;
            const qMensuales = project?.q_mensuales || {};
            

            if (!acc[key]) {
            acc[key] = {
                proyecto: project.proyecto,
                tipo: project.tipo,
                registros: 0,
                versiones: {}
            };
            }

            const versionKeys = sortVersionKeys(
                // Object.keys(qMensuales).filter((k) => /^q_(plan|210|v\d+)$/.test(k))
                Object.keys(qMensuales).filter((k) => /^q_(plan|210|57|v\d+)$/.test(k))
            );

        
            versionKeys.forEach((versionKey) => {

                const aArrayAcc = []
                const qArray = qMensuales?.[versionKey] ?? [];

                const totalAmountFinalAct = []
                const totalAmountFinalEn = []

                // console.log("OBJECTVALUES", Object.values(qMensuales))
                // const qArrayAcc = 
                // const qMens = Object.values(qMensuales)

                console.log("qArray", qArray)

                const qAcc = qArray.reduce((acc, q) => {
                    aArrayAcc.push({
                        header: q.header,
                        value: acc + Number(q?.value)
                    })
                    return acc + Number(q?.value)
                }, 0)

                // console.log("qArrayAcc", qArrayAcc)
                // console.log("qMensualesAcc", qMensualesAcc)

                // console.log("qArray", qArray)
                // console.log("aArrayAcc", aArrayAcc)

                const totalQs = qArray.reduce(
                    (sum, item) => sum + (Number(item?.value) || 0),
                    0
                );

                // const energiaMontos = aArrayAcc.reduce(
                //     (sum, item) => 
                //         sum +
                //             (Number(item?.value) || 0) *
                //             (Number(project?.driver_energia) || 0) *
                //             (Number(project?.incidencia_energia) || 0),
                //         0
                // );

                // console.log("energiaMontos", energiaMontos)

                const energiaMontos = qArray.reduce(
                    (sum, item, index) => {

                        totalAmountFinalEn.push(sum + (Number(item?.value) || 0) * (Number(project?.driver_energia) || 0) * (Number(project?.incidencia_energia) || 0))

                        return sum +
                            (Number(item?.value) || 0) *
                            (Number(project?.driver_energia) || 0) *
                            (Number(project?.incidencia_energia) || 0)
                    }, 0
                );

                console.log("totalAmountFinalEn", totalAmountFinalEn)

                // const actividadMontos = aArrayAcc.reduce(
                //     (sum, item) =>
                //     sum +
                //     (Number(item?.value) || 0) *
                //         (Number(project?.driver_actividad) || 0) *
                //         (Number(project?.incidencia_actividad) || 0),
                //     0
                // );

                const actividadMontos = qArray.reduce(
                    (sum, item, index) => {

                        // console.log("sum", sum)
                        // console.log("item", item)
                        totalAmountFinalAct.push(sum + getMontoActividad(project, versionKey, item, index))

                        return sum + getMontoActividad(project, versionKey, item, index);
                    },
                    0
                );

                // totalAmountFinalAct.push(actividadMontos)

                // console.log("actividadMontos", actividadMontos);

                if (!acc[key].versiones[versionKey]) {
                    acc[key].versiones[versionKey] = {
                        energiaQs: 0,
                        energiaMontos: 0,
                        actividadQs: 0,
                        actividadMontos: 0,
                        totalQs: 0,
                        totalMontos: 0
                    };
                }

                // console.log("totalAmountFinalAct", totalAmountFinalAct)

                acc[key].versiones[versionKey].energiaQs += totalQs;
                // acc[key].versiones[versionKey].energiaMontos += energiaMontos;
                acc[key].versiones[versionKey].energiaMontos += totalAmountFinalEn.slice(0, -1).reduce((s, v) => s + v, 0);

                acc[key].versiones[versionKey].actividadQs += totalQs;
                // acc[key].versiones[versionKey].actividadMontos += actividadMontos;
                acc[key].versiones[versionKey].actividadMontos += totalAmountFinalAct.reduce((s, v) => s + v, 0);

                acc[key].versiones[versionKey].totalQs += totalQs;
                // acc[key].versiones[versionKey].totalMontos += energiaMontos + actividadMontos;
                acc[key].versiones[versionKey].totalMontos += totalAmountFinalEn.reduce((s, v) => s + v, 0) + totalAmountFinalAct.reduce((s, v) => s + v, 0);
            });

            acc[key].registros += 1;

            return acc;
        }, {})
    );

    const allVersionKeys = sortVersionKeys([
        ...new Set(
            opexEstimacion.flatMap((project) =>
            // Object.keys(project?.q_mensuales || {}).filter((k) => /^q_(plan|210|v\d+)$/.test(k))
            Object.keys(project?.q_mensuales || {}).filter((k) => /^q_(plan|210|57|v\d+)$/.test(k))
            )
        )
    ]);

    console.log("GROUPED", grouped)
    // console.log("ALL VERSION KEYS", allVersionKeys)

    return (
        <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table className="min-w-max">
                <TableHeader>
                    {/* Fila superior: grupos por versión */}
                    <TableRow className="border-b bg-white hover:bg-white">
                    <TableHead
                        rowSpan={2}
                        className="sticky left-0 z-30 min-w-[110px] bg-white align-middle font-semibold text-slate-800 border-r"
                    >
                        Tipo
                    </TableHead>

                    <TableHead
                        rowSpan={2}
                        className="sticky left-[110px] z-30 min-w-[220px] bg-white align-middle font-semibold text-slate-800 border-r"
                    >
                        Proyecto
                    </TableHead>

                    {allVersionKeys.map((versionKey, index) => (
                        <TableHead
                        key={`group-${versionKey}`}
                        colSpan={3}
                        className={`text-center font-bold text-sm border-l border-b ${getVersionHeaderClass(versionKey, index)}`}
                        >
                        {getVersionLabel(versionKey)}
                        </TableHead>
                    ))}
                    </TableRow>

                    {/* Fila inferior: subcolumnas */}
                    <TableRow className="border-b hover:bg-transparent">
                    {allVersionKeys.map((versionKey, index) => (
                        <>
                        <TableHead
                            className={`text-center font-semibold text-xs min-w-[90px] border-l ${getVersionSubHeaderClass(versionKey, index)}`}
                        >
                            Q Total
                        </TableHead>
                        <TableHead
                            className={`text-center font-semibold text-xs min-w-[130px] ${getVersionSubHeaderClass(versionKey, index)}`}
                        >
                            Actividad
                        </TableHead>
                        <TableHead
                            className={`text-center font-semibold text-xs min-w-[130px] ${getVersionSubHeaderClass(versionKey, index)}`}
                        >
                            Energía
                        </TableHead>
                        </>
                    ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {grouped.map((project, rowIndex) => (
                    <TableRow
                        key={`${project.tipo}-${project.proyecto}`}
                        className={rowIndex % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"}
                    >
                        <TableCell className="sticky left-0 z-20 bg-inherit border-r font-semibold text-sm text-slate-800">
                        {project.tipo}
                        </TableCell>

                        <TableCell className="sticky left-[110px] z-20 bg-inherit border-r font-medium text-slate-900">
                        {project.proyecto}
                        </TableCell>

                        {allVersionKeys.map((versionKey) => {
                        const version = project.versiones?.[versionKey];

                        return (
                            <>
                            <TableCell className="text-right border-l font-semibold text-slate-800">
                                {Number(version?.totalQs || 0).toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                                })}
                            </TableCell>

                            <TableCell className="text-right text-slate-700">
                                {formatCurrency(Number(version?.actividadMontos || 0))}
                            </TableCell>

                            <TableCell className="text-right text-slate-700">
                                {formatCurrency(Number(version?.energiaMontos || 0))}
                            </TableCell>
                            </>
                        );
                        })}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </Card>
    );
}