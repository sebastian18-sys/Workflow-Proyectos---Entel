import { api } from "../../../../lib/axios"

export const postTrackingForecastBulkImport = (data = {}, config = {}) =>
    api.post("/projects/tracking/tracking/forecast-bulk/import", data, config).then(res => res.data)