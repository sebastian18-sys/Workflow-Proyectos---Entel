import { api } from "../../../lib/axios"

export const getDashboardReqFilters = (params = {}, config = {}) => {

    return api
        .get("/providers/requirements/get-requirements-dashboard-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}