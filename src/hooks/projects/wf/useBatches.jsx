import { useEffect, useState } from "react"
import { getBatches } from "@/services/projects/wf/batches/getBatches"
import { postValidateBatch, postBatch, postLaunchBatch } from "@/services/projects/wf/batches/postBatches"
import { deleteBatch } from "@/services/projects/wf/batches/deleteBatches"

export const useBatches = ({
    page = 1, 
    limit = 20, 
    search = "", 
    batch_id = "", 
    status = "",
    workflow_code = "", 
    project_type = ""
} = {}) => {
    
    const [batches, setBatches] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState(null)

    useEffect(() => {
        const controller = new AbortController()

        const loadData = async() => {
            try {
                setLoading(true)

                const params = {
                    page, limit, search, batch_id, status, workflow_code, project_type
                }

                const res = await getBatches(params, { signal: controller.signal })

                if (controller.signal.aborted) return

                setBatches(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                setError(err)
                setBatches([])
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [page, limit, search, batch_id, status, workflow_code, project_type])

    const validateBatch = async(data) => postValidateBatch(data)
    const addBatch = async(data) => postBatch(data)
    const launchBatch = async(id, data) => postLaunchBatch(id, data)
    const removeBatch = async(id) => deleteBatch(id)

    return {
        batches, loading, totalResults, totalPages, error,
        validateBatch, addBatch, launchBatch, removeBatch
    }
}