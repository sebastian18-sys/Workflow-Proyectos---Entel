import { api } from "../../lib/axios"

// export const getAllTickets = () => {
//     return api.get("/providers/budget/get-tickets").then(res => res.data)
// }

const cleanParams = (params = {}) => {

    return Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    )
}

export const getAllTickets = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-tickets-q", {
            ...config,
            params,
        })
        .then(res => res.data)
}

// export const getOCbyProjects = (params = {}, config = {}) => {

//     return api
//         .get("/providers/budget/get-oc-sites", {
//             ...config,
//             params,
//         })
//         .then(res => res.data)
// }
