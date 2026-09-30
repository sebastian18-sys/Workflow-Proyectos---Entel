import { api } from "@/lib/axios"

export const getDeliverables = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-deliverables", {
            ...config,
            params,
        })
        .then(res => res.data)
}