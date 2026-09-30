import { api } from "../../../../lib/axios"

export const getInbox = (params = {}, config = {}) =>
    api.get(`/projects/inbox/inbox`, { ...config, params }).then(res => res.data)

export const getInboxKanban = (params = {}, config = {}) =>
    api.get(`/projects/inbox/inbox/kanban`, { ...config, params }).then(res => res.data)

export const getInboxHistory = (params = {}, config = {}) =>
    api.get(`/projects/inbox/inbox/history`, { ...config, params }).then(res => res.data)

export const getInboxMonthly = (params = {}, config = {}) =>
    api.get(`/projects/inbox/inbox/monthly`, { ...config, params }).then(res => res.data)