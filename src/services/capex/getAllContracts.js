import { api } from "../../lib/axios"

const cleanParams = (params = {}) => {

    return Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    )
}

export const getAllContracts = (filters = {}, config = {}) => {
    // return api.get("/providers/contracts/get-pa-contracts").then(res => res.data)
    return api
        .get("/providers/contracts/get-pa-contracts", {
            ...config,
            params: cleanParams(filters),
        })
        .then(res => res.data)
}

export const getContractsTable = (params = {}, config = {}) => {

    return api
        .get("/providers/contracts/get-pa-contracts-q2", {
            ...config,
            params,
        })
        .then(res => res.data)
}