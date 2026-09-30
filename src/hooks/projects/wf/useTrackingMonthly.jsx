import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"
import { getTrackingMonthly } from "@/services/projects/wf/tracking/getTracking"


export const useTrackingMonthly = ({
    workflow_code = "",
    workflow_version = "",
    task_code = "",
    year = "",
    month = "",
    forecast_source = "RESPONSIBLE",
    task_status = "",
    search = "",
    page = 1,
    limit = 20,
    enabled = true
} = {}) => {

    const [items, setItems] = useState([])
    const [plan, setPlan] = useState(null)
    const [summary, setSummary] = useState({ total: 0 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const reload =
        useCallback(() => {
            setReloadKey(
                prev =>
                    prev + 1
            )
        }, [])


    const params =
        useMemo(
            () => ({
                workflow_code,
                workflow_version,
                task_code,
                year,
                month,
                forecast_source,
                task_status,
                search,
                page,
                limit
            }),
            [
                workflow_code,
                workflow_version,
                task_code,
                year,
                month,
                forecast_source,
                task_status,
                search,
                page,
                limit
            ]
        )

    useEffect(() => {

        if (!enabled || !task_code || !year || !month) {
            return
        }

        const controller = new AbortController()

        const load =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const res = await getTrackingMonthly(params,
                        { signal: controller.signal }
                    )

                    if (controller.signal.aborted) {
                        return
                    }

                    const content = res?.content || {}

                    setItems(content.items || [])
                    setPlan(content.plan || null)

                    setSummary(content.summary || { total: 0 })
                    setTotalResults(content.totalResults || 0)
                    setTotalPages(content.totalPages || 0)
                    setCurrentPage(content.currentPage || 1)

                } catch (err) {

                    if (controller.signal.aborted) {
                        return
                    }

                    setError(err)

                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false)
                    }
                }
            }


        load()

        return () => {
            controller.abort()
        }

    }, [
        params,
        enabled,
        task_code,
        year,
        month,
        reloadKey
    ])

    return {
        items,
        plan,
        summary,
        loading,
        error,
        totalResults,
        totalPages,
        currentPage,
        reload
    }
}