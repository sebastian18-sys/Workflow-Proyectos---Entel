import { api } from "../../lib/axios"

export const getAverageWeekReq = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-oc-sites-weekly-velocity", {
            ...config,
            params,
        })
        .then(res => res.data)
}