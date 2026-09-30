import { api, apiPython } from "../../lib/axios"

export const getAllProjectsCapexByPM = ({ FCST_Actual, FCST_mes }) => {
    return api.get("/providers/budget/pm-tree", { params: { FCST_Actual, FCST_mes } }).then(res => res.data)
}