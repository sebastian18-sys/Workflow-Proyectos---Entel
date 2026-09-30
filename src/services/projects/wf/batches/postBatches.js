import { api } from "../../../../lib/axios"

export const postValidateBatch = async(data) => {
    const result = await api.post(`/projects/batches/batches/validate`, data)
    return result.data
}

export const postBatch = async(data) => {
    const result = await api.post(`/projects/batches/batches`, data)
    return result.data
}

export const postLaunchBatch = async(batchId, data = {}) => {
    const result = await api.post(`/projects/batches/batches/${batchId}/launch`, data)
    return result.data
}

export const postSite = async(data) => {
    const result = await api.post(`/projects/batches/sites`, data)
    return result.data
}