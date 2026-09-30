import { api } from "../../lib/axios"

export const getSummaryByKey = () => {
    return api.get("/providers/budget/get-sites/summary-by-llave").then(res => res.data)
}