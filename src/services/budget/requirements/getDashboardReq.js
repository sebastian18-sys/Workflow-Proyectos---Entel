import { api } from "../../../lib/axios"

export const getDashboardReq = (params = {}, config = {}) => {

    return api
        .get("/providers/requirements/get-dashboard-requirements", {
            ...config,
            params,
        })
        .then(res => res.data)
}