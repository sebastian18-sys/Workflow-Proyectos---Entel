import { useEffect, useState } from "react"
import { getInstanceForecasts, getForecastHistory } from "@/services/projects/wf/forecasts/getForecasts"
import { putTaskForecast, putForecastBulk } from "@/services/projects/wf/forecasts/putForecasts"

export const useForecasts = ({
    instanceId = "", 
    mode = "CURRENT",
    page = 1, 
    limit = 20, 
    search = "",
    task_code = "", 
    performed_by = "", 
    forecast_type = "",
    date_from = "", 
    date_to = ""
} = {}) => {
    
    const [items, setItems] = useState([])
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

                if (mode === "HISTORY") {
                    const res = await getForecastHistory(instanceId, {
                        page, limit, search, task_code,
                        performed_by, forecast_type, date_from, date_to
                    }, { signal: controller.signal })

                    if (controller.signal.aborted) return

                    setItems(res?.content?.items || [])
                    setTotalResults(res?.content?.totalResults || 0)
                    setTotalPages(res?.content?.totalPages || 0)
                    return
                }

                const res = await getInstanceForecasts(instanceId, {
                    signal: controller.signal
                })

                if (!controller.signal.aborted) {
                    setItems(res?.content?.items || [])
                }
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
        instanceId, mode, page, limit, search,
        task_code, performed_by, forecast_type,
        date_from, date_to
    ])

    const updateForecast = async(instanceId, taskCode, data) =>
        putTaskForecast(instanceId, taskCode, data)

    const updateForecastBulk = async(data) =>
        putForecastBulk(data)

    return {
        items, loading, totalResults, totalPages, error,
        updateForecast, updateForecastBulk
    }
}