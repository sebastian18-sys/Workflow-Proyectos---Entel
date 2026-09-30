import { api } from "../../../../lib/axios"

export const getBatches = (params = {}, config = {}) =>
    api.get(`/projects/batches/batches`, { ...config, params }).then(res => res.data)

export const getBatchById = (batchId, config = {}) =>
    api.get(`/projects/batches/batches/${batchId}`, config).then(res => res.data)

export const getSites = (params = {}, config = {}) =>
    api.get(`/projects/batches/sites`, { ...config, params }).then(res => res.data)

export const getSiteById = (siteId, config = {}) =>
    api.get(`/projects/batches/sites/${siteId}`, config).then(res => res.data)