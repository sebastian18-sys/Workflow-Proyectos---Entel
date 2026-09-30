import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"
import { getTrackingFlow } from "@/services/projects/wf/tracking/getTracking"


export const useTrackingFlow = ({
    workflow_code = "",
    workflow_version = "",
    enabled = true
} = {}) => {

    const [workflow, setWorkflow] = useState({ nodes: [], edges: [] })

    const [counts, setCounts] = useState({})
    const [totalSites, setTotalSites] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
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
                workflow_version
            }),
            [
                workflow_code,
                workflow_version
            ]
        )

    useEffect(() => {

        if (!enabled || !workflow_code) {
            return
        }

        const controller = new AbortController()

        const load =
            async() => {

                try {

                    setLoading(true)
                    setError(null)
                    const res = await getTrackingFlow(params, { signal: controller.signal })

                    if (controller.signal.aborted) {
                        return
                    }

                    const content = res?.content || {}

                    setWorkflow({
                        version_id: content.workflow?.version_id || null,
                        version: content.workflow?.version || null,
                        nodes: content.workflow?.nodes || [],
                        edges: content.workflow?.edges || []
                    })
                    setCounts(content.counts || {})
                    setTotalSites(content.total_sites || 0)

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
        workflow_code,
        reloadKey
    ])

    return {
        workflow,
        nodes: workflow.nodes,
        edges: workflow.edges,
        counts,
        totalSites,
        loading,
        error,
        reload
    }
}