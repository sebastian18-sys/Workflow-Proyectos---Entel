import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getBulkCompletion, getBulkCompletionOptions } from "@/services/projects/wf/bulk/getBulkCompletion"
import { putBulkCompletion } from "@/services/projects/wf/bulk/putBulkCompletion"

export function useBulkCompletion(params = {}, { enabled = true } = {}) {
    const [items, setItems] = useState([])
    const [configuration, setConfiguration] = useState([])
    const [filterOptions, setFilterOptions] = useState({
        workflow_code: [],
        tasks: []
    })

    const [loading, setLoading] = useState(false)
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(100)

    const gridRequestRef = useRef(0)
    const optionsRequestRef = useRef(0)

    /*
     * El backend acepta arrays o CSV.
     * Lo normalizamos a CSV para tener requests predecibles.
     */
    const queryParams = useMemo(() => {
        const taskCodes = Array.isArray(params.task_codes)
            ? params.task_codes.filter(Boolean)
            : []

        const subtaskKeys = Array.isArray(params.subtask_keys)
            ? params.subtask_keys.filter(Boolean)
            : []

        return {
            ...params,
            task_codes: taskCodes.length ? taskCodes.join(",") : undefined,
            subtask_keys: subtaskKeys.length ? subtaskKeys.join(",") : undefined
        }
    }, [params])

    /*
     * Las opciones solamente dependen del usuario
     * y workflow seleccionado.
     */
    const optionsParams = useMemo(() => ({
        user_id: params.user_id || undefined,
        workflow_code: params.workflow_code || undefined
    }), [
        params.user_id,
        params.workflow_code
    ])

    /*
     * =========================================================
     * CARGAR OPCIONES
     * =========================================================
     */
    const loadOptions = useCallback(async() => {
        if (!enabled || !optionsParams.user_id) {
            setFilterOptions({
                workflow_code: [],
                tasks: []
            })
            return
        }

        const requestId = ++optionsRequestRef.current

        try {
            setLoadingOptions(true)

            const response = await getBulkCompletionOptions(optionsParams)

            if (requestId !== optionsRequestRef.current) return

            const content = response?.content || response?.data?.content || {}

            setFilterOptions({
                workflow_code: content.workflow_code || [],
                tasks: content.tasks || []
            })
        } catch (e) {
            if (requestId !== optionsRequestRef.current) return

            console.error("useBulkCompletion.loadOptions:", e)

            setFilterOptions({
                workflow_code: [],
                tasks: []
            })

            setError(
                e?.response?.data?.message ||
                e.message ||
                "No se pudieron cargar las opciones"
            )
        } finally {
            if (requestId === optionsRequestRef.current) {
                setLoadingOptions(false)
            }
        }
    }, [
        enabled,
        optionsParams
    ])

    /*
     * =========================================================
     * CARGAR GRILLA
     * =========================================================
     */
    const load = useCallback(async() => {
        if (!enabled || !queryParams.user_id) {
            setItems([])
            setConfiguration([])
            setTotalResults(0)
            setTotalPages(0)
            return
        }

        const requestId = ++gridRequestRef.current

        try {
            setLoading(true)
            setError(null)

            const response = await getBulkCompletion(queryParams)

            if (requestId !== gridRequestRef.current) return

            const content = response?.content || response?.data?.content || {}

            setItems(content.items || [])
            setConfiguration(content.configuration || [])
            setTotalResults(content.totalResults || 0)
            setTotalPages(content.totalPages || 0)
            setCurrentPage(content.currentPage || 1)
            setPerPage(content.perPage || Number(queryParams.limit) || 100)
        } catch (e) {
            if (requestId !== gridRequestRef.current) return

            console.error("useBulkCompletion.load:", e)

            setItems([])
            setConfiguration([])
            setTotalResults(0)
            setTotalPages(0)

            setError(
                e?.response?.data?.message ||
                e.message ||
                "No se pudo cargar el completado masivo"
            )
        } finally {
            if (requestId === gridRequestRef.current) {
                setLoading(false)
            }
        }
    }, [
        enabled,
        queryParams
    ])

    /*
     * =========================================================
     * GUARDAR
     * =========================================================
     */
    const saveChanges = useCallback(async(changes = []) => {
        if (!Array.isArray(changes) || !changes.length) {
            return {
                result: "OK",
                content: {
                    requested: 0,
                    success: 0,
                    failed: 0,
                    items: []
                }
            }
        }

        if (!params.user_id) {
            throw new Error("Usuario requerido")
        }

        try {
            setSaving(true)
            setError(null)

            const response = await putBulkCompletion({
                user_id: String(params.user_id),
                items: changes
            })

            /*
             * Una transición puede:
             * - completar una Subtask
             * - quitar WorkItem actual
             * - abrir otra Subtask
             * - modificar las opciones disponibles
             *
             * Por eso refrescamos tanto la grilla
             * como los filtros.
             */
            await Promise.all([
                load(),
                loadOptions()
            ])

            return response
        } catch (e) {
            const message =
                e?.response?.data?.message ||
                e.message ||
                "No se pudieron guardar los cambios"

            setError(message)

            throw e
        } finally {
            setSaving(false)
        }
    }, [
        params.user_id,
        load,
        loadOptions
    ])

    /*
     * =========================================================
     * RELOAD GENERAL
     * =========================================================
     */
    const reload = useCallback(async() => {
        await Promise.all([
            load(),
            loadOptions()
        ])
    }, [
        load,
        loadOptions
    ])

    /*
     * =========================================================
     * AUTO LOAD OPTIONS
     * =========================================================
     */
    useEffect(() => {
        loadOptions()
    }, [loadOptions])

    /*
     * =========================================================
     * AUTO LOAD GRID
     * =========================================================
     */
    useEffect(() => {
        load()
    }, [load])

    return {
        items,
        configuration,
        filterOptions,

        loading,
        loadingOptions,
        saving,
        error,

        totalResults,
        totalPages,
        currentPage,
        perPage,

        reload,
        reloadOptions: loadOptions,
        reloadGrid: load,
        saveChanges,
        setItems
    }
}