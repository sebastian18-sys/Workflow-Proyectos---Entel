import { api } from "../../../../lib/axios"

export const deleteWorkflow = async(workflowId) => {    //OK
    const result = await api.delete(`/projects/workflows/workflows/${workflowId}`)
    return result.data
}

export const deleteWorkflowVersion = async(versionId) => { //NOK
    const result = await api.delete(`/projects/workflows/workflow-versions/${versionId}`)
    return result.data
}