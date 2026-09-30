import { api } from "../../../../lib/axios"

export const getTracking = (params = {}, config = {}) =>
    api.get(`/projects/tracking/tracking`, { ...config, params }).then(res => res.data)

export const getTrackingFlow = (params = {}, config = {}) =>
    api.get(`/projects/tracking/tracking/flow`, { ...config, params }).then(res => res.data)

export const getTrackingMonthly = (params = {}, config = {}) =>
    api.get(`/projects/tracking/tracking/monthly`, { ...config, params }).then(res => res.data)

export const getTrackingStandby = (params = {}, config = {}) =>
    api.get(`/projects/tracking/tracking/standby`, { ...config, params }).then(res => res.data)

export const getTrackingSummary = async(params = {}) => {
    const query = {
        ...params,
        column_filters: Object.keys(params.column_filters ||{}).length
            ? JSON.stringify(params.column_filters)
            : undefined
    }

    const result = await api.get("/projects/tracking/tracking/site-summary", { params: query })
    return result.data
}

export const getTrackingForecastBulkTemplate = (params = {}, config = {}) =>
    api.get("/projects/tracking/tracking/forecast-bulk/template", { ...config, params }).then(res => res.data)

export const getTrackingReport = (params = {}, config = {}) =>
    api.get(`/projects/tracking/tracking/report`, { ...config, params }).then(res => res.data)