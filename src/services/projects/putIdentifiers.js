import { apiPython } from "@/lib/axios"

export const putIdentifiers = async (fd, token) => {
    
    const result = await apiPython.put(`/sites/update-identificadores-by-type`, fd, {
        headers: { 
            // "Content-Type": "multipart/form-data"
            Authorization: `Bearer ${token}`
        },
    })

    return result.data

}