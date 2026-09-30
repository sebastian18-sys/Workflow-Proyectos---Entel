import { api } from "../../../../lib/axios"

export const putSubtaskState = async(instanceId, taskCode, subtaskKey, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/tasks/${taskCode}/subtasks/${subtaskKey}/state`, data)
    return result.data
}

export const putSubtaskAssignees = async(instanceId, taskCode, subtaskKey, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/tasks/${taskCode}/subtasks/${subtaskKey}/assignees`, data)
    return result.data
}

export const putInstanceCancel = async(instanceId, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/cancel`, data)
    return result.data
}

export const putTaskOpen = async(instanceId, taskCode, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/tasks/${taskCode}/open`, data)
    return result.data
}

export const putTaskReopen = async(instanceId, taskCode, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/tasks/${taskCode}/reopen`, data)
    return result.data
}

export const putWorkflowStartDate = async(instanceId, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/start-date`, data)
    return result.data
}

export const putSubtaskFormData = async(instanceId, taskCode, subtaskKey, data) => {
    const result = await api.patch(`/projects/instances/instances/${instanceId}/tasks/${taskCode}/subtasks/${subtaskKey}/form-data`, data)
    return result.data
}