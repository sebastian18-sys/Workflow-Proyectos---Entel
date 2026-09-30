import {
    useCallback,
    useEffect,
    useState
} from "react"
import { getInstanceDetail } from "@/services/projects/wf/instances/getInstances"


export const useSiteDetails = (
    instanceId
) => {

    const [data, setData] = useState(null)
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

        if (!instanceId) return 
        const controller = new AbortController()

        const loadData =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const res = await getInstanceDetail(
                        instanceId,
                        {
                            signal: controller.signal
                        }
                    )

                    if (controller.signal.aborted) return
                    setData(res?.content || null)

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
        instanceId,
        reloadKey
    ])


    return {
        data,
        site: data?.site || null,
        instance: data?.instance || null,
        loading,
        error,
        reload
    }
}