import { api } from "../../../../lib/axios"

// export const getWorkflows = (params = {}, config = {}) => {

//     return api
//         .get("/projects/workflows/workflows", {
//             ...config,
//             params,
//         })
//         .then(res => res.data)
// }

export const getWorkflows = (params = {}, config = {}) =>
    api.get(`/projects/workflows/workflows`, { ...config, params }).then(res => res.data)

export const getWorkflowById = (workflowId, config = {}) =>
    api.get(`/projects/workflows/workflows/${workflowId}`, config).then(res => res.data)

export const getWorkflowVersions = (workflowId, params = {}, config = {}) =>
    api.get(`/projects/workflows/workflows/${workflowId}/versions`, { ...config, params }).then(res => res.data)

export const getWorkflowVersionById = (versionId, config = {}) =>
    api.get(`/projects/workflows/workflow-versions/${versionId}`, config).then(res => res.data)