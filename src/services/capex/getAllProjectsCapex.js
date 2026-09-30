import { api } from "../../lib/axios"

export const getAllProjectsCapex = () => {
    return api.get("/providers/budget/get-projects").then(res => res.data)
}

export const getProjectsCapex = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-projects-q", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getAllProjectsByLlaveCapex = () => {
    return api.get("/providers/budget/get-projects-llave").then(res => res.data)
}