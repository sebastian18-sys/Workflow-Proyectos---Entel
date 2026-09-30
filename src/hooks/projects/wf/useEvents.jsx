import { useEffect, useState } from "react"
import { getEvents } from "@/services/projects/wf/events/getEvents"

export const useEvents = ({
    instanceId = "", 
    page = 1, 
    limit = 20,
    search = "", 
    task_code = "", 
    subtask_key = "",
    event_type = "", 
    performed_by = "",
    date_from = "", 
    date_to = ""
} = {}) => {
    
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!instanceId) return

        const controller = new AbortController()

        const loadData = async() => {
            try {
                setLoading(true)

                const params = {
                    page, limit, search, task_code,
                    subtask_key, event_type, performed_by,
                    date_from, date_to
                }

                const res = await getEvents(instanceId, params, { signal: controller.signal })

                if (controller.signal.aborted) return

                setEvents(res?.content?.items || [])
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
        instanceId, page, limit, search,
        task_code, subtask_key, event_type,
        performed_by, date_from, date_to
    ])

    return {
        events, loading,
        totalResults, totalPages, error
    }
}