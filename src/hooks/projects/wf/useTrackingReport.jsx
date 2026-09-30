
import { useCallback, useState } from "react"
import { getTrackingReport } from "@/services/projects/wf/tracking/getTracking"


export function useTrackingReport() {
    const [downloading, setDownloading] = useState(false)

    const downloadReport = useCallback(async(params = {}) => {
        try {
            setDownloading(true)

            const response = await getTrackingReport(params)

            if (response?.result !== "OK") {
                throw new Error(
                    response?.message ||
                    "No se pudo obtener el reporte"
                )
            }

            return response.content
        } finally {
            setDownloading(false)
        }
    }, [])

    return {
        downloading,
        downloadReport
    }
}