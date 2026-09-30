import {
    Check,
    Circle,
    X,
    AlertTriangle,
    Play,
    Flag,
    Loader2
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useSiteJourney } from "@/hooks/projects/wf/useSiteJourney"


function edgeSource(edge) {
    return (
        edge.from ||
        edge.source ||
        edge.source_node_key
    )
}

function edgeTarget(edge) {
    return (
        edge.to ||
        edge.target ||
        edge.target_node_key
    )
}

function getNodeKey(node) {
    return (
        node.node_key ||
        node.id
    )
}


function buildJourneyStages({
    nodes = [],
    edges = [],
    runtime = []
}) {

    const nodeMap =
        new Map(
            nodes.map(node => [
                getNodeKey(node),
                node
            ])
        )

    const runtimeMap =
        new Map(
            runtime.map(node => [
                node.node_key,
                node
            ])
        )

    const getOutgoing =
        nodeKey =>
            edges.filter(
                edge =>
                    edgeSource(edge) ===
                    nodeKey
            )

    const stages = []

    const startNode =
        nodes.find(
            node =>
                node.type === "START"
        )

    if (!startNode) {
        return stages
    }

    stages.push({
        type: "START",
        key: getNodeKey(startNode)
    })

    let currentNode = startNode
    const visited = new Set()

    while (currentNode) {

        const currentKey =
            getNodeKey(currentNode)

        if (
            visited.has(currentKey)
        ) {
            break
        }

        visited.add(currentKey)

        const outgoing =
            getOutgoing(currentKey)

        if (!outgoing.length) {
            break
        }

        const targets =
            outgoing
                .map(edge =>
                    nodeMap.get(
                        edgeTarget(edge)
                    )
                )
                .filter(Boolean)


        /*
         * PARALLEL SPLIT
         */
        const split =
            targets.find(
                node =>
                    node.type === "GATEWAY" &&
                    node.gateway_type ===
                        "PARALLEL_SPLIT"
            )

        if (split) {

            const splitKey =
                getNodeKey(split)

            const parallelTasks =
                getOutgoing(splitKey)
                    .map(edge =>
                        nodeMap.get(
                            edgeTarget(edge)
                        )
                    )
                    .filter(
                        node =>
                            node?.type ===
                            "TASK"
                    )


            stages.push({
                type: "PARALLEL",
                key: splitKey,
                tasks:
                    parallelTasks.map(
                        taskNode => {
                            const runtimeNode = runtimeMap.get(getNodeKey(taskNode))
                            return {
                                node_key: getNodeKey(taskNode),
                                task_code: runtimeNode?.task_code || taskNode.task_code,
                                task_name: runtimeNode?.task_name || taskNode.label || taskNode.task_code,
                                status: runtimeNode?.status || "NOT_REACHED",
                                forecast: runtimeNode?.forecast || null
                            }
                        }
                    )
            })

            /*
             * Buscar JOIN común
             */
            const join =
                parallelTasks
                    .flatMap(
                        taskNode =>
                            getOutgoing(
                                getNodeKey(
                                    taskNode
                                )
                            )
                                .map(edge =>
                                    nodeMap.get(
                                        edgeTarget(edge)
                                    )
                                )
                    )
                    .find(
                        node =>
                            node?.type === "GATEWAY" &&
                            node.gateway_type === "PARALLEL_JOIN"
                    )


            if (!join) {
                break
            }

            currentNode = join

            continue
        }

        /*
         * TASK SIMPLE
         */
        const taskNode = targets.find(node => node.type === "TASK")

        if (taskNode) {
            const runtimeNode = runtimeMap.get(getNodeKey(taskNode))

            stages.push({
                type: "TASK",
                key: getNodeKey(taskNode),
                task: {
                    node_key: getNodeKey(taskNode),
                    task_code: runtimeNode?.task_code || taskNode.task_code,
                    task_name: runtimeNode?.task_name || taskNode.label || taskNode.task_code,
                    status: runtimeNode?.status || "NOT_REACHED",
                    forecast: runtimeNode?.forecast || null
                }
            })
            currentNode = taskNode
            continue
        }


        /*
         * END
         */
        const endNode = targets.find(node => node.type === "END")

        if (endNode) {
            stages.push({
                type: "END",
                key: getNodeKey(endNode)
            })

            break
        }

        /*
         * Gateway intermedio.
         */
        currentNode = targets[0] || null
    }

    return stages
}


function JourneyTaskCard({
    task
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-700">
                        {task.task_name}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                        {task.task_code}
                    </div>
                </div>
                <TaskStatusBadge
                    status={task.status}
                />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    Forecast
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                    {formatDate(
                        task.forecast
                            ?.current_date
                    )}
                </div>
            </div>
        </div>
    )
}


