import { apiPython } from "../../../lib/axios"

export async function getAllUsers(token) { 

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }

    const users = await apiPython.get("/sites/get-users", config)
    return users.data.content

}