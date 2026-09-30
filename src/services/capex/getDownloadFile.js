import { api } from "../../lib/axios"

const cleanParams = (params = {}) => {

    return Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    )
}

export const getDownloadFile = (filters = {}, config = {}) => {

    console.log("FILTROS", filters)

    return api
        .get("/providers/budget/download-ticket-file", {
            ...config,
			responseType: "blob",
            params: cleanParams(filters)
        })
        .then(res => res.data)
}

export const getDownloadAll = (filters = {}, config = {}) => {
    return api
        .get("/providers/budget/download-ticket-all-sustentos-file", {
            ...config,
			responseType: "blob",
            params: cleanParams(filters)
        })
        .then(res => res.data)
}

export const getDownloadCrFile = (filters = {}, config = {}) => {

    return api
        .get("/providers/budget/download-cr-file", {
            ...config,
			responseType: "blob",
            params: cleanParams(filters)
        })
        .then(res => res.data)
}

export const getDownloadDeliverable = (filters = {}, config = {}) => {

    return api
        .get("/providers/budget/download-deliverable-file", {
            ...config,
			responseType: "blob",
            params: cleanParams(filters)
        })
        .then(res => res.data)
}