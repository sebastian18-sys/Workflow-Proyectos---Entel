import { useEffect, useState } from "react"
import { getInbox, getInboxKanban } from "@/services/projects/wf/inbox/getInbox"

export const useInbox = ({
    page = 1, 
    limit = 20, 
    search = "", 
    user_id = "",
    workflow_code = "", 
    task_code = "", 
    task_status = "",
    subtask_status = "", 
    relation = "", 
    sortBy = "updatedAt",
    sortDirection = "desc",
    view = "TABLE"
} = {}) => {

    const [inboxs, setInboxs] = useState([])
    const [columns, setColumns] = useState([])
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

                const params = {
                    page, limit, search, user_id, workflow_code,
                    task_code, task_status, subtask_status, relation,
                    sortBy, sortDirection
                }

                if (view === "KANBAN") {
                    const res = await getInboxKanban(params, { signal: controller.signal })
                    if (!controller.signal.aborted) setColumns(res?.content?.columns || [])
                    return
                }

                const res = await getInbox(params, { signal: controller.signal })
                if (controller.signal.aborted) return

                setInboxs(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                setError(err)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [
        page, limit, search, user_id, workflow_code,
        task_code, task_status, subtask_status, relation,
        sortBy, sortDirection, view, reloadKey
    ])

    return {
        inboxs, columns, loading,
        totalResults, totalPages, error, reload
    }
}