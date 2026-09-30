import { apiPython } from "../../lib/axios"

export async function getIdentifiers() { 

    const project = await apiPython.get("/sites/get-sites")
    return project.data.content

}