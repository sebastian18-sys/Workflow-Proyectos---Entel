import { api } from "../../../../lib/axios"

export const getComments = (instanceId, params = {}, config = {}) =>
    api.get(`/projects/comments/instances/${instanceId}/comments`, { ...config, params }).then(res => res.data)

export const getCommentParticipants = (instanceId, config = {}) =>
    api.get(`/projects/comments/instances/${instanceId}/participants`, config).then(res => res.data)