import { getInboxMonthly } from "@/services/projects/wf/inbox/getInbox"
import { useEffect, useState } from "react"

export const useInboxMonthly = ({
    page = 1,
    limit = 20,
    search = "",
    user_id = "",
    month = "",
    forecast_type = "RESPONSIBLE",
    workflow_code = "",
    task_code = "",
    task_status = "",
    sortBy = "forecast_date",
    sortDirection = "asc"
} = {}) => {

    const [monthly, setMonthly] = useState([])

    const [summary, setSummary] = useState({
        total: 0,
        available: 0,
        tracking: 0,
        waiting_previous_task: 0,
        completed: 0
    })

    const [plan, setPlan] = useState({
        month: "",
        forecast_type: ""
    })

    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    const reload = () => {
        setReloadKey(prev => prev + 1)
    }

    useEffect(() => {
        if (!user_id || !month) {
            return
        }

        const controller = new AbortController()

        const loadData = async() => {
            try {
                setLoading(true)
                setError(null)

                const params = {
                    page,
                    limit,
                    search,
                    user_id,
                    month,
                    forecast_type,
                    workflow_code,
                    task_code,
                    task_status,
                    sortBy,
                    sortDirection
                }

                const res = await getInboxMonthly(
                    params,
                    {
                        signal: controller.signal
                    }
                )

                if (controller.signal.aborted) {
                    return
                }

                const content = res?.content || {}

                setMonthly(content.items || [])

                setSummary({
                    total: content.summary?.total || 0,
                    available: content.summary?.available || 0,
                    tracking: content.summary?.tracking || 0,
                    waiting_previous_task: content.summary?.waiting_previous_task || 0,
                    completed: content.summary?.completed || 0
                })

                setPlan({
                    month: content.plan?.month || "",
                    forecast_type: content.plan?.forecast_type || ""
                })

                setTotalResults(content.totalResults || 0)
                setTotalPages(content.totalPages || 0)

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

        loadData()

        return () => {
            controller.abort()
        }

    }, [
        page,
        limit,
        search,
        user_id,
        month,
        forecast_type,
        workflow_code,
        task_code,
        task_status,
        sortBy,
        sortDirection,
        reloadKey
    ])

    return {
        monthly,
        summary,
        plan,
        loading,
        totalResults,
        totalPages,
        error,
        reload
    }
}