import { apiPython } from "../../lib/axios"

export async function getProjectInfoById(id, token) {

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }

    const project = await apiPython.get(`/projects/get-project/info/${id}`, config)
    return project.data.content
}