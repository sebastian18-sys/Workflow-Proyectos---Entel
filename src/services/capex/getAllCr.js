import { api } from "../../lib/axios"

export const getAllCr = () => {
    return api.get("/providers/budget/cr-individual").then(res => res.data)
}

export const getCrTable = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/cr-individual-q", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getCRbyOC = async (oc) => {

    return api.get(`/providers/budget/cr-detalles-line-oc`, {
        params: {
            oc: oc
        }
    }).then(res => res.data)
}