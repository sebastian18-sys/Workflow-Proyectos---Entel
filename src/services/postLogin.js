import { api, apiPython } from "../lib/axios"

export const postLogin = async (username, password, token) => {

    const result = await apiPython.post("/login", { 
        username, 
        password,
        token
    })
 
    return result.data.content
}