import { api } from "@/lib/axios"

export const getPaymentsSites = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-payments-sites", {
            ...config,
            params,
        })
        .then(res => res.data)
}