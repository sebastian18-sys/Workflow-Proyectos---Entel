import { api } from "../../lib/axios"

export const getOCbyProjects = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-oc-sites-test", {
            ...config,
            params,
        })
        .then(res => res.data)
}