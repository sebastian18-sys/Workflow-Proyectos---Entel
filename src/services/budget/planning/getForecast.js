import { api } from "../../../lib/axios"

export const getForecast = (params = {}, config = {}) => {

    return api
        .get("/providers/forecast/get-forecasts", {
            ...config,
            params,
        })
        .then(res => res.data)
}