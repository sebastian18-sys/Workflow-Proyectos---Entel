import { api } from "../../lib/axios"

// const cleanParams = (params = {}) => {

//     return Object.fromEntries(
//         Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
//     )
// }

export const getPayments = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-payments", {
            ...config,
            params,
        })
        .then(res => res.data)
}