import { useEffect, useMemo, useState } from "react"
import {
    Upload,
    Play,
    RefreshCw,
    CheckCircle2,
    XCircle,
    FileSpreadsheet,
    Workflow,
    Loader2,
    ArrowLeft
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { toast } from "wc-toast"

import { useWorkflows } from "@/hooks/projects/wf/useWorkflows"
import { useBatches } from "@/hooks/projects/wf/useBatches"
import { Link } from "react-router"
import { useAuth } from "@/hooks/useAuth"

import Dropzone from "@/components/drag_drop/drag_drop"
import { parseSitesExcel, SITE_EXCEL_COLUMNS } from "@/lib/workflowSitesExcel"
import { useResponsibleUsers } from "@/hooks/admin/useResponsibleUsers"
import { resolveResponsibleUserIds } from "@/lib/assignment"
import { useTasks } from "@/hooks/projects/wf/useTasks"


const TEMP_SITES = [
    {
        site: "010325621_SM_Aviacion_Lamas",
        project_code: "M0854",
        project_name: "RANCO TDD 2026",
        subproject_name: "RANCO TDD 2026 - Q2",
        torrera: "ATC"
    },
    // {
    //     site: "010325624_SM_Nvo_tacabamba",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010325622_SM_Caserio_Palmas",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010291330_CP_Rosario_Huayllay",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310001_LM_Santa_Anita",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "TDP"
    // },
    // {
    //     site: "010310002_LM_San_Borja",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310003_LM_La_Molina",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "SBA"
    // },
    // {
    //     site: "010310004_LM_Miraflores",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310005_LM_Surco",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310006_LM_Barranco",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "TDP"
    // },
    // {
    //     site: "010310007_LM_Chorrillos",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310008_LM_San_Isidro",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310009_LM_Lince",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310010_LM_Brena",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "SBA"
    // },
    // {
    //     site: "010310011_LM_Pueblo_Libre",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310012_LM_Jesus_Maria",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310013_LM_Magdalena",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "TDP"
    // },
    // {
    //     site: "010310014_LM_San_Miguel",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310015_LM_Callao",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // },
    // {
    //     site: "010310016_LM_Bellavista",
    //     project_code: "M0854",
    //     project_name: "RANCO TDD 2026",
    //     subproject_name: "RANCO TDD 2026 - Q2",
    //     torrera: "ATC"
    // }
]

export default function UploadSites() {

    const { user } = useAuth()

    const [importOpen, setImportOpen] = useState(false)
    const [excelFiles, setExcelFiles] = useState([])
    const [excelError, setExcelError] = useState("")
    const [parsingExcel, setParsingExcel] = useState(false)

    const [workflowId, setWorkflowId] = useState("")
    const [previewItems, setPreviewItems] = useState([])
    const [batch, setBatch] = useState(null)

    const [validating, setValidating] = useState(false)
    const [creatingBatch, setCreatingBatch] = useState(false)
    const [launching, setLaunching] = useState(false)

    const [launchDialogOpen, setLaunchDialogOpen] = useState(false)

    const {
        workflows = [],
        loading: loadingWorkflows
    } = useWorkflows({
        page: 1,
        limit: 1000,
        status: "PUBLISHED"
    })

    const {
        validateBatch,
        addBatch,
        launchBatch
    } = useBatches()

    const { groupUsers } = useResponsibleUsers()
    const { tasks } = useTasks({
        page: 1,
        limit: 1000
    })

    const buildResolvedAssignments = tasks => {
        const result = {}

        for (const task of tasks || []) {
            for (const subtask of task.subtasks || []) {
                if (subtask.assignment?.mode !== "FIXED_USERS") continue

                result[`${task.task_code}::${subtask.subtask_key}`] =
                    resolveResponsibleUserIds(
                        subtask.assignment?.responsibles || [],
                        groupUsers.groups || []
                    )
            }
        }

        return result
    }


    const publishedWorkflows = useMemo(() => {
        return (workflows || []).filter(item =>
            item.status === "PUBLISHED" &&
            item.active_version
        )
    }, [workflows])

    const selectedWorkflow = useMemo(() => {
        return publishedWorkflows.find(
            item => String(item._id) === String(workflowId)
        ) || null
    }, [publishedWorkflows, workflowId])

    const validCount = useMemo(
        () => previewItems.filter(item => item.valid === true).length,
        [previewItems]
    )

    const invalidCount = useMemo(
        () => previewItems.filter(item => item.valid === false).length,
        [previewItems]
    )

    const pendingCount = useMemo(
        () => previewItems.filter(item => item.valid == null).length,
        [previewItems]
    )

    const allValidated = useMemo(
        () => previewItems.length > 0 && previewItems.every(item => item.valid === true),
        [previewItems]
    )


    useEffect(() => {
        setPreviewItems([])
        setBatch(null)
    }, [workflowId])


    const buildTemporaryItems = () => {
        return TEMP_SITES.map((item, index) => ({
            row: index + 1,
            ...item
        }))
    }

    const handleLoadTemporarySites = () => {
        if (!workflowId) {
            toast.warning("Seleccionar un Workflow")
            return
        }

        setPreviewItems(
            buildTemporaryItems().map(item => ({
                ...item,
                valid: null,
                errors: []
            }))
        )

        setBatch(null)
    }


    const handleImportExcel = async() => {
        if (!selectedWorkflow) {
            toast.warning("Seleccionar un Workflow")
            return
        }

        if (!excelFiles.length) {
            setExcelError("Seleccionar un archivo XLSX")
            return
        }

        try {
            setParsingExcel(true)
            setExcelError("")

            const items = await parseSitesExcel(excelFiles[0])

            setPreviewItems(items)
            setBatch(null)
            setImportOpen(false)

            toast.success(`${items.length} sitios cargados desde Excel`)
        } catch (error) {
            console.error(error)
            setExcelError(error.message || "No se pudo leer el archivo")
            toast.error(error.message || "Archivo inválido")
        } finally {
            setParsingExcel(false)
        }
    }

    // VALIDAR CARGA DE SITIOS
    const handleValidate = async () => {

        if (!selectedWorkflow) {
            toast.warning("Seleccionar un Workflow")
            return
        }

        if (!previewItems.length) {
            toast.warning("No existen sitios para validar")
            return
        }

        try {

            setValidating(true)

            const response = await validateBatch({
                workflow_id: selectedWorkflow._id,
                items: previewItems.map(({ valid, validation_errors, ...item }) => item)
            })

            if (response?.result !== "OK") {
                throw new Error(
                    response?.message ||
                    "No se pudo validar la carga"
                )
            }

            const content = response.content || {}

            setPreviewItems(
                (content.items || []).map(item => ({
                    ...item,
                    validation_errors: item.validation_errors || []
                }))
            )

            setBatch(null)

            if (content.invalid > 0) {
                toast.warning(`${content.valid} válidos / ${content.invalid} con error`)
            } else {
                toast.success(`${content.valid} sitios validados`)
            }

        } catch (error) {

            console.error(error)

            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Error al validar sitios"
            )

        } finally {
            setValidating(false)
        }
    }

    // GENERAR LOTE
    const handleCreateBatch = async () => {

        if (!selectedWorkflow) {
            toast.warning("Seleccionar un Workflow")
            return
        }

        if (!previewItems.length) {
            toast.warning("No existen sitios para procesar")
            return
        }

        if (invalidCount > 0) {
            toast.warning(
                "Existen sitios con errores. Corregir antes de continuar."
            )
            return
        }

        if (!allValidated) {
            toast.warning("Primero valida todos los registros")
            return
        }

        try {
            setCreatingBatch(true)
            const actorId = Number(user?.id ?? user?.user_id ?? user?.userId)
            if (!Number.isFinite(actorId)) {
                toast.error("No se pudo identificar al usuario")
                return
            }

            const response = await addBatch({
                workflow_id: selectedWorkflow._id,
                source: "EXCEL",
                items: previewItems,
                user_id: actorId
            })

            if (response?.result !== "OK") {
                throw new Error(
                    response?.message ||
                    "No se pudo crear el lote"
                )
            }

            setBatch(response.content)
            toast.success("Lote creado correctamente")
        } catch (error) {
            console.error(error)
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Error al crear lote"
            )
        } finally {
            setCreatingBatch(false)
        }
    }

    // LANZAR LOTE
    const handleLaunch = async () => {

        if (!batch?._id) {
            toast.warning("Primero debes crear el lote")
            return
        }

        try {
            setLaunching(true)
            const actorId = Number(user?.id ?? user?.user_id ?? user?.userId)

            if (!Number.isFinite(actorId)) {
                toast.error("No se pudo identificar al usuario")
                return
            }

            const resolvedAssignments = buildResolvedAssignments(tasks)

            const response = await launchBatch(batch._id, {
                user_id: actorId,
                resolved_assignments: resolvedAssignments
            })


            if (response?.result !== "OK") {
                throw new Error(
                    response?.message ||
                    "No se pudieron lanzar los sitios"
                )
            }

            const launched = response?.content?.launched || 0
            toast.success(`${launched} sitios lanzados correctamente`)
            setBatch(prev => ({
                ...prev,
                status: "LAUNCHED"
            }))
            setLaunchDialogOpen(false)

        } catch (error) {
            console.error(error)
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Error al lanzar sitios"
            )
        } finally {
            setLaunching(false)
        }
    }


    const reset = () => {
        setWorkflowId("")
        setPreviewItems([])
        setBatch(null)
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* Breadcrumb */}
                <div className="flex justify-between gap-4 mb-5 md:mb-6 lg:mb-8">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="#"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/projects/templates/workflows" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Carga de Sitios
                            </Link>
                        </h2>
                    </div>
                    <Button
                        variant="outline"
                        onClick={reset}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Limpiar
                    </Button>
                </div>

                <div>
                    <div className="relative">
                        {/* items-center justify-between flex */}
                        <div className="bg-white relative rounded-lg p-6 mb-6">
                            <div className="mx-auto  max-w-7xl ">
                                <div className="flex justify-between items-center gap-3">
                                    <div>
                                        <div className="space-y-2">
                                            {/* <label className="text-sm font-medium text-slate-700">
                                                Workflow a utilizar
                                            </label> */}
                                            <Select
                                                value={workflowId}
                                                onValueChange={setWorkflowId}
                                                disabled={loadingWorkflows}
                                            >
                                                <SelectTrigger className="h-10 bg-white">
                                                    <SelectValue placeholder="Seleccionar Workflow..." />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {publishedWorkflows.map(item => (
                                                        <SelectItem
                                                            key={item._id}
                                                            value={String(item._id)}
                                                        >
                                                            {item.workflow_code} · {item.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selectedWorkflow && (
                                            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">

                                                    <div className="flex items-center gap-2">
                                                        <Workflow className="h-4 w-4 text-blue-500" />

                                                        <span className="text-slate-500">
                                                            Workflow:
                                                        </span>

                                                        <span className="font-medium text-slate-700">
                                                            {selectedWorkflow.name}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-slate-500">
                                                            Versión:
                                                        </span>{" "}

                                                        <span className="font-medium text-slate-700">
                                                            v{selectedWorkflow.active_version}
                                                        </span>
                                                    </div>

                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    >
                                                        Publicado
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleLoadTemporarySites}
                                            disabled={!workflowId}
                                        >
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Cargar 20 sitios demo
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setImportOpen(true)}
                                            disabled={!workflowId || launching}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Importar Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between border-b bg-white px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-semibold text-[#31577e]">
                                        Vista previa
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Información de los sitios que serán asociados al Workflow seleccionado.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!!previewItems.length && (
                                        <>
                                            <Badge
                                                variant="outline"
                                                className="border-slate-200 bg-white text-slate-600"
                                            >
                                                {previewItems.length} sitios
                                            </Badge>

                                            {validCount > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                                                >
                                                    {validCount} válidos
                                                </Badge>
                                            )}

                                            {invalidCount > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-red-200 bg-red-50 text-red-700"
                                                >
                                                    {invalidCount} con error
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-50">
                                        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="w-[60px] px-5 py-3">#</th>

                                            {SITE_EXCEL_COLUMNS.map(column => (
                                                <th
                                                    key={column.key}
                                                    className="whitespace-nowrap px-4 py-3"
                                                >
                                                    {column.label}
                                                </th>
                                            ))}

                                            <th className="w-[160px] px-4 py-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {!previewItems.length && (
                                            <tr>
                                                <td
                                                    colSpan={SITE_EXCEL_COLUMNS.length + 2}
                                                    className="px-5 py-16 text-center"
                                                >
                                                    <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                                                    <p className="text-sm font-medium text-slate-500">
                                                        No existen sitios cargados
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Selecciona un Workflow y carga los sitios temporales.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                        {previewItems.map((item, index) => (
                                            <tr
                                                key={`${item.site}-${item.row_number || index}`}
                                                className="bg-white hover:bg-slate-50/60"
                                            >
                                                <td className="px-5 py-3 text-slate-400">
                                                    {item.row_number || index + 2}
                                                </td>

                                                {SITE_EXCEL_COLUMNS.map(column => (
                                                    <td
                                                        key={column.key}
                                                        className="max-w-[240px] whitespace-nowrap px-4 py-3 text-slate-600"
                                                        title={String(item[column.key] ?? "")}
                                                    >
                                                        {item[column.key] ?? ""}
                                                    </td>
                                                ))}

                                                <td className="px-4 py-3">
                                                    {item.valid === true && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Válido
                                                        </div>
                                                    )}

                                                    {item.valid === false && (
                                                        <div
                                                            className="text-xs font-medium text-red-600"
                                                            title={(item.validation_errors || []).join("\n")}
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <XCircle className="h-4 w-4" />
                                                                Error
                                                            </div>

                                                            {!!item.validation_errors?.length && (
                                                                <div className="mt-1 max-w-[220px] whitespace-normal text-[10px] font-normal">
                                                                    {item.validation_errors.join(" · ")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {item.valid == null && (
                                                        <span className="text-xs text-slate-400">
                                                            Sin validar
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/50 px-5 py-4">
                                <div className="text-xs text-slate-500">
                                    {batch?._id ? (
                                        <>
                                            Lote generado:
                                            <span className="ml-1 font-semibold text-slate-700">
                                                {batch.batch_code || batch._id}
                                            </span>
                                        </>
                                    ) : (
                                        "Primero valida los registros antes de lanzar."
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={
                                            !previewItems.length ||
                                            validating ||
                                            batch?.status === "LAUNCHED"
                                        }
                                        onClick={handleValidate}
                                    >
                                        {validating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                        )}

                                        Validar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={
                                            !allValidated ||
                                            creatingBatch ||
                                            !!batch?._id
                                        }
                                        onClick={handleCreateBatch}
                                    >
                                        {creatingBatch && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}

                                        Generar lote
                                    </Button>
                                    <Button
                                        className="bg-blue-500 hover:bg-blue-600"
                                        disabled={
                                            !batch?._id ||
                                            launching ||
                                            batch?.status === "LAUNCHED"
                                        }
                                        onClick={() => setLaunchDialogOpen(true)}
                                    >
                                        {launching ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Play className="mr-2 h-4 w-4" />
                                        )}
                                        Lanzar sitios
                                    </Button>
                                </div>
                            </div>
                        </Card>
                        {/* DIALOG CARGA EXCEL */}
                        <Dialog open={importOpen} onOpenChange={setImportOpen}>
                            <DialogContent className="sm:max-w-[620px]">
                                <DialogHeader>
                                    <DialogTitle>Importar sitios desde Excel</DialogTitle>
                                    <DialogDescription>
                                        Selecciona el archivo con la estructura definida para la carga de sitios.
                                    </DialogDescription>
                                </DialogHeader>

                                <Dropzone
                                    files={excelFiles}
                                    onFilesChange={setExcelFiles}
                                    error={excelError}
                                    setError={setExcelError}
                                    maxFiles={1}
                                    multiple={false}
                                    allowedExtensions={[".xlsx"]}
                                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    helperText="Formato permitido: XLSX"
                                />

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setImportOpen(false)}
                                        disabled={parsingExcel}
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        onClick={handleImportExcel}
                                        disabled={!excelFiles.length || parsingExcel}
                                    >
                                        {parsingExcel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Cargar archivo
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {/* DIALOG LANZAMIENTO */}
                        <AlertDialog
                            open={launchDialogOpen}
                            onOpenChange={setLaunchDialogOpen}
                        >
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Lanzar sitios
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Se crearán {validCount} sitios y sus respectivas
                                        instancias utilizando el Workflow{" "}
                                        <strong>
                                            {selectedWorkflow?.name}
                                        </strong>.
                                        Esta acción iniciará el flujo y asignará las primeras actividades.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleLaunch}
                                        className="bg-blue-500 hover:bg-blue-600"
                                    >
                                        Lanzar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </div>

                
            </div>
        </div>
    )
}