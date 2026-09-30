import { api, apiPython } from "../../lib/axios"

export const execScenarios = () => {
  return apiPython.get("/capex/scenarios-opex").then(res => res.data)
}