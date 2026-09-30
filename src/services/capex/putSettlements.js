import { api } from "../../lib/axios"


export const putSettlements = async (fd) => {
    const result = await api.patch(`/providers/budget/settlements/update/sites`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}

export const putSettlementAproved = async (id, fd) => {
    const result = await api.patch(`/providers/budget/settlements/${id}/state/approved`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putSettlementObserved = async (id, fd) => {
    const result = await api.patch(`/providers/budget/settlements/${id}/state/observed`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putSettlementReturn = async (id, fd) => {
    const result = await api.patch(`/providers/budget/settlements/${id}/state/return-pending`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putSettlementToCancelled = async (id, fd) => {
    const result = await api.patch(`/providers/budget/settlements/${id}/state/cancel`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}