import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"
import { getTracking, getTrackingReport } from "@/services/projects/wf/tracking/getTracking"

export const useTracking = ({
    workflow_code = "",
    workflow_version = "",
    task_code = "",
    task_status = "",
    instance_status = "",
    project_type_name = "",
    search = "",
    page = 1,
    limit = 20,
    sortBy = "updatedAt",
    sortDirection = "desc"
} = {}) => {

    const [items, setItems] = useState([])
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)


    const reload = useCallback(() => {
        setReloadKey(
            prev =>
                prev + 1
        )
    }, [])


    const params = useMemo(
        () => ({
            workflow_code,
            workflow_version,
            task_code,
            task_status,
            instance_status,
            project_type_name,
            search,
            page,
            limit,
            sortBy,
            sortDirection
        }),
        [
            workflow_code,
            workflow_version,
            task_code,
            task_status,
            instance_status,
            project_type_name,
            search,
            page,
            limit,
            sortBy,
            sortDirection
        ]
    )


    useEffect(() => {

        const controller = new AbortController()

        const load =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const res = await getTracking(params, { signal: controller.signal })

                    if (controller.signal.aborted) {
                        return
                    }

                    const content = res?.content || {}
                    setItems(content.items || [])
                    setTasks(content.tasks || [])
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
        reloadKey
    ])

    return {
        items,
        tasks,
        loading,
        error,
        totalResults,
        totalPages,
        currentPage,
        reload
    }
}