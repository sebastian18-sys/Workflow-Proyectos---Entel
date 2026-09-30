import { api, apiPython } from "../../lib/axios"

export const getAllOpex = () => {
    return api.get("/providers/budget/get-opex").then(res => res.data)
}

export const getAllOpexEstimaciones = () => {
    return api.get("/providers/budget/get-opex-estimacion").then(res => res.data)
}