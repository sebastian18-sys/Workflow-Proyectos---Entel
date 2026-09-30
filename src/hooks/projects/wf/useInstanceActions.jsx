import { putInstanceCancel, putSubtaskAssignees, putSubtaskFormData, putSubtaskState, putTaskOpen, putTaskReopen, putWorkflowStartDate } from "@/services/projects/wf/instances/putInstances"
import {
    useCallback,
    useState
} from "react"


export const useInstanceActions = ({
    instanceId,
    onUpdated
} = {}) => {

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const execute =
        useCallback(
            async(callback) => {
                try {
                    setSaving(true)
                    setError(null)
                    const result = await callback()
                    await onUpdated?.()
                    return result
                } catch (err) {
                    setError(err)
                    throw err
                } finally {
                    setSaving(false)
                }
            },
            [
                onUpdated
            ]
        )

    const changeSubtaskState =
        useCallback(
            (taskCode, subtaskKey, data) => {
                return execute(() => putSubtaskState(instanceId, taskCode, subtaskKey, data))
            },
            [
                instanceId,
                execute
            ]
        )

    const updateAssignees =
        useCallback(
            (taskCode, subtaskKey, data) => {
                return execute(() => putSubtaskAssignees(instanceId, taskCode, subtaskKey, data))
            },
            [
                instanceId,
                execute
            ]
        )

    const openTask =
        useCallback(
            (taskCode, data) => {
                return execute(() => putTaskOpen(instanceId, taskCode, data))
            },
            [
                instanceId,
                execute
            ]
        )


    const reopenTask =
        useCallback(
            (taskCode, data) => {
                return execute(() => putTaskReopen(instanceId, taskCode, data))
            },
            [
                instanceId,
                execute
            ]
        )

    const changeStartDate =
        useCallback(
            data => {
                return execute(() => putWorkflowStartDate(instanceId, data))
            },
            [
                instanceId,
                execute
            ]
        )

    const cancelInstance =
        useCallback(
            data => {
                return execute(() => putInstanceCancel(instanceId, data))
            },
            [
                instanceId,
                execute
            ]
        )

    const saveSubtaskForm = async(taskCode, subtaskKey, data) => {

        if (!instanceId) {
            return null
        }

        try {

            setSaving(true)

            const response =
                await putSubtaskFormData(
                    instanceId,
                    taskCode,
                    subtaskKey,
                    data
                )

            await onUpdated?.()

            return (
                response?.content ||
                null
            )

        } finally {

            setSaving(false)
        }
    }

    const changeSubtaskAssignees = async (
        taskCode,
        subtaskKey,
        data
    ) => {
        try {
            setSaving(true)

            const result =
                await putSubtaskAssignees(
                    instanceId,
                    taskCode,
                    subtaskKey,
                    data
                )

            await onUpdated?.()

            return result

        } finally {
            setSaving(false)
        }
    }


    return {
        saving,
        error,
        changeSubtaskState,
        updateAssignees,
        openTask,
        reopenTask,
        changeStartDate,
        cancelInstance,
        saveSubtaskForm,
        changeSubtaskAssignees
    }
}