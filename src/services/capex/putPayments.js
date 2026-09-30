import { api } from "../../lib/axios"

export const putPayments = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/update/${id}`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}

export const putPaymentsSites = async (id, fd) => {

    console.log("SERVICE PUT TICKETS SITES", id)
    for (const [k, v] of fd.entries()) {
        console.log(k, v instanceof File ? `${v.name} (${v.size} bytes)` : v)
    }
    
    const result = await api.patch(`/providers/budget/payments/update/site/${id}`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}

export const putPayToSendMg = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/pay-send-mg`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putPayGenerated = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/pay-generated`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putPayToSendMgH2 = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/pay-send-mg-h2`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putPayGeneratedH2 = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/pay-generated-h2`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putPayGenValidate = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/paygen-validate`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putValidateSendMg = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/validate-send-mg`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putPayToCancelled = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/pay-cancel`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putPayToClose = async (id, fd) => {
    const result = await api.patch(`/providers/budget/payments/${id}/state/pay-close`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}