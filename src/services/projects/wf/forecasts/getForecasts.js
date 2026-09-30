import { api } from "../../../../lib/axios"

export const getInstanceForecasts = (instanceId, config = {}) =>
    api.get(`/projects/forecast/instances/${instanceId}/forecasts`, config).then(res => res.data)

export const getForecastHistory = (instanceId, params = {}, config = {}) =>
    api.get(`/projects/forecast/instances/${instanceId}/forecasts/history`, { ...config, params }).then(res => res.data)