import { useEffect, useMemo, useState } from 'react';
// import { MONTHS } from '@/lib/types';
// import { useEstimations } from '@/lib/use-estimations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEstimations } from '@/hooks/budget/capex/useEstimations';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import { Label } from '../ui/label';
import { toast } from 'wc-toast';
import { formatCurrency } from '@/lib/helpers';
import { MONTOS_FIJOS_ACTIVIDAD } from '@/constants/montos_fijos_opex';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// const getVersionLabel = (versionKey) => {
//     if (versionKey === "q_plan") return "PLAN";
//     const match = versionKey.match(/^q_v(\d+)$/);
//     if (match) return `V${match[1]}`;
//     return versionKey.toUpperCase();
// };  

const getVersionLabel = (key) => {
    if (key === "q_plan") return "Plan";
    if (key === "q_210") return "FCST 2+10";
    if (key === "q_57") return "FCST 5+7";
    const match = key.match(/^q_v(\d+)$/);
    if (match) return `V${match[1]}`;
    return key;
};

const initializeEstimations = (data, qmes) => {
    return data.flatMap(project => {

        console.log("project", project)


        const calculateMontosAct = (qs, project, qmes) => { 
            // return qs.map(q => q * project.driver_actividad * project.incidencia_actividad);

            const montosFijos =
                MONTOS_FIJOS_ACTIVIDAD[String(project._id)]?.[qmes] ?? [];

            return qs.map((q, index) => {
                const montoFijo = montosFijos[index];

                if (montoFijo !== null && montoFijo !== undefined) {
                    return Number(montoFijo);
                }

                return (
                    Number(q ?? 0) *
                    Number(project.driver_actividad ?? 0) *
                    Number(project.incidencia_actividad ?? 0)
                );
            });

        };

        const calculateMontosEne = (qs, project) => {
            return qs.map(q => q * project.driver_energia * project.incidencia_energia);
        };

        

        // console.log("qE", qsEnergia)
        const qs = project?.q_mensuales[qmes].map(q => q.value)

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
                montos: calculateMontosAct(qs, project, qmes),
            }
        ];
    });
};


const DEFAULT_HEADERS = [
    "Ene Plan Q",
    "Feb Plan Q",
    "Mar Plan Q",
    "Abr Plan Q",
    "May Plan Q",
    "Jun Plan Q",
    "Jul Plan Q",
    "Ago Plan Q",
    "Set Plan Q",
    "Oct Plan Q",
    "Nov Plan Q",
    "Dic Plan Q"
];


const parseNumber = (value) => {
    if (value === "" || value === null || value === undefined) return 0;
    const normalized = String(value).replace(",", ".").trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
};

const getMaxExistingVersion = (projects = []) => {
    let max = 0;

    for (const project of projects) {
        const keys = Object.keys(project?.q_mensuales || {});
        for (const key of keys) {
        const match = key.match(/^q_v(\d+)$/);
        if (match) {
            const version = Number(match[1]);
            if (!Number.isNaN(version) && version > max) {
            max = version;
            }
        }
        }
    }

    return max;
};

