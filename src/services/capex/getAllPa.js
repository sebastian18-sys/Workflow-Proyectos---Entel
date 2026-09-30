import { api } from "../../lib/axios"

export const getAllPa = () => {
    return api.get("/providers/budget/get-rq/pa-by-supplier").then(res => res.data)
}