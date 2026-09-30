import { api } from "../../../../lib/axios"

export const putTaskForecast = async(instanceId, taskCode, data) => {
    const result = await api.patch(`/projects/forecast/instances/${instanceId}/tasks/${taskCode}/forecast`, data)
    return result.data
}

export const putForecastBulk = async(data) => {
    const result = await api.patch(`/projects/forecast/forecasts/bulk`, data)
    return result.data
}