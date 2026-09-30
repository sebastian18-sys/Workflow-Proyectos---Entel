import { api } from "../../lib/axios"

const cleanParams = (params = {}) => {

    return Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    )
}

export const getAllTicketsSites = (filters = {}, config = {}) => {
    // return api.get("/providers/budget/get-sites").then(res => res.data)
    return api
        .get("/providers/budget/get-sites", {
            ...config,
            params: cleanParams(filters),
        })
        .then(res => res.data)
}