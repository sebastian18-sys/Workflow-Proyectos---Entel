import { apiPython } from "../../../lib/axios"

export async function getResponsibleUsers(token) { 

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }

    const users = await apiPython.get("/sites/get-group-users", config)
    return users.data.content

}