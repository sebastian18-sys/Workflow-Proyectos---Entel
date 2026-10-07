import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"

import {
    MessageSquare,
    Send,
    UserRound,
    Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSiteComments } from "@/hooks/projects/wf/useSiteComments"
import { Badge } from "../ui/badge"
import { PERMS } from "@/constants/perm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export default function SiteChat({
    instanceId,
    taskCode = null,
    instance,
    currentUser,
    compact = false,
    can
}) {

    const [message, setMessage] = useState("")
    const [selectedMentions, setSelectedMentions] = useState([])
    const [selectedTaskCode, setSelectedTaskCode] = useState("")
    // const [selectedTaskName, setSelectedTaskName] = useState(null)
    const effectiveTaskCode = taskCode || selectedTaskCode
    const chatListRef = useRef(null)

    const {
        comments,
        participants,
        loading,
        sending,
        error,
        sendComment
    } = useSiteComments(instanceId, {
        enabled: !!instanceId,
        params: {
            ...(effectiveTaskCode
                ? { task_code: effectiveTaskCode }
                : {}
            )
        }
    })

    const orderedComments = useMemo(() => {

        return [...(comments || [])].sort((a, b) => {

            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()

            if (dateA !== dateB) {
                return dateA - dateB
            }

            return String(a._id || "")
                .localeCompare(String(b._id || ""))
        })

    }, [comments])

    const scrollToBottom = (behavior = "auto") => {
        const container = chatListRef.current
        if (!container) return
        container.scrollTo({
            top: container.scrollHeight,
            behavior
        })
    }

    useEffect(() => {
        if (loading) return
        requestAnimationFrame(() => {
            scrollToBottom("auto")
        })

    }, [
        loading,
        effectiveTaskCode,
        orderedComments.length
    ])

    const handleSend = async() => {

        const text = message.trim()

        if (!text || !currentUser?.id) return

        await sendComment({
            user_id: String(currentUser?.id || ""),
            user_name:
                currentUser?.name ||
                currentUser?.email ||
                "",
            message: text,
            task_code: effectiveTaskCode || null,
            attachments: [],
            mentions: selectedMentions
        })

        setMessage("")
        setSelectedMentions([])

        requestAnimationFrame(() => {
            scrollToBottom("smooth")
        })
    }

    const isPMOrAdmin = can(PERMS.PROJECTS.PROJECT_WORKFLOW_PM_ADMIN_FUNCTIONS)

    // TASKs disponibles para chat
    const chatTasks = useMemo(() =>
        (instance?.nodes || [])
            .filter(
                node =>
                    node.task_code
            ),
        [instance]
    )

    // TASK asociada al usuario normal
    const userTask = useMemo(() => {

        const userId = String(currentUser?.id || "")

        return chatTasks.find(
            node =>
                (node.participants || [])
                    .map(String)
                    .includes(userId)

                &&
                node.status === "ACTIVE"
        )},
        [chatTasks, currentUser]
    )

    // Última TASK para PM/Admin
    const lastReachedTask = useMemo(() => {
        const reached = chatTasks.filter(node => node.status !== "NOT_REACHED")
        if (reached.length === 0) {
            return (
                chatTasks[0] ||
                null
            )
        }
        return reached[reached.length - 1]
        }, [chatTasks]
    )

    const currentChatTask = useMemo(() => {
        return chatTasks.find(
            task => task.task_code === effectiveTaskCode
        ) || null
    }, [chatTasks, effectiveTaskCode])


    useEffect(() => {

        if (taskCode) {
            setSelectedTaskCode(taskCode)
            return
        }

        if (!chatTasks.length) return

        /*
        * PM / ADMIN:
        * última TASK alcanzada.
        */
        if (isPMOrAdmin) {
            setSelectedTaskCode(lastReachedTask?.task_code || chatTasks[0]?.task_code || "")
            return
        }

        /*
        * Usuario normal:
        * su TASK activa.
        */
        if (userTask) {
            setSelectedTaskCode(userTask.task_code)
            return
        }

        /*
        * Fallback:
        * última TASK en la que participa.
        */
        const userId = String(currentUser?.id || "")

        const participantTasks = chatTasks.filter(
            node =>
                (node.participants || [])
                    .map(String)
                    .includes(userId)
            )

        const last = participantTasks[participantTasks.length - 1]
        setSelectedTaskCode(last?.task_code || "")

    }, [
        taskCode,
        chatTasks,
        isPMOrAdmin,
        lastReachedTask,
        userTask,
        currentUser
    ])


    return (
        <div
            className={
                compact
                    ? "flex min-h-0 flex-1 flex-col"
                    : "flex min-h-[520px] flex-col"
            }
        >

            {!compact && (
                <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <MessageSquare className="h-4 w-4" />
                            </div>

                            <div>
                                <div className="text-sm font-semibold text-slate-700">
                                    Conversación de tarea
                                </div>
                                <div className="mt-0.5 text-xs text-slate-400">
                                    Comentarios y coordinaciones del equipo
                                </div>
                            </div>
                        </div>

                        {isPMOrAdmin ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-400">
                                    Tarea
                                </span>

                                <Select
                                    value={selectedTaskCode}
                                    onValueChange={setSelectedTaskCode}
                                >
                                    <SelectTrigger className="h-9 w-[220px] bg-white">
                                        <SelectValue placeholder="Seleccionar tarea" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {chatTasks.map(task => (
                                            <SelectItem
                                                key={task.node_key}
                                                value={task.task_code}
                                            >
                                                {task.task_name || task.task_code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                    Tarea
                                </span>

                                <Badge
                                    variant="outline"
                                    className="border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                >
                                    {currentChatTask?.task_name ||
                                        currentChatTask?.task_code ||
                                        "-"
                                    }
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div
                ref={chatListRef}
                className={[
                    "min-h-0 flex-1 space-y-3 overflow-y-auto scroll-smooth",
                    compact
                        ? "px-4 py-4"
                        : "px-6 py-5"
                ].join(" ")}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando comentarios...
                    </div>
                ) : error ? (
                    <div className="py-16 text-center text-sm text-red-500">
                        No se pudieron cargar los comentarios.
                    </div>
                ) : orderedComments.length === 0 ? (
                    <div
                        className={[
                            "flex items-center justify-center text-center",
                            compact
                                ? "min-h-[260px]"
                                : "py-16"
                        ].join(" ")}
                    >
                        <div>
                            <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                            <div className="mt-3 text-sm font-medium text-slate-500">
                                Sin comentarios
                            </div>
                            {compact && (
                                <div className="mt-1 text-xs text-slate-400">
                                    Inicia una conversación sobre esta tarea.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    orderedComments.map(
                        (comment, index) => {

                            const mine =
                                String(
                                    comment.user_id
                                ) ===
                                String(
                                    currentUser?.id
                                )

                            return (
                                <CommentItem
                                    key={comment._id || index}
                                    comment={comment}
                                    mine={mine}
                                    compact={compact}
                                />
                            )
                        }
                    )

                )}

            </div>


            <div
                className={[
                    "border-t border-slate-100 bg-white",
                    compact
                        ? "p-4"
                        : "px-5 py-4"
                ].join(" ")}
            >
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <Textarea
                        value={message}
                        disabled={sending}
                        onChange={event =>
                            setMessage(
                                event.target.value
                            )
                        }
                        onKeyDown={event => {
                            if (
                                event.key === "Enter" &&
                                !event.shiftKey
                            ) {
                                event.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Escribe un comentario..."
                        className={
                            compact
                                ? "min-h-[72px] resize-none border-0 p-1 shadow-none focus-visible:ring-0"
                                : "min-h-[90px] resize-none border-0 p-1 shadow-none focus-visible:ring-0"
                        }
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[10px] text-slate-400">
                            Enter para enviar · Shift + Enter para nueva línea
                        </span>

                        <Button
                            size="sm"
                            onClick={handleSend}
                            disabled={
                                sending ||
                                !message.trim()
                            }
                        >
                            {sending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}

                            Enviar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}


/*
 * =========================================================
 * COMMENT
 * =========================================================
 */

// function CommentItem({
//     comment,
//     mine,
//     compact
// }) {

//     return (
//         <div
//             className={`flex gap-3 ${
//                 mine
//                     ? "flex-row-reverse"
//                     : ""
//             }`}
//         >
//             <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-500">
//                 <UserRound className="h-4 w-4" />
//             </div>
//             <div
//                 className={[
//                     compact
//                         ? "max-w-[88%]"
//                         : "max-w-[68%]",
//                     "rounded-xl px-4 py-3",
//                     mine
//                         ? "bg-blue-50"
//                         : "border border-slate-100 bg-white"
//                 ].join(" ")}
//             >
//                 <div className="text-xs font-medium text-slate-600">
//                     {
//                         comment.user_name ||
//                         comment.user_id ||
//                         "Usuario"
//                     }
//                 </div>
//                 <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
//                     {comment.message || ""}
//                 </div>
//                 <div className="mt-2 text-[10px] text-slate-400">
//                     {
//                         formatDateTime(
//                             comment.createdAt
//                         )
//                     }
//                 </div>
//             </div>
//         </div>
//     )
// }

function CommentItem({
    comment,
    mine,
    compact
}) {

    return (
        <div
            className={[
                "flex items-end gap-2.5",
                mine
                    ? "justify-end"
                    : "justify-start"
            ].join(" ")}
        >

            {/* AVATAR OTRO USUARIO */}
            {!mine && (
                <div className="
                    flex h-8 w-8 flex-none
                    items-center justify-center
                    rounded-full
                    bg-slate-100
                    text-slate-500
                ">
                    <UserRound className="h-4 w-4" />
                </div>
            )}

            {/* MENSAJE */}
            <div
                className={[
                    "min-w-[140px] rounded-2xl px-4 py-3",
                    compact
                        ? "max-w-[82%]"
                        : "max-w-[70%]",
                    mine
                        ? "rounded-br-md bg-blue-50"
                        : "rounded-bl-md border border-slate-100 bg-white"
                ].join(" ")}
            >

                <div
                    className={[
                        "text-xs font-semibold",
                        mine
                            ? "text-blue-700"
                            : "text-slate-600"
                    ].join(" ")}
                >
                    {comment.user_name ||
                        comment.user_id ||
                        "Usuario"}
                </div>

                <div className="
                    mt-1
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-5
                    text-slate-700
                ">
                    {comment.message || ""}
                </div>

                <div
                    className={[
                        "mt-2 text-[10px] text-slate-400",
                        mine
                            ? "text-right"
                            : "text-left"
                    ].join(" ")}
                >
                    {formatDateTime(
                        comment.createdAt
                    )}
                </div>

            </div>

            {/* AVATAR PROPIO */}
            {mine && (
                <div className="
                    flex h-8 w-8 flex-none
                    items-center justify-center
                    rounded-full
                    bg-blue-50
                    text-blue-500
                ">
                    <UserRound className="h-4 w-4" />
                </div>
            )}

        </div>
    )
}


function formatDateTime(
    value
) {

    if (!value) {
        return "-"
    }

    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(value)
    )
}