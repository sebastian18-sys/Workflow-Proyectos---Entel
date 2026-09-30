import { api } from "../../lib/axios"

export const postTickets = async (fd) => {
    const result = await api.post("/providers/budget/insert-tickets", fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data

}