import { apiPlanner } from "../../lib/axios"

export const getProjectsOpex = () => {
  return apiPlanner.get("/project/listAll").then(res => res.data)
}