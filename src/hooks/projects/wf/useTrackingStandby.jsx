import { getTrackingStandby } from "@/services/projects/wf/tracking/getTracking"
import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"


export const useTrackingStandby = ({
    workflow_code = "",
    task_code = "",
    subtask_key = "",
    project_type_name = "",
    search = "",
    page = 1,
    limit = 20,
    sortBy = "standby_since",
    sortDirection = "desc",
    enabled = true
} = {}) => {

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const params =
        useMemo(
            () => ({
                workflow_code,
                task_code,
                subtask_key,
                project_type_name,
                search,
                page,
                limit,
                sortBy,
                sortDirection
            }),
            [
                workflow_code,
                task_code,
                subtask_key,
                project_type_name,
                search,
                page,
                limit,
                sortBy,
                sortDirection
            ]
        )


    const paramsKey =
        useMemo(
            () =>
                JSON.stringify(
                    params
                ),
            [
                params
            ]
        )


    const reload =
        useCallback(
            () => {

                setReloadKey(
                    previous =>
                        previous + 1
                )

            },
            []
        )


    useEffect(() => {

        if (!enabled) {
            return
        }

        const controller = new AbortController()

        const loadData =
            async() => {

                try {

                    setLoading(true)
                    setError(null)


                    const response =
                        await getTrackingStandby(
                            params,
                            {
                                signal:
                                    controller.signal
                            }
                        )


                    if (
                        controller
                            .signal
                            .aborted
                    ) {
                        return
                    }


                    const content =
                        response?.content ||
                        {}


                    setItems(
                        content.items ||
                        []
                    )

                    setTotalResults(
                        Number(
                            content.totalResults ||
                            0
                        )
                    )

                    setTotalPages(
                        Number(
                            content.totalPages ||
                            0
                        )
                    )

                    setCurrentPage(
                        Number(
                            content.currentPage ||
                            page ||
                            1
                        )
                    )

                } catch (error) {

                    if (
                        controller
                            .signal
                            .aborted
                    ) {
                        return
                    }


                    setError(error)

                    setItems([])
                    setTotalResults(0)
                    setTotalPages(0)

                } finally {

                    if (
                        !controller
                            .signal
                            .aborted
                    ) {
                        setLoading(false)
                    }
                }
            }


        loadData()


        return () =>
            controller.abort()

    }, [
        enabled,
        paramsKey,
        reloadKey
    ])

    return {
        items,
        loading,
        error,
        totalResults,
        totalPages,
        currentPage,
        reload
    }
}