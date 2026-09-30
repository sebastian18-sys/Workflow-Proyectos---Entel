import { useEffect, useState } from "react"
import { getSites } from "@/services/projects/wf/batches/getBatches"
import { postSite } from "@/services/projects/wf/batches/postBatches"
import { deleteSite } from "@/services/projects/wf/batches/deleteBatches"

export const useSites = ({
    page = 1, 
    limit = 20, 
    search = "", 
    site_id = "", 
    identificador = "",
    macro_project = "", 
    sub_project = "", 
    site,
    tower = "",
    project_type = "", 
    status = ""
} = {}) => {

    const [sites, setSites] = useState([])
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
                    page, limit, search, site_id, identificador,
                    macro_project, sub_project, site,
                    tower, project_type, status
                }

                const res = await getSites(params, { signal: controller.signal })

                if (controller.signal.aborted) return

                setSites(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                setError(err)
                setSites([])
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [
        page, limit, search, site_id, identificador,
        macro_project, sub_project, site,
        tower, project_type, status
    ])

    const addSite = async(data) => postSite(data)
    const removeSite = async(id) => deleteSite(id)

    

    return {
        sites, loading, totalResults, totalPages, error,
        addSite, removeSite
    }
}