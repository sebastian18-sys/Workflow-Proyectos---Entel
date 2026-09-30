import { api } from "../../lib/axios"

export const postDeliverables = async (fd) => {
    const result = await api.post("/providers/budget/insert-deliverables", fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}