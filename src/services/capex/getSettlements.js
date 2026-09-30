import { api } from "@/lib/axios"

export const getSettlements = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-settlements", {
            ...config,
            params,
        })
        .then(res => res.data)
}