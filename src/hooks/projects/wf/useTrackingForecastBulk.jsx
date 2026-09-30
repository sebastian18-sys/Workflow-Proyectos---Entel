import { getTrackingForecastBulkTemplate } from "@/services/projects/wf/tracking/getTracking"
import { postTrackingForecastBulkImport } from "@/services/projects/wf/tracking/postTracking"
import { useCallback, useState } from "react"

export function useTrackingForecastBulk() {
    const [downloading, setDownloading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState(null)

    const getTemplate = useCallback(async(params = {}) => {
        try {
            setDownloading(true)
            setError(null)
            const response = await getTrackingForecastBulkTemplate(params)
            return response?.content || {}
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "No se pudo obtener el formato")
            throw e
        } finally {
            setDownloading(false)
        }
    }, [])

    const importForecasts = useCallback(async(data = {}) => {
        try {
            setImporting(true)
            setError(null)
            const response = await postTrackingForecastBulkImport(data)
            return response?.content || {}
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "No se pudo importar el FCST PM")
            throw e
        } finally {
            setImporting(false)
        }
    }, [])

    return { 
        downloading, 
        importing, 
        error, 
        getTemplate, 
        importForecasts 
    }
}