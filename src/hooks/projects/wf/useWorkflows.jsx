import { useEffect, useState } from "react"
import { getWorkflowById, getWorkflows, getWorkflowVersionById, getWorkflowVersions } from "@/services/projects/wf/workflows/getWorkflows"
import { postWorkflow, postWorkflowVersion, postDuplicateWorkflow } from "@/services/projects/wf/workflows/postWorkflows"
import { 
    putWorkflow, 
    putWorkflowGraph, 
    putPublishWorkflowVersion, 
    putArchiveWorkflowVersion 
} from "@/services/projects/wf/workflows/putWorkflows"
import { deleteWorkflow, deleteWorkflowVersion } from "@/services/projects/wf/workflows/deleteWorkflows"

export const useWorkflows = ({
    page = 1, 
    limit = 10, 
    search = "", 
    sortBy = "updatedAt", 
    sortDirection = "desc",
    workflow_id = "", 
    workflow_code = "", 
    status = "", 
    project_type_id = ""
} = {}) => {
    
    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState(null)

    useEffect(() => {

        const controller = new AbortController()

        const loadData = async() => {
            try {
                setLoading(true)
                setError(null)

                const params = {
                    page, limit, search, sortBy, sortDirection,
                    workflow_id, workflow_code, status, project_type_id
                }

                const res = await getWorkflows(params, { signal: controller.signal })
                if (controller.signal.aborted) return

                setWorkflows(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                console.error("Error useWorkflows:", err)
                setError(err)
                setWorkflows([])
                setTotalResults(0)
                setTotalPages(0)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [page, limit, search, sortBy, sortDirection, workflow_id, workflow_code, status, project_type_id])


    const getWorkflow = async(id) => {
        try {
            return await getWorkflowById(id)
        } catch (error) {
            console.error("Error getWorkflow:", error)
            throw error
        }
    }

    const getVersions = async(id, params = {}) => {
        try {
            return await getWorkflowVersions(id, params)
        } catch (error) {
            console.error("Error getVersions:", error)
            throw error
        }
    }

    const getVersion = async(id) => {
        try {
            return await getWorkflowVersionById(id)
        } catch (error) {
            console.error("Error getVersion:", error)
            throw error
        }
    }


    const addWorkflow = async(data) => postWorkflow(data)
    const addVersion = async(id, data) => postWorkflowVersion(id, data)
    const duplicateWorkflow = async(id, data) => postDuplicateWorkflow(id, data)
    const updateWorkflow = async(id, data) => putWorkflow(id, data)
    const updateGraph = async(id, data) => putWorkflowGraph(id, data)
    const publishVersion = async(id, data) => putPublishWorkflowVersion(id, data)
    const archiveVersion = async(id, data) => putArchiveWorkflowVersion(id, data)
    const removeWorkflow = async(id) => deleteWorkflow(id)
    const removeVersion = async(id) => deleteWorkflowVersion(id)

    return {
        workflows, loading, totalResults, totalPages, error,
        getWorkflow, getVersions, getVersion,
        addWorkflow, addVersion, duplicateWorkflow, updateWorkflow,
        updateGraph, publishVersion, archiveVersion, removeWorkflow, removeVersion
    }
}