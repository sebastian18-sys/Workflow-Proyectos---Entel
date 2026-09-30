import { api } from "../../lib/axios"

export const postPayments = async (fd) => {
    const result = await api.post("/providers/budget/insert-payments", fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}