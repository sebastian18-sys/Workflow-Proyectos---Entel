import { api, apiPython } from "../../lib/axios"

export const postScenarios = async (fd) => {

    const result = await apiPython.post("/capex/scenarios-opex-data", {
        data: fd,
    })
 
    return result.data
}