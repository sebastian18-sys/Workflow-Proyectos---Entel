import { api } from "@/lib/axios"

export const getTypeDeliverableFields = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-types-deliverables-fields", {
            ...config,
            params,
        })
        .then(res => res.data)
}