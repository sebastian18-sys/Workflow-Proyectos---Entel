import { api } from "../../../../lib/axios"

export const getInstances = (params = {}, config = {}) =>
    api.get(`/projects/instances/instances`, { ...config, params }).then(res => res.data)

export const getInstanceById = (instanceId, config = {}) =>
    api.get(`/projects/instances/instances/${instanceId}`, config).then(res => res.data)

export const getInstanceDetail = (instanceId, config = {}) =>
    api.get(`/projects/instances/instances/${instanceId}/detail`, config).then(res => res.data)

export const getInstanceJourney = (instanceId, config = {}) =>
    api.get(`/projects/instances/instances/${instanceId}/journey`, config).then(res => res.data)

export const getInstanceParticipants = (instanceId, config = {}) =>
    api.get(`/projects/instances/instances/${instanceId}/participants`, config).then(res => res.data)