import { api } from "../../../../lib/axios"

export const deleteBatch = async(batchId) => {
    const result = await api.delete(`/projects/batches/batches/${batchId}`)
    return result.data
}

export const deleteSite = async(siteId) => {
    const result = await api.delete(`/projects/batches/sites/${siteId}`)
    return result.data
}