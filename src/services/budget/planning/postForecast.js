import { api } from "../../../lib/axios"

export const postForecast = async (fd) => {
    const result = await api.post("/providers/forecast/insert-forecast-template", fd)

    return result.data

}