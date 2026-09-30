import { api } from "../lib/axios"

export const getOCOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-oc-sites-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getTicketOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-tickets-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getPAOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/contracts/get-pa-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getRQOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-rqs-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getProjectOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-projects-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getCROptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-crs-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getPaymentsOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-payments-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getSettlementOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-settlements-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getDeliverablesOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/get-deliverables-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getForecastsOptions = (params = {}, config = {}) => {

    return api
        .get("/providers/forecast/get-forecast-filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getWorkflowsOptions = (params = {}, config = {}) => {

    return api
        .get("/projects/workflows/workflows/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getTasksOptions = (params = {}, config = {}) => {

    return api
        .get("/projects/tasks/tasks/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getInboxOptions = (params = {}, config = {}) => {
    return api
        .get("/projects/inbox/inbox/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getTrackingOptions = (params = {}, config = {}) => {
    return api
        .get("/projects/tracking/tracking/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getTrackingMonthlyOptions = (params = {}, config = {}) => {
    return api
        .get("/projects/tracking/tracking/monthly/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getTrackingStandbyOptions = (params = {}, config = {}) => {
    return api
        .get("/projects/tracking/tracking/standby/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getBulkOptions = (params = {}, config = {}) => {
    return api
        .get("/projects/bulk/bulk-completion/filter-options", {
            ...config,
            params,
        })
        .then(res => res.data)
}