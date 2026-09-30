import { api } from "../../lib/axios"

export const putTickets = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/update/${id}`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}

export const putTicketsSites = async (id, fd) => {

    console.log("SERVICE PUT TICKETS SITES", id)
    for (const [k, v] of fd.entries()) {
        console.log(k, v instanceof File ? `${v.name} (${v.size} bytes)` : v)
    }
    
    const result = await api.patch(`/providers/budget/tickets/update/site/${id}`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}


export const putTicketSitesAssignTo = async (fd) => {

    // console.log fd
    for (const [k, v] of fd.entries()) {
        console.log(k, v instanceof File ? `${v.name} (${v.size} bytes)` : v)
    }

    const result = await api.patch(`/providers/budget/tickets/update/site/assign-to`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}



export const putToSendMg = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/${id}/state/send-mg`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putToObserved = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/${id}/state/observe`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putToObservedFromMg = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/${id}/state/mg-to-observe`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putToPending = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/${id}/state/return-pending`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putToSendRq = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/${id}/state/rq-generated`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

export const putToCancelled = async (id, fd) => {
    const result = await api.patch(`/providers/budget/tickets/${id}/state/cancel`, fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}

