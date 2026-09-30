import { api } from "../../../../lib/axios"

export const postComment = async(instanceId, data) => {
    const result = await api.post(`/projects/comments/instances/${instanceId}/comments`, data)
    return result.data
}