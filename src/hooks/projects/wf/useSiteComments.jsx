import {
    useCallback,
    useEffect,
    useState
} from "react"
import { getCommentParticipants, getComments } from "@/services/projects/wf/comments/getComments"
import { postComment } from "@/services/projects/wf/comments/postComments"
import { getInstanceParticipants } from "@/services/projects/wf/instances/getInstances"


export const useSiteComments = (
    instanceId,
    {
        params = {},
        enabled = true
    } = {}
) => {

    const [comments, setComments] = useState([])
    const [participants, setParticipants] = useState([])

    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    const reload =
        useCallback(() => {
            setReloadKey(
                prev =>
                    prev + 1
            )
        }, [])


    const paramsKey = JSON.stringify(params)

    useEffect(() => {

        if (!instanceId || !enabled) return

        const controller = new AbortController()

        const loadData =
            async() => {

                try {

                    setLoading(true)
                    setError(null)

                    const [commentsRes, participantsRes] =
                        await Promise.all([
                            getComments(
                                instanceId,
                                params,
                                {
                                    signal: controller.signal
                                }
                            ),

                            getInstanceParticipants(
                                instanceId,
                                {
                                    signal: controller.signal
                                }
                            )
                        ])


                    if (controller.signal.aborted) return

                    const commentsContent = commentsRes?.content

                    setComments(
                        Array.isArray(commentsContent)
                            ? commentsContent
                            : commentsContent?.items ||
                              []
                    )


                    const participantsContent = participantsRes?.content

                    setParticipants(Array.isArray(participantsContent)
                        ? participantsContent
                        : participantsContent
                            ?.participants ||
                            participantsContent
                            ?.users ||
                            []
                    )

                } catch (err) {
                    if (controller.signal.aborted) {
                        return
                    }
                    setError(err)
                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false)
                    }
                }
            }

        loadData()

        return () => controller.abort()

    }, [
        instanceId,
        paramsKey,
        enabled,
        reloadKey
    ])


    const sendComment =
        useCallback(
            async(data) => {

                if (!instanceId) {
                    return null
                }

                if(!params?.task_code) {
                    throw new Error("No se ha seleccionado una tarea para el comentario.")
                }

                try {

                    setSending(true)
                    setError(null)

                    const res = await postComment(instanceId, {...data, task_code: params.task_code})

                    /*
                     * Podemos agregar inmediatamente
                     * el comentario sin esperar reload.
                     */
                    if (
                        res?.content
                    ) {
                        setComments(
                            prev => [
                                ...prev,
                                res.content
                            ]
                        )

                    } else {
                        reload()
                    }

                    return (
                        res?.content || null
                    )
                } catch (err) {
                    setError(err)
                    throw err
                } finally {
                    setSending(false)
                }
            },
            [
                instanceId,
                paramsKey,
                reload
            ]
        )

    return {
        comments,
        participants,
        loading,
        sending,
        error,
        reload,
        sendComment
    }
}