import { getForecastHistory } from "@/services/projects/wf/forecasts/getForecasts"

export const useForecastHistory = (
    instanceId,
    params = {},
    enabled = true
) => {

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {

        if (!instanceId || !enabled) {
            return
        }

        const controller = new AbortController()

        const load =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const res =
                        await getForecastHistory(
                            instanceId,
                            params,
                            {
                                signal: controller.signal
                            }
                        )


                    if (controller.signal.aborted) {
                        return
                    }

                    setHistory(
                        res?.content?.items ||
                        res?.content ||
                        []
                    )

                } catch (err) {

                    if (!controller.signal.aborted) {
                        setError(err)
                    }

                } finally {

                    if (!controller.signal.aborted) {
                        setLoading(false)
                    }
                }
            }

        load()

        return () => controller.abort()

    }, [
        instanceId,
        enabled,
        JSON.stringify(params)
    ])

    return {
        history,
        loading,
        error
    }
}