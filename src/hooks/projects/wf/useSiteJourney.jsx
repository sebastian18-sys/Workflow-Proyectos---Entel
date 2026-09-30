
import {
    useCallback,
    useEffect,
    useState
} from "react"
import { getInstanceJourney } from "@/services/projects/wf/instances/getInstances"

export const useSiteJourney = (
    instanceId,
    enabled = true
) => {

    const [workflow, setWorkflow] = useState({
        nodes: [],
        edges: []
    })

    const [runtime, setRuntime] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)


    const reload =
        useCallback(() => {
            setReloadKey(
                prev => prev + 1
            )
        }, [])


    useEffect(() => {

        if (!instanceId || !enabled) return

        const controller = new AbortController()

        const loadData =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const res = await getInstanceJourney(instanceId, { signal: controller.signal })

                    if (controller.signal.aborted) return
                    const content = res?.content || {}

                    setWorkflow({
                        nodes: content.workflow?.nodes || [],
                        edges: content.workflow?.edges || []
                    })

                    setRuntime(content.runtime || [])

                } catch (err) {
                    if (controller.signal.aborted) return
                    setError(err)
                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false)
                    }
                }
            }

        loadData()
        return () => controller.abort()

    }, [
        instanceId,
        enabled,
        reloadKey
    ])

    return {
        workflow,
        nodes: workflow.nodes,
        edges: workflow.edges,
        runtime,
        loading,
        error,
        reload
    }
}