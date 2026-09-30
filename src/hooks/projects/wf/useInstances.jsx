import { useEffect, useState } from "react"
import { 
    getInstances, 
    getInstanceDetail, 
    getInstanceJourney, 
    getInstanceParticipants 
} from "@/services/projects/wf/instances/getInstances"
import {
    putSubtaskState, putSubtaskAssignees, putInstanceCancel,
    putTaskOpen, putTaskReopen, putWorkflowStartDate
} from "@/services/projects/wf/instances/putInstances"

export const useInstances = ({
    page = 1, 
    limit = 20, 
    search = "", 
    instance_id = "",
    workflow_code = "", 
    status = "", 
    task_code = "", 
    task_status = ""
} = {}) => {
    
    const [instances, setInstances] = useState([])
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
                    page, limit, search, instance_id,
                    workflow_code, status, task_code, task_status
                }

                const res = await getInstances(params, { signal: controller.signal })

                if (controller.signal.aborted) return

                setInstances(res?.content?.items || [])
                setTotalResults(res?.content?.totalResults || 0)
                setTotalPages(res?.content?.totalPages || 0)
            } catch (err) {
                if (controller.signal.aborted) return
                setError(err)
                setInstances([])
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadData()
        return () => controller.abort()
    }, [page, limit, search, instance_id, workflow_code, status, task_code, task_status])

    const getDetail = async(id) => getInstanceDetail(id)
    const getJourney = async(id) => getInstanceJourney(id)
    const getParticipants = async(id) => getInstanceParticipants(id)

    const updateState = async(instanceId, taskCode, subtaskKey, data) =>
        putSubtaskState(instanceId, taskCode, subtaskKey, data)

    const updateAssignees = async(instanceId, taskCode, subtaskKey, data) =>
        putSubtaskAssignees(instanceId, taskCode, subtaskKey, data)

    const openTask = async(instanceId, taskCode, data) =>
        putTaskOpen(instanceId, taskCode, data)

    const reopenTask = async(instanceId, taskCode, data) =>
        putTaskReopen(instanceId, taskCode, data)

    const cancelInstance = async(instanceId, data) =>
        putInstanceCancel(instanceId, data)

    const updateStartDate = async(instanceId, data) =>
        putWorkflowStartDate(instanceId, data)

    return {
        instances, loading, totalResults, totalPages, error,
        getDetail, getJourney, getParticipants,
        updateState, updateAssignees, openTask,
        reopenTask, cancelInstance, updateStartDate
    }
}