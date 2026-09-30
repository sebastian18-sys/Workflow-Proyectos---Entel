import { api } from "../../lib/axios"

export const getSolicitadoByKey = () => {
    return api.get("/providers/budget/get-site/amount-by-key").then(res => res.data)
}