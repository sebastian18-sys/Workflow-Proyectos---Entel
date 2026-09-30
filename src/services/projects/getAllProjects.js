import { apiPython } from "../../lib/axios"

export async function getAllProjects(token) {

    const config = {
        headers: {
        Authorization: `Bearer ${token}`
        }
    }

    const project = await apiPython.get("/projects/get-project", config)
    return project.data.content
}