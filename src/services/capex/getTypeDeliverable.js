import { api } from "@/lib/axios"

export const getTypeDeliverable = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-types-deliverables", {
            ...config,
            params,
        })
        .then(res => res.data)
}