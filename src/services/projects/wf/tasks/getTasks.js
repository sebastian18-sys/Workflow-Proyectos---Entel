import { api } from "../../../../lib/axios"

export const getTasks = (params = {}, config = {}) =>
    api.get(`projects/tasks/tasks`, { ...config, params }).then(res => res.data)

export const getTaskById = (taskId, config = {}) =>
    api.get(`projects/tasks/tasks/${taskId}`, config).then(res => res.data)