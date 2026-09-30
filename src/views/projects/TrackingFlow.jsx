import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    ArrowLeft,
    Calendar,
    GitBranch,
    Loader2,
    MonitorCheck,
    StopCircle,
    Workflow as WorkflowIcon
} from "lucide-react"

import {
    Link
} from "react-router-dom"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useOptionsFilter } from "@/hooks/useOptionsFilter"


import { useTrackingFlow } from "@/hooks/projects/wf/useTrackingFlow"
import { getTrackingOptions } from "@/services/getOptionsFilters"



export default function TrackingFlow() {

    const {
        filterOptions
    } = useOptionsFilter({
        request: getTrackingOptions,
        debugName: "getTrackingOptions"
    })

    console.log("filterOptions", filterOptions)

    /*
     * =========================================================
     * FILTERS
     * =========================================================
     */
    const [workflowCode, setWorkflowCode] = useState("")
    const [workflowVersion, setWorkflowVersion] = useState("")

    /*
     * Seleccionamos automáticamente el primer workflow.
     */
    useEffect(() => {

        if (workflowCode || !filterOptions.workflow_code?.length) return

        setWorkflowCode(
            getOptionValue(filterOptions.workflow_code[0])
        )

    }, [
        filterOptions.workflow_code,
        workflowCode
    ])

    /*
     * Cuando cambia Workflow:
     * limpiamos versión.
     *
     * Si tu filter-options depende del workflow seleccionado
     * luego podemos hacer que useOptionsFilter reciba params.
     */
    useEffect(() => {
        setWorkflowVersion("")
    }, [workflowCode])

    /*
     * Seleccionamos primera versión disponible.
     */
    useEffect(() => {

        if (workflowVersion || !filterOptions.workflow_version?.length) return

        setWorkflowVersion(
            getOptionValue(filterOptions.workflow_version[0])
        )

    }, [
        filterOptions.workflow_version,
        workflowVersion
    ])

    /*
     * =========================================================
     * FLOW
     * =========================================================
     */
    const {
        workflow,
        counts,
        totalSites,
        loading,
        error
    } = useTrackingFlow({
        workflow_code: workflowCode,
        workflow_version: workflowVersion,
        enabled: !!workflowCode
    })


    const nodes = workflow?.nodes || []
    const edges = workflow?.edges || []

    /*
     * =========================================================
     * GRAPH SIZE
     * =========================================================
     */
    const graphSize =
        useMemo(() => {

            if (!nodes.length) {
                return {
                    width: 1100,
                    height: 420
                }
            }

            const maxX = Math.max(...nodes.map(node => Number(node.position?.x || 0)))
            const maxY = Math.max(...nodes.map(node => Number(node.position?.y || 0)))

            return {
                width: Math.max(1100, maxX + 320),
                height: Math.max(420, maxY + 220)
            }

        }, [nodes])


    const graphBounds =
    useMemo(() => {

        if (!nodes.length) {
            return {
                width: 1100,
                height: 520,
                offsetX: 80,
                offsetY: 60
            }
        }

        const positions =
            nodes.map(node => ({
                x: Number(
                    node.position?.x ||
                    0
                ),
                y: Number(
                    node.position?.y ||
                    0
                )
            }))

        const minX =
            Math.min(
                ...positions.map(
                    item => item.x
                )
            )

        const minY =
            Math.min(
                ...positions.map(
                    item => item.y
                )
            )

        const maxX =
            Math.max(
                ...positions.map(
                    item => item.x
                )
            )

        const maxY =
            Math.max(
                ...positions.map(
                    item => item.y
                )
            )

        const paddingX = 100
        const paddingY = 80

        return {
            width:
                Math.max(
                    1100,
                    maxX -
                    minX +
                    420 +
                    paddingX * 2
                ),

            height:
                Math.max(
                    520,
                    maxY -
                    minY +
                    220 +
                    paddingY * 2
                ),

            offsetX:
                paddingX -
                minX,

            offsetY:
                paddingY -
                minY
        }

    }, [nodes])
    

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                {/* =================================================
                    NAV TABS
                ================================================= */}
                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                {/* TRACKING */}
                                <div>
                                    <Link
                                        to="/projects/tracking"
                                        className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent"
                                    >
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <MonitorCheck />
                                            Tracking
                                        </div>
                                    </Link>
                                </div>

                                {/* FLOW ACTIVE */}
                                <div>
                                    <Link
                                        aria-current="page"
                                        to="/projects/tracking/flow"
                                        className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]"
                                    >
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <WorkflowIcon />
                                            Flujo
                                        </div>
                                    </Link>
                                </div>
                                {/* MONTHLY */}
                                <div>
                                    <Link
                                        to="/projects/tracking/monthly"
                                        className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent"
                                    >
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Calendar />
                                            Plan Mensual
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/projects/tracking/standby" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <StopCircle /> Stand By
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    BREADCRUMB / TITLE
                ================================================= */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/projects"
                            title="Atrás"
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-semibold text-[#2b7fff]">
                                Flujo de Tracking
                            </h2>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    MAIN
                ================================================= */}
                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">
                                        {/* =================================================
                                            TOOLBAR
                                        ================================================= */}
                                        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
                                            {/* LEFT FILTERS */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {/* WORKFLOW */}
                                                <div className="min-w-[220px]">
                                                    <label className="mb-2 block text-xs font-medium text-slate-500">
                                                        Workflow
                                                    </label>
                                                    <Select
                                                        value={workflowCode}
                                                        onValueChange={setWorkflowCode}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Seleccionar workflow" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(filterOptions.workflow_code || [])
                                                                .map(
                                                                    option => (
                                                                        <SelectItem
                                                                            key={getOptionValue(option)}
                                                                            value={getOptionValue(option)}
                                                                        >
                                                                            {getOptionLabel(option)}
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* VERSION */}
                                                <div className="min-w-[150px]">
                                                    <label className="mb-2 block text-xs font-medium text-slate-500">
                                                        Versión
                                                    </label>
                                                    <Select
                                                        value={workflowVersion}
                                                        onValueChange={setWorkflowVersion}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <div className="flex items-center gap-2">
                                                                <GitBranch className="h-4 w-4 text-slate-400" />
                                                                <SelectValue placeholder="Versión" />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(filterOptions.workflow_version || [])
                                                                .map(
                                                                    option => (
                                                                        <SelectItem
                                                                            key={getOptionValue(option)}
                                                                            value={getOptionValue(option)}
                                                                        >
                                                                            {getVersionLabel(option)}
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* TOTAL */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">
                                                    Total sitios
                                                </span>
                                                <div className="flex min-w-[44px] h-9 items-center justify-center rounded-xl bg-blue-50 px-3 font-semibold text-[#2b7fff]">
                                                    {totalSites || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* =================================================
                                            FLOW CARD
                                        ================================================= */}
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            {/* FLOW HEADER */}
                                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                                <div>
                                                    <div className="font-semibold text-slate-700">
                                                        Flujo del workflow
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        El contador azul representa los sitios actualmente activos en cada TASK.
                                                    </div>
                                                </div>
                                                {workflowCode && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-blue-200 bg-blue-50 text-blue-700"
                                                    >
                                                        {workflowCode}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* =================================================
                                                LOADING
                                            ================================================= */}
                                            {loading ? (
                                                <FlowLoading />
                                            ) : error ? (
                                                <div className="flex min-h-[420px] items-center justify-center text-sm text-red-500">
                                                    No se pudo cargar el flujo.
                                                </div>
                                            ) : !workflowCode ? (
                                                <div className="flex min-h-[420px] items-center justify-center text-sm text-muted-foreground">
                                                    Seleccione un workflow.
                                                </div>
                                            ) : nodes.length === 0 ? (
                                                <div className="flex min-h-[420px] items-center justify-center text-sm text-muted-foreground">
                                                    El workflow no tiene nodos configurados.
                                                </div>
                                            ) : (

                                                /*
                                                 * =================================================
                                                 * GRAPH
                                                 * =================================================
                                                 */
                                                <div
                                                    className="
                                                        max-h-[720px]
                                                        overflow-auto
                                                        overscroll-contain
                                                        bg-slate-50/20
                                                    "
                                                >
                                                    <div
                                                        className="relative"
                                                        style={{
                                                            // width: graphSize.width,
                                                            // height: graphSize.height,
                                                            width: graphBounds.width,
                                                            height: graphBounds.height,
                                                            backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
                                                            backgroundSize: "20px 20px"
                                                        }}
                                                    >
                                                        {/* EDGES */}
                                                        <svg
                                                            className="pointer-events-none absolute inset-0"
                                                            // width={graphSize.width}
                                                            // height={graphSize.height}
                                                            width={graphBounds.width}
                                                            height={graphBounds.height}
                                                        >
                                                            <defs>
                                                                <marker
                                                                    id="tracking-arrow"
                                                                    markerWidth="8"
                                                                    markerHeight="8"
                                                                    refX="7"
                                                                    refY="4"
                                                                    orient="auto"
                                                                    markerUnits="strokeWidth"
                                                                >
                                                                    <path
                                                                        d="M0,0 L8,4 L0,8 z"
                                                                        fill="#94a3b8"
                                                                    />
                                                                </marker>
                                                            </defs>
                                                            {edges.map(
                                                                edge => (
                                                                    <FlowEdge
                                                                        key={
                                                                            edge.edge_key ||
                                                                            `${getEdgeSource(edge)}-${getEdgeTarget(edge)}`
                                                                        }
                                                                        edge={edge}
                                                                        nodes={nodes}
                                                                        offsetX={graphBounds.offsetX}
                                                                        offsetY={graphBounds.offsetY}
                                                                    />
                                                                )
                                                            )}
                                                        </svg>

                                                        {/* NODES */}
                                                        {nodes.map(
                                                            node => (
                                                                <FlowNode
                                                                    key={node.node_key}
                                                                    node={node}
                                                                    count={getNodeCount(counts, node)}
                                                                    offsetX={graphBounds.offsetX}
                                                                    offsetY={graphBounds.offsetY}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FlowNode({
    node,
    count,
    offsetX,
    offsetY
}) {

    const x =
        Number(
            node.position?.x ||
            0
        ) + offsetX

    const y =
        Number(
            node.position?.y ||
            0
        ) + offsetY


    /*
     * START
     */

    if (
        node.type === "START"
    ) {

        return (

            <div
                className="absolute flex size-12 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-[9px] font-semibold text-blue-600 shadow-sm"
                style={{
                    left: x,
                    top: y
                }}
            >
                INICIO
            </div>

        )
    }


    /*
     * END
     */

    if (
        node.type === "END"
    ) {

        return (

            <div
                className="absolute flex size-12 items-center justify-center rounded-full border-2 border-slate-400 bg-white text-[9px] font-semibold text-slate-500 shadow-sm"
                style={{
                    left: x,
                    top: y
                }}
            >
                FIN
            </div>

        )
    }


    /*
     * GATEWAY
     */

    if (
        node.type === "GATEWAY"
    ) {

        return (

            <div
                className="absolute flex size-11 rotate-45 items-center justify-center rounded-md border-2 border-amber-300 bg-amber-50 shadow-sm"
                style={{
                    left: x,
                    top: y
                }}
            >

                <div className="-rotate-45 text-base font-semibold text-amber-600">

                    {
                        getGatewaySymbol(
                            node.gateway_type
                        )
                    }

                </div>

            </div>

        )
    }


    /*
     * TASK
     */

    const active =
        count.ACTIVE ||
        0

    const completed =
        count.COMPLETED ||
        0

    const cancelled =
        count.CANCELLED ||
        0


    return (

        <div
            className="absolute w-[190px] rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm"
            style={{
                left: x,
                top: y
            }}
        >

            <div className="flex items-start justify-between gap-2">

                <div className="min-w-0">

                    <div
                        className="truncate text-sm font-semibold text-slate-700"
                        title={
                            node.label ||
                            node.task_name ||
                            node.task_code
                        }
                    >
                        {
                            node.label ||
                            node.task_name ||
                            node.task_code ||
                            "TASK"
                        }
                    </div>


                    {node.task_code && (

                        <div className="mt-0.5 text-[10px] text-slate-400">
                            {
                                node.task_code
                            }
                        </div>

                    )}

                </div>


                {/* ACTIVE COUNT */}

                <div className="flex size-8 flex-none items-center justify-center rounded-full bg-[#2b7fff] text-xs font-semibold text-white">

                    {
                        active
                    }

                </div>

            </div>


            <div className="mt-3 flex items-center gap-3 text-[10px]">

                <div>

                    <span className="text-slate-400">
                        Activos
                    </span>

                    <span className="ml-1 font-semibold text-blue-600">
                        {
                            active
                        }
                    </span>

                </div>


                <div>

                    <span className="text-slate-400">
                        Completados
                    </span>

                    <span className="ml-1 font-semibold text-emerald-600">
                        {
                            completed
                        }
                    </span>

                </div>


                {cancelled > 0 && (

                    <div>

                        <span className="text-slate-400">
                            Cancel.
                        </span>

                        <span className="ml-1 font-semibold text-red-500">
                            {
                                cancelled
                            }
                        </span>

                    </div>

                )}

            </div>

        </div>

    )
}


/*
 * =========================================================
 * EDGE
 * =========================================================
 */

function FlowEdge({
    edge,
    nodes,
    offsetX = 0,
    offsetY = 0
}) {

    const sourceKey =
        getEdgeSource(
            edge
        )

    const targetKey =
        getEdgeTarget(
            edge
        )


    const source =
        nodes.find(
            node =>
                node.node_key ===
                sourceKey
        )

    const target =
        nodes.find(
            node =>
                node.node_key ===
                targetKey
        )


    if (
        !source ||
        !target
    ) {
        return null
    }


    const from =
        getNodeCenter(
            source,
            offsetX,
            offsetY
        )

    const to =
        getNodeCenter(
            target,
            offsetX,
            offsetY
        )


    /*
     * Línea quebrada:
     *
     * source ----+
     *            |
     *            +---- target
     */

    const middleX =
        (
            from.x +
            to.x
        ) / 2


    const path =
        `
        M ${from.x} ${from.y}
        L ${middleX} ${from.y}
        L ${middleX} ${to.y}
        L ${to.x} ${to.y}
        `


    return (

        <path
            d={
                path
            }
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#tracking-arrow)"
        />

    )
}


/*
 * =========================================================
 * LOADING
 * =========================================================
 */

function FlowLoading() {
    return (
        <div className="min-h-[420px] p-8">
            <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">
                    Cargando flujo...
                </span>
            </div>
            <div className="mt-10 flex gap-16">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-24 w-[190px] rounded-xl" />
                <Skeleton className="h-24 w-[190px] rounded-xl" />
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        </div>
    )
}

/*
 * =========================================================
 * COUNTS
 * =========================================================
 */
function getNodeCount(counts, node) {

    if (!counts) {
        return {}
    }

    /*
     * Puede venir como:
     *
     * {
     *   "T-0001": {
     *      ACTIVE: 3
     *   }
     * }
     */
    if (
        node.task_code &&
        counts[node.task_code]
    ) {
        return counts[node.task_code]
    }

    /*
     * O eventualmente por node_key.
     */
    if (
        node.node_key &&
        counts[node.node_key]
    ) {
        return counts[node.node_key]
    }

    return {}
}

/*
 * =========================================================
 * NODE POSITION
 * =========================================================
 */
function getNodeCenter(
    node,
    offsetX = 0,
    offsetY = 0
) {
    const x = Number(node.position?.x || 0) + offsetX
    const y = Number(node.position?.y || 0) + offsetY

    if (node.type === "TASK") {
        return {
            x: x + 95,
            y: y + 45
        }
    }

    if (node.type === "GATEWAY") {
        return {
            x: x + 22,
            y: y + 22
        }
    }

    return {
        x: x + 24,
        y: y + 24
    }
}


/*
 * =========================================================
 * EDGE HELPERS
 * =========================================================
 */

function getEdgeSource(edge) {
    return (
        edge.source ||
        edge.from ||
        edge.source_node_key ||
        ""
    )
}


function getEdgeTarget(edge) {
    return (
        edge.target ||
        edge.to ||
        edge.target_node_key ||
        ""
    )
}


/*
 * =========================================================
 * GATEWAY
 * =========================================================
 */

function getGatewaySymbol(type) {
    switch (type) {
        case "PARALLEL_SPLIT":
        case "PARALLEL_JOIN": return "+"
        case "EXCLUSIVE": return "×"
        default: return "◇"
    }
}


/*
 * =========================================================
 * FILTER OPTIONS
 * =========================================================
 */

function getOptionValue(option) {

    if (option === null || option === undefined) {
        return ""
    }

    if (typeof option === "object") {
        return String(
            option.value ??
            option.id ??
            option.code ??
            ""
        )
    }

    return String(option)
}


function getOptionLabel(option) {

    if (option === null || option === undefined) {
        return ""
    }


    if (typeof option === "object") {

        return String(
            option.label ??
            option.name ??
            option.value ??
            option.code ??
            ""
        )
    }

    return String(option)
}


function getVersionLabel(
    option
) {

    const value = getOptionLabel(option)

    if (!value) return

    if (String(value).toLowerCase().startsWith("v")) {
        return value
    }

    return `v${value}`
}