const getLatestVersionKey = (project) => {
    const qMensuales = project?.q_mensuales || {};
    const versionKeys = Object.keys(qMensuales)
        .map((key) => {
        const match = key.match(/^q_v(\d+)$/);
        return match ? { key, version: Number(match[1]) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.version - a.version);

    if (versionKeys.length > 0) return versionKeys[0].key;
    return "q_plan";
};

const getHeadersFromProject = (project) => {
    const base = project?.q_mensuales?.q_plan || [];
    return DEFAULT_HEADERS.map((defaultHeader, index) => base[index]?.header || defaultHeader);
};

const buildMontosActividad = (project, qs = []) => {
    const factor =
        parseNumber(project?.driver_actividad) * parseNumber(project?.incidencia_actividad);

    return Array.from({ length: 12 }, (_, index) => {
        const q = parseNumber(qs[index]);
        return q * factor;
    });
};

const initializeEstimationsForm = (projects = []) => {
    return projects.map((project) => {
        const latestKey = getLatestVersionKey(project);
        const source = project?.q_mensuales?.[latestKey] || project?.q_mensuales?.q_plan || [];

        const qs = Array.from({ length: 12 }, (_, index) => parseNumber(source[index]?.value));

        return {
            projectId: project._id,
            type: "actividad",
            qs,
            montos: buildMontosActividad(project, qs),
        };
    });
};


function FormNewEstimation({ opexEstimacion, addEstimation }) {

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [estimaciones, setEstimaciones] = useState(() => initializeEstimationsForm(opexEstimacion));
    const [selectedCell, setSelectedCell] = useState(null);

    useEffect(() => {
        if (open) {
            setEstimaciones(initializeEstimationsForm(opexEstimacion));
            setError(null);
            setSelectedCell(null);
        }
    }, [open, opexEstimacion]);

    const projectMap = useMemo(() => {
        return new Map(opexEstimacion.map((project) => [project._id, project]));
    }, [opexEstimacion]);

    const estimationMap = useMemo(() => {
        return new Map(estimaciones.map((est) => [est.projectId, est]));
    }, [estimaciones]);

    const nextVersionPreview = useMemo(() => {
        const maxVersion = getMaxExistingVersion(opexEstimacion);
        return `q_v${maxVersion + 1}`;
    }, [opexEstimacion]);

    const handleQsChange = (projectId, monthIndex, rawValue) => {
        setEstimaciones((prev) =>
        prev.map((est) => {
            if (est.projectId !== projectId || est.type !== "actividad") return est;

            const project = projectMap.get(projectId);
            const qs = [...est.qs];
            qs[monthIndex] = rawValue === "" ? 0 : parseNumber(rawValue);

            return {
            ...est,
            qs,
            montos: buildMontosActividad(project, qs),
            };
        })
        );
    };

    const handleSingleCellPaste = (projectId, monthIndex, text) => {
        const value = parseNumber(text);
        handleQsChange(projectId, monthIndex, value);
    };

    const handlePasteRange = (text) => {
        if (!selectedCell) return;

        const rows = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((row) => row.trim() !== "")
        .map((row) => row.split("\t"));

        if (!rows.length) return;

        const startRowIndex = opexEstimacion.findIndex((p) => p._id === selectedCell.projectId);
        if (startRowIndex === -1) return;

        setEstimaciones((prev) => {
        const next = prev.map((est) => ({
            ...est,
            qs: [...est.qs],
            montos: [...est.montos],
        }));

        const nextMap = new Map(next.map((est) => [est.projectId, est]));

        rows.forEach((cols, rowOffset) => {
            const project = opexEstimacion[startRowIndex + rowOffset];
            if (!project) return;

            const est = nextMap.get(project._id);
            if (!est) return;

            cols.forEach((cellValue, colOffset) => {
            const monthIndex = selectedCell.monthIndex + colOffset;
            if (monthIndex < 0 || monthIndex > 11) return;

            est.qs[monthIndex] = parseNumber(cellValue);
            });

            est.montos = buildMontosActividad(project, est.qs);
        });

        return next;
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const fd = new FormData();

        try {
            const payload = opexEstimacion.map((project) => {
                const estimation = estimationMap.get(project._id);
                const headers = getHeadersFromProject(project);

                return {
                    _id: project._id,
                    q_values: Array.from({ length: 12 }, (_, index) => ({
                        header: headers[index],
                        value: parseNumber(estimation?.qs?.[index]),
                    })),
                };
            });

            // console.log("PAYLOAD", payload)
            // fd.append("projects", JSON.stringify(payload));



            const res = await addEstimation(payload)

            if (res.result !== "OK") {
                throw new Error(res.message || "No se pudo crear la nueva versión");
            }

            // if (typeof onCreated === "function") {
            //     onCreated(data);
            // }

            toast.success("Estimación creada correctamente")

            // const res = await fetch("/api/projects/create-q-version", {
            //     method: "POST",
            //     headers: {
            //     "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({ projects: payload }),
            // });

            // const data = await res.json();

            // if (data.result !== "OK") {
            //     throw new Error(data.message || "No se pudo crear la nueva versión");
            // }

            // if (typeof onCreated === "function") {
            //     onCreated(data);
            // }

            setOpen(false);
        } catch (err) {
            console.error(err);
            setError(err.message || "Ocurrió un error al crear la estimación");
        } finally {
            setLoading(false);
        }
    };

    // const estimaciones = initializeEstimations(opexEstimacion)    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Trigger: botón “+” */}
            <DialogTrigger asChild>
                <Button size="icon" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                    <Plus className="h-6 w-6 text-white" />
                </Button>
            </DialogTrigger>

            {/* Content */}
            <DialogContent className="p-0 sm:max-w-6xl max-h-[85vh] overflow-hidden">
                {/* Header (barra superior como Figura 2) */}
                <DialogHeader className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-sm font-semibold text-blue-500 pb-2">
                                Añadir nueva estimación
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Completa los Qs para añadir nueva estimación
                            </DialogDescription>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">
                            Nueva versión: <span className="text-blue-500">{nextVersionPreview}</span>
                        </div>
                    </div>
                </DialogHeader>

                <Separator />

                {/* Body scrollable */}
                <div className="max-h-[calc(85vh-120px)] overflow-y-auto">
                    <form id="new-project-form" onSubmit={onSubmit} className="px-6 py-5 space-y-6">
                        {/* === PROYECTO === */}
                        <section className="space-y-4">
                            {/* <h3 className="text-[13px] font-semibold text-blue-400">Ticket</h3> */}

                            <Card className="border-0 shadow-sm overflow-hidden w-full">
                                <div 
                                    className="overflow-x-auto"
                                    onPaste={(e) => {
                                        // e.preventDefault();
                                        // const text = e.clipboardData?.getData('text') || '';
                                        // handlePasteRange(text);
                                        if (!selectedCell) return;
                                        e.preventDefault();
                                        const text = e.clipboardData?.getData("text") || "";
                                        handlePasteRange(text);
                                    }}
                                >
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="font-semibold sticky left-0 bg-muted/50 z-10 px-3 py-3 text-left text-sm">Tipo</th>
                                                <th className="font-semibold sticky left-20 bg-muted/50 z-10 px-3 py-3 text-left text-sm">Proyecto</th>
                                                {/* <th className="font-semibold sticky left-48 bg-muted/50 z-10 px-3 py-3 text-center text-sm">Incidencia</th> */}
                                                {/* <th className="font-semibold sticky left-64 bg-muted/50 z-10 px-3 py-3 text-center text-sm">Driver Plan</th> */}
                                                {MONTHS.map(month => (
                                                <th key={month} className="font-semibold text-center text-xs px-1 py-3 min-w-[50px]">
                                                    {month.substring(0, 3)}
                                                </th>
                                                ))}
                                                <th className="font-semibold text-right text-sm px-3 py-3 min-w-[70px]">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {opexEstimacion.map((project) => {
                                                // const estimation = getEstimation(project.id, estimationType);
                                                // if (!estimation) return null;
                                                const estimation = estimationMap.get(project._id);
                                                if (!estimation) return null;

                                                const displayValues = estimation.qs;
                                                const total = displayValues.reduce((a, b) => a + parseNumber(b), 0);

                                                return (
                                                    <tr
                                                        key={project._id}
                                                        className="border-b hover:bg-muted/50 transition-colors"
                                                    >
                                                        {/* {displayValues.map((value, monthIndex) => (
                                                        <td key={monthIndex} className="text-center px-1 py-2 border-l">
                                                            <input
                                                                type="number"
                                                                value={value === 0 ? "" : value}
                                                                onChange={e => handleQsChange(project._id, monthIndex, e.target.value)}
                                                                placeholder="0"
                                                                className="w-full h-8 text-center text-xs p-0.5 font-semibold border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                                                onPaste={(e) => {
                                                                    e.preventDefault();
                                                                    const text = e.clipboardData?.getData("text") || "";
                                                                    handleSingleCellPaste(project._id, monthIndex, text);
                                                                }}
                                                            />
                                                        </td>
                                                        ))} */}

                                                        <td className="font-medium text-sm sticky left-0 bg-background z-10 px-3 py-2 min-w-[110px]">
                                                            {project.tipo}
                                                        </td>

                                                        <td className="font-medium text-sm sticky left-[110px] bg-background z-10 px-3 py-2 min-w-[180px]">
                                                            {project.proyecto}
                                                        </td>

                                                        {displayValues.map((value, monthIndex) => (
                                                        <td key={monthIndex} className="text-center px-1 py-2 border-l">
                                                            <input
                                                            type="number"
                                                            value={value === 0 ? "" : value.toFixed(0)}
                                                            onFocus={() =>
                                                                setSelectedCell({
                                                                projectId: project._id,
                                                                monthIndex,
                                                                type: "actividad",
                                                                })
                                                            }
                                                            onChange={(e) =>
                                                                handleQsChange(project._id, monthIndex, e.target.value)
                                                            }
                                                            placeholder="0"
                                                            className="w-full h-8 text-center text-xs p-0.5 font-semibold border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                                            onPaste={(e) => {
                                                                e.preventDefault();
                                                                const text = e.clipboardData?.getData("text") || "";

                                                                if (text.includes("\t") || text.includes("\n")) {
                                                                setSelectedCell({
                                                                    projectId: project._id,
                                                                    monthIndex,
                                                                    type: "actividad",
                                                                });
                                                                handlePasteRange(text);
                                                                return;
                                                                }

                                                                handleSingleCellPaste(project._id, monthIndex, text);
                                                            }}
                                                            />
                                                        </td>
                                                        ))}

                                                        <td className="text-right font-semibold text-sm px-3 py-2">
                                                            {total.toFixed(0)}
                                                        </td>

                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                        </section>

                        <Separator />
                        {/* Footer inferior */}
                        <DialogFooter className="gap-2 pt-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="cursor-pointer">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            {!loading ? (
                                <Button type="submit" className="gap-2 bg-blue-500 hover:bg-blue-400 cursor-pointer">
                                    <Plus className="h-4 w-4" /> Crear
                                </Button>
                            ) : (
                                <Button disabled type="submit" className="gap-2 bg-blue-500 hover:bg-blue-400 cursor-pointer">
                                    <Spinner className="h-4 w-4" />
                                </Button>
                            )}
                            
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}



export function EstimationDetail() {

    const { opexEstimacion, state, addEstimation, updateEstimation, getEstimation, getProject } = useEstimations();
    const [estimationType, setEstimationType] = useState('actividad');
    const [viewType, setViewType] = useState('qs');
    const [qmes, setQmes] = useState('q_210', 'q_57');
    const [selectedCells, setSelectedCells] = useState(new Set());

    const handleQsChange = (projectId, monthIndex, value) => {
        const estimation = getEstimation(projectId, estimationType);
        if (!estimation) return;

        const newQs = [...estimation.qs];
        newQs[monthIndex] = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
        updateEstimation(projectId, estimationType, newQs);
    };

    const handlePasteRange = (pastedText) => {
        // Parsear el rango pegado desde Excel (puede ser múltiples filas y columnas)
        const lines = pastedText.trim().split('\n');
        const rows = lines.map(line =>
            line.split('\t').map(cell => {
                const trimmed = cell.trim();
                // Si está vacío, considera como 0; si no es número, intenta parsearlo
                if (trimmed === '') return 0;
                const num = parseFloat(trimmed);
                return isNaN(num) ? 0 : Math.max(0, num);
            })
        );

        // Mapear cada fila pegada a un proyecto en orden
        const projectIds = state.projects.map(p => p.id);
        
        rows.forEach((row, rowIndex) => {
            const projectId = projectIds[rowIndex];
            if (!projectId) return;

            const estimation = getEstimation(projectId, estimationType);
            if (!estimation) return;

            const newQs = [...estimation.qs];
            // Pegar hasta 12 valores (meses)
            for (let colIndex = 0; colIndex < Math.min(row.length, 12); colIndex++) {
                newQs[colIndex] = row[colIndex];
            }

            updateEstimation(projectId, estimationType, newQs);
        });
    };

    const handleSingleCellPaste = (projectId, pastedText) => {
        // Para paste en una sola celda, distribuir los valores en los meses
        const values = pastedText
            .split(/[\s\n\t,]+/)
            .map(v => {
                const trimmed = v.trim();
                if (trimmed === '') return 0;
                const num = parseFloat(trimmed);
                return isNaN(num) ? 0 : Math.max(0, num);
            })
            .filter(v => v !== null);

        if (values.length === 0) return;

        const estimation = getEstimation(projectId, estimationType);
        if (!estimation) return;

        const newQs = [...estimation.qs];
        for (let i = 0; i < Math.min(values.length, 12); i++) {
            newQs[i] = values[i];
        }

        updateEstimation(projectId, estimationType, newQs);
    };

    // get available Qs in q_mensuales from opexEstimacion}
    // // q_mensuales = { q_plan: [...], q_v1: [...], q_v2: [...] } ---> get plan, v1, v2, etc...
    const q_mes = useMemo(() => {
        const q = opexEstimacion[0]?.q_mensuales
        if (!q) return []
        return Object.keys(q).map(k => ({ label: k, value: q[k] }))
    }, [opexEstimacion])    

    console.log("OPEXES", opexEstimacion)
    console.log("QMES", q_mes)

    const estimaciones = initializeEstimations(opexEstimacion, qmes)

    // console.log("ESTIMACIONES", estimaciones)

    return (
        <div className="">
            {/* Navs principales */}
            <div className="flex flex-col gap-4 my-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Detalle de Estimaciones</h2>
                    <p className="text-sm text-muted-foreground">Edita los Qs mensuales para cada proyecto</p>
                </div>     
                <FormNewEstimation opexEstimacion={opexEstimacion} addEstimation={addEstimation} />
            </div>

            <Tabs value={qmes} onValueChange={(v) => setQmes(v)} className="w-auto mb-5">
                <TabsList className={"grid grid-cols-" + q_mes.length}>
                    {q_mes.map((q) => (
                        <TabsTrigger key={q.label} value={q.label}>{getVersionLabel(q.label)}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className='flex justify-between'>

                {/* Nav Energía/Actividad */}
                <Tabs value={estimationType} onValueChange={(v) => setEstimationType(v)} className="w-auto">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="energia">Energía</TabsTrigger>
                        <TabsTrigger value="actividad">Actividad</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Nav Qs/Montos */}
                <Tabs value={viewType} onValueChange={(v) => setViewType(v)} className="w-auto">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="qs">Qs</TabsTrigger>
                        <TabsTrigger value="monto">Montos</TabsTrigger>
                    </TabsList>
                </Tabs>

                
            </div>

            {/* Tabla de proyectos y meses */}
            <Card className="border-0 shadow-sm overflow-hidden w-full">
                <div 
                    className="overflow-x-auto"
                    onPaste={viewType === 'qs' ? (e) => {
                        e.preventDefault();
                        const text = e.clipboardData?.getData('text') || '';
                        handlePasteRange(text);
                    } : undefined}
                >
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="font-semibold sticky left-0 bg-muted/50 z-10 px-3 py-3 text-left text-sm">Tipo</th>
                                <th className="font-semibold sticky left-20 bg-muted/50 z-10 px-3 py-3 text-left text-sm">Proyecto</th>
                                <th className="font-semibold sticky left-48 bg-muted/50 z-10 px-3 py-3 text-center text-sm">Incidencia</th>
                                <th className="font-semibold sticky left-64 bg-muted/50 z-10 px-3 py-3 text-center text-sm">Driver Plan</th>
                                {MONTHS.map(month => (
                                    <th key={month} className="font-semibold text-center text-xs px-1 py-3 min-w-[50px]">
                                        {month.substring(0, 3)}
                                    </th>
                                ))}
                                <th className="font-semibold text-right text-sm px-3 py-3 min-w-[70px]">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opexEstimacion.map((project, projectRowIndex) => {
                                // const estimation = getEstimation(project.id, estimationType);
                                // if (!estimation) return null;
                                const arrAcc = []

                                // console.log("estimationType", estimaciones)

                                const estimation = estimaciones.find(est => est.projectId === project._id && est.type === estimationType);
                                
                                if (!estimation) return null;

                                // console.log("ESTIMACION", estimation)

                                if(viewType === 'monto') {
                                    const res = estimation.montos.reduce((acc, val) => {
                                        arrAcc.push(acc + val)
                                        return acc + val
                                    }, 0)
                                }

                                const displayValues = viewType === 'qs' ? estimation.qs : arrAcc;
                                
                                

                                console.log("ARR ACC", arrAcc)
                                const totalFinal = arrAcc.reduce((acc, val) => acc + val, 0)
                                console.log("TOTAL FINAL", totalFinal)

                                const total = displayValues.reduce((a, b) => a + b, 0);
                                const isEditable = viewType === 'qs';

                                // console.log("DISPLAY VALUES", displayValues)

                                return (
                                    <tr
                                        key={project._id}
                                        className="border-b hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="font-medium text-sm sticky left-0 bg-background z-10 px-3 py-2">
                                            {project.tipo}
                                        </td>
                                        <td className="font-medium sticky left-20 bg-background z-10 px-3 py-2 text-sm">
                                            {project.proyecto}
                                        </td>
                                        <td className="text-sm sticky left-48 bg-background z-10 px-3 py-2 text-center">
                                            {estimationType === "energia"
                                                ? (project.incidencia_energia * 100).toFixed(0)
                                                : (project.incidencia_actividad * 100).toFixed(0)
                                            }%
                                            {/* {(project.incidencia_actividad * 100).toFixed(0)}% */}
                                        </td>
                                        <td className="font-semibold text-sm sticky left-64 bg-background z-10 px-3 py-2 text-center">
                                            {estimationType === "actividad"
                                                ? (project.driver_actividad).toFixed(2)
                                                : (project.driver_energia).toFixed(2)
                                            }
                                            {/* {project.driver_actividad.toFixed(0)} */}
                                        </td>

                                        {displayValues.map((value, monthIndex) => (
                                            <td key={monthIndex} className="text-center px-1 py-2 border-l">
                                                {isEditable ? (
                                                <input
                                                    type="number"
                                                    value={value === 0 ? '' : value.toFixed(0)}
                                                    onChange={e => handleQsChange(project.id, monthIndex, e.target.value)}
                                                    placeholder="0"
                                                    className="w-full h-8 text-center text-xs p-0.5 font-semibold border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                                    onPaste={(e) => {
                                                        e.preventDefault();
                                                        const text = e.clipboardData?.getData('text') || '';
                                                        handleSingleCellPaste(project.id, text);
                                                    }}
                                                />
                                                ) : (
                                                <span className="text-xs font-semibold">{formatCurrency(value.toFixed(1))}</span>
                                                )}
                                            </td>
                                        ))}

                                        <td className="text-right font-semibold text-sm px-3 py-2">
                                            {viewType === 'qs' ? total.toFixed(0) : formatCurrency(total.toFixed(2))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Info copy-paste */}
            {viewType === 'qs' && (
                <Card className="border-0 shadow-sm p-4 bg-blue-50 border-l-4 border-blue-400">
                    <p className="text-sm text-blue-900 mb-2">
                        <strong>Tips de Copy-Paste:</strong>
                    </p>
                    <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
                        <li>Pega un rango completo desde Excel (múltiples filas y columnas) y se distribuirá automáticamente en los proyectos y meses</li>
                        <li>También puedes pegar en una sola celda y se distribuirán los valores en los 12 meses de ese proyecto</li>
                        <li>Las celdas vacías se interpretan como 0</li>
                    </ul>
                </Card>
            )}
        </div>
    );
}