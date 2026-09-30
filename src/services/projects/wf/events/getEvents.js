import { api } from "../../../../lib/axios"

export const getEvents = (instanceId, params = {}, config = {}) =>
    api.get(`/projects/events/instances/${instanceId}/events`, { ...config, params }).then(res => res.data)