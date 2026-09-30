import { api } from "@/lib/axios"

export const getSettlementsSites = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-settlements-sites", {
            ...config,
            params,
        })
        .then(res => res.data)
}