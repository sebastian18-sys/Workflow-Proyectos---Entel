import { api } from "../../lib/axios"

export const postOpex = async (fd) => {
    const result = await api.post("/providers/budget/insert-opex", fd)

    return result.data

}

export const postOpexEstimaciones = async (fd) => {
    const result = await api.post("/providers/budget/insert-opex-estimacion", fd)

    return result.data

}

export const putOpexEstimaciones = async (fd) => {
    const result = await api.post(`/providers/budget/create-q-version`, {
        // headers: { 
        //     "Content-Type": "multipart/form-data"
        // },
        projects: fd
    })

    return result.data

}