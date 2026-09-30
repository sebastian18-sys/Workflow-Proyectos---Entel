import { api } from "../../../../lib/axios"

export const deleteTask = async(taskId) => {
    const result = await api.delete(`projects/tasks/tasks/${taskId}`)
    return result.data
}

export const deleteSubtask = async(taskId, subtaskKey) => {
    const result = await api.delete(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}`)
    return result.data
}

export const deleteSubtaskField = async(taskId, subtaskKey, fieldKey) => {
    const result = await api.delete(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}/fields/${fieldKey}`)
    return result.data
}

export const deleteSubtaskState = async(taskId, subtaskKey, stateKey) => {
    const result = await api.delete(`projects/tasks/tasks/${taskId}/subtasks/${subtaskKey}/states/${stateKey}`)
    return result.data
}