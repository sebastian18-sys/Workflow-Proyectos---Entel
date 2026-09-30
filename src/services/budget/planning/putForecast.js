import { api } from "../../../lib/axios"

export const putForecast = async (fd) => {
    const result = await api.patch(`/providers/forecast/forecast/update/projects`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}