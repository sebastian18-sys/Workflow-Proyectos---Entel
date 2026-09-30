import { api } from "../../../../lib/axios"

export const putWorkflow = async(workflowId, data) => {
    const result = await api.patch(`/projects/workflows/workflows/${workflowId}`, data)
    return result.data
}

export const putWorkflowGraph = async(versionId, data) => {
    const result = await api.patch(`/projects/workflows/workflow-versions/${versionId}/graph`, data)
    return result.data
}

export const putPublishWorkflowVersion = async(versionId, data = {}) => {
    const result = await api.patch(`/projects/workflows/workflow-versions/${versionId}/publish`, data)
    return result.data
}

export const putArchiveWorkflowVersion = async(versionId, data = {}) => {
    const result = await api.patch(`/projects/workflows/workflow-versions/${versionId}/archive`, data)
    return result.data
}