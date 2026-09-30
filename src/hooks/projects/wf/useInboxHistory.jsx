import { getInboxHistory } from "@/services/projects/wf/inbox/getInbox"
import { useEffect, useState } from "react"

export const useInboxHistory = ({
    page = 1,
    limit = 20,
    search = "",
    user_id = "",
    workflow_code = "",
    task_code = "",
    task_status = "",
    subtask_status = "",
    sortBy = "updatedAt",
    sortDirection = "desc"
} = {}) => {

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    const reload = () => {
        setReloadKey(prev => prev + 1)
    }

    useEffect(() => {
        if (!user_id) return

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
                    workflow_code,
                    task_code,
                    task_status,
                    subtask_status,
                    sortBy,
                    sortDirection
                }

                const res = await getInboxHistory(
                    params,
                    {
                        signal: controller.signal
                    }
                )

                if (controller.signal.aborted) {
                    return
                }

                setHistory(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)

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
        workflow_code,
        task_code,
        task_status,
        subtask_status,
        sortBy,
        sortDirection,
        reloadKey
    ])

    return {
        history,
        loading,
        totalResults,
        totalPages,
        error,
        reload
    }
}