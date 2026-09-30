import { useCallback, useEffect, useMemo, useState } from "react"
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    useReactFlow,
    ReactFlowProvider,
} from "@xyflow/react"

import "@xyflow/react/dist/style.css"

import {
    Plus,
    Minus,
    Maximize,
    Link2,
    Trash2,
    Play,
    Square,
    GitBranch,
    Workflow,
    Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { Checkbox } from "@/components/ui/checkbox"

const NODE_TYPES = {
    START: "START",
    TASK: "TASK",
    PARALLEL_SPLIT: "PARALLEL_SPLIT",
    PARALLEL_JOIN: "PARALLEL_JOIN",
    EXCLUSIVE: "EXCLUSIVE",
    END: "END"
}


// NODO INICIO
function StartNode({ selected }) {
    return (
        <div
            className={[
                "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-emerald-50 shadow-sm",
                selected ? "border-blue-500" : "border-emerald-400",
            ].join(" ")}
        >
            <Play className="h-4 w-4 text-emerald-600" />

            <Handle
                type="source"
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-white !bg-emerald-500"
            />
        </div>
    )
}

// NODO FIN
function EndNode({ selected }) {
    return (
        <div
            className={[
                "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-red-50 shadow-sm",
                selected ? "border-blue-500" : "border-red-400",
            ].join(" ")}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-2.5 !w-2.5 !border-white !bg-red-500"
            />

            <Square className="h-3.5 w-3.5 fill-red-500 text-red-500" />
        </div>
    )
}

// NODO TASK
function TaskNode({ data, selected }) {
    return (
        <div
            className={[
                "relative min-w-[170px] rounded-xl border bg-white shadow-sm",
                selected ? "border-blue-500 ring-1 ring-blue-100" : "border-slate-200",
            ].join(" ")}
        >
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-blue-500" />

            <Handle
                type="target"
                position={Position.Left}
                className="!h-2.5 !w-2.5 !border-white !bg-blue-500"
            />

            <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <Workflow className="h-3.5 w-3.5" />
                        {data.label || "Nueva tarea"}
                    </div>

                    <span className="text-sm font-semibold text-slate-500">
                        {data.sla_days || 0}d
                    </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                        {data.subtasks_count || 0} subtareas
                    </span>

                    <span>
                        {data.business_days ? "Hábiles" : "Calendario"}
                    </span>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-white !bg-blue-500"
            />
        </div>
    )
}

// NODO GATEWAY PARALELO
function ParallelNode({ data, selected }) {
    
    const isJoin = data.gateway_type === "PARALLEL_JOIN"

    return (
        <div
            className={[
                "flex h-12 w-12 rotate-45 items-center justify-center border-2 bg-blue-50 shadow-sm",
                selected
                    ? "border-blue-600"
                    : "border-blue-300"
            ].join(" ")}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-2.5 !w-2.5 !border-white !bg-blue-500"
            />

            <div className="-rotate-45 text-[8px] font-semibold text-blue-600">
                {isJoin ? "JOIN" : "PAR"}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-white !bg-blue-500"
            />
        </div>
    )
}

// NODO GATEWAY EXCLUSIVO
function ExclusiveNode({ data, selected }) {
    return (
        <div
            className={[
                "flex h-12 w-12 rotate-45 items-center justify-center border-2 bg-amber-50 shadow-sm",
                selected ? "border-blue-600" : "border-amber-300",
            ].join(" ")}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!h-2.5 !w-2.5 !border-white !bg-amber-500"
            />

            <div className="-rotate-45 text-[12px] font-bold text-amber-600">
                ×
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-white !bg-amber-500"
            />
        </div>
    )
}



const nodeTypes = {
    START: StartNode,
    TASK: TaskNode,
    PARALLEL_SPLIT: ParallelNode,
    PARALLEL_JOIN: ParallelNode,
    EXCLUSIVE: ExclusiveNode,
    END: EndNode
}

function CanvasEditor({
    initialNodes = [],
    initialEdges = [],
    editable = true,
    onSave,
    tasks,
    onCreateTask,
    onOpenTask
}) {
    const { fitView, zoomIn, zoomOut } = useReactFlow()

    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])
    const [selectedNodeId, setSelectedNodeId] = useState(null)
    const [connectMode, setConnectMode] = useState(false)
    const [connectSource, setConnectSource] = useState(null)

    const [taskDialogOpen, setTaskDialogOpen] = useState(false)
    const [taskMode, setTaskMode] = useState("NEW")
    const [selectedTaskId, setSelectedTaskId] = useState("")
    const [taskForm, setTaskForm] = useState({
        name: "",
        // sla_days: 0,
        // business_days: true
    })


    // MAPEAR NODOS MONGO → REACT FLOW
    useEffect(() => {
        const mappedNodes = (initialNodes || []).map((node, index) => ({
            id: String(node.node_key || node.id),
            type: getReactNodeType(node),
            position: node.position || {
                x: 80 + index * 220,
                y: 180
            },
            data: {
                ...node,
                label:
                    node.label ||
                    node.task_name ||
                    node.task_code ||
                    node.name ||
                    node.type
            }
        }))

        const mappedEdges = (initialEdges || []).map((edge, index) => ({
            id: String(
                edge.edge_key ||
                edge.id ||
                `EDGE_${index}`
            ),
            source: String(
                edge.from ||
                edge.source
            ),
            target: String(
                edge.to ||
                edge.target
            ),
            type: "smoothstep",
            data: {
                edge_key:
                    edge.edge_key ||
                    edge.id,
                condition:
                    edge.condition ||
                    null,
                is_default:
                    edge.is_default === true
            }
        }))

        setNodes(mappedNodes)
        setEdges(mappedEdges)
    }, [initialNodes, initialEdges])

    const selectedNode = useMemo(() => {
        return nodes.find(node => node.id === selectedNodeId) || null
    }, [nodes, selectedNodeId])

    const onNodesChange = useCallback(changes => {
        if (!editable) return
        setNodes(nds => applyNodeChanges(changes, nds))
    }, [editable])

    const onEdgesChange = useCallback(changes => {
        if (!editable) return
        setEdges(eds => applyEdgeChanges(changes, eds))
    }, [editable])

    const onConnect = useCallback(params => {
        if (!editable) return

        setEdges(eds =>
            addEdge(
                {
                    ...params,
                    type: "smoothstep",
                },
                eds
            )
        )
    }, [editable])

    // AGREGAR NODO
    const addNode = type => {
        if (!editable) return

        const id = `${type}_${Date.now()}`

        let data = {
            label: getDefaultLabel(type)
        }

        if (type === NODE_TYPES.PARALLEL_SPLIT) {
            data.gateway_type = "PARALLEL_SPLIT"
        }

        if (type === NODE_TYPES.PARALLEL_JOIN) {
            data.gateway_type = "PARALLEL_JOIN"
        }

        if (type === NODE_TYPES.EXCLUSIVE) {
            data.gateway_type = "EXCLUSIVE"
        }

        setNodes(prev => [
            ...prev,
            {
                id,
                type,
                position: {
                    x: 200 + Math.random() * 300,
                    y: 160 + Math.random() * 200
                },
                data
            }
        ])

        setSelectedNodeId(id)
    }

    // ELIMINAR NODO Y SUS CONEXIONES
    const deleteSelectedNode = () => {
        if (!selectedNodeId) return

        setNodes(prev =>
            prev.filter(node => node.id !== selectedNodeId)
        )

        setEdges(prev =>
            prev.filter(edge =>
                edge.source !== selectedNodeId &&
                edge.target !== selectedNodeId
            )
        )

        setSelectedNodeId(null)
        setConnectSource(null)
    }

    // CONECTAR HACIENDO CLICK EN ORIGEN Y DESTINO
    const handleNodeClick = (_, node) => {
        setSelectedNodeId(node.id)

        if (!connectMode) return

        if (!connectSource) {
            setConnectSource(node.id)
            return
        }

        if (connectSource === node.id) return

        setEdges(prev => [
            ...prev,
            {
                id: `edge_${connectSource}_${node.id}_${Date.now()}`,
                source: connectSource,
                target: node.id,
                type: "smoothstep",
            },
        ])

        setConnectSource(null)
        setConnectMode(false)
    }

    // ACTUALIZAR DATOS RÁPIDOS DEL NODO
    const updateSelectedNode = (field, value) => {
        if (!selectedNodeId) return

        setNodes(prev =>
            prev.map(node => {
                if (node.id !== selectedNodeId) return node

                return {
                    ...node,
                    data: {
                        ...node.data,
                        [field]: value,
                    },
                }
            })
        )
    }

    // GUARDAR GRAFO EN FORMATO DEL MODELO WF_VERSIONS
    const handleSaveGraph = async() => {
        const payload = buildGraphPayload(nodes, edges)
        await onSave?.(payload)
    }

    const buildGraphPayload = (
        currentNodes,
        currentEdges
    ) => {
        return {
            nodes: currentNodes.map(node => {
                const item = {
                    node_key: node.id,
                    type: getMongoNodeType(node.type),
                    label: node.data.label || "",
                    position: {
                        x: node.position.x,
                        y: node.position.y
                    }
                }

                if (node.type === "TASK") {
                    if (node.data?.task_id) {
                        item.task_id = node.data.task_id
                    }

                    if (node.data?.task_code) {
                        item.task_code = node.data.task_code
                    }
                }

                if (node.type === "PARALLEL_SPLIT") {
                    item.gateway_type = "PARALLEL_SPLIT"
                }

                if (node.type === "PARALLEL_JOIN") {
                    item.gateway_type = "PARALLEL_JOIN"
                }

                if (node.type === "EXCLUSIVE") {
                    item.gateway_type = "EXCLUSIVE"
                }

                return item
            }),

            edges: currentEdges.map(
                (edge, index) => ({
                    edge_key:
                        edge.data?.edge_key ||
                        edge.id ||
                        `EDGE_${index + 1}`,

                    from: edge.source,
                    to: edge.target,
                    condition: edge.data?.condition || null,
                    is_default: edge.data?.is_default === true
                })
            )
        }
    }

      const handleAddTaskFromDialog = async() => {
        try {
            let task = null

            // REUTILIZAR TASK EXISTENTE
            if (taskMode === "EXISTING") {
                task = tasks.find(
                    x => String(x._id) === String(selectedTaskId)
                )

                if (!task) {
                    throw new Error("No se encontró la tarea seleccionada")
                }
            }

            // CREAR NUEVA TASK
            if (taskMode === "NEW") {
                if (!taskForm.name.trim()) {
                    throw new Error("Ingresar nombre de la tarea")
                }

                const response = await onCreateTask?.({
                    name: taskForm.name.trim(),
                    description: "",
                    // sla_days: Number(taskForm.sla_days || 0),
                    // business_days: taskForm.business_days
                })

                if (response?.result === "OK") {
                    task = response.content
                } else if (response?._id) {
                    task = response
                }

                if (!task?._id) {
                    throw new Error(
                        response?.message ||
                        "No se pudo crear la tarea"
                    )
                }
            }

            const id = `TASK_${Date.now()}`

            const newNode = {
                id,
                type: "TASK",
                position: {
                    x: 220 + Math.random() * 260,
                    y: 160 + Math.random() * 220
                },
                data: {
                    label: task.name,
                    task_id: task._id,
                    task_code: task.task_code,
                    // sla_days: task.sla_days || 0,
                    // business_days: task.business_days !== false,
                    subtasks_count: task.subtasks?.length || 0
                }
            }

            setNodes(prev => [
                ...prev,
                newNode
            ])

            setSelectedNodeId(id)

            setTaskDialogOpen(false)

            setTaskMode("NEW")
            setSelectedTaskId("")
            setTaskForm({
                name: "",
                // sla_days: 0,
                // business_days: true
            })
        } catch (error) {
            console.error(error)

            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo agregar la tarea"
            )
        }
    }

    return (
        <div className="grid min-h-[620px] grid-cols-[minmax(0,1fr)_280px] overflow-hidden rounded-xl border bg-white">

            {/* IZQUIERDA - CANVAS */}
            <div className="min-w-0">

                {/* TOOLBAR */}
                <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 border-b px-3">
                    <div className="text-sm font-semibold text-[#31577e]">
                        Diseñador visual · PLANTILLA
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addNode(NODE_TYPES.START)}
                        >
                            + Inicio
                        </Button>

                        <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => setTaskDialogOpen(true)}
                        >
                            + Tarea
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                addNode(NODE_TYPES.PARALLEL_SPLIT)
                            }
                        >
                            + Paralelo
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                addNode(NODE_TYPES.PARALLEL_JOIN)
                            }
                        >
                            + Unión
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addNode(NODE_TYPES.EXCLUSIVE)}
                        >
                            + Exclusivo
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addNode(NODE_TYPES.END)}
                        >
                            + Fin
                        </Button>

                        <Button
                            variant={connectMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                setConnectMode(prev => !prev)
                                setConnectSource(null)
                            }}
                        >
                            <Link2 className="mr-1 h-3.5 w-3.5" />
                            Conectar
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => zoomOut()}
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => zoomIn()}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                fitView({
                                    padding: 0.15,
                                    duration: 300,
                                })
                            }
                        >
                            <Maximize className="mr-1 h-3.5 w-3.5" />
                            Ajustar
                        </Button>

                        <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={handleSaveGraph}
                        >
                            <Save className="mr-1 h-3.5 w-3.5" />
                            Guardar
                        </Button>
                    </div>
                </div>

                {/* AYUDA */}
                <div className="border-b bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                    Arrastra cajas libremente. Para conectar puedes usar los puntos de los nodos o activar
                    <strong> Conectar</strong> y seleccionar origen → destino.
                </div>

                {/* CANVAS */}
                <div className="h-[560px]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        nodesDraggable={editable}
                        nodesConnectable={editable}
                        elementsSelectable
                        fitView
                        minZoom={0.25}
                        maxZoom={2}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={handleNodeClick}
                    >
                        <Background
                            variant="dots"
                            gap={20}
                            size={1}
                        />
                    </ReactFlow>
                </div>
            </div>

            {/* DERECHA - CONFIGURACIÓN RÁPIDA */}
            <aside className="border-l bg-white">
                {!selectedNode ? (
                    <div className="p-5 text-sm text-slate-400">
                        Selecciona un nodo para visualizar su configuración.
                    </div>
                ) : (
                    <>
                        <div className="border-b p-4">
                            <div className="font-semibold text-[#31577e]">
                                {selectedNode.data.label}
                            </div>

                            <div className="text-xs text-slate-400">
                                Configuración rápida
                            </div>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label>
                                    Nombre
                                </Label>

                                <Input
                                    value={selectedNode.data.label || ""}
                                    onChange={e =>
                                        updateSelectedNode(
                                            "label",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            {selectedNode.type === "PARALLEL" && (
                                <div className="space-y-2">
                                    <Label>Tipo de paralelo</Label>

                                    <Select
                                        value={
                                            selectedNode.data.gateway_type ||
                                            "PARALLEL_SPLIT"
                                        }
                                        onValueChange={value =>
                                            updateSelectedNode(
                                                "gateway_type",
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="PARALLEL_SPLIT">
                                                Apertura paralela
                                            </SelectItem>

                                            <SelectItem value="PARALLEL_JOIN">
                                                Unión paralela
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedNode.type === "TASK" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>
                                            Código
                                        </Label>

                                        <Input
                                            value={selectedNode.data.task_code || ""}
                                            onChange={e =>
                                                updateSelectedNode(
                                                    "task_code",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>
                                                SLA
                                            </Label>

                                            <Input
                                                type="number"
                                                min="0"
                                                value={selectedNode.data.sla_days || 0}
                                                onChange={e =>
                                                    updateSelectedNode(
                                                        "sla_days",
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                Subtareas
                                            </Label>

                                            <Input
                                                disabled
                                                value={
                                                    selectedNode.data.subtasks_count || 0
                                                }
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-blue-500 hover:bg-blue-600"
                                        disabled={!selectedNode?.data?.task_id}
                                        onClick={() => {
                                            if (!selectedNode?.data?.task_id) return

                                            onOpenTask?.({
                                                _id: selectedNode.data.task_id,
                                                task_code: selectedNode.data.task_code,
                                                name: selectedNode.data.label
                                            })
                                        }}
                                    >
                                        Configurar tarea
                                    </Button>
                                </>
                            )}

                            {connectMode && connectSource === selectedNode.id && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-600">
                                    Nodo origen seleccionado. Haz clic en el nodo destino.
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                onClick={deleteSelectedNode}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar nodo
                            </Button>
                        </div>
                    </>
                )}
            </aside>
            <Dialog
                open={taskDialogOpen}
                onOpenChange={setTaskDialogOpen}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#31577e]">
                            Agregar tarea
                        </DialogTitle>

                        <DialogDescription>
                            Reutiliza una tarea existente o crea una nueva.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">

                        <div className="space-y-2">
                            <Label>Tarea</Label>

                            <Select
                                value={taskMode === "NEW" ? "NEW" : selectedTaskId}
                                onValueChange={value => {
                                    if (value === "NEW") {
                                        setTaskMode("NEW")
                                        setSelectedTaskId("")
                                        setTaskForm({
                                            name: "",
                                            // sla_days: 0,
                                            // business_days: true
                                        })
                                        return
                                    }

                                    setTaskMode("EXISTING")
                                    setSelectedTaskId(value)

                                    const selected = tasks.find(
                                        x => String(x._id) === String(value)
                                    )

                                    if (selected) {
                                        setTaskForm({
                                            name: selected.name || "",
                                            // sla_days: selected.sla_days || 0,
                                            // business_days: selected.business_days !== false
                                        })
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tarea..." />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="NEW">
                                        + Nueva
                                    </SelectItem>

                                    {tasks.map(task => (
                                        <SelectItem
                                            key={task._id}
                                            value={String(task._id)}
                                        >
                                            {task.task_code} · {task.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nombre</Label>

                                <Input
                                    disabled={taskMode === "EXISTING"}
                                    value={taskForm.name}
                                    onChange={e =>
                                        setTaskForm(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            {/* <div className="space-y-2">
                                <Label>SLA</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    disabled={taskMode === "EXISTING"}
                                    value={taskForm.sla_days}
                                    onChange={e =>
                                        setTaskForm(prev => ({
                                            ...prev,
                                            sla_days: Number(e.target.value)
                                        }))
                                    }
                                />
                            </div> */}
                        </div>

                        {/* <label className="flex items-center gap-3">
                            <Checkbox
                                disabled={taskMode === "EXISTING"}
                                checked={taskForm.business_days}
                                onCheckedChange={value =>
                                    setTaskForm(prev => ({
                                        ...prev,
                                        business_days: !!value
                                    }))
                                }
                            />

                            <span className="text-sm">
                                Contabilizar días hábiles
                            </span>
                        </label> */}

                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setTaskDialogOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={handleAddTaskFromDialog}
                        >
                            Agregar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// TIPO MONGO → TIPO VISUAL
function getReactNodeType(node) {
    if (node.type === "START") return "START"
    if (node.type === "END") return "END"
    if (node.type === "TASK") return "TASK"

    if (node.type === "GATEWAY") {
        if (node.gateway_type === "PARALLEL_SPLIT") {
            return "PARALLEL_SPLIT"
        }

        if (node.gateway_type === "PARALLEL_JOIN") {
            return "PARALLEL_JOIN"
        }

        if (node.gateway_type === "EXCLUSIVE") {
            return "EXCLUSIVE"
        }
    }

    return "TASK"
}

// TIPO VISUAL → TIPO MONGO
function getMongoNodeType(type) {
    if (
        type === "PARALLEL_SPLIT" ||
        type === "PARALLEL_JOIN" ||
        type === "EXCLUSIVE"
    ) {
        return "GATEWAY"
    }

    return type
}

// TIPO DE GATEWAY
// function getGatewayType(type) {
//     if (type === "PARALLEL") return "PARALLEL_SPLIT"
//     if (type === "EXCLUSIVE") return "EXCLUSIVE"
//     return null
// }

// NOMBRE INICIAL DEL NODO
function getDefaultLabel(type) {
    switch (type) {
        case "START":
            return "Inicio"

        case "TASK":
            return "Nueva tarea"

        case "PARALLEL":
            return "PAR"

        case "EXCLUSIVE":
            return "XOR"

        case "END":
            return "Fin"

        default:
            return "Nodo"
    }
}


export default function WorkflowCanvas(props) {
    return (
        <ReactFlowProvider>
            <CanvasEditor {...props} />
        </ReactFlowProvider>
    )
}