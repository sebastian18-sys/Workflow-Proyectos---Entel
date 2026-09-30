import { api } from "../../lib/axios"

export const getSummaryByPa = () => {
    return api.get("/providers/budget/get-rq/pa-by-ticket").then(res => res.data)
}