import {
    useCallback,
    useEffect,
    useState
} from "react"
import { getEvents } from "@/services/projects/wf/events/getEvents"

export const useSiteEvents = (
    instanceId,
    params = {},
    enabled = true
) => {

    const [events, setEvents] = useState([])
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

    const paramsKey = JSON.stringify(params)

    useEffect(() => {
        if (!instanceId || !enabled) return

        const controller = new AbortController()

        const loadData =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const res = await getEvents(
                        instanceId,
                        params,
                        {
                            signal: controller.signal
                        }
                    )

                    if (controller.signal.aborted) return
                    const content = res?.content

                    setEvents(
                        Array.isArray(content)
                            ? content
                            : content?.items ||
                              []
                    )

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
        paramsKey,
        enabled,
        reloadKey
    ])

    return {
        events,
        loading,
        error,

        reload
    }
}