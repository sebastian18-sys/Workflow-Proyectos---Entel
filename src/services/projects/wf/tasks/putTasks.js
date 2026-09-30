import { api } from "../../../../lib/axios"

export const putTask = async(taskId, data) => {
    const result = await api.patch(`projects/tasks/tasks/${taskId}`, data)
    return result.data
}

export const putSubtask = async(taskId, subtaskKey, data) => {
    const result = await api.patch(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}`, data)
    return result.data
}

export const putSubtasksOrder = async(taskId, data) => {
    const result = await api.patch(`projects/tasks/tasks/${taskId}/subtasks-order`, data)
    return result.data
}

export const putSubtaskField = async(taskId, subtaskKey, fieldKey, data) => {
    const result = await api.patch(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}/fields/${fieldKey}`, data)
    return result.data
}

export const putSubtaskState = async(taskId, subtaskKey, stateKey, data) => {
    const result = await api.patch(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}/states/${stateKey}`, data)
    return result.data
}