import { apiPython } from "../../lib/axios"

export const postIdentifers = async (fd, token) => {

    const result = await apiPython.post("/sites/import-identificadores", fd, {
        headers: { 
            // "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
        },
    })

    return result.data
 
}   