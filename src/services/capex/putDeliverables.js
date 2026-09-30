import { api } from "../../lib/axios"

export const putDeliverables = async (id, fd) => {
    const result = await api.patch(`/providers/budget/deliverables/update/${id}`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}

export const putDeliverableAproved = async (id, fd) => {
    const result = await api.patch(`/providers/budget/deliverables/${id}/state/approved`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putDeliverableObserved = async (id, fd) => {
    const result = await api.patch(`/providers/budget/deliverables/${id}/state/observed`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putDeliverableReturn = async (id, fd) => {
    const result = await api.patch(`/providers/budget/deliverables/${id}/state/return-pending`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putDeliverableToCancelled = async (id, fd) => {
    const result = await api.patch(`/providers/budget/deliverables/${id}/state/cancel`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}