import { api } from "../../lib/axios"

export const postSettlements = async (fd) => {
    const result = await api.post("/providers/budget/insert-settlements", fd, {
        headers: { 
            "Content-Type": "multipart/form-data"
        },
    })

    return result.data
}