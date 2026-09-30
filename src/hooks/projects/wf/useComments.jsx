import { useEffect, useState } from "react"
import { getComments } from "@/services/projects/wf/comments/getComments"
import { postComment } from "@/services/projects/wf/comments/postComments"

export const useComments = ({
    instanceId = "",
    page = 1, 
    limit = 30,
    search = "", 
    user_id = "",
    task_code = "",
    task_name = "", 
    mention_user_id = "",
    date_from = "", 
    date_to = ""
} = {}) => {
    
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!instanceId) return

        const controller = new AbortController()

        const loadData = async() => {
            try {
                setLoading(true)

                const params = {
                    page, limit, search, user_id, task_code, task_name,
                    mention_user_id, date_from, date_to
                }

                const res = await getComments(instanceId, params, { signal: controller.signal })

                if (controller.signal.aborted) return

                setComments(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                setError(err)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [
        instanceId, page, limit, search, user_id, task_code, task_name,
        mention_user_id, date_from, date_to
    ])

    const addComment = async(data) =>
        postComment(instanceId, {...data, task_code, task_name})

    return {
        comments, loading,
        totalResults, totalPages, error,
        addComment
    }
}