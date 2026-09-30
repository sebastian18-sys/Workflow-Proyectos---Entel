import { api } from "../../../../lib/axios"

export const postTask = async(data) => {
    const result = await api.post(`projects/tasks/tasks`, data)
    return result.data
}

export const postSubtask = async(taskId, data) => {
    const result = await api.post(`projects/tasks/tasks/${taskId}/subtasks`, data)
    return result.data
}

export const postSubtaskField = async(taskId, subtaskKey, data) => {
    const result = await api.post(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}/fields`, data)
    return result.data
}

export const postSubtaskState = async(taskId, subtaskKey, data) => {
    const result = await api.post(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}/states`, data)
    return result.data
}