function JourneyEndpoint({
    type
}) {
    const isStart = type === "START"

    return (
        <div className="flex flex-col items-center">
            <div
                className={[
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    isStart
                        ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                        : "border-red-300 bg-red-50 text-red-500"
                ].join(" ")}
            >
                {isStart ? (
                    <Play className="h-4 w-4" />
                ) : (
                    <Flag className="h-4 w-4" />
                )}
            </div>
            <div className="mt-2 text-xs font-medium text-slate-600">
                {isStart
                    ? "Inicio"
                    : "Fin"
                }
            </div>
        </div>
    )
}


function ParallelStage({
    tasks
}) {

    return (
        <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-5">

            <div className="mb-4 flex items-center justify-between">

                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ejecución en paralelo
                </div>

                <Badge
                    variant="outline"
                    className="border-blue-200 bg-white text-blue-600"
                >
                    {tasks.length} TASK
                </Badge>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {tasks.map(
                    task => (
                        <JourneyTaskCard
                            key={
                                task.node_key
                            }
                            task={
                                task
                            }
                        />
                    )
                )}

            </div>

        </div>
    )
}

function formatDate(value) {

    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date)
}




function TaskStatusBadge({
    status
}) {

    const config = {
        ACTIVE: [
            "En curso",
            "border-blue-200 bg-blue-50 text-blue-700"
        ],
        COMPLETED: [
            "Completada",
            "border-emerald-200 bg-emerald-50 text-emerald-700"
        ],
        NOT_REACHED: [
            "Pendiente",
            "border-slate-200 bg-slate-50 text-slate-500"
        ],
        CANCELLED: [
            "Cancelada",
            "border-red-200 bg-red-50 text-red-600"
        ]
    }

    const [
        label,
        className
    ] =
        config[status] ||
        [
            status || "-",
            "border-slate-200 bg-slate-50 text-slate-500"
        ]

    return (
        <Badge
            variant="outline"
            className={`text-[10px] ${className}`}
        >
            {label}
        </Badge>
    )
}


function JourneySummary({
    label,
    value
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="mt-1 text-lg font-semibold text-[#31577e]">
                {value}
            </div>
        </div>
    )
}


function LegendItem({
    label,
    className
}) {
    return (
        <div className="flex items-center gap-2">
            <div
                className={`h-3 w-3 rounded-full border-2 ${className}`}
            />
            {label}
        </div>
    )
}



export default function SiteJourney({
    instanceId
}) {

    const {
        workflow,
        runtime,
        loading,
        error,
        reload
    } = useSiteJourney(instanceId, true)

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando recorrido...
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                No se pudo cargar el viaje del sitio.
            </div>
        )
    }

    const runtimeMap =
        new Map(
            (runtime || []).map(node => [
                node.node_key,
                node
            ])
        )

    const nodes = workflow?.nodes || []

    if (!nodes.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <div className="text-sm font-medium text-slate-500">
                    Sin información de recorrido
                </div>
            </div>
        )
    }

    const stages = buildJourneyStages({
        nodes: workflow?.nodes || [],
        edges: workflow?.edges || [],
        runtime: runtime || []
    })


    return (
        <div className="space-y-6">
            {/* =================================================
                SUMMARY
            ================================================= */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <JourneySummary
                    label="Total TASK"
                    value={runtime.filter(x => x.task_code).length}
                />
                <JourneySummary
                    label="Completadas"
                    value={
                        runtime.filter(x => x.status === "COMPLETED").length
                    }
                />
                <JourneySummary
                    label="En curso"
                    value={
                        runtime.filter(x => x.status === "ACTIVE").length
                    }
                />
                <JourneySummary
                    label="Pendientes"
                    value={
                        runtime.filter(x => x.status === "NOT_REACHED").length
                    }
                />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-6">
                <div className="mx-auto max-w-6xl space-y-3">
                    {stages.map(
                        stage => {

                            if (stage.type === "START") {
                                return (
                                    <JourneyEndpoint
                                        key={stage.key}
                                        type="START"
                                    />
                                )
                            }


                            if (stage.type === "PARALLEL") {
                                return (
                                    <div
                                        key={stage.key}
                                        className="space-y-3"
                                    >
                                        <div className="mx-auto h-7 w-px bg-slate-300" />
                                        <ParallelStage
                                            tasks={stage.tasks}
                                        />
                                    </div>
                                )
                            }


                            if (stage.type === "TASK") {

                                return (
                                    <div
                                        key={stage.key}
                                        className="space-y-3"
                                    >

                                        <div className="mx-auto h-7 w-px bg-slate-300" />
                                        <div className="mx-auto max-w-sm">
                                            <JourneyTaskCard
                                                task={stage.task}
                                            />
                                        </div>
                                    </div>
                                )
                            }


                            if (stage.type === "END") {
                                return (
                                    <div
                                        key={stage.key}
                                        className="space-y-3"
                                    >
                                        <div className="mx-auto h-7 w-px bg-slate-300" />
                                        <JourneyEndpoint
                                            type="END"
                                        />
                                    </div>
                                )
                            }

                            return null
                        }
                    )}
                </div>
            </div>
        </div>
    )
}