import { api } from "../../../../lib/axios"

export const putBulkCompletion = async(data) => {
    const result = await api.patch(`/projects/bulk/bulk-completion`, data)
    return result.data
}