import { getTrackingSummary } from "@/services/projects/wf/tracking/getTracking"
import { useCallback, useEffect, useState } from "react"

export function useTrackingSummary(params = {}, { enabled = true } = {}) {
    const [items, setItems] = useState([])
    const [tasks, setTasks] = useState([])
    const [filterOptions, setFilterOptions] = useState({
        tasks: {},
        pending: []
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(20)


    const load = useCallback(async() => {
        if (!enabled || !params.workflow_code) {
            setItems([])
            setTasks([])
            setTotalResults(0)
            setTotalPages(0)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await getTrackingSummary(params)
            const content = response?.content || {}

            setItems(content.items || [])
            setTasks(content.tasks || [])
            setFilterOptions(content.filter_options || {
                tasks: {},
                pending: []
            })
            setTotalResults(content.totalResults || 0)
            setTotalPages(content.totalPages || 0)
            setCurrentPage(content.currentPage || 1)
            setPerPage(content.perPage || Number(params.limit) || 20)
        } catch (e) {
            console.error("useSiteSummary:", e)
            setItems([])
            setTasks([])
            setFilterOptions({
                tasks: {},
                pending: []
            })
            setTotalResults(0)
            setTotalPages(0)
            setError(e?.response?.data?.message || e.message || "No se pudo cargar el resumen")
        } finally {
            setLoading(false)
        }
    }, [enabled, params])

    useEffect(() => {
        load()
    }, [load])

    return {
        items,
        tasks,
        filterOptions,
        loading,
        error,
        totalResults,
        totalPages,
        currentPage,
        perPage,
        reload: load
    }
}