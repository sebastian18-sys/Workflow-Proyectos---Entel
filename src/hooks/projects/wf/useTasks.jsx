import { useEffect, useState } from "react"
import { getTaskById, getTasks } from "@/services/projects/wf/tasks/getTasks"
import { 
    postTask, 
    postSubtask, 
    postSubtaskField, 
    postSubtaskState 
} from "@/services/projects/wf/tasks/postTasks"
import { 
    putTask, 
    putSubtask, 
    putSubtasksOrder, 
    putSubtaskField, 
    putSubtaskState 
} from "@/services/projects/wf/tasks/putTasks"
import { 
    deleteTask, 
    deleteSubtask, 
    deleteSubtaskField, 
    deleteSubtaskState 
} from "@/services/projects/wf/tasks/deleteTasks"

export const useTasks = ({
    page = 1, 
    limit = 10, 
    search = "", 
    task_id = "", 
    task_code = "", 
    status = ""
} = {}) => {

    const [tasks, setTasks] = useState([])
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
                    page, limit, search, task_id, task_code, status
                }

                const res = await getTasks(params, { signal: controller.signal })

                if (controller.signal.aborted) return

                setTasks(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                setError(err)
                setTasks([])
                setTotalResults(0)
                setTotalPages(0)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [page, limit, search, task_id, task_code, status])

    const getTask = async(id) => {
        try {
            return await getTaskById(id)
        } catch (error) {
            console.error("Error getTask:", error)
            throw error
        }
    }

    const addTask = async(data) => postTask(data)
    const updateTask = async(id, data) => putTask(id, data)
    const removeTask = async(id) => deleteTask(id)

    const addSubtask = async(taskId, data) => postSubtask(taskId, data)
    const updateSubtask = async(taskId, key, data) => putSubtask(taskId, key, data)
    const removeSubtask = async(taskId, key) => deleteSubtask(taskId, key)
    const updateSubtasksOrder = async(taskId, data) => putSubtasksOrder(taskId, data)

    const addField = async(taskId, subtaskKey, data) => postSubtaskField(taskId, subtaskKey, data)
    const updateField = async(taskId, subtaskKey, fieldKey, data) => putSubtaskField(taskId, subtaskKey, fieldKey, data)
    const removeField = async(taskId, subtaskKey, fieldKey) => deleteSubtaskField(taskId, subtaskKey, fieldKey)

    const addState = async(taskId, subtaskKey, data) => postSubtaskState(taskId, subtaskKey, data)
    const updateState = async(taskId, subtaskKey, stateKey, data) => putSubtaskState(taskId, subtaskKey, stateKey, data)
    const removeState = async(taskId, subtaskKey, stateKey) => deleteSubtaskState(taskId, subtaskKey, stateKey)

    return {
        tasks, loading, totalResults, totalPages, error,
        getTask,
        addTask, updateTask, removeTask,
        addSubtask, updateSubtask, removeSubtask, updateSubtasksOrder,
        addField, updateField, removeField,
        addState, updateState, removeState
    }
}