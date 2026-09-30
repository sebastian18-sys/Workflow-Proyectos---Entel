import {
    useCallback,
    useEffect,
    useState
} from "react"

import { getInstanceForecasts } from "@/services/projects/wf/forecasts/getForecasts"
import { putTaskForecast } from "@/services/projects/wf/forecasts/putForecasts"

export const useInstanceForecasts = (
    instanceId,
    {
        enabled = true
    } = {}
) => {

    const [forecasts, setForecasts] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    const reload =
        useCallback(() => {
            setReloadKey(
                prev =>
                    prev + 1
            )
        }, [])


    useEffect(() => {
        if (!instanceId || !enabled
        ) {
            return
        }

        const controller = new AbortController()

        const loadData =
            async() => {

                try {
                    setLoading(true)
                    setError(null)
                    const res =
                        await getInstanceForecasts(
                            instanceId,
                            {
                                signal: controller.signal
                            }
                        )


                    if (controller.signal.aborted) {
                        return
                    }

                    const content = res?.content

                    setForecasts(
                        Array.isArray(content)
                            ? content
                            : content?.items ||
                              content?.forecasts ||
                              []
                    )

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
        return () => controller.abort()

    }, [
        instanceId,
        enabled,
        reloadKey
    ])

    const updateForecast =
        useCallback(
            async(taskCode, data) => {

                if (!instanceId || !taskCode) return null

                try {

                    setSaving(true)
                    setError(null)

                    const res = await putTaskForecast(
                        instanceId,
                        taskCode,
                        data
                    )

                    reload()

                    return (
                        res?.content ||
                        null
                    )
                } catch (err) {
                    setError(err)
                    throw err
                } finally {
                    setSaving(false)
                }
            },
            [
                instanceId,
                reload
            ]
        )


    return {
        forecasts,
        loading,
        saving,
        error,
        reload,
        updateForecast
    }
}