import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import {
    ArrowLeft,
    Copy,
    Plus,
    Save,
    Workflow as WorkflowIcon,
    Settings2,
    Info,
    Loader2,
    NotebookTabs,
    ChevronDown
} from "lucide-react"
import { toast } from "wc-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { useWorkflows } from "@/hooks/projects/wf/useWorkflows"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import WorkflowCanvas from "@/components/WorkflowCanvas/WorkflowCanvas"
import { useTasks } from "@/hooks/projects/wf/useTasks"

// import WorkflowCanvas from "./components/WorkflowCanvas"

const STATUS = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DRAFT: "bg-blue-50 text-blue-700 border-blue-200",
    ARCHIVED: "bg-slate-100 text-slate-600 border-slate-200"
}

const MENU = [
    { key: "GENERAL", label: "General", icon: Info },
    { key: "WORKFLOW", label: "Workflow", icon: WorkflowIcon },
    { key: "CONFIG", label: "Configuración", icon: Settings2 }
]


export default function WorkflowDetail() {

    const { id } = useParams()

    const navigate = useNavigate()

    const {
        getWorkflow,
        getVersions,
        getVersion,
        updateWorkflow,
        duplicateWorkflow,
        addVersion,
        publishVersion,
        archiveVersion,
        updateGraph
    } = useWorkflows()

    const {
        tasks,
        addTask
    } = useTasks({ page: 1, limit: 1000 })

    const [tab, setTab] = useState("GENERAL")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [workflow, setWorkflow] = useState(null)
    const [versions, setVersions] = useState([])
    const [selectedVersionId, setSelectedVersionId] = useState("")
    const [version, setVersion] = useState(null)

    const [form, setForm] = useState({
        name: "",
        description: "",
        project_type_id: "",
        project_type_name: "",
        created_by: ""
    })

    const loadWorkflow = async() => {
        try {
            setLoading(true)

            const [workflowRes, versionsRes] = await Promise.all([
                getWorkflow(id),
                getVersions(id, {
                    page: 1,
                    limit: 100
                })
            ])

            const workflowData = workflowRes?.content || null
            const versionItems = versionsRes?.content?.items || []

            setWorkflow(workflowData)
            setVersions(versionItems)

            setForm({
                name: workflowData?.name || "",
                description: workflowData?.description || "",
                project_type_id: String(workflowData?.project_type_id || "")
            })

            let activeVersion = null

            if (workflowData?.active_version) {
                activeVersion = versionItems.find(item =>
                    String(item.version) === String(workflowData.active_version)
                )
            }

            if (!activeVersion && versionItems.length > 0) {
                activeVersion =
                    versionItems.find(item => item.status === "PUBLISHED") ||
                    versionItems[0]
            }

            if (activeVersion?._id) {
                const versionId = String(activeVersion._id)
                setSelectedVersionId(versionId)
                const versionRes = await getVersion(versionId)
                setVersion(versionRes?.content || null)
            }
        } catch (error) {
            console.error(error)
            toast.error("No se pudo cargar el Workflow")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) loadWorkflow()
    }, [id])


    const handleVersionChange = async(versionId) => {
        try {
            setSelectedVersionId(versionId)

            const res = await getVersion(versionId)
            setVersion(res?.content || null)
        } catch (error) {
            toast.error("No se pudo cargar la versión")
        }
    }

    const handleSaveGeneral = async() => {
        try {
            setSaving(true)

            const res = await updateWorkflow(id, {
                name: form.name,
                description: form.description,
                project_type_id: form.project_type_id
            })

            if (res?.result !== "OK") {
                throw new Error(
                    res?.message ||
                    "No se pudo actualizar"
                )
            }

            setWorkflow(res.content)
            toast.success("Workflow actualizado")
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo guardar"
            )
        } finally {
            setSaving(false)
        }
    }

    const handleDuplicate = async() => {
        try {
            const res = await duplicateWorkflow(id, {})

            if (res?.result !== "OK") {
                throw new Error(
                    res?.message ||
                    "No se pudo duplicar"
                )
            }

            toast.success("Workflow duplicado")

            navigate(
                `/projects/templates/workflows/${res.content.workflow._id}`
            )
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo duplicar"
            )
        }
    }

    const handleNewVersion = async() => {
        try {
            const res = await addVersion(id, {})

            if (res?.result !== "OK") {
                throw new Error(
                    res?.message ||
                    "No se pudo crear la versión"
                )
            }

            toast.success("Nueva versión creada")

            await loadWorkflow()

            setSelectedVersionId(
                String(res.content._id)
            )

            setVersion(res.content)
            setTab("WORKFLOW")
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo crear la versión"
            )
        }
    }

    const handlePublish = async() => {
        if (!version?._id) return

        try {
            const res = await publishVersion(
                version._id,
                {}
            )

            if (res?.result !== "OK") {
                throw new Error(
                    res?.message ||
                    "No se pudo publicar"
                )
            }

            toast.success("Versión publicada")
            await loadWorkflow()
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo publicar"
            )
        }
    }

    const handleArchive = async() => {
        if (!version?._id) return

        try {
            const res = await archiveVersion(
                version._id,
                {}
            )

            if (res?.result !== "OK") {
                throw new Error(
                    res?.message ||
                    "No se pudo archivar"
                )
            }

            toast.success("Versión archivada")
            await loadWorkflow()
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo archivar"
            )
        }
    }


    const createTaskFromNode = async(node) => {
        try {
            const response = await addTask({
                name: node.data?.label || "Nueva tarea",
                description: "",
                // sla_days: Number(node.data?.sla_days || 0),
                // business_days: node.data?.business_days !== false
            })

            if (response?.result !== "OK") {
                throw new Error(
                    response?.message ||
                    "No se pudo crear la tarea"
                )
            }

            console.log("RESPUESTA POST TASK:", response)

            return response.content
        } catch (error) {
            console.error("Error createTaskFromNode:", error)

            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo crear la tarea"
            )

            return null
        }
    }

    const openTask = task => {
        navigate(
            `/projects/templates/tasks/${task._id}`,
            {
                state: {
                    workflowId: workflow._id,
                    workflowCode: workflow.workflow_code,
                    versionId: version._id
                }
            }
        )
    }


    const handleConfigureTask = async(node) => {
        try {
            // YA EXISTE TASK
            if (node.data?.task_id) {
                navigate(
                    `/projects/templates/tasks/${node.data.task_id}`,
                    {
                        state: {
                            workflowId: workflow._id,
                            workflowCode: workflow.workflow_code,
                            versionId: version._id
                        }
                    }
                )

                return null
            }

            // TODAVÍA NO EXISTE
            const response = await addTask({
                name:
                    node.data.label ||
                    "Nueva tarea",

                description: "",

                // sla_days:
                //     Number(
                //         node.data.sla_days || 0
                //     ),

                // business_days:
                //     node.data.business_days !== false
            })

            if (response?.result !== "OK") {
                throw new Error(
                    response?.message ||
                    "No se pudo crear la tarea"
                )
            }

            const task = response.content

            navigate(
                `/projects/templates/tasks/${task._id}`,
                {
                    state: {
                        workflowId: workflow._id,
                        workflowCode: workflow.workflow_code,
                        versionId: version._id
                    }
                }
            )

            return task

        } catch (error) {
            console.error(
                "Error configure task:",
                error
            )

            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "No se pudo configurar la tarea"
            )

            return null
        }
    }

    const currentStatus =
        version?.status ||
        workflow?.status ||
        "DRAFT"

    const versionLabel =
        version?.version ??
        "-"

    if (loading) {
        return (
            <div className="p-8">
                <Skeleton className="mb-3 h-6 w-52" />
                <Skeleton className="h-[300px] w-full rounded-2xl" />
            </div>
        )
    }

    if (!workflow) {
        return (
            <div className="p-8 text-sm text-slate-500">
                Workflow no encontrado
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/projects/templates/workflows"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/projects/templates/workflows" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Workflow
                            </Link>
                            <span className="text-gray-400"> / </span>
                            <span className="text-[#2b7fff]">{workflow?.code ?? id}</span>
                        </h2>
                    </div>
                    {/* <div className="flex gap-4">
                        <Button size="icon" onClick={onDownloadSites} className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0">
                            <Download className="h-4 w-4" /> Descargar Sitios
                        </Button>
                        <Button size="icon" onClick={onDownloadTemplate} className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0">
                            <Download className="h-4 w-4" /> Descargar Formato MG
                        </Button>
                    </div> */}
                    <div className="flex items-center gap-2">
                        {/* SELECTOR DE VERSIÓN */}
                        <Select
                            value={selectedVersionId}
                            onValueChange={handleVersionChange}
                        >
                            <SelectTrigger className="h-10 min-w-[130px] rounded-lg bg-white">
                                <SelectValue placeholder="Versión" />
                            </SelectTrigger>

                            <SelectContent>
                                {versions.map(item => (
                                    <SelectItem
                                        key={item._id}
                                        value={String(item._id)}
                                    >
                                        v{item.version} · {item.status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* CAMBIO DE ESTADO */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={[
                                        "h-10 min-w-[105px] rounded-lg border",
                                        currentStatus === "PUBLISHED"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : currentStatus === "ARCHIVED"
                                                ? "border-slate-200 bg-slate-100 text-slate-600"
                                                : "border-blue-200 bg-blue-50 text-blue-600"
                                    ].join(" ")}
                                >
                                    {currentStatus}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                    disabled={currentStatus === "DRAFT"}
                                    onClick={() => handleChangeStatus("DRAFT")}
                                >
                                    DRAFT
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={currentStatus === "PUBLISHED"}
                                    onClick={() => handleChangeStatus("PUBLISHED")}
                                >
                                    PUBLISHED
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={currentStatus === "ARCHIVED"}
                                    onClick={() => handleChangeStatus("ARCHIVED")}
                                >
                                    ARCHIVED
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            className="h-10 gap-2 rounded-lg bg-white"
                            onClick={handleDuplicate}
                        >
                            <Copy className="h-4 w-4" />
                            Duplicar
                        </Button>

                        <Button
                            variant="outline"
                            className="h-10 gap-2 rounded-lg bg-white"
                            onClick={handleNewVersion}
                        >
                            <Plus className="h-4 w-4" />
                            Nueva versión
                        </Button>
                    </div>
                </div>

                <div>
                    <div className="relative">

                        <div className="bg-white relative rounded-lg p-6 mb-6">
                            <div className="mx-auto flex max-w-7xl items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-[#cce5ff] rounded-full p-2">
                                                <NotebookTabs className="w-5 h-5 text-[#3b82f6]" />
                                            </div>
                                            <h1 className="text-lg font-medium text-gray-400">{workflow?.name}</h1>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                        {/* main */}
                        <div className="rounded-2xl bg-white relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size flex">

                                        <div className="grid w-full grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)]">

                                            {/* SIDEBAR */}
                                            <aside className="border-r border-slate-100 p-4">
                                                <div className="space-y-2">
                                                    {MENU.map(item => {
                                                        const Icon = item.icon
                                                        const active = tab === item.key

                                                        return (
                                                            <button
                                                                key={item.key}
                                                                type="button"
                                                                onClick={() => setTab(item.key)}
                                                                className={[
                                                                    "flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition",
                                                                    active
                                                                        ? "bg-blue-50 font-semibold text-blue-600"
                                                                        : "text-slate-500 hover:bg-slate-50"
                                                                ].join(" ")}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                                {item.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </aside>

                                            {/* CONTENT */}
                                            <main className="min-w-0 w-full p-6">

                                                {/* GENERAL */}
                                                {tab === "GENERAL" && (
                                                    <div className="space-y-6">

                                                        <div>
                                                            <div className="mb-4 text-sm font-medium text-blue-600">
                                                                Información
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                                                <div className="space-y-2">
                                                                    <Label>Nombre</Label>

                                                                    <Input
                                                                        value={form.name}
                                                                        onChange={e =>
                                                                            setForm(p => ({
                                                                                ...p,
                                                                                name: e.target.value
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Tipo proyecto</Label>

                                                                    <Input
                                                                        value={form.project_type_id}
                                                                        onChange={e =>
                                                                            setForm(p => ({
                                                                                ...p,
                                                                                project_type_id: e.target.value
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="space-y-2 lg:col-span-2">
                                                                    <Label>Descripción</Label>

                                                                    <Textarea
                                                                        rows={4}
                                                                        value={form.description}
                                                                        onChange={e =>
                                                                            setForm(p => ({
                                                                                ...p,
                                                                                description: e.target.value
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Versión</Label>

                                                                    <Input
                                                                        disabled
                                                                        value={versionLabel}
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Estado</Label>

                                                                    <Input
                                                                        disabled
                                                                        value={currentStatus}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="mt-6 flex justify-end">
                                                                <Button
                                                                    onClick={handleSaveGeneral}
                                                                    disabled={saving}
                                                                    className="gap-2 bg-blue-500 hover:bg-blue-600"
                                                                >
                                                                    {saving ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Save className="h-4 w-4" />
                                                                    )}

                                                                    Guardar cambios
                                                                </Button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                )}

                                                {/* WORKFLOW */}
                                                {tab === "WORKFLOW" && (
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                            <div>
                                                                <h2 className="font-semibold text-[#31577e]">
                                                                    Flujo del Workflow
                                                                </h2>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    Estructura de la versión v{versionLabel}.
                                                                </p>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                {currentStatus === "DRAFT" && (
                                                                    <Button
                                                                        onClick={handlePublish}
                                                                        className="bg-blue-500 hover:bg-blue-600"
                                                                    >
                                                                        Publicar versión
                                                                    </Button>
                                                                )}

                                                                {currentStatus === "PUBLISHED" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={handleArchive}
                                                                    >
                                                                        Archivar
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* CANVAS */}
                                                        {/* <WorkflowCanvas
                                                            nodes={version?.nodes || []}
                                                            edges={version?.edges || []}
                                                            editable={false}
                                                        /> */}
                                                        <WorkflowCanvas
                                                            initialNodes={version?.nodes || []}
                                                            initialEdges={version?.edges || []}
                                                            editable={currentStatus === "DRAFT"}
                                                            tasks={tasks}
                                                            onCreateTask={addTask}
                                                            onOpenTask={openTask}

                                                            onSave={async(payload) => {
                                                                try {
                                                                    const response = await updateGraph(
                                                                        version._id,
                                                                        payload
                                                                    )

                                                                    if (response?.result !== "OK") {
                                                                        throw new Error(
                                                                            response?.message ||
                                                                            "No se pudo guardar el flujo"
                                                                        )
                                                                    }

                                                                    setVersion(response.content)

                                                                    toast.success(
                                                                        "Workflow guardado correctamente"
                                                                    )
                                                                } catch (error) {
                                                                    console.error(error)

                                                                    toast.error(
                                                                        error?.response?.data?.message ||
                                                                        error.message ||
                                                                        "No se pudo guardar"
                                                                    )
                                                                }
                                                            }}

                                                        />
                                                    </div>
                                                )}

                                                {/* CONFIG */}
                                                {tab === "CONFIG" && (
                                                    <div>
                                                        <h2 className="font-semibold text-[#31577e]">
                                                            Configuración de versión
                                                        </h2>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Información estructural y control de la versión seleccionada.
                                                        </p>

                                                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                                                            <div className="rounded-xl border bg-slate-50 p-4">
                                                                <div className="text-xs text-slate-500">
                                                                    Tareas
                                                                </div>

                                                                <div className="mt-1 text-2xl font-semibold text-slate-700">
                                                                    {(version?.nodes || []).filter(
                                                                        x => x.type === "TASK"
                                                                    ).length}
                                                                </div>
                                                            </div>

                                                            <div className="rounded-xl border bg-slate-50 p-4">
                                                                <div className="text-xs text-slate-500">
                                                                    Gateways
                                                                </div>

                                                                <div className="mt-1 text-2xl font-semibold text-slate-700">
                                                                    {(version?.nodes || []).filter(
                                                                        x => x.type === "GATEWAY"
                                                                    ).length}
                                                                </div>
                                                            </div>

                                                            <div className="rounded-xl border bg-slate-50 p-4">
                                                                <div className="text-xs text-slate-500">
                                                                    Conexiones
                                                                </div>

                                                                <div className="mt-1 text-2xl font-semibold text-slate-700">
                                                                    {version?.edges?.length || 0}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </main>
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