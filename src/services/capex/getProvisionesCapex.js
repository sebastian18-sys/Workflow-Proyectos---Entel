import { api } from "../../lib/axios"

export const getProvisionesCapex = () => {
    return api.get("/providers/budget/rq-provisiones").then(res => res.data)
}