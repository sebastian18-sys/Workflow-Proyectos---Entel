import { api } from "../../../../lib/axios"

export const postWorkflow = async(data) => {
    const result = await api.post(`/projects/workflows/workflows`, data)
    return result.data
}

export const postWorkflowVersion = async(workflowId, data) => {
    const result = await api.post(`/projects/workflows/workflows/${workflowId}/versions`, data)
    return result.data
}

export const postDuplicateWorkflow = async(workflowId, data = {}) => {
    const result = await api.post(`/projects/workflows/workflows/${workflowId}/duplicate`, data)
    return result.data
}